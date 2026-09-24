package com.bmwtechworks.customer.service;

import com.bmwtechworks.customer.model.Customers;
import com.bmwtechworks.customer.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<Customers> findAll(){
        return customerRepository.findAll();
    }

    public Optional<Customers> findByUserId(UUID userId) {
        return customerRepository.findByUserId(userId);
    }

    public Optional<Customers> findById(UUID id){
        return customerRepository.findById(id);
    }

    public Customers addCustomer(UUID userId, Customers customer){
        customer.setUserId(userId);
        return customerRepository.save(customer);
    }

    public Customers updateCustomer(UUID id, Customers customer){
        Customers existingCustomer = customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer Not Found"));
        existingCustomer.setName(customer.getName());
        existingCustomer.setEmail(customer.getEmail());
        existingCustomer.setPhone(customer.getPhone());
        existingCustomer.setAddress(customer.getAddress());
        return customerRepository.save(existingCustomer);
    }

    public String deleteCustomer(UUID id){
        customerRepository.deleteById(id);
        return "Customer Data deleted Successfully";
    }

}
