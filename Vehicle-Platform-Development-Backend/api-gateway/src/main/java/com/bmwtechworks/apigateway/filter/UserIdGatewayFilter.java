package com.bmwtechworks.apigateway.filter;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.servlet.function.HandlerFilterFunction;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

public class UserIdGatewayFilter {

    public static HandlerFilterFunction<ServerResponse, ServerResponse> addUserIdHeader() {

        return (request, next) -> {

            Authentication authentication =
                    SecurityContextHolder.getContext().getAuthentication();

            if (authentication instanceof JwtAuthenticationToken jwtAuth) {

                String userId = jwtAuth.getToken()
                        .getClaimAsString("userId");

                System.out.println(">>> Gateway filter userId: " + userId);

                if (userId != null) {

                    ServerRequest modifiedRequest =
                            ServerRequest.from(request)
                                    .header("X-User-Id", userId)
                                    .build();

                    return next.handle(modifiedRequest);
                }
            }

            return next.handle(request);
        };
    }
}