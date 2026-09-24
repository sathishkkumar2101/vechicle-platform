package com.bmwtechworks.userroleservice.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CommandLineRunner generatePasswordHash(PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println("PASSWORD HASH = "
                    + passwordEncoder.encode("password123"));
        };
    }
}