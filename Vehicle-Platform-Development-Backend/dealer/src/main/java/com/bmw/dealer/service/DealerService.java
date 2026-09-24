package com.bmw.dealer.service;

import com.bmw.dealer.client.*;
import com.bmw.dealer.dto.*;
import com.bmw.dealer.exception.CustomerNotFoundException;
import com.bmw.dealer.exception.DealerNotFoundException;
import com.bmw.dealer.exception.NoDealerFoundException;
import com.bmw.dealer.exception.NoOrderFoundException;
import com.bmw.dealer.model.AppointmentStatus;
import com.bmw.dealer.model.Dealer;
import com.bmw.dealer.repository.DealerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DealerService {

    private final DealerRepository dealerRepository;
    private final VehicleClient vehicleClient;
    private final OrderClient orderClient;
    private final UserClient userClient;
    private final CustomerClient customerClient;
    private final AppointmentClient appointmentClient;


    // Create Dealer
    public Dealer createDealer(DealerRequestDTO request) {

        UserDTO user = userClient.getUserByUsername(
                request.username()
        );

        Dealer dealer = new Dealer();

        dealer.setUserId(user.id());
        dealer.setName(request.name());
        dealer.setLocation(request.location());

        return dealerRepository.save(dealer);
    }
    // Get all Dealers
    public List<Dealer> getAllDealers() {
        return dealerRepository.findAll();
    }

    // Get logged-in Dealer's own details
    public Dealer getMyDealer(UUID userId) {
        return dealerRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new DealerNotFoundException(
                                "Dealer not found for user ID: " + userId
                        )
                );
    }

    // Get all Dealers
    public List<OrderDTO> getAllOrders(UUID dealerId, UUID userId) {

        Dealer dealer = dealerRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new DealerNotFoundException(
                                "Dealer not found for user ID: " + userId
                        )
                );

        if (!dealer.getDealerId().equals(dealerId)) {
            throw new RuntimeException(
                    "Access denied: dealer does not belong to logged-in user"
            );
        }

        List<OrderDTO> orders = orderClient.getAllOrders(dealerId);

        if (orders.isEmpty()) {
            throw new NoOrderFoundException(
                    "No orders found with : " + dealerId + " ID"
            );
        }

        return orders;
    }

    // Get Dealer by ID
    public Dealer getDealerById(UUID dealerId) {

        return dealerRepository.findById(dealerId)
                .orElseThrow(() ->
                        new DealerNotFoundException(
                                "Dealer not found with ID: " + dealerId
                        )
                );
    }


    // Update Dealer
    public Dealer updateDealer(UUID dealerId, Dealer dealer) {

        Dealer existingDealer = dealerRepository.findById(dealerId)
                .orElseThrow(() ->
                        new DealerNotFoundException(
                                "Dealer not found with ID: " + dealerId
                        )
                );

        existingDealer.setName(dealer.getName());
        existingDealer.setLocation(dealer.getLocation());

        return dealerRepository.save(existingDealer);
    }


    // Delete Dealer
    public void deleteDealer(UUID dealerId) {

        Dealer existingDealer = dealerRepository.findById(dealerId)
                .orElseThrow(() ->
                        new DealerNotFoundException(
                                "Dealer not found with ID: " + dealerId
                        )
                );

        dealerRepository.delete(existingDealer);
    }


    // Get vehicles belonging to a dealer
    public List<VehicleDTO> getVehiclesByDealer(UUID dealerId) {

        // First check whether the dealer exists
        dealerRepository.findById(dealerId)
                .orElseThrow(() ->
                        new DealerNotFoundException(
                                "Dealer not found with ID: " + dealerId
                        )
                );

        // Call Vehicle Microservice through Feign
        return vehicleClient.getVehiclesByDealer(dealerId);
    }


    // Get dealers by location
    public List<Dealer> getDealersByLocation(String location) {

        List<Dealer> dealers =
                dealerRepository.findByLocationIgnoreCase(location);

        if (dealers.isEmpty()) {
            throw new NoDealerFoundException(
                    "No dealers found in location: " + location
            );
        }

        return dealers;
    }

    public CustomerDTO getCustomerById(UUID customerId){

        CustomerDTO customer=customerClient.getCustomerById(customerId);

        if(customer==null)
            throw  new CustomerNotFoundException(" Customer not found with id :"+ customerId);
        return customerClient.getCustomerById(customerId);
    }

    public OrderDTO updateOrder(UUID orderId, OrderDTO orderDTO) {

        return orderClient.updateOrder(
                orderId,
                orderDTO
        );
    }

    public AppointmentDTO updateAppointmentStatus(
            UUID appointmentId,
            AppointmentStatus status
    ) {

        return appointmentClient.updateStatus(
                appointmentId,
                status
        );
    }
}