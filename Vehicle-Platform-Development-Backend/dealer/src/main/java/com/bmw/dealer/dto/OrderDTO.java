package com.bmw.dealer.dto;

import com.bmw.dealer.model.OrderStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;


public record OrderDTO(
        UUID id,
        UUID customerId,
        UUID vehicleId,
        UUID dealerId,
        OrderStatus status,
        LocalDateTime createdAt,
        BigDecimal totalAmount
) {
}
