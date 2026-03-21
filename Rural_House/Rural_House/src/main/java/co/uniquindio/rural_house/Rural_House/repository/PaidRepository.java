package co.uniquindio.rural_house.Rural_House.repository;


import co.uniquindio.rural_house.Rural_House.entity.Paid;
import co.uniquindio.rural_house.Rural_House.entity.enums.PaidState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaidRepository extends JpaRepository<Paid, String> {
    List<Paid> findByRental_Id(String rentalId);
    List<Paid> findByPaidState(PaidState paidState);
}
