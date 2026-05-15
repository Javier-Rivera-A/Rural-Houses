package co.uniquindio.rural_house.Rural_House.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OwnerSummaryResponse {

    private String ownerId;
    private LocalDate startDate;
    private LocalDate endDate;

    // Escenario 1: reservas activas en el período
    private int totalActiveRentals;

    // Escenario 2: ingresos de reservas confirmadas/pagadas
    private double totalIncome;

    // Desglose por casa (para el gráfico de barras del frontend)
    private List<HouseSummary> summaryByHouse;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HouseSummary {
        private String houseCode;
        private int activeRentals;
        private double income;
    }
}