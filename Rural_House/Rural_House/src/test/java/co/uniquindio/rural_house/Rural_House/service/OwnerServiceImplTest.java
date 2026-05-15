package co.uniquindio.rural_house.Rural_House.service;

import co.uniquindio.rural_house.Rural_House.entity.Owner;
import co.uniquindio.rural_house.Rural_House.exception.BusinessException;
import co.uniquindio.rural_house.Rural_House.repository.OwnerRepository;
import co.uniquindio.rural_house.Rural_House.repository.UserRepository;
import co.uniquindio.rural_house.Rural_House.service.impl.OwnerServiceImpl;
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
public class OwnerServiceImplTest {

    @Mock
    private OwnerRepository ownerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private OwnerServiceImpl ownerService;

    private Owner owner;

    @BeforeEach
    void setUp() {
        owner = new Owner();
        owner.setId("owner-1");
        owner.setUserName("oldUsername");
        owner.setEmail("old@email.com");
        owner.setPassword("oldPassword");
        owner.setPhone("12345678");
        owner.setAccessWord("oldAccessWord");
    }

    @Test
    void updateUserName_successful() {
        when(ownerRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(userRepository.existsByUserName("newUsername")).thenReturn(false);

        ownerService.updateUserName("owner-1", "newUsername");

        assertEquals("newUsername", owner.getUserName());
        verify(ownerRepository, times(1)).save(owner);
    }

    @Test
    void updateUserName_alreadyInUse_shouldThrowException() {
        when(ownerRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(userRepository.existsByUserName("newUsername")).thenReturn(true);

        assertThrows(BusinessException.class, () -> {
            ownerService.updateUserName("owner-1", "newUsername");
        });
    }

    @Test
    void updateEmail_successful() {
        when(ownerRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(userRepository.existsByEmail("new@email.com")).thenReturn(false);

        ownerService.updateEmail("owner-1", "new@email.com");

        assertEquals("new@email.com", owner.getEmail());
        verify(ownerRepository, times(1)).save(owner);
    }

    @Test
    void updateEmail_alreadyInUse_shouldThrowException() {
        when(ownerRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(userRepository.existsByEmail("new@email.com")).thenReturn(true);

        assertThrows(BusinessException.class, () -> {
            ownerService.updateEmail("owner-1", "new@email.com");
        });
    }

    @Test
    void updatePassword_successful() {
        when(ownerRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPassword");

        ownerService.updatePassword("owner-1", "newPassword");

        assertEquals("encodedNewPassword", owner.getPassword());
        verify(ownerRepository, times(1)).save(owner);
    }

    @Test
    void updatePhone_successful() {
        when(ownerRepository.findById("owner-1")).thenReturn(Optional.of(owner));

        ownerService.updatePhone("owner-1", "87654321");

        assertEquals("87654321", owner.getPhone());
        verify(ownerRepository, times(1)).save(owner);
    }

    @Test
    void updateAccessWord_successful() {
        when(ownerRepository.findById("owner-1")).thenReturn(Optional.of(owner));

        ownerService.updateAccessWord("owner-1", "newAccessWord");

        assertEquals("newAccessWord", owner.getAccessWord());
        verify(ownerRepository, times(1)).save(owner);
    }
}
