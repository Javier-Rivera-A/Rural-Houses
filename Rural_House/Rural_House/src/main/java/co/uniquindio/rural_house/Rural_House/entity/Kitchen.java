package co.uniquindio.rural_house.Rural_House.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kitchens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Kitchen {

    // UML: + idCocina: String
    @Id
    @Column(name = "id_cocina")
    private String idCocina;

    // UML: + dishWasher: Boolean
    private Boolean dishWasher = false;

    // UML: + washingMachine: Boolean
    private Boolean washingMachine = false;

    // UML: + countryHouse: CountryHouse  (bidireccional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_house_id", nullable = false)
    private CountryHouse countryHouse;
}
