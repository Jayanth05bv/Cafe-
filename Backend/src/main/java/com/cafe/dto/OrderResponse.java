package com.cafe.dto;

import com.cafe.entity.Order;
import com.cafe.entity.OrderItem;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {

    private Long id;
    private String orderNumber;
    private CafeSummary cafe;
    private TableSummary cafeTable;
    private UserSummary customer;
    private UserSummary waiter;
    private UserSummary preparedBy;
    private UserSummary servedBy;
    private List<OrderItemSummary> items;
    private String status;
    private LocalDate reservationDate;
    private String reservationTimeSlot;
    private Integer guestCount;
    private String seatingPreference;
    private String seatingNotes;
    private String paymentProvider;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paymentCapturedAt;

    public static OrderResponse from(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderNumber(order.getOrderNumber());
        if (order.getCafe() != null) {
            response.setCafe(new CafeSummary(order.getCafe().getId(), order.getCafe().getName()));
        }
        if (order.getCafeTable() != null) {
            response.setCafeTable(new TableSummary(
                    order.getCafeTable().getId(),
                    order.getCafeTable().getTableNumber(),
                    order.getCafeTable().getCapacity(),
                    order.getCafeTable().getStatus() != null ? order.getCafeTable().getStatus().name() : null,
                    order.getCafeTable().getLocation() != null ? order.getCafeTable().getLocation().name() : null
            ));
        }
        if (order.getCustomer() != null) {
            response.setCustomer(new UserSummary(order.getCustomer().getId(), order.getCustomer().getUsername(), order.getCustomer().getEmail()));
        }
        if (order.getWaiter() != null) {
            response.setWaiter(new UserSummary(order.getWaiter().getId(), order.getWaiter().getUsername(), order.getWaiter().getEmail()));
        }
        if (order.getPreparedBy() != null) {
            response.setPreparedBy(new UserSummary(order.getPreparedBy().getId(), order.getPreparedBy().getUsername(), order.getPreparedBy().getEmail()));
        }
        if (order.getServedBy() != null) {
            response.setServedBy(new UserSummary(order.getServedBy().getId(), order.getServedBy().getUsername(), order.getServedBy().getEmail()));
        }
        response.setItems(order.getItems().stream().map(OrderItemSummary::from).toList());
        response.setStatus(order.getStatus() != null ? order.getStatus().name() : null);
        response.setReservationDate(order.getReservationDate());
        response.setReservationTimeSlot(order.getReservationTimeSlot());
        response.setGuestCount(order.getGuestCount());
        response.setSeatingPreference(order.getSeatingPreference());
        response.setSeatingNotes(order.getSeatingNotes());
        response.setPaymentProvider(order.getPaymentProvider());
        response.setRazorpayOrderId(order.getRazorpayOrderId());
        response.setRazorpayPaymentId(order.getRazorpayPaymentId());
        response.setTotalAmount(order.getTotalAmount());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());
        response.setPaymentCapturedAt(order.getPaymentCapturedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public CafeSummary getCafe() { return cafe; }
    public void setCafe(CafeSummary cafe) { this.cafe = cafe; }
    public TableSummary getCafeTable() { return cafeTable; }
    public void setCafeTable(TableSummary cafeTable) { this.cafeTable = cafeTable; }
    public UserSummary getCustomer() { return customer; }
    public void setCustomer(UserSummary customer) { this.customer = customer; }
    public UserSummary getWaiter() { return waiter; }
    public void setWaiter(UserSummary waiter) { this.waiter = waiter; }
    public UserSummary getPreparedBy() { return preparedBy; }
    public void setPreparedBy(UserSummary preparedBy) { this.preparedBy = preparedBy; }
    public UserSummary getServedBy() { return servedBy; }
    public void setServedBy(UserSummary servedBy) { this.servedBy = servedBy; }
    public List<OrderItemSummary> getItems() { return items; }
    public void setItems(List<OrderItemSummary> items) { this.items = items; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getReservationDate() { return reservationDate; }
    public void setReservationDate(LocalDate reservationDate) { this.reservationDate = reservationDate; }
    public String getReservationTimeSlot() { return reservationTimeSlot; }
    public void setReservationTimeSlot(String reservationTimeSlot) { this.reservationTimeSlot = reservationTimeSlot; }
    public Integer getGuestCount() { return guestCount; }
    public void setGuestCount(Integer guestCount) { this.guestCount = guestCount; }
    public String getSeatingPreference() { return seatingPreference; }
    public void setSeatingPreference(String seatingPreference) { this.seatingPreference = seatingPreference; }
    public String getSeatingNotes() { return seatingNotes; }
    public void setSeatingNotes(String seatingNotes) { this.seatingNotes = seatingNotes; }
    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getPaymentCapturedAt() { return paymentCapturedAt; }
    public void setPaymentCapturedAt(LocalDateTime paymentCapturedAt) { this.paymentCapturedAt = paymentCapturedAt; }

    public record CafeSummary(Long id, String name) {}

    public record TableSummary(Long id, String tableNumber, Integer capacity, String status, String location) {}

    public record UserSummary(Long id, String username, String email) {}

    public static class OrderItemSummary {
        private Long id;
        private Integer quantity;
        private BigDecimal unitPrice;
        private String specialInstructions;
        private MenuSummary menuItem;

        static OrderItemSummary from(OrderItem item) {
            OrderItemSummary summary = new OrderItemSummary();
            summary.setId(item.getId());
            summary.setQuantity(item.getQuantity());
            summary.setUnitPrice(item.getUnitPrice());
            summary.setSpecialInstructions(item.getSpecialInstructions());
            if (item.getMenuItem() != null) {
                summary.setMenuItem(new MenuSummary(
                        item.getMenuItem().getId(),
                        item.getMenuItem().getName(),
                        item.getMenuItem().getPrice(),
                        item.getMenuItem().getCategory() != null ? item.getMenuItem().getCategory().name() : null
                ));
            }
            return summary;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public String getSpecialInstructions() { return specialInstructions; }
        public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
        public MenuSummary getMenuItem() { return menuItem; }
        public void setMenuItem(MenuSummary menuItem) { this.menuItem = menuItem; }
    }

    public record MenuSummary(Long id, String name, BigDecimal price, String category) {}
}
