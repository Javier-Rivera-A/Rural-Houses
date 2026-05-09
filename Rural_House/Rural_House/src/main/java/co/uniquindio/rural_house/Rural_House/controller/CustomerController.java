package co.uniquindio.rural_house.Rural_House.controller;

import co.uniquindio.rural_house.Rural_House.dto.request.LoginRequest;
import co.uniquindio.rural_house.Rural_House.dto.request.RegisterCustomerRequest;
import co.uniquindio.rural_house.Rural_House.dto.response.ApiResponse;
import co.uniquindio.rural_house.Rural_House.entity.Customer;
import co.uniquindio.rural_house.Rural_House.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    /**
     * POST /api/customers/register
     * Registra un nuevo cliente. Valida formato de email, contraseña segura
     * y verifica que el usuario/email no existan previamente.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterCustomerRequest request) {
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

    //Metodos de actualizacion

    @PutMapping("/{id}/username")
    public ResponseEntity<ApiResponse<String>> updateUserName(@PathVariable String id, @Valid @RequestBody co.uniquindio.rural_house.Rural_House.dto.request.UpdateUserNameRequest request) {
        customerService.updateUserName(id, request.getUserName());
        return ResponseEntity.ok(ApiResponse.ok("Nombre de usuario actualizado correctamente", id));
    }

    @PutMapping("/{id}/email")
    public ResponseEntity<ApiResponse<String>> updateEmail(@PathVariable String id, @Valid @RequestBody co.uniquindio.rural_house.Rural_House.dto.request.UpdateEmailRequest request) {
        customerService.updateEmail(id, request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Email actualizado correctamente", id));
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse<String>> updatePassword(@PathVariable String id, @Valid @RequestBody co.uniquindio.rural_house.Rural_House.dto.request.UpdatePasswordRequest request) {
        customerService.updatePassword(id, request.getPassword());
        return ResponseEntity.ok(ApiResponse.ok("Contraseña actualizada correctamente", id));
    }

    @PutMapping("/{id}/phone")
    public ResponseEntity<ApiResponse<String>> updatePhone(@PathVariable String id, @Valid @RequestBody co.uniquindio.rural_house.Rural_House.dto.request.UpdatePhoneRequest request) {
        customerService.updatePhone(id, request.getPhone());
        return ResponseEntity.ok(ApiResponse.ok("Teléfono actualizado correctamente", id));
    }
}

