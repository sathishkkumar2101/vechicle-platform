package com.bmwtechworks.userroleservice.dto;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String name,
        String email,
        UUID roleId
) {
}