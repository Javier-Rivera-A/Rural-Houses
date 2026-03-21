package co.uniquindio.rural_house.Rural_House.repository;


import co.uniquindio.rural_house.Rural_House.entity.RentalPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RentalPackageRepository extends JpaRepository<RentalPackage, String> {

    List<RentalPackage> findByCountryHouse_Id(String countryHouseId);

    @Query("SELECT rp FROM RentalPackage rp WHERE rp.countryHouse.id = :houseId " +
           "AND rp.startingDate <= :date AND rp.endingDate >= :date")
    List<RentalPackage> findPackagesForDate(@Param("houseId") String houseId,
                                            @Param("date") LocalDate date);
}
