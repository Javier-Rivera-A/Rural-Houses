package co.uniquindio.rural_house.Rural_House.service;



import co.uniquindio.rural_house.Rural_House.dto.request.RentalRequest;
import co.uniquindio.rural_house.Rural_House.dto.response.RentalResponse;

import java.util.List;

public interface RentalService {
    RentalResponse makeRental(String customerId, RentalRequest request);
    RentalResponse findByCode(String rentalCode);
    List<RentalResponse> findByCustomer(String customerId);
    List<RentalResponse> findByCountryHouse(String houseId);

    // Operaciones del propietario
    void registerPayment(String ownerId, String rentalId, Float amount);
    void cancelRental(String ownerId, String rentalId);
    List<RentalResponse> getExpiredPendingRentals(String ownerId);
}
