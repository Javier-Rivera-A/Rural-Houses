package com.ruralhouses.service;

import com.ruralhouses.dto.request.CountryHouseRequest;
import com.ruralhouses.dto.request.RentalPackageRequest;
import com.ruralhouses.dto.response.AvailabilityResponse;
import com.ruralhouses.dto.response.CountryHouseResponse;
import com.ruralhouses.dto.response.RentalPackageResponse;
import com.ruralhouses.entity.CountryHouse;

import java.time.LocalDate;
import java.util.List;

public interface CountryHouseService {

    // Operaciones del propietario
    CountryHouseResponse register(String ownerId, CountryHouseRequest request);
    CountryHouseResponse update(String ownerId, String houseId, CountryHouseRequest request);
    void deactivate(String ownerId, String houseId);

    // Paquetes de alquiler
    RentalPackageResponse addRentalPackage(String ownerId, String houseId, RentalPackageRequest request);
    RentalPackageResponse updateRentalPackage(String ownerId, String packageId, RentalPackageRequest request);
    void deleteRentalPackage(String ownerId, String packageId);

    // Búsquedas públicas
    List<CountryHouseResponse> findByPopulation(String populationName);
    CountryHouseResponse findByCode(String code);
    CountryHouseResponse findById(String id);

    // Disponibilidad
    AvailabilityResponse checkAvailability(String houseCode, LocalDate checkIn, int nights);

    // Helper interno
    CountryHouse getEntityByCode(String code);
    CountryHouse getEntityById(String id);
    void verifyOwnership(String ownerId, String houseId);
}
