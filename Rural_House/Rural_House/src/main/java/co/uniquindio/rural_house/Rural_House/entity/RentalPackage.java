package co.uniquindio.rural_house.Rural_House.entity;


import co.uniquindio.rural_house.Rural_House.entity.enums.TypeRental;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "rental_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RentalPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private LocalDate startingDate;

    @Column(nullable = false)
    private LocalDate endingDate;

    @Column(nullable = false)
    private Float priceNight;

    @Column(nullable = false)
    private Float pricePerRoomNight;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeRental typeRental;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_house_id", nullable = false)
    private CountryHouse countryHouse;
}
