package com.ruralhouses.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.util.Map;

@Data
public class AvailabilityResponse {
    private String countryHouseCode;
    // Clave: fecha, Valor: estado de disponibilidad de la casa y habitaciones
    private Map<LocalDate, DayAvailability> dailyAvailability;

    @Data
    public static class DayAvailability {
        // Estado de la casa entera: FREE, RESERVED, NOT_AVAILABLE
        private String entireHouseStatus;
        // Clave: bedroomCode, Valor: FREE, RESERVED, NOT_AVAILABLE
        private Map<Integer, String> bedroomsStatus;
    }
}
