package com.ruralhouses.service.impl;

import com.ruralhouses.dto.request.LoginRequest;
import com.ruralhouses.dto.request.RegisterOwnerRequest;
import com.ruralhouses.entity.Owner;
import com.ruralhouses.entity.enums.EnumAccountState;
import com.ruralhouses.exception.BusinessException;
import com.ruralhouses.exception.ResourceNotFoundException;
import com.ruralhouses.exception.UnauthorizedException;
import com.ruralhouses.repository.OwnerRepository;
import com.ruralhouses.repository.UserRepository;
import com.ruralhouses.service.OwnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerServiceImpl implements OwnerService {

    private final OwnerRepository ownerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public Owner register(RegisterOwnerRequest request) {
        if (userRepository.existsByUserName(request.getUserName())) {
            throw new BusinessException("El nombre de usuario '" + request.getUserName() + "' ya está en uso");
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("El email ya está registrado");
        }

        Owner owner = new Owner();
        owner.setUserName(request.getUserName());
        owner.setPassword(passwordEncoder.encode(request.getPassword()));
        owner.setAccessWord(request.getAccessWord());
        owner.setEmail(request.getEmail());
        owner.setPhone(request.getPhone());
        owner.setAccountState(EnumAccountState.ACTIVE);

        return ownerRepository.save(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public Owner login(LoginRequest request) {
        Owner owner = ownerRepository.findByUserName(request.getUserName())
                .orElseThrow(() -> new UnauthorizedException("Credenciales incorrectas"));

        // El propietario se identifica con su accessWord, no con la password genérica de User
        if (!request.getPassword().equals(owner.getAccessWord())) {
            throw new UnauthorizedException("Palabra de acceso incorrecta");
        }
        if (owner.getAccountState() != EnumAccountState.ACTIVE) {
            throw new UnauthorizedException("La cuenta está desactivada");
        }
        return owner;
    }

    @Override
    @Transactional(readOnly = true)
    public Owner findById(String id) {
        return ownerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Propietario no encontrado con ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Owner findByUserName(String userName) {
        return ownerRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("Propietario no encontrado: " + userName));
    }
}
