package com.bmwtechworks.order.service;

import com.bmwtechworks.order.model.OrderStatus;
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

    public List<Orders> findAllOrders() {
        return ordersRepository.findAll();
    }

    public Orders findById(UUID id) {
        return ordersRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    public List<Orders> findByDealerId(UUID dealerId) {
        return ordersRepository.findByDealerId(dealerId);
    }

    public List<Orders> findByCustomerId(UUID customerId) {
        return ordersRepository.findByCustomerId(customerId);
    }

    public Orders createOrder(Orders order) {
        return ordersRepository.save(order);
    }

    /**
     * Full update — used by ADMIN only.
     * Allows updating all fields including dealerId, customerId, vehicleId.
     */
    public Orders updateOrder(UUID id, Orders order) {
        Orders existing = ordersRepository.findById(id).orElseThrow();
        existing.setVehicleId(order.getVehicleId());
        existing.setCustomerId(order.getCustomerId());
        existing.setDealerId(order.getDealerId());
        existing.setStatus(order.getStatus());
        existing.setTotalAmount(order.getTotalAmount());
        return ordersRepository.save(existing);
    }

    /**
     * Status-only update — used by DEALER.
     * A Dealer can only change the status of an order.
     * Fields: dealerId, customerId, vehicleId, totalAmount are NOT modifiable.
     */
    public Orders updateOrderStatus(UUID id, OrderStatus newStatus) {
        Orders existing = ordersRepository.findById(id).orElseThrow();
        existing.setStatus(newStatus);
        return ordersRepository.save(existing);
    }

    public String deleteOrder(UUID id) {
        ordersRepository.deleteById(id);
        return "Order deleted successfully";
    }
}
