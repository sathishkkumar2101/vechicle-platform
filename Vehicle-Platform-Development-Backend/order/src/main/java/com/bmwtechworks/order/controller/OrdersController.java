package com.bmwtechworks.order.controller;

import com.bmwtechworks.order.model.Orders;
import com.bmwtechworks.order.service.OrdersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
public class OrdersController {
    @Autowired
    private OrdersService ordersService;

    /**
     * GET /api/v1/orders
     *
     * CUSTOMER → returns only their own orders (by customerId == userId)
     * ADMIN    → returns all orders
     * DEALER   → NOT served here; dealers use /dealers/orders/{dealerId} via dealer-service
     *            which performs proper userId→dealerId resolution + ownership check.
     *            Returning all orders for an unverified dealerId would be an IDOR.
     */
    @GetMapping
    public List<Orders> findAllOrders(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        if ("CUSTOMER".equals(userRole) && userId != null) {
            return ordersService.findByCustomerId(UUID.fromString(userId));
        }
        if ("ADMIN".equals(userRole)) {
            return ordersService.findAllOrders();
        }
        // DEALER role should NOT receive all orders via this endpoint.
        // Dealer order fetching is handled via dealer-service → /dealers/orders/{dealerId}
        // which performs proper userId→dealerId ownership resolution.
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    /**
     * GET /api/v1/orders/{id}
     *
     * ADMIN    → always allowed
     * CUSTOMER → only if order.customerId == userId
     * DEALER   → requires X-Dealer-Id header (set by dealer-service after ownership check)
     *            Compares order.dealerId with the verified dealerId, NOT userId.
     */
    @GetMapping("/{id}")
    public Orders findById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Dealer-Id", required = false) String dealerId
    ) {
        Orders order = ordersService.findById(id);

        if ("ADMIN".equals(userRole)) {
            return order;
        }

        if ("CUSTOMER".equals(userRole) && userId != null) {
            if (order.getCustomerId() != null && order.getCustomerId().toString().equals(userId)) {
                return order;
            }
        }

        if ("DEALER".equals(userRole) && dealerId != null) {
            // X-Dealer-Id is set by dealer-service after resolving userId → dealerId
            // Compare against actual dealerId stored on the order
            if (order.getDealerId() != null && order.getDealerId().toString().equals(dealerId)) {
                return order;
            }
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    /**
     * GET /api/v1/orders/dealers/{dealerId}
     *
     * This endpoint is called by dealer-service (internal Feign) after it has already
     * verified that the authenticated dealer owns this dealerId.
     * The gateway-level route for /dealers/orders/{dealerId} performs userId→dealerId
     * ownership verification in DealerService.getAllOrders() before calling this.
     *
     * NOTE: This endpoint is intentionally NOT protected by an ownership check here
     * because dealer-service performs that check before calling us.
     * Direct access to this port is a network-level concern (internal Docker network).
     */
    @GetMapping("/dealers/{dealerId}")
    public List<Orders> findByDealerId(@PathVariable UUID dealerId) {
        return ordersService.findByDealerId(dealerId);
    }

    @GetMapping("/customers/{customerId}")
    public List<Orders> findByCustomerId(@PathVariable UUID customerId) {
        return ordersService.findByCustomerId(customerId);
    }

    @PostMapping
    public Orders createOrder(@RequestBody Orders order) {
        return ordersService.createOrder(order);
    }

    /**
     * PUT /api/v1/orders/{id}
     *
     * ADMIN → full update allowed
     * DEALER → only allowed to update status field; ownership verified upstream by dealer-service
     *          dealerId, customerId, vehicleId are NOT modifiable by dealer
     *
     * The gateway blocks DEALER role from calling this endpoint directly.
     * Dealers update orders via PUT /dealers/orders/{orderId} which goes through dealer-service.
     */
    @PutMapping("/{id}")
    public Orders updateOrder(
            @PathVariable UUID id,
            @RequestBody Orders order,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Dealer-Id", required = false) String dealerId
    ) {
        Orders existing = ordersService.findById(id);

        if ("DEALER".equals(userRole) && dealerId != null) {
            // Dealer can only update status — verify ownership first
            if (existing.getDealerId() == null || !existing.getDealerId().toString().equals(dealerId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Access denied: order does not belong to your dealership");
            }
            return ordersService.updateOrderStatus(id, order.getStatus());
        }

        // ADMIN full update
        return ordersService.updateOrder(id, order);
    }

    @DeleteMapping("/{id}")
    public String deleteOrder(@PathVariable UUID id) {
        return ordersService.deleteOrder(id);
    }
}
