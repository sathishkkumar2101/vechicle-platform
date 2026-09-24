package com.bmwtechworks.serviceappointment.controller;

import com.bmwtechworks.serviceappointment.model.Appointment;
import com.bmwtechworks.serviceappointment.model.AppointmentStatus;
import com.bmwtechworks.serviceappointment.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // CREATE APPOINTMENT
    // Authorization will be handled by API Gateway
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(
            @RequestBody Appointment appointment) {

        Appointment createdAppointment =
                appointmentService.createAppointment(appointment);

        return new ResponseEntity<>(
                createdAppointment,
                HttpStatus.CREATED
        );
    }

    // GET APPOINTMENT BY ID
    // Authorization will be handled by API Gateway
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentById(id)
        );
    }

    // GET ALL APPOINTMENTS
    // Admin only - enforced by API Gateway
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        if ("CUSTOMER".equals(userRole) && userId != null) {
            return ResponseEntity.ok(appointmentService.getAppointmentsByCustomerId(UUID.fromString(userId)));
        }
        if ("DEALER".equals(userRole) && userId != null) {
            return ResponseEntity.ok(appointmentService.getAppointmentsByDealerId(UUID.fromString(userId)));
        }
        return ResponseEntity.ok(
                appointmentService.getAllAppointments()
        );
    }
    
    @GetMapping("/customers/{customerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByCustomerId(customerId));
    }

    @GetMapping("/dealers/{dealerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByDealer(@PathVariable UUID dealerId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDealerId(dealerId));
    }

    // FULL UPDATE
    // Admin only - enforced by API Gateway
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable UUID id,
            @RequestBody Appointment appointment) {

        return ResponseEntity.ok(
                appointmentService.updateAppointment(
                        id,
                        appointment
                )
        );
    }

    // UPDATE SERVICE TYPE
    // Customer/Dealer/Admin authorization will be handled by API Gateway
    @PatchMapping("/{id}/service-type")
    public ResponseEntity<Appointment> updateServiceType(
            @PathVariable UUID id,
            @RequestParam String serviceType) {

        return ResponseEntity.ok(
                appointmentService.updateServiceType(
                        id,
                        serviceType
                )
        );
    }

    // UPDATE STATUS
    // Dealer/Admin authorization will be handled by API Gateway
    @PatchMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(
            @PathVariable UUID id,
            @RequestParam AppointmentStatus status) {

        return ResponseEntity.ok(
                appointmentService.updateStatus(
                        id,
                        status
                )
        );
    }

    // DELETE APPOINTMENT
    // Admin only - enforced by API Gateway
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(
            @PathVariable UUID id) {

        appointmentService.deleteAppointment(id);

        return ResponseEntity.noContent().build();
    }
}