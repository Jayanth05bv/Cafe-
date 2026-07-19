package com.cafe.service;

import com.cafe.security.JwtUtil;
import com.cafe.dto.LoginRequest;
import com.cafe.dto.RegisterRequest;
import com.cafe.entity.ConfirmationToken;
import com.cafe.entity.Cafe;
import com.cafe.entity.Profile;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.ConfirmationTokenRepository;
import com.cafe.repository.RoleRepository;
import com.cafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int PASSWORD_RESET_TOKEN_VALIDITY_MINUTES = 60;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ConfirmationTokenRepository confirmationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                        ConfirmationTokenRepository confirmationTokenRepository,
                        PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,
                        JwtUtil jwtUtil, EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.confirmationTokenRepository = confirmationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Transactional
    public Map<String, Object> login(LoginRequest request) {
        User existingUser = userRepository.findByUsernameOrEmail(
                request.getUsernameOrEmail(), request.getUsernameOrEmail()
        ).orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        boolean isCustomer = existingUser.getRoles() != null && existingUser.getRoles().stream()
                .anyMatch(r -> r.getName() == Role.RoleName.CUSTOMER);
        if (isCustomer && !existingUser.isEnabled()) {
            existingUser.setEnabled(true);
            userRepository.save(existingUser);
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()
                )
        );
        User user = userRepository.findByUsernameOrEmail(
                request.getUsernameOrEmail(), request.getUsernameOrEmail()
        ).orElseThrow();
        if (!user.isEnabled()) {
            user.setEnabled(true);
            userRepository.save(user);
        }

        String jwt = jwtUtil.generateToken(authentication, user.getSessionVersion());
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("roles", user.getRoles().stream().map(r -> r.getName().name()).toList());
        if (user.getProfile() != null) {
            response.put("fullName", user.getProfile().getFullName());
        }
        return response;
    }

    @Transactional
    public User register(String username, String email, String password, Set<Role.RoleName> roleNames) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        Set<Role> roles = roleNames.stream()
                .map(name -> roleRepository.findByName(name).orElseThrow(() ->
                        new IllegalArgumentException("Role not found: " + name)))
                .collect(Collectors.toSet());
        Profile profile = new Profile();
        profile.setFullName(username);
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(roles);
        user.setProfile(profile);
        user.setEnabled(true);
        profile.setUser(user);
        return userRepository.save(user);
    }

    /** Create user from admin dashboard: enabled immediately, no email confirmation required. */
    @Transactional
    public User registerByAdmin(String username, String email, String password, Set<Role.RoleName> roleNames,
                                String fullName, String phone, String address, String workExperience) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        Set<Role> roles = roleNames.stream()
                .map(name -> roleRepository.findByName(name).orElseThrow(() ->
                        new IllegalArgumentException("Role not found: " + name)))
                .collect(Collectors.toSet());
        Profile profile = new Profile();
        profile.setFullName((fullName != null && !fullName.isBlank()) ? fullName : username);
        profile.setPhone(phone);
        profile.setAddress(address);
        profile.setWorkExperience(workExperience);
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(roles);
        user.setProfile(profile);
        user.setEnabled(true);
        User saved = userRepository.save(user);
        return saved;
    }

    /** Create waiter or chef account by cafe owner. User is enabled immediately and can log in. Sends welcome email. */
    @Transactional
    public User registerStaff(String username, String email, String password, Role.RoleName roleName, Cafe cafe,
                              String fullName, String phone, String address,
                              String workExperience, String additionalDetails) {
        if (roleName != Role.RoleName.CHEF && roleName != Role.RoleName.WAITER) {
            throw new IllegalArgumentException("Only CHEF or WAITER role can be created by owner");
        }
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        Role role = roleRepository.findByName(roleName).orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));
        Profile profile = new Profile();
        profile.setFullName((fullName != null && !fullName.isBlank()) ? fullName : username);
        profile.setPhone(phone);
        profile.setAddress(address);
        profile.setWorkExperience(workExperience);
        profile.setAdditionalDetails(additionalDetails);
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(Set.of(role));
        user.setProfile(profile);
        user.setCafe(cafe);
        user.setEnabled(true);
        profile.setUser(user);
        User saved = userRepository.save(user);
        String loginUrl = frontendUrl + "/login";
        emailService.sendStaffWelcome(saved.getEmail(), saved.getUsername(), roleName.name(), loginUrl);
        return saved;
    }

    /** Public registration: only CUSTOMER is allowed. Chef and Waiter are created from Admin dashboard. */
    @Transactional
    public Map<String, Object> registerAndLogin(RegisterRequest request) {
        Set<Role.RoleName> roleNames = Set.of(resolvePublicRegistrationRole(request.getRole()));
        User user = register(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                roleNames);
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        String jwt = jwtUtil.generateToken(authentication, user.getSessionVersion());
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("roles", user.getRoles().stream().map(r -> r.getName().name()).toList());
        if (user.getProfile() != null) {
            response.put("fullName", user.getProfile().getFullName());
        }
        return response;
    }

    private Role.RoleName resolvePublicRegistrationRole(String rawRole) {
        String normalized = rawRole == null ? "" : rawRole.trim().toUpperCase();
        return switch (normalized) {
            case "", "CUSTOMER", "ROLE_CUSTOMER" -> Role.RoleName.CUSTOMER;
            case "OWNER", "ROLE_OWNER", "CAFE_OWNER", "ROLE_CAFE_OWNER" -> Role.RoleName.OWNER;
            default -> throw new IllegalArgumentException("Public registration supports only CUSTOMER or CAFE_OWNER");
        };
    }

    @Transactional
    public Map<String, Object> confirm(String token, String type) {
        ConfirmationToken.TokenType tokenType;
        try {
            tokenType = ConfirmationToken.TokenType.valueOf(type != null ? type.toUpperCase() : "");
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid confirmation type");
        }
        ConfirmationToken ct = confirmationTokenRepository.findByTokenAndType(token, tokenType)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired confirmation link"));
        if (ct.getExpiresAt().isBefore(Instant.now())) {
            confirmationTokenRepository.delete(ct);
            throw new IllegalArgumentException("Confirmation link has expired");
        }
        User user = ct.getUser();
        confirmationTokenRepository.delete(ct);
        Map<String, Object> response = new HashMap<>();
        if (tokenType == ConfirmationToken.TokenType.REGISTRATION) {
            user.setEnabled(true);
            userRepository.save(user);
            response.put("success", true);
            response.put("type", "registration");
            response.put("message", "Registration confirmed. You can now log in.");
        } else {
            var authorities = user.getRoles().stream()
                    .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getName().name()))
                    .collect(Collectors.toList());
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user.getUsername(), null, authorities);
            String jwt = jwtUtil.generateToken(authentication, user.getSessionVersion());
            response.put("success", true);
            response.put("type", "login");
            response.put("token", jwt);
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("roles", user.getRoles().stream().map(r -> r.getName().name()).toList());
            if (user.getProfile() != null) {
                response.put("fullName", user.getProfile().getFullName());
            }
        }
        return response;
    }

    /** Request password reset: sends email with reset link to the given email if user exists. */
    @Transactional
    public Map<String, Object> requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        Map<String, Object> response = new HashMap<>();
        response.put("message", "If an account exists with this email, you will receive a password reset link.");
        userRepository.findByEmail(email).ifPresent(user -> {
            String tokenValue = UUID.randomUUID().toString();
            ConfirmationToken ct = new ConfirmationToken();
            ct.setToken(tokenValue);
            ct.setUser(user);
            ct.setType(ConfirmationToken.TokenType.PASSWORD_RESET);
            ct.setExpiresAt(Instant.now().plusSeconds(PASSWORD_RESET_TOKEN_VALIDITY_MINUTES * 60L));
            confirmationTokenRepository.save(ct);
            String resetLink = frontendUrl + "/reset-password?token=" + tokenValue;
            if (mailEnabled) {
                boolean sent = emailService.sendPasswordReset(user.getEmail(), user.getUsername(), resetLink);
                if (!sent) {
                    log.info("Mail disabled: password reset link for {} -> {}", user.getEmail(), resetLink);
                }
            } else {
                log.info("Mail disabled: password reset link for {} -> {}", user.getEmail(), resetLink);
            }
            // Always return the link so the user can reset even if email fails or is not configured
            response.put("resetLink", resetLink);
        });
        return response;
    }

    /** Reset password using token from email link. */
    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token is required");
        }
        if (newPassword == null || newPassword.length() < 4) {
            throw new IllegalArgumentException("Password must be at least 4 characters");
        }
        ConfirmationToken ct = confirmationTokenRepository.findByTokenAndType(token, ConfirmationToken.TokenType.PASSWORD_RESET)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link"));
        if (ct.getExpiresAt().isBefore(Instant.now())) {
            confirmationTokenRepository.delete(ct);
            throw new IllegalArgumentException("Reset link has expired. Please request a new one.");
        }
        User user = ct.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        confirmationTokenRepository.delete(ct);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password updated. You can now log in.");
        return response;
    }
}
