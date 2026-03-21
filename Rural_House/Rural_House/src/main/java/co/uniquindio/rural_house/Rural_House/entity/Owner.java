package co.uniquindio.rural_house.Rural_House.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "owners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Owner extends User {

    private String accessWord;

    // UML: listCountryHouses: HashSet<CountryHouse>
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CountryHouse> listCountryHouses = new HashSet<>();
}
