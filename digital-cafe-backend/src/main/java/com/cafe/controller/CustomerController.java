package com.cafe.controller;

import com.cafe.dto.CustomerProfileResponse;
import com.cafe.dto.CustomerProfileUpdateRequest;
import com.cafe.dto.OrderRequest;
import com.cafe.dto.OrderResponse;
import com.cafe.dto.RazorpayOrderResponse;
import com.cafe.dto.RazorpayVerificationRequest;
import com.cafe.entity.Profile;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeTable;
import com.cafe.entity.Menu;
import com.cafe.entity.Order;
import com.cafe.service.CafeService;
import com.cafe.service.OrderService;
import com.cafe.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.cafe.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private final CafeService cafeService;
    private final OrderService orderService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PaymentService paymentService;

    public CustomerController(CafeService cafeService, OrderService orderService, UserRepository userRepository, PasswordEncoder passwordEncoder, PaymentService paymentService) {
        this.cafeService = cafeService;
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.paymentService = paymentService;
    }

    @GetMapping("/cafes")
    public ResponseEntity<List<Cafe>> listCafes() {
        return ResponseEntity.ok(cafeService.findAll());
    }

    @GetMapping("/cafes/{id}")
    public ResponseEntity<Cafe> getCafe(@PathVariable Long id) {
        return ResponseEntity.ok(cafeService.findById(id));
    }

    @GetMapping("/cafes/{cafeId}/menu")
    public ResponseEntity<List<Menu>> getMenu(@PathVariable Long cafeId) {
        return ResponseEntity.ok(cafeService.getMenu(cafeId));
    }

    @GetMapping("/cafes/{cafeId}/tables")
    public ResponseEntity<List<CafeTable>> getTables(@PathVariable Long cafeId) {
        return ResponseEntity.ok(cafeService.getTables(cafeId));
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        request.setCustomerId(user.getId());
        return ResponseEntity.ok(OrderResponse.from(orderService.create(request)));
    }

    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String orderNumber) {
        return ResponseEntity.ok(OrderResponse.from(orderService.findByOrderNumber(orderNumber)));
    }

    @Transactional(readOnly = true)
    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> myOrders() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return ResponseEntity.ok(orderService.findByCustomerId(user.getId()).stream().map(OrderResponse::from).toList());
    }

    @GetMapping("/me")
    public ResponseEntity<CustomerProfileResponse> me() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return ResponseEntity.ok(CustomerProfileResponse.from(user));
    }

    @PatchMapping("/me")
    public ResponseEntity<CustomerProfileResponse> updateMe(@Valid @RequestBody CustomerProfileUpdateRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsernameOrEmail(currentUsername, currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUsername));

        String nextUsername = request.getUsername().trim();
        userRepository.findByUsername(nextUsername)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Username already exists");
                });

        user.setUsername(nextUsername);
        Profile profile = user.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
            user.setProfile(profile);
        }
        profile.setFirstName(trimToNull(request.getFirstName()));
        profile.setLastName(trimToNull(request.getLastName()));
        profile.setFullName(trimToNull(request.getFullName()));
        profile.setPhone(trimToNull(request.getPhone()));
        profile.setGender(trimToNull(request.getGender()));
        profile.setMaritalStatus(trimToNull(request.getMaritalStatus()));
        profile.setInstituteName(trimToNull(request.getInstituteName()));
        profile.setDegree(trimToNull(request.getDegree()));
        profile.setPassingYear(trimToNull(request.getPassingYear()));
        profile.setGrade(trimToNull(request.getGrade()));
        profile.setPercentage(trimToNull(request.getPercentage()));
        profile.setStreetAddress(trimToNull(request.getStreetAddress()));
        profile.setPlotNo(trimToNull(request.getPlotNo()));
        profile.setCity(trimToNull(request.getCity()));
        profile.setState(trimToNull(request.getState()));
        profile.setPincode(trimToNull(request.getPincode()));
        profile.setAddress(trimToNull(request.getAddress()));
        profile.setCompanyName(trimToNull(request.getCompanyName()));
        profile.setWorkLocation(trimToNull(request.getWorkLocation()));
        profile.setStartDate(request.getStartDate());
        profile.setEndDate(request.getEndDate());
        profile.setCompensationPackage(trimToNull(request.getCompensationPackage()));
        profile.setWorkExperience(trimToNull(request.getWorkExperience()));
        profile.setIdentificationFileName(trimToNull(request.getIdentificationFileName()));
        profile.setAdditionalDetails(trimToNull(request.getAdditionalDetails()));
        profile.setFullName(firstNonBlank(
                profile.getFullName(),
                joinNonBlank(profile.getFirstName(), profile.getLastName())
        ));
        profile.setAddress(firstNonBlank(
                profile.getAddress(),
                joinNonBlank(profile.getStreetAddress(), profile.getPlotNo(), profile.getCity(), profile.getState(), profile.getPincode())
        ));
        profile.setWorkExperience(firstNonBlank(
                profile.getWorkExperience(),
                joinNonBlank(profile.getCompanyName(), profile.getWorkLocation(), profile.getCompensationPackage())
        ));
        String password = trimToNull(request.getPassword());
        if (password != null) {
            user.setPassword(passwordEncoder.encode(password));
        }

        return ResponseEntity.ok(CustomerProfileResponse.from(userRepository.save(user)));
    }

    @PostMapping("/orders/{id}/pay")
    public ResponseEntity<OrderResponse> payOrder(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        Order order = orderService.findById(id);
        if (order.getCustomer() == null || !order.getCustomer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only pay for your own orders");
        }
        return ResponseEntity.ok(OrderResponse.from(orderService.markPaid(id)));
    }

    @PostMapping("/orders/{id}/payment/razorpay-order")
    public ResponseEntity<RazorpayOrderResponse> createRazorpayOrder(@PathVariable Long id) {
        Order order = findCustomerOwnedOrder(id);
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cancelled orders cannot be paid");
        }
        RazorpayOrderResponse response = paymentService.createRazorpayOrder(order);
        paymentService.attachRazorpayOrder(order, response);
        orderService.save(order);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/orders/{id}/payment/verify")
    public ResponseEntity<OrderResponse> verifyRazorpayPayment(@PathVariable Long id, @Valid @RequestBody RazorpayVerificationRequest request) {
        Order order = findCustomerOwnedOrder(id);
        paymentService.verifyPaymentSignature(order, request);
        paymentService.attachSuccessfulPayment(order, request);
        orderService.save(order);
        return ResponseEntity.ok(OrderResponse.from(orderService.markPaid(id)));
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        Order order = orderService.findById(id);
        if (order.getCustomer() == null || !order.getCustomer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only cancel your own orders");
        }
        return ResponseEntity.ok(OrderResponse.from(orderService.cancelByCustomer(id)));
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Order findCustomerOwnedOrder(Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        Order order = orderService.findById(id);
        if (order.getCustomer() == null || !order.getCustomer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only access your own orders");
        }
        return order;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String trimmed = trimToNull(value);
            if (trimmed != null) {
                return trimmed;
            }
        }
        return null;
    }

    private String joinNonBlank(String... values) {
        String joined = Stream.of(values)
                .map(this::trimToNull)
                .filter(value -> value != null)
                .collect(Collectors.joining(", "));
        return joined.isBlank() ? null : joined;
    }
}
