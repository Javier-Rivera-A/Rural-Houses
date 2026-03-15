package com.ruralhouses.entity;

import com.ruralhouses.entity.enums.StateCountryHouse;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "country_houses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CountryHouse {

    // UML: + id: String
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // UML: + owner: Owner
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private Owner owner;

    // UML: + privateBathrooms: Byte
    @Min(0)
    private Byte privateBathrooms;

    // UML: + publicBathrooms: Byte
    @Min(0)
    private Byte publicBathrooms;

    // UML: + code: String
    @Column(nullable = false, unique = true)
    private String code;

    // UML: + description: String
    @Column(columnDefinition = "TEXT")
    private String description;

    // UML: + garagePlaces: Byte
    @Min(0)
    private Byte garagePlaces;

    // UML: + diningRooms: ArrayList<Kitchen>
    @OneToMany(mappedBy = "countryHouse", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Kitchen> diningRooms = new ArrayList<>();

    // UML: + stateCountryHouse: StateCountryHouse
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StateCountryHouse stateCountryHouse = StateCountryHouse.ACTIVE;

    // UML: + population: Population
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "population_id", nullable = false)
    private Population population;

    // UML: + bedrooms: HashSet<Bedroom>  (minimo 3, validado en service)
    @OneToMany(mappedBy = "countryHouse", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Bedroom> bedrooms = new HashSet<>();

    // UML: + photo: ArrayList<Photo>
    @OneToMany(mappedBy = "countryHouse", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photo = new ArrayList<>();

    // UML: + rentalPackages: ArrayList<RentalPackage>
    @OneToMany(mappedBy = "countryHouse", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RentalPackage> rentalPackages = new ArrayList<>();

    // UML: + rental: HashSet<Rental>
    @OneToMany(mappedBy = "countryHouse", cascade = CascadeType.ALL)
    private Set<Rental> rental = new HashSet<>();
}
