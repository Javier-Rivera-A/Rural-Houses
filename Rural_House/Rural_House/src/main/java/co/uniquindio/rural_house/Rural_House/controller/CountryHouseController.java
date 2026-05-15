package co.uniquindio.rural_house.Rural_House.controller;

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

    /**
    * PUT /api/houses/{houseId}/reactivate?ownerId={id}
    * El propietario reactiva una casa rural desactivada.
    */
    @PutMapping("/{houseId}/reactivate")
    public ResponseEntity<ApiResponse<Void>> reactivate(
            @RequestParam String ownerId,
            @PathVariable String houseId) {
        countryHouseService.reactivate(ownerId, houseId);
        return ResponseEntity.ok(ApiResponse.ok("Casa rural reactivada", null));
    }

    // ─── Paquetes de alquiler ──────────────────────────────────────────────────

    /**
     * POST /api/houses/{houseId}/packages?ownerId={id}
     * El propietario añade un paquete de alquiler con rango de fechas, precios y tipo.
     * 
     * @param ownerId (QueryParam) ID del propietario.
     * @param houseId (PathVariable) ID de la casa rural.
     * @param request Carga del paquete (RentalPackageRequest) a crear enviada en JSON.
     * 
     * @return ApiResponse con detalles del paquete creado RentalPackageResponse.
     * 
     * Excepciones posibles para FrontEnd:
     * - "La fecha de inicio no puede ser posterior a la de fin"
     * - "El paquete se solapa con otro paquete existente (YYYY-MM-DD a YYYY-MM-DD)"
     */
    @PostMapping("/{houseId}/packages")
    public ResponseEntity<ApiResponse<RentalPackageResponse>> addPackage(
            @RequestParam String ownerId,
            @PathVariable String houseId,
            @Valid @RequestBody RentalPackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Paquete de alquiler añadido", countryHouseService.addRentalPackage(ownerId, houseId, request)));
    }

    /**
     * PUT /api/houses/packages/{packageId}?ownerId={id}
     * El propietario modifica un paquete de alquiler.
     * 
     * Funciona idénticamente a la creación pero con el ID del paquete, y se validarán
     * de la misma forma solapamientos o cruce de fechas erróneas.
     * 
     * @param ownerId (QueryParam) ID del propietario.
     * @param packageId (PathVariable) ID del paquete a editar.
     */
    @PutMapping("/packages/{packageId}")
    public ResponseEntity<ApiResponse<RentalPackageResponse>> updatePackage(
            @RequestParam String ownerId,
            @PathVariable String packageId,
            @Valid @RequestBody RentalPackageRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Paquete de alquiler actualizado", countryHouseService.updateRentalPackage(ownerId, packageId, request)));
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

    // ─── Búsquedas públicas 

    /**
     * GET /api/houses/search?population={nombre}&minBedrooms={num}&minGaragePlaces={num}
     * Busca casas rurales extendiendo la búsqueda básica, filtrando por población, número de habitaciones y plazas de garaje.
     *
     * @param population      (Opcional) Nombre de la población a buscar.
     * @param minBedrooms     (Opcional) Cantidad mínima de habitaciones deseadas.
     * @param minGaragePlaces (Opcional) Cantidad mínima de plazas de garaje deseadas.
     * 
     * @return ApiResponse con una lista de CountryHouseResponse con las casas que cumplen los criterios.
     *
     * Uso en el FrontEnd: 
     * En el servicio de React/Angular/Vue, realizar una petición GET a la ruta '/api/houses/search', añadiendo
     * los filtros como parámetros de consulta (query params). Se pueden omitir los que el usuario no seleccione.
     * 
     * Ejemplo con Axios: 
     * axios.get('/api/houses/search', { params: { population: 'Armenia', minBedrooms: 3, minGaragePlaces: 1 } })
     * 
     * El objeto regresado es: 
     * { "message": "OK", "data": [ { "id": "...", "code": "...", "privateBathrooms": 2, ... } ] }
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CountryHouseResponse>>> searchHouses(
            @RequestParam(required = false) String population,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer minBathrooms,
            @RequestParam(required = false) Integer minKitchens,
            @RequestParam(required = false) Integer minGaragePlaces,
            @RequestParam(required = false) Boolean hasPrivateBathroom,
            @RequestParam(required = false) Boolean hasDishwasher,
            @RequestParam(required = false) Boolean hasWashingMachine,
            @RequestParam(required = false) String bedType) {
        return ResponseEntity.ok(ApiResponse.ok("Búsqueda combinada completada", 
            countryHouseService.searchByFilters(
                population, code, minBedrooms, minBathrooms, minKitchens, minGaragePlaces, 
                hasPrivateBathroom, hasDishwasher, hasWashingMachine, bedType)));
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

    /**
     * GET /api/houses
     * Lista todas las casas rurales activas (homepage).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CountryHouseResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.findAll()));
    }

    /**
     * GET /api/houses/owner/{ownerId}
     * Lista todas las casas de un propietario (activas e inactivas).
     */
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<CountryHouseResponse>>> getByOwner(
            @PathVariable String ownerId) {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.findByOwner(ownerId)));
    }

    // ─── Disponibilidad ───────────────────────────────────────────────────────

    /**
     * GET /api/houses/{code}/availability?checkIn=YYYY-MM-DD&nights=N
     * Consulta la disponibilidad de una casa rural para un período específico (Rango de fechas).
     * 
     * @param code    Código único de la casa (PathVariable). Ej: "C-001"
     * @param checkIn Fecha de ingreso (QueryParam) en formato ISO (YYYY-MM-DD). No puede ser en el pasado.
     * @param nights  Número de noches (QueryParam). Debe ser mayor a 0.
     * 
     * @return ApiResponse con un AvailabilityResponse que contiene el estado global y por habitación para cada día.
     * 
     * Uso en el FrontEnd (Selector de fechas):
     * Tras seleccionar la fecha de inicio en el calendario y calcular la cantidad de noches (o ingresar la fecha de salida y calcular las noches),
     * realizar la petición GET enviando esos datos numéricos y de fecha estructurada.
     * 
     * Ejemplo Axios (Buscando 3 noches desde el 1 de Diciembre de 2026):
     * axios.get('/api/houses/CHI-001/availability', { params: { checkIn: '2026-12-01', nights: 3 } })
     * 
     * Excepciones esperables para atrapar en Frontend:
     * - 400 Bad Request: "La fecha de ingreso no puede ser en el pasado"
     * - 400 Bad Request: "El número de noches debe ser mayor a 0"
     */
    @GetMapping("/{code}/availability")
    public ResponseEntity<ApiResponse<AvailabilityResponse>> checkAvailability(
            @PathVariable String code,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam int nights) {
        return ResponseEntity.ok(ApiResponse.ok(countryHouseService.checkAvailability(code, checkIn, nights)));
    }

    //Fotos
    @PostMapping("/{houseId}/photos")
    public ResponseEntity<ApiResponse<PhotoResponse>> addPhoto(
            @RequestParam String ownerId,
            @PathVariable String houseId,
            @Valid @RequestBody PhotoRequest request) {

        PhotoResponse response = countryHouseService.addPhoto(ownerId, houseId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Imagen agregada correctamente", response));
    }

    /**
     /**
     * GET /api/houses/{houseId}/occupancy?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * Retorna el porcentaje de ocupación de una casa en un período determinado.
     */
    @GetMapping("/{houseId}/occupancy")
    public ResponseEntity<ApiResponse<OccupancyResponse>> getOccupancy(
            @PathVariable String houseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        OccupancyResponse response = countryHouseService.getOccupancyRate(houseId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok("Ocupación calculada correctamente", response));
    }
    @GetMapping("/{code}/suggestions")
    public ResponseEntity<ApiResponse<List<CountryHouseResponse>>> suggestAlternatives(
            @PathVariable String code,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam int nights) {

        List<CountryHouseResponse> response = countryHouseService.suggestAlternatives(code, checkIn, nights);

        return ResponseEntity.ok(
                ApiResponse.ok("Sugerencias obtenidas correctamente", response)
        );
    }

    @GetMapping("/{houseId}/packages")
    public ResponseEntity<ApiResponse<List<RentalPackageResponse>>> getPackagesByHouse(
            @PathVariable String houseId) {

        List<RentalPackageResponse> response = countryHouseService.getRentalPackagesByHouse(houseId);

        return ResponseEntity.ok(
                ApiResponse.ok("Paquetes obtenidos correctamente", response)
        );
    }
}
