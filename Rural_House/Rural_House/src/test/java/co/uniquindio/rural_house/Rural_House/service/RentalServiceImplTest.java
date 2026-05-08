package co.uniquindio.rural_house.Rural_House.service;

import co.uniquindio.rural_house.Rural_House.entity.*;
import co.uniquindio.rural_house.Rural_House.entity.enums.RentalState;
import co.uniquindio.rural_house.Rural_House.exception.BusinessException;
import co.uniquindio.rural_house.Rural_House.exception.UnauthorizedException;
import co.uniquindio.rural_house.Rural_House.repository.*;
import co.uniquindio.rural_house.Rural_House.service.impl.RentalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RentalServiceImplTest {

    @Mock
    private RentalRepository rentalRepository;
    @Mock
    private BankAccountRepository bankAccountRepository;
    @Mock
    private PaidRepository paidRepository;
    @Mock
    private EmailService emailService;
    // Ignoramos los demás repositorios porque no se usan en payRental para esta prueba

    @InjectMocks
    private RentalServiceImpl rentalService;

    private Rental dummyRental;
    private Customer customer;
    private Owner owner;
    private CountryHouse house;

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setId("customer-1");
        customer.setEmail("customer@mail.com");

        owner = new Owner();
        owner.setId("owner-1");
        owner.setEmail("owner@mail.com");

        house = new CountryHouse();
        house.setId("house-1");
        house.setOwner(owner);

        dummyRental = new Rental();
        dummyRental.setId("rental-1");
        dummyRental.setRentalCode("RES-123");
        dummyRental.setCustomer(customer);
        dummyRental.setCountryHouse(house);
        dummyRental.setState(RentalState.PENDING);
    }

    @Test
    void payRental_successful_shouldTransferAndConfirm() {
        // Arrange
        when(rentalRepository.findById("rental-1")).thenReturn(Optional.of(dummyRental));

        BankAccount customerAccount = new BankAccount();
        customerAccount.setMount(1000.0);
        when(bankAccountRepository.findByUser_Id("customer-1")).thenReturn(List.of(customerAccount));

        BankAccount ownerAccount = new BankAccount();
        ownerAccount.setMount(500.0);
        when(bankAccountRepository.findByUser_Id("owner-1")).thenReturn(List.of(ownerAccount));

        // Act
        rentalService.payRental("customer-1", "rental-1", 200.0f);

        // Assert
        assertEquals(800.0, customerAccount.getMount());
        assertEquals(700.0, ownerAccount.getMount());

        verify(bankAccountRepository, times(2)).save(any(BankAccount.class));
        verify(paidRepository, times(1)).save(any(Paid.class));
        
        assertEquals(RentalState.CONFIRMED, dummyRental.getState());
        verify(rentalRepository, times(1)).save(dummyRental);

        verify(emailService, times(1)).sendEmail(eq("customer@mail.com"), anyString(), anyString());
        verify(emailService, times(1)).sendEmail(eq("owner@mail.com"), anyString(), anyString());
    }

    @Test
    void payRental_notCustomer_shouldThrowException() {
        when(rentalRepository.findById("rental-1")).thenReturn(Optional.of(dummyRental));

        assertThrows(UnauthorizedException.class, () -> {
            rentalService.payRental("other-customer", "rental-1", 200.0f);
        });
    }

    @Test
    void payRental_noCustomerAccount_shouldThrowException() {
        when(rentalRepository.findById("rental-1")).thenReturn(Optional.of(dummyRental));
        when(bankAccountRepository.findByUser_Id("customer-1")).thenReturn(Collections.emptyList());

        assertThrows(BusinessException.class, () -> {
            rentalService.payRental("customer-1", "rental-1", 200.0f);
        });
    }

    @Test
    void payRental_insufficientFunds_shouldThrowException() {
        when(rentalRepository.findById("rental-1")).thenReturn(Optional.of(dummyRental));

        BankAccount customerAccount = new BankAccount();
        customerAccount.setMount(100.0); // Less than amount to pay
        when(bankAccountRepository.findByUser_Id("customer-1")).thenReturn(List.of(customerAccount));

        assertThrows(BusinessException.class, () -> {
            rentalService.payRental("customer-1", "rental-1", 200.0f);
        });
    }

    @Test
    void payRental_noOwnerAccount_shouldThrowException() {
        when(rentalRepository.findById("rental-1")).thenReturn(Optional.of(dummyRental));

        BankAccount customerAccount = new BankAccount();
        customerAccount.setMount(1000.0);
        when(bankAccountRepository.findByUser_Id("customer-1")).thenReturn(List.of(customerAccount));

        when(bankAccountRepository.findByUser_Id("owner-1")).thenReturn(Collections.emptyList());

        assertThrows(BusinessException.class, () -> {
            rentalService.payRental("customer-1", "rental-1", 200.0f);
        });
    }
}
