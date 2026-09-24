package com.bmwtechworks.customer.controller;

import com.bmwtechworks.customer.model.Customers;
import com.bmwtechworks.customer.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {
    @Autowired
    private CustomerService customerService;

    @GetMapping("/me")
    public Optional<Customers> getMyCustomer(
            @RequestHeader("X-User-Id") UUID userId) {

        return customerService.findByUserId(userId);
    }

    @GetMapping
    public List<Customers> fetchAll(){
        return customerService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Customers> findById(@PathVariable UUID id){
        return customerService.findById(id);
    }

    @PostMapping
    public ResponseEntity<Customers> addCustomer(@RequestHeader("X-User-Id") UUID userId, @RequestBody Customers customer){
        return new ResponseEntity<>(customerService.addCustomer(userId, customer), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customers> updateCustomer(@PathVariable UUID id, @RequestBody Customers customer){
        return ResponseEntity.ok(customerService.updateCustomer(id, customer));
    }

    @DeleteMapping("/{id}")
    public String deleteCustomer(@PathVariable UUID id){
        return customerService.deleteCustomer(id);
    }
}
