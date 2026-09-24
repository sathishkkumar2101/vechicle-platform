package com.bmwtechworks.serviceappointment.service;

import com.bmwtechworks.serviceappointment.model.Appointment;
import com.bmwtechworks.serviceappointment.model.AppointmentStatus;

import java.util.List;
import java.util.UUID;

public interface AppointmentService {

    Appointment createAppointment(Appointment appointment);

    Appointment getAppointmentById(UUID id);

    List<Appointment> getAllAppointments();
    
    List<Appointment> getAppointmentsByCustomerId(UUID customerId);

    List<Appointment> getAppointmentsByDealerId(UUID dealerId);

    Appointment updateAppointment(UUID id, Appointment appointment);

    Appointment updateServiceType(UUID id, String serviceType);

    Appointment updateStatus(UUID id, AppointmentStatus status);

    void deleteAppointment(UUID id);
}