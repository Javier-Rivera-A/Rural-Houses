package co.uniquindio.rural_house.Rural_House.repository;


import co.uniquindio.rural_house.Rural_House.entity.Owner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OwnerRepository extends JpaRepository<Owner, String> {
    Optional<Owner> findByUserName(String userName);
}
