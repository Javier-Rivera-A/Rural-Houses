package com.ruralhouses.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class RentalRequest {

    @NotBlank(message = "El código de la casa es obligatorio")
    private String countryHouseCode;

    @NotNull(message = "La fecha de entrada es obligatoria")
    private LocalDate checkInDate;

    @Positive(message = "El número de noches debe ser positivo")
    private Byte numberNights;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    private String contactPhoneNumber;

    // Si es null o vacío, se alquila la casa entera
    private List<String> bedroomCodes;
}
