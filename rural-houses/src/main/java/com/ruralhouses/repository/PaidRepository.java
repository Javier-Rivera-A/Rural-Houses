package com.ruralhouses.repository;

import com.ruralhouses.entity.Paid;
import com.ruralhouses.entity.enums.PaidState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaidRepository extends JpaRepository<Paid, String> {
    List<Paid> findByRental_Id(String rentalId);
    List<Paid> findByPaidState(PaidState paidState);
}
