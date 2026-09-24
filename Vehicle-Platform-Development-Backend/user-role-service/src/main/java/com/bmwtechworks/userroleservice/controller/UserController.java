package com.bmwtechworks.userroleservice.controller;

import com.bmwtechworks.userroleservice.dto.MeResponse;
import com.bmwtechworks.userroleservice.dto.UserRequest;
import com.bmwtechworks.userroleservice.dto.UserResponse;
import com.bmwtechworks.userroleservice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/me")
    public MeResponse getCurrentUser(
            @RequestHeader("X-User-Id") UUID userId
    ) {
        return userService.getCurrentUser(userId);
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(
            @PathVariable UUID id
    ) {
        return userService.getUserById(id);
    }
    @GetMapping("/username/{username}")
    public UserResponse getUserByUsername(
            @PathVariable String username
    ) {
        return userService.getUserByUsername(username);
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(
            @Valid @RequestBody UserRequest request
    ) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UserRequest request
    ) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(
            @PathVariable UUID id
    ) {
        userService.deleteUser(id);
    }
}