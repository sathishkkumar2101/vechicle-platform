package com.bmwtechworks.userroleservice.service;

import com.bmwtechworks.userroleservice.client.PermissionClient;
import com.bmwtechworks.userroleservice.dto.MeResponse;
import com.bmwtechworks.userroleservice.dto.PermissionResponse;
import com.bmwtechworks.userroleservice.dto.UserRequest;
import com.bmwtechworks.userroleservice.dto.UserResponse;
import com.bmwtechworks.userroleservice.model.Role;
import com.bmwtechworks.userroleservice.model.User;
import com.bmwtechworks.userroleservice.repository.RoleRepository;
import com.bmwtechworks.userroleservice.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionClient permissionClient;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionClient permissionClient,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionClient = permissionClient;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse getUserById(UUID id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + id
                        )
                );

        return toResponse(user);
    }
    public UserResponse getUserByUsername(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with username: " + username
                        )
                );

        return toResponse(user);
    }

    public MeResponse getCurrentUser(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + userId
                        )
                );

        Role role = roleRepository.findById(user.getRoleId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Role not found with id: " + user.getRoleId()
                        )
                );

        List<String> permissions = role.getPermissionIds()
                .stream()
                .map(permissionClient::getPermissionById)
                .map(PermissionResponse::name)
                .toList();

        return new MeResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                role.getName(),
                permissions
        );
    }

    public UserResponse createUser(UserRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException(
                    "User already exists with email: " + request.email()
            );
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new RuntimeException(
                    "User already exists with username: " + request.username()
            );
        }

        String roleName = "CUSTOMER";

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Role not found: " + roleName
                        )
                );

        User user = User.builder()
                .username(request.username())
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .roleId(role.getId())
                .build();

        User savedUser = userRepository.save(user);

        return toResponse(savedUser);
    }

    public UserResponse updateUser(UUID id, UserRequest request) {

        User existingUser = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + id
                        )
                );

        existingUser.setName(request.name());
        existingUser.setEmail(request.email());

        existingUser.setPassword(
                passwordEncoder.encode(request.password())
        );

        String roleName = request.role().toUpperCase();

        if (!roleName.equals("CUSTOMER")
                && !roleName.equals("DEALER")) {

            throw new RuntimeException(
                    "Only CUSTOMER or DEALER roles are allowed"
            );
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Role not found: " + roleName
                        )
                );

        existingUser.setRoleId(role.getId());

        return toResponse(userRepository.save(existingUser));
    }

    public void deleteUser(UUID id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + id
                        )
                );

        userRepository.delete(user);
    }

    public User login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid email or password"
                        )
                );

        boolean validPassword =
                passwordEncoder.matches(
                        password,
                        user.getPassword()
                );

        if (!validPassword) {
            throw new RuntimeException(
                    "Invalid email or password"
            );
        }

        return user;
    }

    private UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getRoleId()
        );
    }
}