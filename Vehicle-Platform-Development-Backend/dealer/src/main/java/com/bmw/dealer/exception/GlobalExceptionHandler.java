package com.bmw.dealer.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DealerNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleDealerNotFound(
            DealerNotFoundException ex,
            HttpServletRequest request) {

        ErrorResponse response = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                "Dealer Not Found",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(response);
    }


    @ExceptionHandler(NoDealerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoDealerFound(
            NoDealerFoundException ex,
            HttpServletRequest request) {

        ErrorResponse response = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                "No Dealers Found",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(response);
    }


    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(
            org.springframework.web.server.ResponseStatusException ex,
            HttpServletRequest request) {

        ErrorResponse response = new ErrorResponse(
                LocalDateTime.now(),
                ex.getStatusCode().value(),
                ex.getReason() != null ? ex.getReason() : "Access Denied",
                ex.getReason(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(ex.getStatusCode())
                .body(response);
    }

    @ExceptionHandler(feign.FeignException.class)
    public ResponseEntity<ErrorResponse> handleFeignException(
            feign.FeignException ex,
            HttpServletRequest request) {

        HttpStatus status = HttpStatus.resolve(ex.status());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        ErrorResponse response = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                status == HttpStatus.FORBIDDEN ? "Access denied: order does not belong to your dealership" : ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(status)
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(
            Exception ex,
            HttpServletRequest request) {

        ErrorResponse response = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}