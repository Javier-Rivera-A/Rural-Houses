package co.uniquindio.rural_house.Rural_House.repository;


import co.uniquindio.rural_house.Rural_House.entity.Population;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PopulationRepository extends JpaRepository<Population, String> {
    Optional<Population> findByName(String name);
    Optional<Population> findByZipCode(String zipCode);
    boolean existsByName(String name);
}
