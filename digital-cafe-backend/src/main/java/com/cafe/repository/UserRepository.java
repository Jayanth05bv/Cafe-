package com.cafe.repository;

import com.cafe.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = {"roles", "cafe", "ownerCafes"})
    List<User> findAll();

    @EntityGraph(attributePaths = {"roles", "cafe", "profile", "ownerCafes"})
    List<User> findByCafeId(Long cafeId);

    @EntityGraph(attributePaths = {"roles", "cafe", "profile", "ownerCafes"})
    Optional<User> findWithOwnerCafesByUsernameOrEmail(String username, String email);

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
