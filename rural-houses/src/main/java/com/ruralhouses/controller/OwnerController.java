package com.ruralhouses.controller;

import com.ruralhouses.dto.request.LoginRequest;
import com.ruralhouses.dto.request.RegisterOwnerRequest;
import com.ruralhouses.dto.response.ApiResponse;
import com.ruralhouses.entity.Owner;
import com.ruralhouses.service.OwnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owners")
@RequiredArgsConstructor
public class OwnerController {

    private final OwnerService ownerService;

    /**
     * POST /api/owners/register
     * Registra un nuevo propietario en el sistema.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterOwnerRequest request) {
        Owner owner = ownerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Propietario registrado correctamente", owner.getId()));
    }

    /**
     * POST /api/owners/login
     * Autentica a un propietario y devuelve su ID de sesión.
     * (En producción se devolvería un JWT)
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(@Valid @RequestBody LoginRequest request) {
        Owner owner = ownerService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login exitoso", owner.getId()));
    }

    /**
     * GET /api/owners/{id}
     * Obtiene los datos de un propietario por ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Owner>> getById(@PathVariable String id) {
        Owner owner = ownerService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(owner));
    }
}
