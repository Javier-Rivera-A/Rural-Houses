package com.ruralhouses.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String url;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_house_id", nullable = false)
    private CountryHouse countryHouse;
}
