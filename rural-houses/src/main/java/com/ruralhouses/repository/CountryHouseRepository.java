package com.ruralhouses.repository;

import com.ruralhouses.entity.CountryHouse;
import com.ruralhouses.entity.enums.StateCountryHouse;
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
}
