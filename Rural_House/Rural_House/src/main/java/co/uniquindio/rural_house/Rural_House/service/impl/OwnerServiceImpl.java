package co.uniquindio.rural_house.Rural_House.service.impl;


import co.uniquindio.rural_house.Rural_House.dto.request.*;
import co.uniquindio.rural_house.Rural_House.entity.*;
import co.uniquindio.rural_house.Rural_House.entity.enums.*;
import co.uniquindio.rural_house.Rural_House.exception.*;
import co.uniquindio.rural_house.Rural_House.repository.*;
import co.uniquindio.rural_house.Rural_House.service.*;
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
                .orElseThrow(() -> new UnauthorizedException("Usuario o palabra de acceso incorrectos"));

        // El propietario se identifica con su accessWord
        if (!request.getPassword().equals(owner.getAccessWord())) {
            throw new UnauthorizedException("Usuario o palabra de acceso incorrectos");
        }
        if (owner.getAccountState() != EnumAccountState.ACTIVE) {
            throw new UnauthorizedException("La cuenta está desactivada. Contacta con soporte.");
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

    @Override
    @Transactional
    public void updateUserName(String id, String newUserName) {
        Owner owner = findById(id);
        if (!owner.getUserName().equals(newUserName) && userRepository.existsByUserName(newUserName)) {
            throw new BusinessException("El nombre de usuario '" + newUserName + "' ya está en uso. Elige otro.");
        }
        owner.setUserName(newUserName);
        ownerRepository.save(owner);
    }

    @Override
    @Transactional
    public void updateEmail(String id, String newEmail) {
        Owner owner = findById(id);
        if (!owner.getEmail().equals(newEmail) && userRepository.existsByEmail(newEmail)) {
            throw new BusinessException("El email '" + newEmail + "' ya está registrado en el sistema.");
        }
        owner.setEmail(newEmail);
        ownerRepository.save(owner);
    }

    @Override
    @Transactional
    public void updatePassword(String id, String newPassword) {
        Owner owner = findById(id);
        owner.setPassword(passwordEncoder.encode(newPassword));
        ownerRepository.save(owner);
    }

    @Override
    @Transactional
    public void updatePhone(String id, String newPhone) {
        Owner owner = findById(id);
        owner.setPhone(newPhone);
        ownerRepository.save(owner);
    }

    @Override
    @Transactional
    public void updateAccessWord(String id, String newAccessWord) {
        Owner owner = findById(id);
        owner.setAccessWord(newAccessWord);
        ownerRepository.save(owner);
    }
}

