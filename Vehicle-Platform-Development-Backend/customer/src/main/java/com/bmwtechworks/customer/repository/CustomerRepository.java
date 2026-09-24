package com.bmwtechworks.customer.repository;

import com.bmwtechworks.customer.model.Customers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customers, UUID> {
    Optional<Customers> findByUserId(UUID userId);
}
