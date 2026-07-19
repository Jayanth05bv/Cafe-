package com.cafe.dto;

import com.cafe.entity.Role;
import com.cafe.entity.User;

public record StaffMemberResponse(
        Long id,
        String username,
        String email,
        String fullName,
        String phone,
        String role,
        boolean enabled
) {
    public static StaffMemberResponse from(User user) {
        String roleName = user.getRoles().stream()
                .map(Role::getName)
                .map(Enum::name)
                .filter(name -> "CHEF".equals(name) || "WAITER".equals(name))
                .findFirst()
                .orElse("");
        String fullName = user.getProfile() != null && user.getProfile().getFullName() != null
                ? user.getProfile().getFullName()
                : user.getUsername();
        String phone = user.getProfile() != null ? user.getProfile().getPhone() : null;
        return new StaffMemberResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                fullName,
                phone,
                roleName,
                user.isEnabled()
        );
    }
}
