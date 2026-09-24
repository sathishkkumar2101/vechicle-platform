package com.bmwtechworks.serviceappointment.controller;

import com.bmwtechworks.serviceappointment.model.Appointment;
import com.bmwtechworks.serviceappointment.model.AppointmentStatus;
import com.bmwtechworks.serviceappointment.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // CREATE APPOINTMENT — CUSTOMER only (gateway enforced)
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(
            @RequestBody Appointment appointment) {

        Appointment createdAppointment = appointmentService.createAppointment(appointment);
        return new ResponseEntity<>(createdAppointment, HttpStatus.CREATED);
    }

    // GET APPOINTMENT BY ID — ownership enforced by gateway
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    /**
     * GET /api/appointments
     *
     * CUSTOMER → returns own appointments by customerId (userId == customerId for customers)
     * DEALER   → returns dealer's appointments using X-Dealer-Id header
     *            X-Dealer-Id is the REAL dealerId (resolved from userId by the gateway
     *            or dealer-service). NOT the userId.
     * ADMIN    → returns all appointments
     *
     * CRITICAL FIX: Dealer appointments now use X-Dealer-Id (real dealerId),
     * NOT userId (which is different from dealerId and caused empty results).
     */
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Dealer-Id", required = false) String dealerId
    ) {
        if ("CUSTOMER".equals(userRole) && userId != null) {
            return ResponseEntity.ok(
                    appointmentService.getAppointmentsByCustomerId(UUID.fromString(userId))
            );
        }
        if ("DEALER".equals(userRole) && dealerId != null) {
            // Use the real dealerId (not userId) to filter appointments
            return ResponseEntity.ok(
                    appointmentService.getAppointmentsByDealerId(UUID.fromString(dealerId))
            );
        }
        if ("ADMIN".equals(userRole)) {
            return ResponseEntity.ok(appointmentService.getAllAppointments());
        }
        // Deny all other requests (including headerless calls to internal port)
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    // GET BY CUSTOMER — used by gateway-verified CUSTOMER requests
    @GetMapping("/customers/{customerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByCustomer(
            @PathVariable UUID customerId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByCustomerId(customerId));
    }

    /**
     * GET /api/appointments/dealers/{dealerId}
     *
     * Called by gateway after verifying ownership via X-Dealer-Id check.
     * The {dealerId} path variable is the real dealerId.
     */
    @GetMapping("/dealers/{dealerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByDealer(
            @PathVariable UUID dealerId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDealerId(dealerId));
    }

    // FULL UPDATE — ADMIN only (gateway enforced)
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable UUID id,
            @RequestBody Appointment appointment) {

        return ResponseEntity.ok(appointmentService.updateAppointment(id, appointment));
    }

    // UPDATE SERVICE TYPE — customer/dealer own appointment (gateway enforced)
    @PatchMapping("/{id}/service-type")
    public ResponseEntity<Appointment> updateServiceType(
            @PathVariable UUID id,
            @RequestParam String serviceType) {

        return ResponseEntity.ok(appointmentService.updateServiceType(id, serviceType));
    }

    /**
     * PATCH /api/appointments/{id}/status
     *
     * DEALER only (gateway enforced via isAppointmentDealer check).
     * The gateway checks appointment.dealerId against the authenticated dealer
     * using the authorizationService.isAppointmentDealer() which uses userId.
     *
     * NOTE: For this check to work correctly the authorizationService must also
     * resolve userId → dealerId. See gateway AuthorizationFilter lines 1142-1158.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(
            @PathVariable UUID id,
            @RequestParam AppointmentStatus status) {

        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }

    // DELETE APPOINTMENT — ADMIN only (gateway enforced)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable UUID id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}