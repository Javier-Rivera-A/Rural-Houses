package co.uniquindio.rural_house.Rural_House.service.impl;

import co.uniquindio.rural_house.Rural_House.dto.request.*;
import co.uniquindio.rural_house.Rural_House.entity.*;
import co.uniquindio.rural_house.Rural_House.service.*;
import co.uniquindio.rural_house.Rural_House.repository.*;
import co.uniquindio.rural_house.Rural_House.exception.*;
import co.uniquindio.rural_house.Rural_House.entity.enums.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public Customer register(RegisterCustomerRequest request) {
        // Verificar si el nombre de usuario ya existe (en toda la tabla users)
        if (userRepository.existsByUserName(request.getUserName())) {
            throw new BusinessException(
                "El nombre de usuario '" + request.getUserName() + "' ya está en uso. Elige otro."
            );
        }
        // Verificar si el email ya existe (en toda la tabla users)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(
                "El email '" + request.getEmail() + "' ya está registrado en el sistema."
            );
        }

        Customer customer = new Customer();
        customer.setUserName(request.getUserName());
        customer.setPassword(passwordEncoder.encode(request.getPassword()));
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAccountState(EnumAccountState.ACTIVE);

        return customerRepository.save(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public Customer login(LoginRequest request) {
        Customer customer = customerRepository.findByUserName(request.getUserName())
                .orElseThrow(() -> new UnauthorizedException("Usuario o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getPassword(), customer.getPassword())) {
            throw new UnauthorizedException("Usuario o contraseña incorrectos");
        }
        if (customer.getAccountState() != EnumAccountState.ACTIVE) {
            throw new UnauthorizedException("La cuenta está desactivada. Contacta con soporte.");
        }
        return customer;
    }

    @Override
    @Transactional(readOnly = true)
    public Customer findById(String id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
    }
}
