package co.uniquindio.rural_house.Rural_House.entity;


import co.uniquindio.rural_house.Rural_House.entity.enums.EnumAccountState;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String userName;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnumAccountState accountState = EnumAccountState.CREATED;

    private String phone;

    @Column(unique = true)
    private String email;

    private LocalDate createdAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BankAccount> bankAccounts = new HashSet<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDate.now();
    }
}
