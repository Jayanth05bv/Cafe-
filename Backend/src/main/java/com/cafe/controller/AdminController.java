package com.cafe.controller;

import com.cafe.dto.OrderResponse;
import com.cafe.entity.Cafe;
import com.cafe.entity.Order;
import com.cafe.entity.User;
import com.cafe.entity.Role;
import com.cafe.repository.ConfirmationTokenRepository;
import com.cafe.repository.OrderRepository;
import com.cafe.repository.UserRepository;
import com.cafe.service.AuthService;
import com.cafe.service.CafeBootstrapService;
import com.cafe.service.CafeService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CafeService cafeService;
    private final AuthService authService;
    private final CafeBootstrapService cafeBootstrapService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ConfirmationTokenRepository confirmationTokenRepository;

    public AdminController(CafeService cafeService,
                           AuthService authService,
                           CafeBootstrapService cafeBootstrapService,
                           UserRepository userRepository,
                           OrderRepository orderRepository,
                           ConfirmationTokenRepository confirmationTokenRepository) {
        this.cafeService = cafeService;
        this.authService = authService;
        this.cafeBootstrapService = cafeBootstrapService;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.confirmationTokenRepository = confirmationTokenRepository;
    }

    @GetMapping("/cafes")
    public ResponseEntity<List<Cafe>> listCafes() {
        return ResponseEntity.ok(cafeService.findAll());
    }

    @PostMapping("/cafes")
    public ResponseEntity<Cafe> createCafe(@RequestBody Map<String, Object> body) {
        Cafe cafe = new Cafe();
        cafe.setName(asString(body.get("name")));
        cafe.setAddress(asString(body.get("address")));
        cafe.setPhone(asString(body.get("phone")));
        cafe.setDescription(asString(body.get("description")));
        cafe.setLogoUrl(asString(body.get("logoUrl")));
        cafe.setImageUrls(asString(body.get("imageUrls")));
        cafe.setBankAccount(asString(body.get("bankAccount")));
        cafe.setBankAccountHolder(asString(body.get("bankAccountHolder")));
        cafe.setBankName(asString(body.get("bankName")));
        cafe.setBankAccountNumber(asString(body.get("bankAccountNumber")));
        cafe.setBankIfscCode(asString(body.get("bankIfscCode")));
        Object revenueObj = body.get("revenue");
        if (revenueObj instanceof Number n) {
            cafe.setRevenue(java.math.BigDecimal.valueOf(n.doubleValue()));
        } else if (revenueObj != null && !revenueObj.toString().isBlank()) {
            cafe.setRevenue(new java.math.BigDecimal(revenueObj.toString()));
        }
        Cafe saved = cafeService.create(cafe);

        Object ownerUserIdObj = body.get("ownerUserId");
        if (ownerUserIdObj != null) {
            Long ownerUserId = ownerUserIdObj instanceof Number
                    ? ((Number) ownerUserIdObj).longValue()
                    : Long.parseLong(ownerUserIdObj.toString());
            User owner = userRepository.findById(ownerUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Owner user not found: " + ownerUserId));
            boolean isOwner = owner.getRoles().stream().anyMatch(r -> r.getName() == Role.RoleName.OWNER);
            if (!isOwner) {
                throw new IllegalArgumentException("Selected user is not an OWNER");
            }
            owner.getOwnerCafes().add(saved);
            owner.setCafe(saved);
            owner.setOwnerAssignmentAccepted(false);
            userRepository.save(owner);
        }
        cafeBootstrapService.seedDefaultsForCafe(saved.getId());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/cafes/{id}")
    public ResponseEntity<Cafe> updateCafe(@PathVariable Long id, @RequestBody Cafe cafe) {
        return ResponseEntity.ok(cafeService.update(id, cafe));
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) body.get("roles");
        Set<Role.RoleName> roleNames = roles.stream()
                .map(Role.RoleName::valueOf)
                .collect(Collectors.toSet());
        String fullName = asString(body.get("fullName"));
        String phone = asString(body.get("phone"));
        String address = asString(body.get("address"));
        String workExperience = asString(body.get("workExperience"));
        return ResponseEntity.ok(authService.registerByAdmin(
                username, email, password, roleNames, fullName, phone, address, workExperience
        ));
    }

    @Transactional(readOnly = true)
    @GetMapping("/users")
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalUsers = userRepository.count();
        long totalCafes = cafeService.findAll().size();
        long totalOrders = orderRepository.count();
        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalCafes", totalCafes,
                "totalOrders", totalOrders
        ));
    }

    @Transactional(readOnly = true)
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> listOrders() {
        return ResponseEntity.ok(orderRepository.findAll().stream().map(OrderResponse::from).toList());
    }

    /**
     * Danger: delete all non-admin users and their related data (orders, tokens, profiles).
     * Admin accounts (users with ADMIN role) are kept so the system remains usable.
     */
    @Transactional
    @DeleteMapping("/users/data")
    public ResponseEntity<Map<String, Object>> purgeNonAdminUserData() {
        List<User> allUsers = userRepository.findAll();

        List<User> nonAdminUsers = allUsers.stream()
                .filter(u -> u.getRoles().stream().noneMatch(r -> r.getName() == Role.RoleName.ADMIN))
                .toList();

        if (nonAdminUsers.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "deletedUsers", 0,
                    "deletedOrders", 0,
                    "message", "No non-admin users to delete"
            ));
        }

        // Delete orders where customer or waiter is one of the non-admin users
        List<Long> nonAdminUserIds = nonAdminUsers.stream().map(User::getId).toList();

        List<Order> allOrders = orderRepository.findAll();
        List<Order> ordersToDelete = allOrders.stream()
                .filter(o -> {
                    Long customerId = o.getCustomer() != null ? o.getCustomer().getId() : null;
                    Long waiterId = o.getWaiter() != null ? o.getWaiter().getId() : null;
                    return (customerId != null && nonAdminUserIds.contains(customerId))
                            || (waiterId != null && nonAdminUserIds.contains(waiterId));
                })
                .toList();

        int ordersDeleted = 0;
        if (!ordersToDelete.isEmpty()) {
            ordersDeleted = ordersToDelete.size();
            orderRepository.deleteAll(ordersToDelete);
        }

        // Delete confirmation tokens for those users
        for (Long userId : nonAdminUserIds) {
            confirmationTokenRepository.deleteByUserId(userId);
        }

        int usersDeleted = nonAdminUsers.size();
        userRepository.deleteAll(nonAdminUsers);

        return ResponseEntity.ok(Map.of(
                "deletedUsers", usersDeleted,
                "deletedOrders", ordersDeleted,
                "message", "Deleted non-admin users and their related data"
        ));
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        if (body.containsKey("enabled")) {
            user.setEnabled(Boolean.TRUE.equals(body.get("enabled")));
        }
        if (body.containsKey("cafeId")) {
            boolean isOwner = user.getRoles().stream()
                    .anyMatch(r -> r.getName() == Role.RoleName.OWNER);
            if (!isOwner) {
                throw new IllegalArgumentException("Only users with OWNER role can be assigned to a cafe");
            }
            Object cafeIdObj = body.get("cafeId");
            if (cafeIdObj == null) {
                user.setCafe(null);
                user.getOwnerCafes().clear();
                user.setOwnerAssignmentAccepted(false);
            } else {
                Long cafeId = cafeIdObj instanceof Number ? ((Number) cafeIdObj).longValue() : Long.parseLong(cafeIdObj.toString());
                Cafe cafe = cafeService.findById(cafeId);
                user.getOwnerCafes().add(cafe);
                user.setCafe(cafe);
                user.setOwnerAssignmentAccepted(false);
            }
        }
        return ResponseEntity.ok(userRepository.save(user));
    }

    private static String asString(Object value) {
        if (value == null) return null;
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
