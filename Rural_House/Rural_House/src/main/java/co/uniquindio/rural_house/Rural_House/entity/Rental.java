package co.uniquindio.rural_house.Rural_House.entity;


import co.uniquindio.rural_house.Rural_House.entity.enums.RentalState;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rentals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Rental {

    // UML: + id: String
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // UML: + rentalCode: String
    @Column(nullable = false, unique = true)
    private String rentalCode;

    // UML: + rentalDayMade: Date
    @Column(nullable = false)
    private LocalDate rentalDayMade;

    // UML: + checkInDate: Date
    @Column(nullable = false)
    private LocalDate checkInDate;

    // UML: + checkOutDate: Date
    @Column(nullable = false)
    private LocalDate checkOutDate;

    // UML: + numberNights: Byte
    @Column(nullable = false)
    private Integer numberNights;

    // UML: + state: RentalState
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalState state = RentalState.PENDING;

    // UML: + contactPhoneNumber: String
    @Column(nullable = false)
    private String contactPhoneNumber;

    // UML: + totalPrice: Float
    @Column(nullable = false)
    private Float totalPrice;

    // UML: + payments: ArrayList<Paid>
    @OneToMany(mappedBy = "rental", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Paid> payments = new ArrayList<>();

    // UML: + customer: Customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    // UML: + rentalPlaceId: ArrayList<String>  (nombre exacto del UML)
    @ElementCollection
    @CollectionTable(name = "rental_place_ids", joinColumns = @JoinColumn(name = "rental_id"))
    @Column(name = "place_id")
    private List<String> rentalPlaceId = new ArrayList<>();

    // Relacion bidireccional con CountryHouse (lado inverso)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_house_id", nullable = false)
    private CountryHouse countryHouse;

    @PrePersist
    public void prePersist() {
        this.rentalDayMade = LocalDate.now();
    }
}
