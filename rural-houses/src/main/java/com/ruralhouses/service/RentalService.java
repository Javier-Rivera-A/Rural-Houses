package com.ruralhouses.service;

import com.ruralhouses.dto.request.RentalRequest;
import com.ruralhouses.dto.response.RentalResponse;
import com.ruralhouses.entity.Rental;

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
