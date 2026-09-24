package com.bmwtechworks.apigateway.filter;

import com.bmwtechworks.apigateway.client.UserAuthorizationClient;
import com.bmwtechworks.apigateway.service.AuthorizationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

public class AuthorizationFilter extends OncePerRequestFilter {

    private final AuthorizationService authorizationService;

    public AuthorizationFilter(
            AuthorizationService authorizationService
    ) {
        this.authorizationService = authorizationService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        System.out.println(
                ">>> AuthorizationFilter HIT: "
                        + request.getMethod()
                        + " "
                        + request.getRequestURI()
        );

        String path = request.getRequestURI();
        String method = request.getMethod();

        if (path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (method.equals("POST") && path.equals("/api/users")) {
            filterChain.doFilter(request, response);
            return;
        }
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        System.out.println(
                ">>> Authentication object: "
                        + authentication
        );

        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)) {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.getWriter().write(
                    "Unauthorized"
            );

            return;
        }

        UUID userId;

        try {

            String subject =
                    jwtAuthentication
                            .getToken()
                            .getSubject();

            userId = UUID.fromString(subject);

        } catch (Exception e) {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.getWriter().write(
                    "Invalid user ID in JWT"
            );

            return;
        }

        System.out.println(
                ">>> Authenticated user ID: "
                        + userId
        );

        /*
         * /api/users/me
         */
        if (method.equals("GET") && path.equals("/api/users/me")) {
            filterChain.doFilter(
                    new UserIdRequestWrapper(request, userId),
                    response
            );

            return;
        }

        /*
         * Permission Service
         */
        if (path.startsWith("/api/permissions")) {

            if (!hasRole(userId, "ADMIN")) {

                response.setStatus(
                        HttpServletResponse.SC_FORBIDDEN
                );

                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );

                return;
            }

