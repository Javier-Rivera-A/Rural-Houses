package co.uniquindio.rural_house.Rural_House.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bank_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // UML: - numberAccount: String  (privado en UML)
    @Column(nullable = false)
    private String numberAccount;

    // UML: + bank: String
    private String bank;

    // UML: + accountType: String
    private String accountType;

    // UML: + mount: Double  (nombre exacto del UML, aunque es typo de "amount")
    private Double mount = 0.0;

    // UML: + user: User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // UML: + paidHistory: ArrayList<Paid>
    @OneToMany(mappedBy = "bankAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Paid> paidHistory = new ArrayList<>();
}
