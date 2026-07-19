package com.cafe.controller;

import com.cafe.dto.LoginRequest;
import com.cafe.dto.RegisterRequest;
import com.cafe.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerAndLogin(request));
    }

    @GetMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirm(
            @RequestParam String token,
            @RequestParam(defaultValue = "registration") String type) {
        return ResponseEntity.ok(authService.confirm(token, type));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody(required = false) Map<String, String> body) {
        String email = (body != null && body.containsKey("email")) ? body.get("email") : null;
        return ResponseEntity.ok(authService.requestPasswordReset(email));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body != null ? body.get("token") : null;
        String newPassword = body != null ? body.get("newPassword") : null;
        return ResponseEntity.ok(authService.resetPassword(token, newPassword));
    }
}
