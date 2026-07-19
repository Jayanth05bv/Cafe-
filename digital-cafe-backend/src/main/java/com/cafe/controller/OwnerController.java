package com.cafe.controller;

import com.cafe.dto.OwnerProfileResponse;
import com.cafe.dto.OrderResponse;
import com.cafe.dto.StaffMemberResponse;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeTable;
import com.cafe.entity.Menu;
import com.cafe.entity.Order;
import com.cafe.entity.Profile;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.UserRepository;
import com.cafe.service.AuthService;
import com.cafe.service.CafeService;
import com.cafe.service.OrderService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    private final CafeService cafeService;
    private final AuthService authService;
    private final OrderService orderService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public OwnerController(CafeService cafeService, AuthService authService, OrderService orderService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.cafeService = cafeService;
        this.authService = authService;
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    @GetMapping("/me")
    public ResponseEntity<OwnerProfileResponse> getCurrentOwner() {
        String username = getCurrentUsername();
        User user = userRepository.findWithOwnerCafesByUsernameOrEmail(username, username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(OwnerProfileResponse.from(user));
    }

    @PutMapping("/me")
    public ResponseEntity<OwnerProfileResponse> updateCurrentOwner(@RequestBody Map<String, Object> body) {
        String currentUsername = getCurrentUsername();
        User owner = userRepository.findByUsernameOrEmail(currentUsername, currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String firstName = value(body.get("firstName")).trim();
        String lastName = value(body.get("lastName")).trim();
        String fullName = value(body.get("fullName")).trim();
        String email = value(body.get("email")).trim();
        String phone = value(body.get("phone")).trim();
        String gender = value(body.get("gender")).trim();
        String maritalStatus = value(body.get("maritalStatus")).trim();
        String instituteName = value(body.get("instituteName")).trim();
        String degree = value(body.get("degree")).trim();
        String passingYear = value(body.get("passingYear")).trim();
        String grade = value(body.get("grade")).trim();
        String percentage = value(body.get("percentage")).trim();
        String streetAddress = value(body.get("streetAddress")).trim();
        String plotNo = value(body.get("plotNo")).trim();
        String city = value(body.get("city")).trim();
        String state = value(body.get("state")).trim();
        String pincode = value(body.get("pincode")).trim();
        String companyName = value(body.get("companyName")).trim();
        String workLocation = value(body.get("workLocation")).trim();
        String startDate = value(body.get("startDate")).trim();
        String endDate = value(body.get("endDate")).trim();
        String compensationPackage = value(body.get("compensationPackage")).trim();
        String identificationFileName = value(body.get("identificationFileName")).trim();
        String profileImageUrl = value(body.get("profileImageUrl")).trim();

        if (fullName.isBlank() || email.isBlank()) {
            throw new IllegalArgumentException("Owner name and email are required");
        }
        userRepository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(owner.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Email already exists");
                });

        owner.setEmail(email);
        Profile profile = owner.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(owner);
            owner.setProfile(profile);
        }
        profile.setFullName(fullName);
        profile.setFirstName(firstName.isBlank() ? null : firstName);
        profile.setLastName(lastName.isBlank() ? null : lastName);
        profile.setPhone(phone.isBlank() ? null : phone);
        profile.setGender(gender.isBlank() ? null : gender);
        profile.setMaritalStatus(maritalStatus.isBlank() ? null : maritalStatus);
        profile.setInstituteName(instituteName.isBlank() ? null : instituteName);
        profile.setDegree(degree.isBlank() ? null : degree);
        profile.setPassingYear(passingYear.isBlank() ? null : passingYear);
        profile.setGrade(grade.isBlank() ? null : grade);
        profile.setPercentage(percentage.isBlank() ? null : percentage);
        profile.setStreetAddress(streetAddress.isBlank() ? null : streetAddress);
        profile.setPlotNo(plotNo.isBlank() ? null : plotNo);
        profile.setCity(city.isBlank() ? null : city);
        profile.setState(state.isBlank() ? null : state);
        profile.setPincode(pincode.isBlank() ? null : pincode);
        profile.setCompanyName(companyName.isBlank() ? null : companyName);
        profile.setWorkLocation(workLocation.isBlank() ? null : workLocation);
        profile.setStartDate(parseDate(startDate));
        profile.setEndDate(parseDate(endDate));
        profile.setCompensationPackage(compensationPackage.isBlank() ? null : compensationPackage);
        profile.setIdentificationFileName(identificationFileName.isBlank() ? null : identificationFileName);
        profile.setProfileImageUrl(profileImageUrl.isBlank() ? null : profileImageUrl);
        User saved = userRepository.save(owner);
        return ResponseEntity.ok(OwnerProfileResponse.from(saved));
    }

    @PostMapping("/me/password")
    public ResponseEntity<Map<String, String>> updatePassword(@RequestBody Map<String, String> body) {
        String currentPassword = value(body.get("currentPassword"));
        String newPassword = value(body.get("newPassword"));
        User owner = requireCurrentUser();
        if (!passwordEncoder.matches(currentPassword, owner.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (!newPassword.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Password must include at least one number");
        }
        if (!newPassword.matches(".*[^A-Za-z0-9].*")) {
            throw new IllegalArgumentException("Password must include at least one special character");
        }
        owner.setPassword(passwordEncoder.encode(newPassword));
        owner.setSessionVersion(owner.getSessionVersion() + 1);
        userRepository.save(owner);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @PostMapping("/me/logout-all")
    public ResponseEntity<Map<String, String>> logoutAllDevices() {
        User owner = requireCurrentUser();
        owner.setSessionVersion(owner.getSessionVersion() + 1);
        userRepository.save(owner);
        return ResponseEntity.ok(Map.of("message", "Logged out from all devices"));
    }

    @PostMapping("/accept-assignment")
    public ResponseEntity<User> acceptAssignment() {
        User user = requireCurrentUser();
        if (user.getOwnerCafes().isEmpty()) {
            throw new IllegalArgumentException("No cafe assignment to accept");
        }
        if (user.getCafe() == null) {
            user.setCafe(user.getOwnerCafes().stream().findFirst().orElse(null));
        }
        user.setOwnerAssignmentAccepted(true);
        return ResponseEntity.ok(userRepository.save(user));
    }

    private static String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        return (String) auth.getPrincipal();
    }

    @GetMapping("/cafes/{id}")
    public ResponseEntity<Cafe> getCafe(@PathVariable Long id) {
        return ResponseEntity.ok(requireOwnedCafe(id));
    }

    @PutMapping("/cafes/{id}")
    public ResponseEntity<Cafe> updateCafe(@PathVariable Long id, @RequestBody Cafe cafe) {
        requireOwnedCafe(id);
        return ResponseEntity.ok(cafeService.update(id, cafe));
    }

    @GetMapping("/cafes/{cafeId}/tables")
    public ResponseEntity<List<CafeTable>> getTables(@PathVariable Long cafeId) {
        requireOwnedCafe(cafeId);
        return ResponseEntity.ok(cafeService.getTables(cafeId));
    }

    @PostMapping("/cafes/{cafeId}/tables")
    public ResponseEntity<CafeTable> addTable(@PathVariable Long cafeId, @RequestBody CafeTable table) {
        requireOwnedCafe(cafeId);
        return ResponseEntity.ok(cafeService.addTable(cafeId, table));
    }

    @GetMapping("/cafes/{cafeId}/menu")
    public ResponseEntity<List<Menu>> getMenu(@PathVariable Long cafeId) {
        requireOwnedCafe(cafeId);
        return ResponseEntity.ok(cafeService.getMenuForOwner(cafeId));
    }

    @PostMapping("/cafes/{cafeId}/menu")
    public ResponseEntity<Menu> addMenuItem(@PathVariable Long cafeId, @RequestBody Menu menu) {
        requireOwnedCafe(cafeId);
        return ResponseEntity.ok(cafeService.addMenuItem(cafeId, menu));
    }

    @PutMapping("/cafes/{cafeId}/menu/{menuId}")
    public ResponseEntity<Menu> updateMenuItem(@PathVariable Long cafeId, @PathVariable Long menuId, @RequestBody Menu menu) {
        requireOwnedCafe(cafeId);
        return ResponseEntity.ok(cafeService.updateMenuItem(cafeId, menuId, menu));
    }

    @PostMapping(value = "/uploads/menu-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, List<String>>> uploadMenuImages(@RequestParam("files") List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Select at least one image to upload");
        }
        Path uploadDir = Paths.get("uploads", "menu").toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);

        List<String> urls = files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .map(file -> storeMenuImage(uploadDir, file))
                .toList();

        if (urls.isEmpty()) {
            throw new IllegalArgumentException("Select at least one image to upload");
        }
        return ResponseEntity.ok(Map.of("urls", urls));
    }

    @PostMapping(value = "/uploads/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadProfileImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Select an image to upload");
        }
        Path uploadDir = Paths.get("uploads", "owner-profile").toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);
        return ResponseEntity.ok(Map.of("url", storeImage(uploadDir, file, "owner-profile", "/uploads/owner-profile/")));
    }

    @PutMapping("/cafes/{cafeId}/tables/{tableId}")
    public ResponseEntity<CafeTable> updateTable(@PathVariable Long cafeId, @PathVariable Long tableId, @RequestBody CafeTable table) {
        requireOwnedCafe(cafeId);
        return ResponseEntity.ok(cafeService.updateTable(cafeId, tableId, table));
    }

    @DeleteMapping("/cafes/{cafeId}/tables/{tableId}")
    public ResponseEntity<Map<String, String>> deleteTable(@PathVariable Long cafeId, @PathVariable Long tableId) {
        requireOwnedCafe(cafeId);
        cafeService.deleteTable(cafeId, tableId);
        return ResponseEntity.ok(Map.of("message", "Table deleted"));
    }

    @GetMapping("/cafes/{cafeId}/orders")
    public ResponseEntity<List<OrderResponse>> getOrders(@PathVariable Long cafeId) {
        requireOwnedCafe(cafeId);
        return ResponseEntity.ok(orderService.findByCafe(cafeId).stream().map(OrderResponse::from).toList());
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long orderId) {
        Order order = orderService.findById(orderId);
        if (order.getCafe() == null || !ownerHasCafe(requireCurrentUser(), order.getCafe().getId())) {
            throw new IllegalArgumentException("Order does not belong to your cafe");
        }
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long orderId, @RequestBody ChefController.StatusUpdate body) {
        Order order = orderService.findById(orderId);
        if (order.getCafe() == null || !ownerHasCafe(requireCurrentUser(), order.getCafe().getId())) {
            throw new IllegalArgumentException("Order does not belong to your cafe");
        }
        return ResponseEntity.ok(OrderResponse.from(orderService.updateStatus(orderId, Order.OrderStatus.valueOf(body.status()))));
    }

    /** Create waiter or chef credentials; stored in database and can log in immediately. */
    @PostMapping("/staff")
    public ResponseEntity<User> createStaff(@RequestBody Map<String, String> body) {
        String currentUsername = getCurrentUsername();
        User owner = userRepository.findByUsernameOrEmail(currentUsername, currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
        Long cafeId = body.get("cafeId") != null && !body.get("cafeId").isBlank() ? Long.parseLong(body.get("cafeId")) : null;
        Cafe cafe = requireOwnedCafe(cafeId);
        if (cafe == null) {
            throw new IllegalArgumentException("Assign a cafe to the owner before creating staff");
        }
        String username = body.get("username");
        String email = body.get("email");
        String password = body.get("password");
        String roleStr = body.get("role");
        String firstName = body.get("firstName");
        String lastName = body.get("lastName");
        String phone = body.get("phone");
        String address = body.get("address");
        String workExperience = body.get("workExperience");
        String additionalDetails = body.get("additionalDetails");
        String fullName = ((firstName != null ? firstName.trim() : "") + " " + (lastName != null ? lastName.trim() : "")).trim();
        if (username == null || username.isBlank() || email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Username, email and password are required");
        }
        Role.RoleName roleName;
        try {
            roleName = Role.RoleName.valueOf(roleStr != null ? roleStr.toUpperCase() : "");
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Role must be WAITER or CHEF");
        }
        User user = authService.registerStaff(
                username, email, password, roleName, cafe, fullName, phone, address, workExperience, additionalDetails
        );
        return ResponseEntity.ok(user);
    }

    @GetMapping("/staff")
    public ResponseEntity<List<StaffMemberResponse>> getStaff(@RequestParam Long cafeId) {
        requireOwnedCafe(cafeId);
        List<StaffMemberResponse> staff = userRepository.findByCafeId(cafeId).stream()
                .map(StaffMemberResponse::from)
                .filter(member -> "CHEF".equals(member.role()) || "WAITER".equals(member.role()))
                .toList();
        return ResponseEntity.ok(staff);
    }

    @PutMapping("/staff/{staffId}")
    public ResponseEntity<StaffMemberResponse> updateStaff(@PathVariable Long staffId, @RequestBody Map<String, Object> body) {
        User owner = requireCurrentOwner();
        User staff = requireOwnedStaff(owner, staffId);
        String username = value(body.get("username")).trim();
        String email = value(body.get("email")).trim();
        String fullName = value(body.get("fullName")).trim();
        String phone = value(body.get("phone")).trim();
        boolean enabled = body.get("enabled") == null || Boolean.parseBoolean(String.valueOf(body.get("enabled")));

        if (username.isBlank() || email.isBlank()) {
            throw new IllegalArgumentException("Username and email are required");
        }
        userRepository.findByUsername(username)
                .filter(existing -> !existing.getId().equals(staff.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Username already exists");
                });
        userRepository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(staff.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Email already exists");
                });

        staff.setUsername(username);
        staff.setEmail(email);
        staff.setEnabled(enabled);
        Profile profile = staff.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(staff);
            staff.setProfile(profile);
        }
        profile.setFullName(fullName.isBlank() ? username : fullName);
        profile.setPhone(phone.isBlank() ? null : phone);
        User saved = userRepository.save(staff);
        return ResponseEntity.ok(StaffMemberResponse.from(saved));
    }

    @PostMapping("/staff/{staffId}/reset-password")
    public ResponseEntity<Map<String, String>> resetStaffPassword(@PathVariable Long staffId, @RequestBody Map<String, String> body) {
        User owner = requireCurrentOwner();
        User staff = requireOwnedStaff(owner, staffId);
        String newPassword = value(body.get("newPassword"));
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        staff.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(staff);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @DeleteMapping("/staff/{staffId}")
    public ResponseEntity<Map<String, String>> deleteStaff(@PathVariable Long staffId) {
        User owner = requireCurrentOwner();
        User staff = requireOwnedStaff(owner, staffId);
        userRepository.delete(staff);
        return ResponseEntity.ok(Map.of("message", "Staff deleted"));
    }

    private User requireCurrentOwner() {
        User owner = requireCurrentUser();
        if (getAccessibleOwnerCafes(owner).isEmpty()) {
            throw new IllegalArgumentException("Assign a cafe to the owner before managing staff");
        }
        return owner;
    }

    private Cafe requireOwnedCafe(Long cafeId) {
        User owner = requireCurrentOwner();
        List<Cafe> accessibleCafes = getAccessibleOwnerCafes(owner);
        if (cafeId == null) {
            return owner.getCafe() != null ? owner.getCafe() : accessibleCafes.stream().findFirst().orElse(null);
        }
        return accessibleCafes.stream()
                .filter(cafe -> cafe.getId().equals(cafeId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Cafe does not belong to this owner"));
    }

    private boolean ownerHasCafe(User owner, Long cafeId) {
        return getAccessibleOwnerCafes(owner).stream().anyMatch(cafe -> cafe.getId().equals(cafeId));
    }

    private List<Cafe> getAccessibleOwnerCafes(User owner) {
        List<Cafe> cafes = new ArrayList<>(owner.getOwnerCafes());
        if (cafes.isEmpty() && owner.getCafe() != null) {
            cafes.add(owner.getCafe());
        }
        return cafes;
    }

    private User requireCurrentUser() {
        String currentUsername = getCurrentUsername();
        return userRepository.findWithOwnerCafesByUsernameOrEmail(currentUsername, currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
    }

    private User requireOwnedStaff(User owner, Long staffId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found"));
        boolean sameCafe = staff.getCafe() != null && ownerHasCafe(owner, staff.getCafe().getId());
        boolean allowedRole = staff.getRoles().stream()
                .map(Role::getName)
                .anyMatch(role -> role == Role.RoleName.CHEF || role == Role.RoleName.WAITER);
        if (!sameCafe || !allowedRole) {
            throw new IllegalArgumentException("Staff member not found for this cafe");
        }
        return staff;
    }

    private String value(Object input) {
        return input == null ? "" : String.valueOf(input);
    }

    private String storeMenuImage(Path uploadDir, MultipartFile file) {
        return storeImage(uploadDir, file, "menu-image", "/uploads/menu/");
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDate.parse(value);
    }

    private String storeImage(Path uploadDir, MultipartFile file, String fallbackName, String relativeDir) {
        try {
            String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
            if (!contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Only image files are allowed");
            }
            String originalName = file.getOriginalFilename() == null ? fallbackName : file.getOriginalFilename();
            String sanitizedName = sanitizeFilename(originalName);
            String filename = UUID.randomUUID() + "-" + sanitizedName;
            Path target = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            String relativePath = relativeDir + filename;
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(relativePath)
                    .toUriString();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store image", ex);
        }
    }

    private String sanitizeFilename(String filename) {
        String normalized = Normalizer.normalize(filename, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "");
        String safe = normalized.replaceAll("[^A-Za-z0-9._-]", "-");
        return safe.isBlank() ? "menu-image" : safe;
    }
}
