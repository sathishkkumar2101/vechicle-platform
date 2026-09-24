package com.bmw.dealer.controller;

import com.bmw.dealer.client.CustomerClient;
import com.bmw.dealer.client.OrderClient;
import com.bmw.dealer.dto.*;
import com.bmw.dealer.model.AppointmentStatus;
import com.bmw.dealer.model.Dealer;
import com.bmw.dealer.service.DealerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/dealers")
@RequiredArgsConstructor
public class DealerController {

    private final DealerService dealerService;

    // Create Dealer
    @PostMapping
    public ResponseEntity<Dealer> createDealer(
            @RequestBody DealerRequestDTO request) {

        Dealer savedDealer = dealerService.createDealer(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedDealer);
    }

    // Get all Dealers
    @GetMapping
    public ResponseEntity<List<Dealer>> getAllDealers() {

        return ResponseEntity.ok(
                dealerService.getAllDealers()
        );
    }
    // Get logged-in Dealer's own details
    @GetMapping("/me")
    public ResponseEntity<Dealer> getMyDealer(
            @RequestHeader("X-User-Id") UUID userId) {

        return ResponseEntity.ok(
                dealerService.getMyDealer(userId)
        );
    }
    // Get Dealer by ID
    @GetMapping("/{dealerId}")
    public ResponseEntity<Dealer> getDealerById(
            @PathVariable UUID dealerId) {

        return ResponseEntity.ok(
                dealerService.getDealerById(dealerId)
        );
    }

    // Update Dealer
    @PutMapping("/{dealerId}")
    public ResponseEntity<Dealer> updateDealer(
            @PathVariable UUID dealerId,
            @RequestBody Dealer dealer) {

        return ResponseEntity.ok(
                dealerService.updateDealer(dealerId, dealer)
        );
    }

    // Delete Dealer
    @DeleteMapping("/{dealerId}")
    public ResponseEntity<Void> deleteDealer(
            @PathVariable UUID dealerId) {

        dealerService.deleteDealer(dealerId);

        return ResponseEntity.noContent().build();
    }

    // Get vehicles belonging to a particular dealer
    @GetMapping("/{dealerId}/vehicles")
    public ResponseEntity<List<VehicleDTO>> getDealerVehicles(
            @PathVariable UUID dealerId) {

        return ResponseEntity.ok(
                dealerService.getVehiclesByDealer(dealerId)
        );
    }

    // Get dealers by location
    @GetMapping("/location/{location}")
    public ResponseEntity<List<Dealer>> getDealersByLocation(
            @PathVariable String location) {

        return ResponseEntity.ok(
                dealerService.getDealersByLocation(location)
        );
    }

    @GetMapping("/orders/{dealerId}")
    public ResponseEntity<List<OrderDTO>> getAllOrder(
            @PathVariable UUID dealerId,
            @RequestHeader("X-User-Id") UUID userId) {

        System.out.println(">>> Dealer Service X-User-Id: " + userId);

        return ResponseEntity.ok(
                dealerService.getAllOrders(dealerId, userId)
        );
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable UUID customerId){
        return ResponseEntity.ok(
                dealerService.getCustomerById(customerId)
        );
    }
    @PutMapping("/orders/{orderId}")
    public ResponseEntity<OrderDTO> updateOrder(
            @PathVariable UUID orderId,
            @RequestBody OrderDTO orderDTO) {

        OrderDTO updatedOrder = dealerService.updateOrder(orderId, orderDTO);

        return ResponseEntity.ok(updatedOrder);
    }

    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<AppointmentDTO> updateAppointmentStatus(
            @PathVariable UUID id,
            @RequestParam AppointmentStatus status) {

        return ResponseEntity.ok(
                dealerService.updateAppointmentStatus(id, status)
        );
    }
}
