package com.bmwtechworks.apigateway.client;

import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class UserAuthorizationClient {

    private final LoadBalancerClient loadBalancerClient;
    private final RestClient restClient;

    public UserAuthorizationClient(
            LoadBalancerClient loadBalancerClient
    ) {
        this.loadBalancerClient = loadBalancerClient;
        this.restClient = RestClient.builder().build();
    }

    public AuthorizationResponse getUserAuthorization(UUID userId) {

        ServiceInstance instance =
                loadBalancerClient.choose("user-role-service");

        if (instance == null) {
            throw new RuntimeException(
                    "User Role Service is not available"
            );
        }

        System.out.println(
                ">>> USER ROLE SERVICE INSTANCE: "
                        + instance.getUri()
        );

        String url = instance.getUri()
                + "/api/internal/users/"
                + userId
                + "/authorization";

        System.out.println(
                ">>> USER AUTHORIZATION URL: "
                        + url
        );

        return restClient
                .get()
                .uri(url)
                .retrieve()
                .body(AuthorizationResponse.class);
    }

    public record AuthorizationResponse(
            UUID userId,
            String role,
            java.util.List<String> permissions
    ) {
    }
}