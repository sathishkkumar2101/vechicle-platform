package com.bmwtechworks.order.controller;

import com.bmwtechworks.order.model.Orders;
import com.bmwtechworks.order.service.OrdersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
public class OrdersController {
    @Autowired
    private OrdersService ordersService;

    @GetMapping
    public List<Orders> findAllOrders(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        if ("CUSTOMER".equals(userRole) && userId != null) {
            return ordersService.findByCustomerId(UUID.fromString(userId));
        }
        if ("DEALER".equals(userRole) && userId != null) {
            return ordersService.findByDealerId(UUID.fromString(userId));
        }
        return ordersService.findAllOrders();
    }

    @GetMapping("/{id}")
    public Orders findById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Orders order = ordersService.findById(id);
        if (order == null) {
            return null;
        }

        if ("ADMIN".equals(userRole)) {
            return order;
        }

        if ("CUSTOMER".equals(userRole) && userId != null) {
            if (order.getCustomerId() != null && order.getCustomerId().toString().equals(userId)) {
                return order;
            }
        }

        if ("DEALER".equals(userRole) && userId != null) {
            if (order.getDealerId() != null && order.getDealerId().toString().equals(userId)) {
                return order;
            }
        }

        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access Denied"
        );
    }

    @GetMapping("/dealers/{dealerId}")
    public List<Orders> findByDealerId(@PathVariable UUID dealerId){
        return ordersService.findByDealerId(dealerId);
    }
    
    @GetMapping("/customers/{customerId}")
    public List<Orders> findByCustomerId(@PathVariable UUID customerId){
        return ordersService.findByCustomerId(customerId);
    }
    @PostMapping
    public Orders createOrder(@RequestBody Orders order) {
        return ordersService.createOrder(order);
    }
    @PutMapping("/{id}")
    public Orders updateOrder(
            @PathVariable UUID id,
            @RequestBody Orders order) {

        return ordersService.updateOrder(id, order);
    }

    @DeleteMapping("/{id}")
    public String deleteOrder(@PathVariable UUID id){
        return ordersService.deleteOrder(id);
    }

}
