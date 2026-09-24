package com.bmwtechworks.serviceappointment.service;

import com.bmwtechworks.serviceappointment.exception.AppointmentNotFoundException;
import com.bmwtechworks.serviceappointment.model.Appointment;
import com.bmwtechworks.serviceappointment.model.AppointmentStatus;
import com.bmwtechworks.serviceappointment.repository.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public Appointment createAppointment(Appointment appointment) {

        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment getAppointmentById(UUID id) {

        return appointmentRepository.findById(id)
                .orElseThrow(() ->
                        new AppointmentNotFoundException(
                                "Appointment not found with id: " + id
                        ));
    }

    @Override
    public List<Appointment> getAllAppointments() {

        return appointmentRepository.findAll();
    }

    @Override
    public List<Appointment> getAppointmentsByCustomerId(UUID customerId) {
        return appointmentRepository.findByCustomerId(customerId);
    }

    @Override
    public List<Appointment> getAppointmentsByDealerId(UUID dealerId) {
        return appointmentRepository.findByDealerId(dealerId);
    }

    @Override
    public Appointment updateAppointment(
            UUID id,
            Appointment updatedAppointment) {

        Appointment existingAppointment =
                appointmentRepository.findById(id)
                        .orElseThrow(() ->
                                new AppointmentNotFoundException(
                                        "Appointment not found with id: " + id
                                ));

        existingAppointment.setCustomerId(
                updatedAppointment.getCustomerId()
        );

        existingAppointment.setVehicleId(
                updatedAppointment.getVehicleId()
        );

        existingAppointment.setDealerId(
                updatedAppointment.getDealerId()
        );

        existingAppointment.setAppointmentDate(
                updatedAppointment.getAppointmentDate()
        );

        existingAppointment.setServiceType(
                updatedAppointment.getServiceType()
        );

        existingAppointment.setStatus(
                updatedAppointment.getStatus()
        );

        return appointmentRepository.save(existingAppointment);
    }

    @Override
    public Appointment updateServiceType(
            UUID id,
            String serviceType) {

        Appointment appointment =
                appointmentRepository.findById(id)
                        .orElseThrow(() ->
                                new AppointmentNotFoundException(
                                        "Appointment not found with id: " + id
                                ));

        appointment.setServiceType(serviceType);

        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment updateStatus(
            UUID id,
            AppointmentStatus status) {

        Appointment appointment =
                appointmentRepository.findById(id)
                        .orElseThrow(() ->
                                new AppointmentNotFoundException(
                                        "Appointment not found with id: " + id
                                ));

        appointment.setStatus(status);

        return appointmentRepository.save(appointment);
    }

    @Override
    public void deleteAppointment(UUID id) {

        if (!appointmentRepository.existsById(id)) {

            throw new AppointmentNotFoundException(
                    "Appointment not found with id: " + id
            );
        }

        appointmentRepository.deleteById(id);
    }
}