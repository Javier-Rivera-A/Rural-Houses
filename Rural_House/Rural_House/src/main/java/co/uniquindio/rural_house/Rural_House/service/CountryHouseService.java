package co.uniquindio.rural_house.Rural_House.service;



import co.uniquindio.rural_house.Rural_House.dto.request.CountryHouseRequest;
import co.uniquindio.rural_house.Rural_House.dto.request.RentalPackageRequest;
import co.uniquindio.rural_house.Rural_House.dto.response.AvailabilityResponse;
import co.uniquindio.rural_house.Rural_House.dto.response.CountryHouseResponse;
import co.uniquindio.rural_house.Rural_House.dto.response.RentalPackageResponse;
import co.uniquindio.rural_house.Rural_House.entity.CountryHouse;

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
