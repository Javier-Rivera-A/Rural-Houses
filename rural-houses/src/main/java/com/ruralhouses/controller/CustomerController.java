package com.ruralhouses.controller;

import com.ruralhouses.dto.request.LoginRequest;
import com.ruralhouses.dto.request.RegisterOwnerRequest;
import com.ruralhouses.dto.response.ApiResponse;
import com.ruralhouses.entity.Customer;
import com.ruralhouses.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    /**
     * POST /api/customers/register
     * Registra un nuevo cliente.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterOwnerRequest request) {
        Customer customer = customerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Cliente registrado correctamente", customer.getId()));
    }

    /**
     * POST /api/customers/login
     * Autentica a un cliente.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(@Valid @RequestBody LoginRequest request) {
        Customer customer = customerService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login exitoso", customer.getId()));
    }

    /**
     * GET /api/customers/{id}
     * Obtiene los datos de un cliente.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> getById(@PathVariable String id) {
        Customer customer = customerService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok("Cliente encontrado", customer.getId()));
    }
}
