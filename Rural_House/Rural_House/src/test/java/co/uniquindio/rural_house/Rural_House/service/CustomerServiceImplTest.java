package co.uniquindio.rural_house.Rural_House.service;

import co.uniquindio.rural_house.Rural_House.entity.Customer;
import co.uniquindio.rural_house.Rural_House.exception.BusinessException;
import co.uniquindio.rural_house.Rural_House.repository.CustomerRepository;
import co.uniquindio.rural_house.Rural_House.repository.UserRepository;
import co.uniquindio.rural_house.Rural_House.service.impl.CustomerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CustomerServiceImplTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private Customer customer;

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setId("cust-1");
        customer.setUserName("oldUsername");
        customer.setEmail("old@email.com");
        customer.setPassword("oldPassword");
        customer.setPhone("12345678");
    }

    @Test
    void updateUserName_successful() {
        when(customerRepository.findById("cust-1")).thenReturn(Optional.of(customer));
        when(userRepository.existsByUserName("newUsername")).thenReturn(false);

        customerService.updateUserName("cust-1", "newUsername");

        assertEquals("newUsername", customer.getUserName());
        verify(customerRepository, times(1)).save(customer);
    }

    @Test
    void updateUserName_alreadyInUse_shouldThrowException() {
        when(customerRepository.findById("cust-1")).thenReturn(Optional.of(customer));
        when(userRepository.existsByUserName("newUsername")).thenReturn(true);

        assertThrows(BusinessException.class, () -> {
            customerService.updateUserName("cust-1", "newUsername");
        });
    }

    @Test
    void updateEmail_successful() {
        when(customerRepository.findById("cust-1")).thenReturn(Optional.of(customer));
        when(userRepository.existsByEmail("new@email.com")).thenReturn(false);

        customerService.updateEmail("cust-1", "new@email.com");

        assertEquals("new@email.com", customer.getEmail());
        verify(customerRepository, times(1)).save(customer);
    }

    @Test
    void updateEmail_alreadyInUse_shouldThrowException() {
        when(customerRepository.findById("cust-1")).thenReturn(Optional.of(customer));
        when(userRepository.existsByEmail("new@email.com")).thenReturn(true);

        assertThrows(BusinessException.class, () -> {
            customerService.updateEmail("cust-1", "new@email.com");
        });
    }

    @Test
    void updatePassword_successful() {
        when(customerRepository.findById("cust-1")).thenReturn(Optional.of(customer));
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPassword");

        customerService.updatePassword("cust-1", "newPassword");

        assertEquals("encodedNewPassword", customer.getPassword());
        verify(customerRepository, times(1)).save(customer);
    }

    @Test
    void updatePhone_successful() {
        when(customerRepository.findById("cust-1")).thenReturn(Optional.of(customer));

        customerService.updatePhone("cust-1", "87654321");

        assertEquals("87654321", customer.getPhone());
        verify(customerRepository, times(1)).save(customer);
    }
}
