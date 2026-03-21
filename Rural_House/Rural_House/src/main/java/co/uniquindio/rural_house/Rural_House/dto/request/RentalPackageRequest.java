package co.uniquindio.rural_house.Rural_House.dto.request;

import co.uniquindio.rural_house.Rural_House.entity.enums.TypeRental;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RentalPackageRequest {

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startingDate;

    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate endingDate;

    @Positive(message = "El precio por noche debe ser positivo")
    private Float priceNight;

    @NotNull(message = "El tipo de alquiler es obligatorio")
    private TypeRental typeRental;
}
