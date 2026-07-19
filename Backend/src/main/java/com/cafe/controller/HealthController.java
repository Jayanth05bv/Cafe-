package com.cafe.controller;

import com.cafe.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.util.Map;

/**
 * Public endpoint to verify the database is connected to the project.
 * GET /api/health/db → returns connection status and a simple count from the DB.
 * GET /api/health/h2-url → returns the absolute JDBC URL for H2 Console (same DB as the app).
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final RoleRepository roleRepository;

    @Value("${spring.datasource.url:jdbc:h2:file:./cafedb;DB_CLOSE_DELAY=-1}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:sa}")
    private String datasourceUsername;

    public HealthController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> dbCheck() {
        long rolesCount = roleRepository.count();
        return ResponseEntity.ok(Map.of(
                "database", "connected",
                "rolesCount", rolesCount
        ));
    }

    /**
     * Returns the JDBC URL that the H2 Console should use to connect to the same
     * file database as the app. Uses absolute path so the console connects even if
     * its working directory differs.
     */
    @GetMapping("/h2-url")
    public ResponseEntity<Map<String, Object>> h2ConsoleUrl() {
        String jdbcUrl = datasourceUrl;
        if (jdbcUrl != null && jdbcUrl.startsWith("jdbc:h2:file:")) {
            int pathStart = "jdbc:h2:file:".length();
            int pathEnd = jdbcUrl.indexOf(';', pathStart);
            String path = pathEnd > pathStart ? jdbcUrl.substring(pathStart, pathEnd) : jdbcUrl.substring(pathStart);
            String options = pathEnd > pathStart ? jdbcUrl.substring(pathEnd) : ";DB_CLOSE_DELAY=-1";
            File file = new File(path.trim()).getAbsoluteFile();
            String absolutePath = file.getAbsolutePath().replace('\\', '/');
            jdbcUrl = "jdbc:h2:file:" + absolutePath + options;
        }
        return ResponseEntity.ok(Map.of(
                "jdbcUrl", jdbcUrl,
                "user", datasourceUsername != null ? datasourceUsername : "sa",
                "password", ""
        ));
    }
}
