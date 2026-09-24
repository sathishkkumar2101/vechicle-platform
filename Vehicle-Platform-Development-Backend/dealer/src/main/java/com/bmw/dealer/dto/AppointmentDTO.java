package com.bmw.dealer.dto;

import com.bmw.dealer.model.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentDTO {
    private UUID id;
    private AppointmentStatus status;
}
