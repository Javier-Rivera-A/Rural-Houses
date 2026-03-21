package co.uniquindio.rural_house.Rural_House.repository;


import co.uniquindio.rural_house.Rural_House.entity.Rental;
import co.uniquindio.rural_house.Rural_House.entity.enums.RentalState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RentalRepository extends JpaRepository<Rental, String> {

    Optional<Rental> findByRentalCode(String rentalCode);

    List<Rental> findByCountryHouse_Id(String countryHouseId);

    List<Rental> findByCustomer_Id(String customerId);

    List<Rental> findByState(RentalState state);

    @Query("SELECT r FROM Rental r WHERE r.countryHouse.id = :houseId " +
           "AND r.state NOT IN ('CANCELLED') " +
           "AND r.checkInDate <= :checkOut AND r.checkOutDate >= :checkIn")
    List<Rental> findOverlappingRentals(@Param("houseId") String houseId,
                                        @Param("checkIn") LocalDate checkIn,
                                        @Param("checkOut") LocalDate checkOut);

    @Query("SELECT r FROM Rental r WHERE r.state = 'PENDING' " +
           "AND r.rentalDayMade <= :expiryDate")
    List<Rental> findExpiredPendingRentals(@Param("expiryDate") LocalDate expiryDate);
}
