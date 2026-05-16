package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import co.uniquindio.rural_house.Rural_House.entity.enums.TypeRental;

import java.time.LocalDate;
import java.util.List;

@Data
public class RentalRequest {

    @NotBlank(message = "El código de la casa es obligatorio")
    private String countryHouseCode;

    @NotNull(message = "La fecha de entrada es obligatoria")
    private LocalDate checkInDate;

    @Positive(message = "El número de noches debe ser positivo")
    private Integer numberNights;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    private String contactPhoneNumber;

    // Si es null o vacío, se alquila la casa entera
    private List<String> bedroomCodes;

    /**
      ENTIRE_HOUSE: renta la casa completa
      ROOMS: renta solo las habitaciones indicadas en bedroomCodes
     Si el paquete es BOTH, el cliente puede elegir cualquiera de los dos.
     */
    @NotNull(message = "Debe indicar el tipo de renta: ENTIRE_HOUSE o ROOMS")
    private TypeRental typeRental;

}
