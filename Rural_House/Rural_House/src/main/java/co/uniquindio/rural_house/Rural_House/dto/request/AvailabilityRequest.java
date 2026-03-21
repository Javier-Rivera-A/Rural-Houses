package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AvailabilityRequest {

    @NotBlank(message = "El código de la casa es obligatorio")
    private String countryHouseCode;

    @NotNull(message = "La fecha de entrada es obligatoria")
    private LocalDate checkInDate;

    @Positive(message = "El número de noches debe ser positivo")
    private Byte numberNights;
}
