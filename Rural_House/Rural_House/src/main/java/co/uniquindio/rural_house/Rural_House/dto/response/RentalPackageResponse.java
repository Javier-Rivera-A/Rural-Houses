package co.uniquindio.rural_house.Rural_House.dto.response;

import co.uniquindio.rural_house.Rural_House.entity.enums.TypeRental;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RentalPackageResponse {
    private String id;
    private LocalDate startingDate;
    private LocalDate endingDate;
    private Float priceNight;
    private TypeRental typeRental;
    private String countryHouseCode;
}
