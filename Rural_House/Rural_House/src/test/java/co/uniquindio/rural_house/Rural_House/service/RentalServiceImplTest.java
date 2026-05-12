package co.uniquindio.rural_house.Rural_House.service;

import co.uniquindio.rural_house.Rural_House.dto.request.PayRentalRequest;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
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

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private RentalPackageRepository rentalPackageRepository;

    @Mock
    private CountryHouseService countryHouseService;

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
        dummyRental.setTotalPrice(1000f);
    }

    @Test
    void payRental_successful_shouldTransferAndConfirm() {

        when(rentalRepository.findById("rental-1"))
                .thenReturn(Optional.of(dummyRental));

        when(paidRepository.findByRental_Id("rental-1"))
                .thenReturn(Collections.emptyList());

        BankAccount customerAccount = new BankAccount();
        customerAccount.setId("customer-account");
        customerAccount.setMount(1000.0);
        customerAccount.setUser(customer);

        BankAccount ownerAccount = new BankAccount();
        ownerAccount.setId("owner-account");
        ownerAccount.setMount(500.0);
        ownerAccount.setUser(owner);

        when(bankAccountRepository.findById("customer-account"))
                .thenReturn(Optional.of(customerAccount));

        when(bankAccountRepository.findById("owner-account"))
                .thenReturn(Optional.of(ownerAccount));

        PayRentalRequest request = new PayRentalRequest();
        request.setAmount(200f);
        request.setCustomerBankAccountId("customer-account");
        request.setOwnerBankAccountId("owner-account");

        rentalService.payRental("customer-1", "rental-1", request);

        assertEquals(800.0, customerAccount.getMount());
        assertEquals(700.0, ownerAccount.getMount());

        verify(bankAccountRepository, times(2))
                .save(any(BankAccount.class));

        verify(paidRepository, times(1))
                .save(any(Paid.class));

        assertEquals(RentalState.CONFIRMED, dummyRental.getState());

        verify(rentalRepository, times(1))
                .save(dummyRental);

        verify(emailService, times(1))
                .sendEmail(eq("customer@mail.com"), anyString(), anyString());

        verify(emailService, times(1))
                .sendEmail(eq("owner@mail.com"), anyString(), anyString());
    }

    @Test
    void payRental_notCustomer_shouldThrowException() {

        when(rentalRepository.findById("rental-1"))
                .thenReturn(Optional.of(dummyRental));

        PayRentalRequest request = new PayRentalRequest();
        request.setAmount(200f);

        assertThrows(UnauthorizedException.class, () -> {
            rentalService.payRental("other-customer", "rental-1", request);
        });
    }

    @Test
    void payRental_customerAccountNotFound_shouldThrowException() {

        when(rentalRepository.findById("rental-1"))
                .thenReturn(Optional.of(dummyRental));

        when(paidRepository.findByRental_Id("rental-1"))
                .thenReturn(Collections.emptyList());

        when(bankAccountRepository.findById("customer-account"))
                .thenReturn(Optional.empty());

        PayRentalRequest request = new PayRentalRequest();
        request.setAmount(200f);
        request.setCustomerBankAccountId("customer-account");
        request.setOwnerBankAccountId("owner-account");

        assertThrows(RuntimeException.class, () -> {
            rentalService.payRental("customer-1", "rental-1", request);
        });
    }

    @Test
    void payRental_insufficientFunds_shouldThrowException() {

        when(rentalRepository.findById("rental-1"))
                .thenReturn(Optional.of(dummyRental));

        when(paidRepository.findByRental_Id("rental-1"))
                .thenReturn(Collections.emptyList());

        BankAccount customerAccount = new BankAccount();
        customerAccount.setId("customer-account");
        customerAccount.setMount(100.0);
        customerAccount.setUser(customer);

        when(bankAccountRepository.findById("customer-account"))
                .thenReturn(Optional.of(customerAccount));

        PayRentalRequest request = new PayRentalRequest();
        request.setAmount(200f);
        request.setCustomerBankAccountId("customer-account");
        request.setOwnerBankAccountId("owner-account");

        assertThrows(BusinessException.class, () -> {
            rentalService.payRental("customer-1", "rental-1", request);
        });
    }

    @Test
    void payRental_ownerAccountNotFound_shouldThrowException() {

        when(rentalRepository.findById("rental-1"))
                .thenReturn(Optional.of(dummyRental));

        when(paidRepository.findByRental_Id("rental-1"))
                .thenReturn(Collections.emptyList());

        BankAccount customerAccount = new BankAccount();
        customerAccount.setId("customer-account");
        customerAccount.setMount(1000.0);
        customerAccount.setUser(customer);

        when(bankAccountRepository.findById("customer-account"))
                .thenReturn(Optional.of(customerAccount));

        when(bankAccountRepository.findById("owner-account"))
                .thenReturn(Optional.empty());

        PayRentalRequest request = new PayRentalRequest();
        request.setAmount(200f);
        request.setCustomerBankAccountId("customer-account");
        request.setOwnerBankAccountId("owner-account");

        assertThrows(RuntimeException.class, () -> {
            rentalService.payRental("customer-1", "rental-1", request);
        });
    }
}