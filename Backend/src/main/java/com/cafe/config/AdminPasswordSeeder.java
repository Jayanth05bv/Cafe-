package com.cafe.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cafe.repository.UserRepository;

/**
 * Ensures the default admin user can always log in with password "admin123".
 * Runs after data.sql so the BCrypt hash is correct for the current encoder.
 */
@Component
public class AdminPasswordSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminPasswordSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findByUsername("admin").ifPresent(admin -> {
            String encoded = passwordEncoder.encode("admin123");
            admin.setPassword(encoded);
            userRepository.save(admin);
        });
    }
}
