package com.bmwtechworks.apigateway.filter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.UUID;

public class UserIdRequestWrapper extends HttpServletRequestWrapper {

    private final UUID userId;
    private final String userRole;

    public UserIdRequestWrapper(
            HttpServletRequest request,
            UUID userId
    ) {
        super(request);
        this.userId = userId;
        this.userRole = null;
    }

    public UserIdRequestWrapper(
            HttpServletRequest request,
            UUID userId,
            String userRole
    ) {
        super(request);
        this.userId = userId;
        this.userRole = userRole;
    }

    @Override
    public String getHeader(String name) {

        if ("X-User-Id".equalsIgnoreCase(name)) {
            return userId != null ? userId.toString() : null;
        }

        if ("X-User-Role".equalsIgnoreCase(name)) {
            return userRole;
        }

        return super.getHeader(name);
    }

    @Override
    public Enumeration<String> getHeaders(String name) {

        if ("X-User-Id".equalsIgnoreCase(name)) {
            return Collections.enumeration(
                    userId != null ? List.of(userId.toString()) : List.of()
            );
        }

        if ("X-User-Role".equalsIgnoreCase(name)) {
            return Collections.enumeration(
                    userRole != null ? List.of(userRole) : List.of()
            );
        }

        return super.getHeaders(name);
    }

    @Override
    public Enumeration<String> getHeaderNames() {

        List<String> headerNames =
                new java.util.ArrayList<>(Collections.list(super.getHeaderNames()));

        boolean existsId = headerNames.stream()
                .anyMatch(name ->
                        "X-User-Id".equalsIgnoreCase(name)
                );

        if (!existsId && userId != null) {
            headerNames.add("X-User-Id");
        }

        boolean existsRole = headerNames.stream()
                .anyMatch(name ->
                        "X-User-Role".equalsIgnoreCase(name)
                );

        if (!existsRole && userRole != null) {
            headerNames.add("X-User-Role");
        }

        return Collections.enumeration(headerNames);
    }
}