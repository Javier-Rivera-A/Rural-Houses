package com.ruralhouses.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CountryHouseRequest {

    @NotBlank(message = "El código de la casa es obligatorio")
    private String code;

    private String description;

    @Min(value = 0, message = "Los baños privados no pueden ser negativos")
    private Byte privateBathrooms;

    @Min(value = 0, message = "Los baños públicos no pueden ser negativos")
    private Byte publicBathrooms;

    @Min(value = 0, message = "Las plazas de garaje no pueden ser negativas")
    private Byte garagePlaces;

    @NotBlank(message = "La población es obligatoria")
    private String populationName;

    // UML: bedrooms: HashSet<Bedroom> — mínimo 3
    @NotNull
    private List<BedroomRequest> bedrooms;

    // UML: diningRooms: ArrayList<Kitchen> — mínimo 1
    @NotNull
    private List<KitchenRequest> diningRooms;

    // UML: photo: ArrayList<Photo>
    private List<PhotoRequest> photo;
}
