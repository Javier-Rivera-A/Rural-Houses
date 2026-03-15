package com.ruralhouses.service.impl;

import com.ruralhouses.dto.request.LoginRequest;
import com.ruralhouses.dto.request.RegisterOwnerRequest;
import com.ruralhouses.entity.Customer;
import com.ruralhouses.entity.enums.EnumAccountState;
import com.ruralhouses.exception.BusinessException;
import com.ruralhouses.exception.ResourceNotFoundException;
import com.ruralhouses.exception.UnauthorizedException;
import com.ruralhouses.repository.CustomerRepository;
import com.ruralhouses.repository.UserRepository;
import com.ruralhouses.service.CustomerService;
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
    public Customer register(RegisterOwnerRequest request) {
        if (userRepository.existsByUserName(request.getUserName())) {
            throw new BusinessException("El nombre de usuario '" + request.getUserName() + "' ya está en uso");
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("El email ya está registrado");
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
                .orElseThrow(() -> new UnauthorizedException("Credenciales incorrectas"));

        if (!passwordEncoder.matches(request.getPassword(), customer.getPassword())) {
            throw new UnauthorizedException("Credenciales incorrectas");
        }
        if (customer.getAccountState() != EnumAccountState.ACTIVE) {
            throw new UnauthorizedException("La cuenta está desactivada");
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