            filterChain.doFilter(request, response);
            return;
        }

        /*
         * Role Service
         */
        if (path.startsWith("/api/roles")) {

            if (!hasRole(userId, "ADMIN")) {

                response.setStatus(
                        HttpServletResponse.SC_FORBIDDEN
                );

                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );

                return;
            }

            filterChain.doFilter(request, response);
            return;
        }

        /*
         * User Service
         */
        if (path.startsWith("/api/users")) {

            if (method.equals("PUT")) {

                String userIdPart =
                        path.substring("/api/users/".length());

                try {

                    UUID requestedUserId =
                            UUID.fromString(userIdPart);

                    if (authorizationService.isOwner(
                            userId,
                            requestedUserId
                    )) {

                        filterChain.doFilter(
                                request,
                                response
                        );

                        return;
                    }

                } catch (IllegalArgumentException ignored) {
                }

                if (authorizationService.hasPermission(
                        userId,
                        "UPDATE_USER"
                )) {

                    filterChain.doFilter(
                            request,
                            response
                    );

                    return;
                }

                response.setStatus(
                        HttpServletResponse.SC_FORBIDDEN
                );

                response.getWriter().write(
                        "Access denied: UPDATE_USER permission required"
                );

                return;
            }

            if (method.equals("DELETE")) {

                if (authorizationService.hasPermission(
                        userId,
                        "DELETE_USER"
                )) {

                    filterChain.doFilter(
                            request,
                            response
                    );

                    return;
                }

                response.setStatus(
                        HttpServletResponse.SC_FORBIDDEN
                );

                response.getWriter().write(
                        "Access denied: DELETE_USER permission required"
                );

                return;
            }

            if (method.equals("GET")) {

                if (hasRole(userId, "ADMIN")) {

                    filterChain.doFilter(
                            request,
                            response
                    );

                    return;
                }

                response.setStatus(
                        HttpServletResponse.SC_FORBIDDEN
                );

                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );

                return;
            }
        }
        /*
         * Vehicle Service
         */
        if (path.startsWith("/api/vehicles")) {

            // ADMIN can do everything
            if (hasRole(userId, "ADMIN")) {
                filterChain.doFilter(request, response);
                return;
            }

            /*
             * CUSTOMER and DEALER can view all vehicles
             */
            if (method.equals("GET")
                    && path.equals("/api/vehicles")) {

                if (hasRole(userId, "CUSTOMER") || hasRole(userId, "DEALER")) {

                    filterChain.doFilter(request, response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER, DEALER or ADMIN role required"
                );
                return;
            }

            /*
             * CUSTOMER + DEALER can view vehicles by dealer
             */
            if (method.equals("GET")
                    && path.matches("/api/vehicles/dealer/[^/]+")) {

                if (hasRole(userId, "CUSTOMER")
                        || hasRole(userId, "DEALER")) {

                    filterChain.doFilter(request, response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER or DEALER role required"
                );
                return;
            }

            /*
             * CUSTOMER + DEALER can view a vehicle by ID
             */
            if (method.equals("GET")) {

                if (hasRole(userId, "CUSTOMER")
                        || hasRole(userId, "DEALER")) {

                    filterChain.doFilter(request, response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER or DEALER role required"
                );
                return;
            }

            /*
             * DEALER can change vehicle status
             */
            if (method.equals("PATCH")
                    && path.matches("/api/vehicles/[^/]+/status")) {

                if (hasRole(userId, "DEALER")) {

                    filterChain.doFilter(request, response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            /*
             * POST, PUT and DELETE are ADMIN only
             */
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write(
                    "Access denied: ADMIN role required"
            );

            return;
        }
        /*
         * Customer Service
         */
        if (path.startsWith("/api/v1/customers")) {

            /*
             * POST /api/v1/customers
             *
             * Only CUSTOMER can create a customer.
             * ADMIN cannot create a customer.
             */
            if (method.equals("POST")
                    && path.equals("/api/v1/customers")) {

                if (hasRole(userId, "CUSTOMER")) {

                    filterChain.doFilter(
                            new UserIdRequestWrapper(request, userId),
                            response
                    );

                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER role required"
                );
                return;
            }
            /*
             * GET ALL CUSTOMERS
             */
            if (method.equals("GET")
                    && path.equals("/api/v1/customers")) {

                if (hasRole(userId, "ADMIN") || hasRole(userId, "DEALER")) {
                    filterChain.doFilter(request, response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN or DEALER role required"
                );
                return;
            }

            /*
             * GET MY CUSTOMER PROFILE
             *
             * CUSTOMER can access only their own profile.
             */
            if (method.equals("GET")
                    && path.equals("/api/v1/customers/me")) {

                if (hasRole(userId, "CUSTOMER")) {

                    filterChain.doFilter(
                            new UserIdRequestWrapper(request, userId),
                            response
                    );

                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER role required"
                );
                return;
            }
            /*
             * ADMIN can do everything EXCEPT POST above.
             */
            if (hasRole(userId, "ADMIN")) {
                filterChain.doFilter(request, response);
                return;
            }

            /*
             * GET ALL CUSTOMERS
             *
             * CUSTOMER + DEALER
             */
            /*
             * GET CUSTOMER BY ID
             *
             * CUSTOMER can access only their own customer record.
             * DEALER can view customer records.
             */
            if (method.equals("GET")
                    && path.matches("/api/v1/customers/[^/]+")) {

                if (path.equals("/api/v1/customers/me")) {
                    filterChain.doFilter(request, response);
                    return;
                }

                String customerIdPart =
                        path.substring("/api/v1/customers/".length());

                try {
                    UUID requestedCustomerId =
                            UUID.fromString(customerIdPart);

                    /*
                     * DEALER can view customer records.
                     */
                    if (hasRole(userId, "DEALER")) {
                        filterChain.doFilter(request, response);
                        return;
                    }

                    /*
                     * CUSTOMER can view only their own record.
                     */
                    if (hasRole(userId, "CUSTOMER")
                            && authorizationService.isOwner(
                            userId,
                            requestedCustomerId)) {

                        filterChain.doFilter(request, response);
                        return;
                    }

                } catch (IllegalArgumentException ignored) {
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: you can only access your own customer profile"
                );
                return;
            }

            /*
             * GET CUSTOMER BY ID
             *
             * CUSTOMER + DEALER
             */
            if (method.equals("GET")
                    && path.matches("/api/v1/customers/[^/]+")) {

                if (hasRole(userId, "CUSTOMER")
                        || hasRole(userId, "DEALER")) {

                    filterChain.doFilter(request, response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER or DEALER role required"
                );
                return;
            }

            /*
             * PUT CUSTOMER
             *
             * CUSTOMER can update their own customer record.
             */
            if (method.equals("PUT")
                    && path.matches("/api/v1/customers/[^/]+")) {

                String customerIdPart =
                        path.substring("/api/v1/customers/".length());

                try {
                    UUID requestedCustomerId =
                            UUID.fromString(customerIdPart);

                    if (authorizationService.isOwner(
                            userId,
                            requestedCustomerId)) {

                        filterChain.doFilter(request, response);
                        return;
                    }

                } catch (IllegalArgumentException ignored) {
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: you can only update your own customer profile"
                );
                return;
            }

            /*
             * DELETE CUSTOMER
             *
             * ADMIN was already handled above.
             * Everyone else is denied.
             */
            if (method.equals("DELETE")
                    && path.matches("/api/v1/customers/[^/]+")) {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );
                return;
            }

            /*
             * Any other Customer API is denied.
             */
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write(
                    "Access denied"
            );
            return;
        }
        /*
         * Order Service
         */
        if (path.startsWith("/api/v1/orders")) {

            /*
             * POST /api/v1/orders
             *
             * Only CUSTOMER can create an order.
             * ADMIN and DEALER cannot create orders.
             */
            if (method.equals("POST")
                    && path.equals("/api/v1/orders")) {

                if (hasRole(userId, "CUSTOMER")) {
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, "CUSTOMER"), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER role required"
                );
                return;
            }

            /*
             * ADMIN can do everything except POST above.
             */
            if (hasRole(userId, "ADMIN")) {
                filterChain.doFilter(new UserIdRequestWrapper(request, userId, "ADMIN"), response);
                return;
            }

            /*
             * GET ORDERS BY CUSTOMER
             */
            if (method.equals("GET")
                    && path.matches("/api/v1/orders/customers/[^/]+")) {

                if (hasRole(userId, "CUSTOMER")) {
                    String customerIdPart = path.substring("/api/v1/orders/customers/".length());
                    try {
                        UUID requestedCustomerId = UUID.fromString(customerIdPart);
                        if (userId.equals(requestedCustomerId)) { // Customer owns this
                            filterChain.doFilter(new UserIdRequestWrapper(request, userId, "CUSTOMER"), response);
                            return;
                        }
                    } catch (IllegalArgumentException ignored) {}
                    
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Access denied: you can only view your own orders");
                    return;
                }
                
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Access denied: CUSTOMER or ADMIN role required");
                return;
            }

            /*
             * GET ALL ORDERS
             *
             * ADMIN is already handled above.
             * CUSTOMER and DEALER will be implicitly filtered
             * by the Order Service.
             */
            if (method.equals("GET")
                    && path.equals("/api/v1/orders")) {
                if (hasRole(userId, "CUSTOMER") || hasRole(userId, "DEALER")) {
                    String role = hasRole(userId, "CUSTOMER") ? "CUSTOMER" : "DEALER";
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, role), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied"
                );
                return;
            }

            /*
             * GET ORDERS BY DEALER
             *
             * DEALER can only access their own dealership's orders.
             * Prevents cross-dealer IDOR.
             */
            if (method.equals("GET")
                    && path.matches("/api/v1/orders/dealers/[^/]+")) {

                if (hasRole(userId, "DEALER")) {
                    String dealerIdPart = path.substring("/api/v1/orders/dealers/".length());
                    try {
                        UUID requestedDealerId = UUID.fromString(dealerIdPart);
                        if (authorizationService.isDealerOwner(userId, requestedDealerId)) {
                            filterChain.doFilter(
                                    new UserIdRequestWrapper(request, userId, "DEALER", requestedDealerId),
                                    response
                            );
                            return;
                        }
                    } catch (IllegalArgumentException ignored) {}

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Access denied: you can only view your own dealership's orders");
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            /*
             * GET ORDER BY ID
             *
             * CUSTOMER and DEALER can access an order,
             * but ownership is verified by the Order Service using
             * customerId (userId) or dealerId (X-Dealer-Id).
             */
            if (method.equals("GET")
                    && path.matches("/api/v1/orders/[^/]+")) {

                if (hasRole(userId, "CUSTOMER")) {
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, "CUSTOMER"), response);
                    return;
                }

                if (hasRole(userId, "DEALER")) {
                    UUID dealerId = authorizationService.getDealerId(userId);
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, "DEALER", dealerId), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER or DEALER role required"
                );
                return;
            }

            /*
             * PUT ORDER
             *
             * ADMIN is already handled above.
             * CUSTOMER and DEALER are denied for now.
             */
            if (method.equals("PUT")
                    && path.matches("/api/v1/orders/[^/]+")) {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );
                return;
            }

            /*
             * DELETE ORDER
             *
             * ADMIN is already handled above.
             */
            if (method.equals("DELETE")
                    && path.matches("/api/v1/orders/[^/]+")) {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );
                return;
            }

            /*
             * Any other Order API is denied.
             */
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write(
                    "Access denied"
            );
            return;
        }
        /*
         * Dealer Service
         */
        if (path.startsWith("/dealers")) {

            /*
             * CREATE DEALER
             *
             * ADMIN only. Dealer self-registration is disabled.
             */
            if (method.equals("POST")
                    && path.equals("/dealers")) {

                if (hasRole(userId, "ADMIN")) {
                    filterChain.doFilter(
                            new UserIdRequestWrapper(request, userId, "ADMIN"),
                            response
                    );
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );
                return;
            }
            /*
             * ADMIN can do everything else.
             */
            if (hasRole(userId, "ADMIN")) {
                filterChain.doFilter(request, response);
                return;
            }

            /*
             * GET MY DEALER DETAILS
             *
             * DEALER only.
             *
             * X-User-Id and X-Dealer-Id are passed to Dealer Service
             * so Dealer Service can find the dealer
             * belonging to the logged-in user.
             */
            if (method.equals("GET")
                    && path.equals("/dealers/me")) {

                if (hasRole(userId, "DEALER")) {
                    UUID dealerId = authorizationService.getDealerId(userId);
                    filterChain.doFilter(
                            new UserIdRequestWrapper(request, userId, "DEALER", dealerId),
                            response
                    );
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            /*
             * GET MY CUSTOMERS
             *
             * DEALER only. Returns only customers associated with this dealer.
             */
            if (method.equals("GET")
                    && path.equals("/dealers/me/customers")) {

                if (hasRole(userId, "DEALER")) {
                    UUID dealerId = authorizationService.getDealerId(userId);
                    filterChain.doFilter(
                            new UserIdRequestWrapper(request, userId, "DEALER", dealerId),
                            response
                    );
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            /*
             * GET ALL DEALERS
             *
             * CUSTOMER + DEALER
             */
            if (method.equals("GET")
                    && path.equals("/dealers")) {

                if (hasRole(userId, "CUSTOMER")
                        || hasRole(userId, "DEALER")) {

                    String role = hasRole(userId, "CUSTOMER") ? "CUSTOMER" : "DEALER";
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, role), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER or DEALER role required"
                );
                return;
            }

            /*
             * GET DEALER BY ID
             *
             * CUSTOMER + DEALER
             */
            if (method.equals("GET")
                    && path.matches("/dealers/[^/]+")) {

                if (hasRole(userId, "CUSTOMER")
                        || hasRole(userId, "DEALER")) {

                    String role = hasRole(userId, "CUSTOMER") ? "CUSTOMER" : "DEALER";
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, role), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER or DEALER role required"
                );
                return;
            }

            /*
             * GET DEALERS BY LOCATION
             *
             * CUSTOMER + DEALER
             */
            if (method.equals("GET")
                    && path.startsWith("/dealers/location/")) {

                if (hasRole(userId, "CUSTOMER")
                        || hasRole(userId, "DEALER")) {

                    String role = hasRole(userId, "CUSTOMER") ? "CUSTOMER" : "DEALER";
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, role), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER or DEALER role required"
                );
                return;
            }

            /*
             * GET DEALER VEHICLES
             *
             * CUSTOMER + DEALER.
             * For DEALER role: must be their own dealership. Prevents cross-dealer inventory browsing.
             */
            if (method.equals("GET")
                    && path.matches("/dealers/[^/]+/vehicles")) {

                if (hasRole(userId, "DEALER")) {
                    String dealerIdPart = path.substring("/dealers/".length(), path.length() - "/vehicles".length());
                    try {
                        UUID requestedDealerId = UUID.fromString(dealerIdPart);
                        if (authorizationService.isDealerOwner(userId, requestedDealerId)) {
                            filterChain.doFilter(
                                    new UserIdRequestWrapper(request, userId, "DEALER", requestedDealerId),
                                    response
                            );
                            return;
                        }
                    } catch (IllegalArgumentException ignored) {}

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Access denied: you can only view your own dealership's inventory");
                    return;
                }

                if (hasRole(userId, "CUSTOMER")) {
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, "CUSTOMER"), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER or DEALER role required"
                );
                return;
            }

            /*
             * GET CUSTOMER FROM DEALER SERVICE
             *
             * DEALER only.
             */
            if (method.equals("GET")
                    && path.matches("/dealers/customer/[^/]+")) {

                if (hasRole(userId, "DEALER")) {
                    UUID dealerId = authorizationService.getDealerId(userId);
                    filterChain.doFilter(
                            new UserIdRequestWrapper(request, userId, "DEALER", dealerId),
                            response
                    );
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            /*
             * UPDATE ORDER
             *
             * DEALER only.
             */
            if (method.equals("PUT")
                    && path.matches("/dealers/orders/[^/]+")) {

                if (hasRole(userId, "DEALER")) {
                    UUID dealerId = authorizationService.getDealerId(userId);
                    filterChain.doFilter(
                            new UserIdRequestWrapper(request, userId, "DEALER", dealerId),
                            response
                    );
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            /*
             * GET ORDER
             *
             * DEALER only — must be their own dealership's orders.
             */
            if (method.equals("GET")
                    && path.matches("/dealers/orders/[^/]+")) {

                if (hasRole(userId, "DEALER")) {
                    String dealerIdPart = path.substring("/dealers/orders/".length());
                    try {
                        UUID requestedDealerId = UUID.fromString(dealerIdPart);
                        if (authorizationService.isDealerOwner(userId, requestedDealerId)) {
                            filterChain.doFilter(
                                    new UserIdRequestWrapper(request, userId, "DEALER", requestedDealerId),
                                    response
                            );
                            return;
                        }
                    } catch (IllegalArgumentException ignored) {}

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Access denied: you can only view your own dealership's orders");
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            /*
             * PATCH APPOINTMENT STATUS VIA DEALER SERVICE
             *
             * DEALER only — must be appointment for this dealership.
             */
            if (method.equals("PATCH")
                    && path.matches("/dealers/appointments/[^/]+/status")) {

                if (hasRole(userId, "DEALER")) {
                    String[] parts = path.split("/");
                    try {
                        UUID appointmentId = UUID.fromString(parts[3]);
                        if (authorizationService.isAppointmentDealer(userId, appointmentId)) {
                            UUID dealerId = authorizationService.getDealerId(userId);
                            filterChain.doFilter(
                                    new UserIdRequestWrapper(request, userId, "DEALER", dealerId),
                                    response
                            );
                            return;
                        }
                    } catch (IllegalArgumentException ignored) {}

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Access denied: appointment does not belong to your dealership");
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            /*
             * UPDATE DEALER
             *
             * ADMIN was already handled above.
             * DEALER and CUSTOMER cannot update dealers.
             */
            if (method.equals("PUT")
                    && path.matches("/dealers/[^/]+")) {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );
                return;
            }

            /*
             * DELETE DEALER
             *
             * ADMIN was already handled above.
             */
            if (method.equals("DELETE")
                    && path.matches("/dealers/[^/]+")) {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );
                return;
            }

            /*
             * Any other Dealer API is denied.
             */
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write(
                    "Access denied"
            );
            return;
        }
        // SERVICE APPOINTMENT
        if (path.startsWith("/api/appointments")) {

            // ADMIN can do everything
            if (hasRole(userId, "ADMIN")) {
                filterChain.doFilter(new UserIdRequestWrapper(request, userId, "ADMIN"), response);
                return;
            }

            // CREATE APPOINTMENT - CUSTOMER only
            if (method.equals("POST")
                    && path.equals("/api/appointments")) {

                if (hasRole(userId, "CUSTOMER")) {
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, "CUSTOMER"), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: CUSTOMER role required"
                );
                return;
            }

            // GET APPOINTMENTS BY CUSTOMER
            if (method.equals("GET")
                    && path.matches("/api/appointments/customers/[^/]+")) {

                if (hasRole(userId, "CUSTOMER")) {
                    String customerIdPart = path.substring("/api/appointments/customers/".length());
                    try {
                        UUID requestedCustomerId = UUID.fromString(customerIdPart);
                        if (userId.equals(requestedCustomerId)) { // Customer owns this
                            filterChain.doFilter(new UserIdRequestWrapper(request, userId, "CUSTOMER"), response);
                            return;
                        }
                    } catch (IllegalArgumentException ignored) {}
                    
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Access denied: you can only view your own appointments");
                    return;
                }
                
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Access denied: CUSTOMER or ADMIN role required");
                return;
            }

            // GET APPOINTMENTS BY DEALER
            if (method.equals("GET")
                    && path.matches("/api/appointments/dealers/[^/]+")) {

                if (hasRole(userId, "DEALER")) {
                    String dealerIdPart = path.substring("/api/appointments/dealers/".length());
                    try {
                        UUID requestedDealerId = UUID.fromString(dealerIdPart);
                        if (authorizationService.isDealerOwner(userId, requestedDealerId)) { // Dealer owns this
                            filterChain.doFilter(new UserIdRequestWrapper(request, userId, "DEALER", requestedDealerId), response);
                            return;
                        }
                    } catch (IllegalArgumentException ignored) {}
                    
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Access denied: you can only view your own dealer appointments");
                    return;
                }
                
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Access denied: DEALER or ADMIN role required");
                return;
            }

            // GET ALL APPOINTMENTS
            if (method.equals("GET")
                    && path.equals("/api/appointments")) {

                if (hasRole(userId, "ADMIN") || hasRole(userId, "CUSTOMER") || hasRole(userId, "DEALER")) {
                    String role = hasRole(userId, "ADMIN") ? "ADMIN" : (hasRole(userId, "DEALER") ? "DEALER" : "CUSTOMER");
                    UUID dealerId = "DEALER".equals(role) ? authorizationService.getDealerId(userId) : null;
                    filterChain.doFilter(new UserIdRequestWrapper(request, userId, role, dealerId), response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied"
                );
                return;
            }

            // GET APPOINTMENT BY ID - CUSTOMER own or DEALER own dealer
            if (method.equals("GET")
                    && path.matches("/api/appointments/[^/]+")) {

                UUID appointmentId;

                try {
                    String[] parts = path.split("/");
                    appointmentId = UUID.fromString(parts[3]);
                } catch (Exception e) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("Invalid appointment ID");
                    return;
                }

                // CUSTOMER can access own appointment
                if (hasRole(userId, "CUSTOMER")) {

                    if (authorizationService.isAppointmentCustomer(
                            userId,
                            appointmentId
                    )) {
                        filterChain.doFilter(new UserIdRequestWrapper(request, userId, "CUSTOMER"), response);
                        return;
                    }

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                            "Access denied: appointment does not belong to customer"
                    );
                    return;
                }

                // DEALER can access their dealer appointments
                if (hasRole(userId, "DEALER")) {

                    if (authorizationService.isAppointmentDealer(
                            userId,
                            appointmentId
                    )) {
                        filterChain.doFilter(new UserIdRequestWrapper(request, userId, "DEALER"), response);
                        return;
                    }

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                            "Access denied: appointment does not belong to dealer"
                    );
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Access denied");
                return;
            }

            // PUT APPOINTMENT - ADMIN only
            if (method.equals("PUT")
                    && path.matches("/api/appointments/[^/]+")) {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );
                return;
            }

            // PATCH SERVICE TYPE - CUSTOMER own or DEALER own dealer
            if (method.equals("PATCH")
                    && path.matches("/api/appointments/[^/]+/service-type")) {

                UUID appointmentId;

                try {
                    String[] parts = path.split("/");
                    appointmentId = UUID.fromString(parts[3]);
                } catch (Exception e) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("Invalid appointment ID");
                    return;
                }

                // CUSTOMER can update own appointment service type
                if (hasRole(userId, "CUSTOMER")) {

                    if (authorizationService.isAppointmentCustomer(
                            userId,
                            appointmentId
                    )) {
                        filterChain.doFilter(request, response);
                        return;
                    }

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                            "Access denied: appointment does not belong to customer"
                    );
                    return;
                }

                // DEALER can update their dealer appointment service type
                if (hasRole(userId, "DEALER")) {

                    if (authorizationService.isAppointmentDealer(
                            userId,
                            appointmentId
                    )) {
                        filterChain.doFilter(request, response);
                        return;
                    }

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                            "Access denied: appointment does not belong to dealer"
                    );
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Access denied");
                return;
            }

            // PATCH STATUS - DEALER only
            if (method.equals("PATCH")
                    && path.matches("/api/appointments/[^/]+/status")) {

                UUID appointmentId;

                try {
                    String[] parts = path.split("/");
                    appointmentId = UUID.fromString(parts[3]);
                } catch (Exception e) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("Invalid appointment ID");
                    return;
                }

                // DEALER can update status for their dealer appointment
                if (hasRole(userId, "DEALER")) {

                    if (authorizationService.isAppointmentDealer(
                            userId,
                            appointmentId
                    )) {
                        UUID dealerId = authorizationService.getDealerId(userId);
                        filterChain.doFilter(new UserIdRequestWrapper(request, userId, "DEALER", dealerId), response);
                        return;
                    }

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                            "Access denied: appointment does not belong to dealer"
                    );
                    return;
                }

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: DEALER role required"
                );
                return;
            }

            // DELETE APPOINTMENT - ADMIN only
            if (method.equals("DELETE")
                    && path.matches("/api/appointments/[^/]+")) {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write(
                        "Access denied: ADMIN role required"
                );
                return;
            }

            // Any other appointment API is denied
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Access denied");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean hasRole(
            UUID userId,
            String requiredRole
    ) {

        UserAuthorizationClient.AuthorizationResponse authorization =
                authorizationService
                        .getUserAuthorization(userId);

        System.out.println(
                ">>> User role: "
                        + authorization.role()
        );

        return requiredRole.equals(
                authorization.role()
        );
    }
}