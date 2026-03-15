package com.ruralhouses.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "populations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Population {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String zipCode;

    @OneToMany(mappedBy = "population", cascade = CascadeType.ALL)
    private Set<CountryHouse> countryHouses = new HashSet<>();
}
