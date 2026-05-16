package co.uniquindio.rural_house.Rural_House.dto.response;

import co.uniquindio.rural_house.Rural_House.entity.enums.RentalState;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class RentalResponse {
    private String id;
    private String rentalCode;
    private LocalDate rentalDayMade;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer numberNights;
    private RentalState state;
    private String contactPhoneNumber;
    private Float totalPrice;
    // UML: rentalPlaceId: ArrayList<String>
    private List<String> rentalPlaceId;
    private String countryHouseCode;
    private String customerUserName;
    // Info de pago al crear reserva (20% del importe, cuenta del propietario)
    private List<String> ownerBankAccount;
    private Float depositRequired;

    // Pagos
    private Float totalPaid;
    private Float remainingBalance;
}
