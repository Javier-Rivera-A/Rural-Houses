package com.ruralhouses.dto.response;

import com.ruralhouses.entity.enums.TypeRental;
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
