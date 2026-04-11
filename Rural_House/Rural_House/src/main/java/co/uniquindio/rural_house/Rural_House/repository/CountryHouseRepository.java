package co.uniquindio.rural_house.Rural_House.repository;


import co.uniquindio.rural_house.Rural_House.entity.CountryHouse;
import co.uniquindio.rural_house.Rural_House.entity.enums.StateCountryHouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CountryHouseRepository extends JpaRepository<CountryHouse, String> {

    Optional<CountryHouse> findByCode(String code);

    boolean existsByCode(String code);

    List<CountryHouse> findByPopulation_Name(String populationName);

    List<CountryHouse> findByPopulation_NameAndStateCountryHouse(String populationName, StateCountryHouse state);

    List<CountryHouse> findByOwner_Id(String ownerId);

    @Query("SELECT ch FROM CountryHouse ch WHERE ch.population.name = :name AND ch.stateCountryHouse = 'ACTIVE'")
    List<CountryHouse> findActiveByPopulationName(@Param("name") String name);

    @Query("SELECT ch FROM CountryHouse ch WHERE ch.stateCountryHouse = 'ACTIVE' " +
           "AND (:population IS NULL OR LOWER(ch.population.name) LIKE LOWER(CONCAT('%', CAST(:population AS text), '%'))) " +
           "AND (:code IS NULL OR LOWER(ch.code) LIKE LOWER(CONCAT('%', CAST(:code AS text), '%'))) " +
           "AND (:minBedrooms IS NULL OR SIZE(ch.bedrooms) >= :minBedrooms) " +
           "AND (:minBathrooms IS NULL OR (ch.privateBathrooms + ch.publicBathrooms) >= :minBathrooms) " +
           "AND (:minKitchens IS NULL OR SIZE(ch.diningRooms) >= :minKitchens) " +
           "AND (:minGaragePlaces IS NULL OR ch.garagePlaces >= :minGaragePlaces) " +
           "AND (:hasPrivateBathroom IS NULL OR :hasPrivateBathroom = false OR EXISTS (SELECT b FROM ch.bedrooms b WHERE b.countryHouse = ch AND b.bathroom = true)) " +
           "AND (:hasDishwasher IS NULL OR :hasDishwasher = false OR EXISTS (SELECT k FROM ch.diningRooms k WHERE k.countryHouse = ch AND k.dishWasher = true)) " +
           "AND (:hasWashingMachine IS NULL OR :hasWashingMachine = false OR EXISTS (SELECT k FROM ch.diningRooms k WHERE k.countryHouse = ch AND k.washingMachine = true)) " +
           "AND (:bedType IS NULL OR EXISTS (SELECT b FROM ch.bedrooms b JOIN b.typesOfBeds t WHERE b.countryHouse = ch AND t = :bedType))")
    List<CountryHouse> searchActiveByAdvancedFilters(
                                             @Param("population") String population,
                                             @Param("code") String code,
                                             @Param("minBedrooms") Integer minBedrooms,
                                             @Param("minBathrooms") Integer minBathrooms,
                                             @Param("minKitchens") Integer minKitchens,
                                             @Param("minGaragePlaces") Integer minGaragePlaces,
                                             @Param("hasPrivateBathroom") Boolean hasPrivateBathroom,
                                             @Param("hasDishwasher") Boolean hasDishwasher,
                                             @Param("hasWashingMachine") Boolean hasWashingMachine,
                                             @Param("bedType") co.uniquindio.rural_house.Rural_House.entity.enums.TypeOfBed bedType);

    @Query("SELECT ch FROM CountryHouse ch WHERE ch.stateCountryHouse = 'ACTIVE'")
    List<CountryHouse> findAllActive();
}
