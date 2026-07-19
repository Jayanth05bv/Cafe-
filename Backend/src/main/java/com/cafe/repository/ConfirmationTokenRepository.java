package com.cafe.repository;

import com.cafe.entity.ConfirmationToken;
import com.cafe.entity.ConfirmationToken.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfirmationTokenRepository extends JpaRepository<ConfirmationToken, Long> {

    Optional<ConfirmationToken> findByTokenAndType(String token, TokenType type);
    void deleteByUserId(Long userId);
}
