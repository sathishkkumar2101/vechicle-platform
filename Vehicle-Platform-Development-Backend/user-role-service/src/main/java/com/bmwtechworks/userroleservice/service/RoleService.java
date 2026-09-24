package com.bmwtechworks.userroleservice.service;

import com.bmwtechworks.userroleservice.client.PermissionClient;
import com.bmwtechworks.userroleservice.dto.PermissionResponse;
import com.bmwtechworks.userroleservice.dto.RoleRequest;
import com.bmwtechworks.userroleservice.dto.RoleResponse;
import com.bmwtechworks.userroleservice.model.Role;
import com.bmwtechworks.userroleservice.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionClient permissionClient;

    public RoleService(
            RoleRepository roleRepository,
            PermissionClient permissionClient
    ) {
        this.roleRepository = roleRepository;
        this.permissionClient = permissionClient;
    }

    // =========================
    // GET ALL ROLES
    // =========================

    public List<RoleResponse> getAllRoles() {

        return roleRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // GET ROLE BY ID
    // =========================

    public RoleResponse getRoleById(UUID id) {

        Role role = roleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Role not found with id: " + id
                        )
                );

        return toResponse(role);
    }

    // =========================
    // CREATE ROLE
    // =========================

    public RoleResponse createRole(RoleRequest request) {

        if (roleRepository.existsByName(request.name())) {
            throw new RuntimeException(
                    "Role already exists: " + request.name()
            );
        }

        Set<UUID> permissionIds =
                request.permissionIds() != null
                        ? new HashSet<>(request.permissionIds())
                        : new HashSet<>();

        // Verify permissions through Permission Service
        validatePermissions(permissionIds);

        Role role = Role.builder()
                .name(request.name())
                .permissionIds(permissionIds)
                .build();

        Role savedRole = roleRepository.save(role);

        return toResponse(savedRole);
    }

    // =========================
    // UPDATE ROLE
    // =========================

    public RoleResponse updateRole(
            UUID id,
            RoleRequest request
    ) {

        Role existingRole = roleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Role not found with id: " + id
                        )
                );

        // Check if another role already uses this name
        if (!existingRole.getName().equals(request.name())
                && roleRepository.existsByName(request.name())) {

            throw new RuntimeException(
                    "Role already exists: " + request.name()
            );
        }

        Set<UUID> permissionIds =
                request.permissionIds() != null
                        ? new HashSet<>(request.permissionIds())
                        : new HashSet<>();

        // Verify permissions through Permission Service
        validatePermissions(permissionIds);

        existingRole.setName(request.name());
        existingRole.setPermissionIds(permissionIds);

        Role updatedRole = roleRepository.save(existingRole);

        return toResponse(updatedRole);
    }

    // =========================
    // DELETE ROLE
    // =========================

    public void deleteRole(UUID id) {

        Role role = roleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Role not found with id: " + id
                        )
                );

        roleRepository.delete(role);
    }

    // =========================
    // VALIDATE PERMISSIONS
    // =========================

    private void validatePermissions(Set<UUID> permissionIds) {

        for (UUID permissionId : permissionIds) {

            try {

                PermissionResponse permission =
                        permissionClient.getPermissionById(permissionId);

                if (permission == null) {
                    throw new RuntimeException(
                            "Permission not found: " + permissionId
                    );
                }

            } catch (Exception e) {

                throw new RuntimeException(
                        "Invalid permission ID: " + permissionId,
                        e
                );
            }
        }
    }

    // =========================
    // ENTITY → RESPONSE
    // =========================

    private RoleResponse toResponse(Role role) {

        return new RoleResponse(
                role.getId(),
                role.getName(),
                role.getPermissionIds()
        );
    }
}