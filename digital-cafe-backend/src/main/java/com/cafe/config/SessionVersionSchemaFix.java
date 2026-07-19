package com.cafe.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Backfills the session_version column for existing databases before seeders run.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SessionVersionSchemaFix implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public SessionVersionSchemaFix(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER DEFAULT 0");
        jdbcTemplate.execute("UPDATE users SET session_version = 0 WHERE session_version IS NULL");
        jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN session_version SET NOT NULL");
    }
}
