package com.ruralhouses.entity;

import com.ruralhouses.entity.enums.TypeOfBed;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bedrooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Bedroom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Integer bedroomCode;

    private Boolean bathroom = false;

    private Byte numberBeds;

    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "bedroom_bed_types", joinColumns = @JoinColumn(name = "bedroom_id"))
    @Column(name = "type_of_bed")
    private List<TypeOfBed> typesOfBeds = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_house_id", nullable = false)
    private CountryHouse countryHouse;
}
