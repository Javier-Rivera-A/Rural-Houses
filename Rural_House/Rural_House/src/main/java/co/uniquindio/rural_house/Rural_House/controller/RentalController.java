package co.uniquindio.rural_house.Rural_House.controller;


import co.uniquindio.rural_house.Rural_House.dto.request.RentalRequest;
import co.uniquindio.rural_house.Rural_House.dto.response.ApiResponse;
import co.uniquindio.rural_house.Rural_House.dto.response.RentalResponse;
import co.uniquindio.rural_house.Rural_House.service.RentalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
public class RentalController {

    private final RentalService rentalService;

    /**
     * POST /api/rentals?customerId={id}
     * Realiza una reserva. Si la reserva no puede hacerse en su totalidad
     * no se realizan reservas parciales.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RentalResponse>> makeRental(
            @RequestParam(required = false) String customerId,
            @Valid @RequestBody RentalRequest request) {
        RentalResponse response = rentalService.makeRental(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        "Reserva creada. Ingrese el 20% (" + response.getDepositRequired() +
                        "€) en la cuenta " + response.getOwnerBankAccount() +
                        " con el concepto: " + response.getRentalCode() +
                        " antes de 3 días. De lo contrario la reserva podrá ser anulada.",
                        response));
    }

    /**
     * GET /api/rentals/{rentalCode}
     * Obtiene los detalles de una reserva por su código.
     */
    @GetMapping("/{rentalCode}")
    public ResponseEntity<ApiResponse<RentalResponse>> getByCode(@PathVariable String rentalCode) {
        return ResponseEntity.ok(ApiResponse.ok(rentalService.findByCode(rentalCode)));
    }

    /**
     * GET /api/rentals/customer/{customerId}
     * Lista todas las reservas de un cliente.
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getByCustomer(@PathVariable String customerId) {
        return ResponseEntity.ok(ApiResponse.ok(rentalService.findByCustomer(customerId)));
    }

    /**
     * GET /api/rentals/house/{houseId}
     * Lista todas las reservas de una casa (vista del propietario).
     */
    @GetMapping("/house/{houseId}")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getByHouse(@PathVariable String houseId) {
        return ResponseEntity.ok(ApiResponse.ok(rentalService.findByCountryHouse(houseId)));
    }

    /**
     * POST /api/rentals/{rentalId}/payment?ownerId={id}&amount={importe}
     * El propietario registra un pago recibido para una reserva.
     * El sistema revisa y avisa de reservas con plazo de pago vencido.
     */
    @PostMapping("/{rentalId}/payment")
    public ResponseEntity<ApiResponse<Void>> registerPayment(
            @PathVariable String rentalId,
            @RequestParam String ownerId,
            @RequestParam Float amount) {
        rentalService.registerPayment(ownerId, rentalId, amount);
        return ResponseEntity.ok(ApiResponse.ok("Pago registrado correctamente", null));
    }

    /**
     * POST /api/rentals/{rentalId}/cancel?ownerId={id}
     * El propietario cancela una reserva (ej. por falta de pago).
     */
    @PostMapping("/{rentalId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelRental(
            @PathVariable String rentalId,
            @RequestParam String ownerId) {
        rentalService.cancelRental(ownerId, rentalId);
        return ResponseEntity.ok(ApiResponse.ok("Reserva cancelada", null));
    }

    /**
     * GET /api/rentals/expired?ownerId={id}
     * Lista las reservas pendientes con plazo de pago vencido (> 3 días).
     */
    @GetMapping("/expired")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getExpiredRentals(@RequestParam String ownerId) {
        return ResponseEntity.ok(ApiResponse.ok(rentalService.getExpiredPendingRentals(ownerId)));
    }
}
