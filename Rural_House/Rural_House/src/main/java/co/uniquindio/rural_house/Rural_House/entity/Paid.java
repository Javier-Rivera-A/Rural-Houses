package co.uniquindio.rural_house.Rural_House.entity;


import co.uniquindio.rural_house.Rural_House.entity.enums.PaidState;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Paid {

    // UML: - id: String  (privado en UML)
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // UML: + paidDate: Date
    @Column(nullable = false)
    private LocalDate paidDate;

    // UML: + amount: Float
    @Column(nullable = false)
    private Float amount;

    // UML: - paidState: PaidState  (privado en UML)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaidState paidState = PaidState.PENDING;

    // UML: + rentalId: String  (campo directo, nombre del UML)
    @Column(name = "rental_ref_id", nullable = false)
    private String rentalId;

    // Relacion JPA con Rental (inferida del diagrama de asociacion)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_id", nullable = false)
    private Rental rental;

    // Relacion JPA con BankAccount (inferida del diagrama de asociacion)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;
}
