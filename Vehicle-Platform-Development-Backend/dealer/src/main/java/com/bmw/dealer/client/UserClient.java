package com.bmw.dealer.client;

import com.bmw.dealer.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-role-service")
public interface UserClient {

    @GetMapping("/api/users/username/{username}")
    UserDTO getUserByUsername(
            @PathVariable("username") String username
    );
}