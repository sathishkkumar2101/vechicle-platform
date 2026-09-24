package com.bmwtechworks.userroleservice.controller;

import com.bmwtechworks.userroleservice.dto.RoleRequest;
import com.bmwtechworks.userroleservice.dto.RoleResponse;
import com.bmwtechworks.userroleservice.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public List<RoleResponse> getAllRoles() {

        return roleService.getAllRoles();
    }

    @GetMapping("/{id}")
    public RoleResponse getRoleById(
            @PathVariable UUID id
    ) {

        return roleService.getRoleById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponse createRole(
            @Valid @RequestBody RoleRequest request
    ) {

        return roleService.createRole(request);
    }

    @PutMapping("/{id}")
    public RoleResponse updateRole(
            @PathVariable UUID id,
            @Valid @RequestBody RoleRequest request
    ) {

        return roleService.updateRole(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(
            @PathVariable UUID id
    ) {

        roleService.deleteRole(id);
    }
}