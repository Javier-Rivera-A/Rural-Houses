package co.uniquindio.rural_house.Rural_House.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OccupancyResponse {

    private String countryHouseCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalDays;
    private int occupiedDays;
    private double occupancyPercentage;
}