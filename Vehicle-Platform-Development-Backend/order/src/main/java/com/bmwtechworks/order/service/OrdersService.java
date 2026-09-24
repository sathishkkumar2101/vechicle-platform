package com.bmwtechworks.order.service;

import com.bmwtechworks.order.model.Orders;
import com.bmwtechworks.order.repository.OrdersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class OrdersService {
    @Autowired
    private OrdersRepository ordersRepository;

    public List<Orders> findAllOrders(){
        return ordersRepository.findAll();
    }

    public Orders findById(UUID id){
        return ordersRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<Orders> findByDealerId(UUID dealerId){
        return ordersRepository.findByDealerId(dealerId);
    }

    public List<Orders> findByCustomerId(UUID customerId){
        return ordersRepository.findByCustomerId(customerId);
    }

    public Orders createOrder(Orders order) {
        return ordersRepository.save(order);
    }

    public Orders updateOrder(UUID id, Orders order){
        Orders existing = ordersRepository.findById(id).orElseThrow();
        existing.setVehicleId(order.getVehicleId());
        existing.setCustomerId(order.getCustomerId());
        existing.setDealerId(order.getDealerId());
        existing.setStatus(order.getStatus());
        existing.setTotalAmount(order.getTotalAmount());
        ordersRepository.save(existing);
        return ordersRepository.save(existing);
    }

    public String deleteOrder(UUID id){
        ordersRepository.deleteById(id);
        return "Order deleted successfully";
    }
}
