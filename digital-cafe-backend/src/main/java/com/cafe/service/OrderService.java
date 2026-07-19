package com.cafe.service;

import com.cafe.dto.OrderRequest;
import com.cafe.entity.*;
import com.cafe.repository.*;
import com.cafe.websocket.OrderStatusNotifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CafeRepository cafeRepository;
    private final CafeTableRepository cafeTableRepository;
    private final UserRepository userRepository;
    private final MenuRepository menuRepository;
    private final OrderStatusNotifier orderStatusNotifier;

    public OrderService(OrderRepository orderRepository, CafeRepository cafeRepository,
                        CafeTableRepository cafeTableRepository, UserRepository userRepository,
                        MenuRepository menuRepository, OrderStatusNotifier orderStatusNotifier) {
        this.orderRepository = orderRepository;
        this.cafeRepository = cafeRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.userRepository = userRepository;
        this.menuRepository = menuRepository;
        this.orderStatusNotifier = orderStatusNotifier;
    }

    @Transactional
    public Order create(OrderRequest request) {
        Cafe cafe = cafeRepository.findById(request.getCafeId())
                .orElseThrow(() -> new IllegalArgumentException("Cafe not found"));
        Order order = new Order();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setCafe(cafe);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setReservationDate(request.getReservationDate());
        order.setReservationTimeSlot(trimToNull(request.getReservationTimeSlot()));
        order.setGuestCount(request.getGuestCount());
        order.setSeatingPreference(normalizePreference(request.getSeatingPreference()));
        order.setSeatingNotes(trimToNull(request.getSeatingNotes()));
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        CafeTable allocatedTable = resolveTable(cafe, request);
        if (allocatedTable != null) {
            allocatedTable.setStatus(CafeTable.TableStatus.RESERVED);
            order.setCafeTable(cafeTableRepository.save(allocatedTable));
        }
        if (request.getCustomerId() != null) {
            order.setCustomer(userRepository.findById(request.getCustomerId()).orElse(null));
        }
        if (request.getWaiterId() != null) {
            order.setWaiter(userRepository.findById(request.getWaiterId()).orElse(null));
        }
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Menu menu = menuRepository.findById(itemReq.getMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + itemReq.getMenuId()));
            BigDecimal lineTotal = menu.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(lineTotal);
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setMenuItem(menu);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(menu.getPrice());
            item.setSpecialInstructions(itemReq.getSpecialInstructions());
            items.add(item);
        }
        order.setItems(items);
        order.setTotalAmount(total);
        Order saved = orderRepository.save(order);
        orderStatusNotifier.notifyOrderStatus(saved.getCafe().getId(), saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));
    }

    @Transactional(readOnly = true)
    public Order findByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderNumber));
    }

    @Transactional(readOnly = true)
    public List<Order> findByCafe(Long cafeId) {
        return orderRepository.findByCafeId(cafeId);
    }

    @Transactional(readOnly = true)
    public List<Order> findByCustomerId(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Order updateStatus(Long orderId, Order.OrderStatus status) {
        return updateStatus(orderId, status, null);
    }

    @Transactional
    public Order updateStatus(Long orderId, Order.OrderStatus status, User actor) {
        Order order = findById(orderId);
        validateStatusTransition(order, status);
        order.setStatus(status);
        if (status == Order.OrderStatus.PREPARING && actor != null) {
            order.setPreparedBy(actor);
        }
        if (status == Order.OrderStatus.READY && actor != null) {
            order.setPreparedBy(actor);
        }
        if (status == Order.OrderStatus.SERVED && actor != null) {
            order.setServedBy(actor);
            if (order.getWaiter() == null) {
                order.setWaiter(actor);
            }
        }
        order.setUpdatedAt(LocalDateTime.now());
        releaseTableIfOrderCompleted(order, status);
        Order saved = orderRepository.save(order);
        orderStatusNotifier.notifyOrderStatus(saved.getCafe().getId(), saved);
        return saved;
    }

    @Transactional
    public Order markPaid(Long orderId) {
        Order order = findById(orderId);
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cancelled orders cannot be paid");
        }
        if (EnumSet.of(Order.OrderStatus.PAID, Order.OrderStatus.PREPARING, Order.OrderStatus.READY, Order.OrderStatus.SERVED)
                .contains(order.getStatus())) {
            return order;
        }
        order.setStatus(Order.OrderStatus.PAID);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        orderStatusNotifier.notifyOrderStatus(saved.getCafe().getId(), saved);
        return saved;
    }

    @Transactional
    public Order cancelByCustomer(Long orderId) {
        Order order = findById(orderId);
        if (EnumSet.of(Order.OrderStatus.PREPARING, Order.OrderStatus.READY, Order.OrderStatus.SERVED)
                .contains(order.getStatus())) {
            throw new IllegalArgumentException("This order can no longer be cancelled");
        }
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            return order;
        }
        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        releaseTableIfOrderCompleted(order, Order.OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        orderStatusNotifier.notifyOrderStatus(saved.getCafe().getId(), saved);
        return saved;
    }

    @Transactional
    public Order save(Order order) {
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    private void validateStatusTransition(Order order, Order.OrderStatus nextStatus) {
        Order.OrderStatus currentStatus = order.getStatus();
        if (currentStatus == nextStatus) {
            return;
        }

        switch (nextStatus) {
            case PREPARING -> {
                if (currentStatus != Order.OrderStatus.CONFIRMED
                        && currentStatus != Order.OrderStatus.PENDING
                        && currentStatus != Order.OrderStatus.PAID) {
                    throw new IllegalArgumentException("Only newly placed orders can move to preparing");
                }
            }
            case READY -> {
                if (currentStatus != Order.OrderStatus.PREPARING) {
                    throw new IllegalArgumentException("Only preparing orders can be marked ready");
                }
            }
            case SERVED -> {
                if (currentStatus != Order.OrderStatus.READY) {
                    throw new IllegalArgumentException("Only ready orders can be marked served");
                }
            }
            default -> {
                // Other states remain available for admin/manual flows.
            }
        }
    }

    private CafeTable resolveTable(Cafe cafe, OrderRequest request) {
        if (request.getTableId() != null) {
            CafeTable selectedTable = cafeTableRepository.findByIdAndCafeId(request.getTableId(), cafe.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Selected table not found for this cafe"));
            boolean reusableReservedTable = selectedTable.getStatus() == CafeTable.TableStatus.RESERVED
                    && request.getCustomerId() != null
                    && customerOwnsActiveTable(request.getCustomerId(), cafe.getId(), selectedTable.getId());
            if (selectedTable.getStatus() != CafeTable.TableStatus.AVAILABLE && !reusableReservedTable) {
                throw new IllegalArgumentException("Selected table is not available");
            }
            if (request.getGuestCount() != null
                    && selectedTable.getCapacity() != null
                    && selectedTable.getCapacity() < request.getGuestCount()) {
                throw new IllegalArgumentException("Selected table cannot accommodate the guest count");
            }
            return selectedTable;
        }

        CafeTable.TableLocation preferredLocation = toLocation(request.getSeatingPreference());
        if (preferredLocation != null) {
            var byLocation = cafeTableRepository.findFirstByCafeIdAndStatusAndLocationOrderByIdAsc(
                    cafe.getId(), CafeTable.TableStatus.AVAILABLE, preferredLocation
            );
            if (byLocation.isPresent()) return byLocation.get();
        }

        return cafeTableRepository.findFirstByCafeIdAndStatusOrderByIdAsc(
                cafe.getId(), CafeTable.TableStatus.AVAILABLE
        ).orElse(null);
    }

    private boolean customerOwnsActiveTable(Long customerId, Long cafeId, Long tableId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .anyMatch(order -> order.getCafe() != null
                        && order.getCafe().getId().equals(cafeId)
                        && order.getCafeTable() != null
                        && order.getCafeTable().getId().equals(tableId)
                        && EnumSet.of(
                                Order.OrderStatus.CONFIRMED,
                                Order.OrderStatus.PAID,
                                Order.OrderStatus.PREPARING,
                                Order.OrderStatus.READY,
                                Order.OrderStatus.PENDING
                        ).contains(order.getStatus()));
    }

    private void releaseTableIfOrderCompleted(Order order, Order.OrderStatus status) {
        if (order.getCafeTable() == null) return;
        if (EnumSet.of(Order.OrderStatus.SERVED, Order.OrderStatus.CANCELLED).contains(status)) {
            CafeTable table = order.getCafeTable();
            table.setStatus(CafeTable.TableStatus.AVAILABLE);
            cafeTableRepository.save(table);
        }
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private CafeTable.TableLocation toLocation(String preference) {
        if (preference == null || preference.isBlank()) return null;
        try {
            return CafeTable.TableLocation.valueOf(preference.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String normalizePreference(String preference) {
        CafeTable.TableLocation location = toLocation(preference);
        return location != null ? location.name() : null;
    }
}
