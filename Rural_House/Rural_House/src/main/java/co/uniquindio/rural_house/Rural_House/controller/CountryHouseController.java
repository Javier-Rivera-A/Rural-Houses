package co.uniquindio.rural_house.Rural_House.controller;

import co.uniquindio.rural_house.Rural_House.entity.*;
import co.uniquindio.rural_house.Rural_House.service.*;
import co.uniquindio.rural_house.Rural_House.dto.response.*;
import co.uniquindio.rural_house.Rural_House.dto.request.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/houses")
@RequiredArgsConstructor
public class CountryHouseController {

    private final CountryHouseService countryHouseService;

    // ─── Operaciones del propietario ───────────────────────────────────────────

    /**
     * POST /api/houses?ownerId={id}
     * El propietario da de alta una casa rural.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CountryHouseResponse>> register(
            @RequestParam String ownerId,
            @Valid @RequestBody CountryHouseRequest request) {
        CountryHouseResponse response = countryHouseService.register(ownerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Casa rural registrada", response));
    }

    /**
     * PUT /api/houses/{houseId}?ownerId={id}
     * El propietario actualiza los datos de una casa rural.
     */
    @PutMapping("/{houseId}")
    public ResponseEntity<ApiResponse<CountryHouseResponse>> update(
            @RequestParam String ownerId,
            @PathVariable String houseId,
            @Valid @RequestBody CountryHouseRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.update(ownerId, houseId, request)));
    }

    /**
     * DELETE /api/houses/{houseId}?ownerId={id}
     * El propietario da de baja (desactiva) una casa rural.
     */
    @DeleteMapping("/{houseId}")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            @RequestParam String ownerId,
            @PathVariable String houseId) {
        countryHouseService.deactivate(ownerId, houseId);
        return ResponseEntity.ok(ApiResponse.ok("Casa rural desactivada", null));
    }

    // ─── Paquetes de alquiler ──────────────────────────────────────────────────

    /**
     * POST /api/houses/{houseId}/packages?ownerId={id}
     * El propietario añade un paquete de alquiler.
     */
    @PostMapping("/{houseId}/packages")
    public ResponseEntity<ApiResponse<RentalPackageResponse>> addPackage(
            @RequestParam String ownerId,
            @PathVariable String houseId,
            @Valid @RequestBody RentalPackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(countryHouseService.addRentalPackage(ownerId, houseId, request)));
    }

    /**
     * PUT /api/houses/packages/{packageId}?ownerId={id}
     * El propietario modifica un paquete de alquiler.
     */
    @PutMapping("/packages/{packageId}")
    public ResponseEntity<ApiResponse<RentalPackageResponse>> updatePackage(
            @RequestParam String ownerId,
            @PathVariable String packageId,
            @Valid @RequestBody RentalPackageRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.updateRentalPackage(ownerId, packageId, request)));
    }

    /**
     * DELETE /api/houses/packages/{packageId}?ownerId={id}
     * El propietario elimina un paquete de alquiler.
     */
    @DeleteMapping("/packages/{packageId}")
    public ResponseEntity<ApiResponse<Void>> deletePackage(
            @RequestParam String ownerId,
            @PathVariable String packageId) {
        countryHouseService.deleteRentalPackage(ownerId, packageId);
        return ResponseEntity.ok(ApiResponse.ok("Paquete eliminado", null));
    }

    // ─── Búsquedas públicas ────────────────────────────────────────────────────

    /**
     * GET /api/houses/search?population={nombre}
     * Busca casas rurales por población.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CountryHouseResponse>>> searchByPopulation(
            @RequestParam String population) {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.findByPopulation(population)));
    }

    /**
     * GET /api/houses/code/{code}
     * Obtiene los detalles de una casa rural por su código.
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<CountryHouseResponse>> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.findByCode(code)));
    }

    /**
     * GET /api/houses/{id}
     * Obtiene los detalles de una casa rural por su ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CountryHouseResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.findById(id)));
    }

    // ─── Disponibilidad ───────────────────────────────────────────────────────

    /**
     * GET /api/houses/{code}/availability?checkIn=YYYY-MM-DD&nights=N
     * Consulta la disponibilidad de una casa rural para un período.
     */
    @GetMapping("/{code}/availability")
    public ResponseEntity<ApiResponse<AvailabilityResponse>> checkAvailability(
            @PathVariable String code,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam int nights) {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.checkAvailability(code, checkIn, nights)));
    }
}
