package com.cafe.controller;

import com.cafe.dto.CustomerProfileResponse;
import com.cafe.dto.CustomerProfileUpdateRequest;
import com.cafe.dto.OrderResponse;
import com.cafe.entity.Profile;
import com.cafe.entity.Order;
import com.cafe.entity.Order.OrderStatus;
import com.cafe.repository.UserRepository;
import com.cafe.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/chef")
public class ChefController {

    private final OrderService orderService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ChefController(OrderService orderService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    @GetMapping("/cafes/{cafeId}/orders")
    public ResponseEntity<List<OrderResponse>> listOrders(@PathVariable Long cafeId) {
        return ResponseEntity.ok(orderService.findByCafe(cafeId).stream().map(OrderResponse::from).toList());
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.findById(id)));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id, @RequestBody StatusUpdate body) {
        OrderStatus status = OrderStatus.valueOf(body.status());
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return ResponseEntity.ok(OrderResponse.from(orderService.updateStatus(id, status, user)));
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

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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

    public record StatusUpdate(String status) {}
}
