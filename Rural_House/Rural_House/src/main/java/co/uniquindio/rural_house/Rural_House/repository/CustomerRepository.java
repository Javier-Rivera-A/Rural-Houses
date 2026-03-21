package co.uniquindio.rural_house.Rural_House.repository;


import co.uniquindio.rural_house.Rural_House.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUserName(String userName);
}
