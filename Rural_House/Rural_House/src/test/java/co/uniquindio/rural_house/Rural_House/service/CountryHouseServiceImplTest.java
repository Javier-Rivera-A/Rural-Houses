package co.uniquindio.rural_house.Rural_House.service;

import co.uniquindio.rural_house.Rural_House.dto.request.PhotoRequest;
import co.uniquindio.rural_house.Rural_House.entity.CountryHouse;
import co.uniquindio.rural_house.Rural_House.entity.Owner;
import co.uniquindio.rural_house.Rural_House.exception.BusinessException;
import co.uniquindio.rural_house.Rural_House.repository.*;
import co.uniquindio.rural_house.Rural_House.service.impl.CountryHouseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import co.uniquindio.rural_house.Rural_House.dto.response.CountryHouseResponse;
import co.uniquindio.rural_house.Rural_House.entity.Population;
import co.uniquindio.rural_house.Rural_House.dto.request.RentalPackageRequest;
import co.uniquindio.rural_house.Rural_House.entity.RentalPackage;
import co.uniquindio.rural_house.Rural_House.entity.enums.TypeRental;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CountryHouseServiceImplTest {

    @Mock
    private CountryHouseRepository countryHouseRepository;

    @Mock
    private RentalPackageRepository rentalPackageRepository;

    @Mock
    private PopulationRepository populationRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private OwnerService ownerService;

    @InjectMocks
    private CountryHouseServiceImpl countryHouseService;

    private CountryHouse dummyHouse;

    @BeforeEach
    void setUp() {
        Owner owner = new Owner();
        owner.setId("owner-123");

        dummyHouse = new CountryHouse();
        dummyHouse.setId("house-123");
        dummyHouse.setOwner(owner);
    }

    @Test
    void addPhoto_withNullUrl_shouldThrowException() {
        // Simulamos que la casa existe y pertenece a owner-123
        when(countryHouseRepository.findById("house-123")).thenReturn(Optional.of(dummyHouse));

        PhotoRequest request = new PhotoRequest();
        request.setUrl(null); // URL nula (vacía)

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            countryHouseService.addPhoto("owner-123", "house-123", request);
        });

        // Verificamos que arrojó nuestro mensaje programado
        assertTrue(exception.getMessage().contains("obligatoria"));
    }

    @Test
    void addPhoto_withInvalidFormat_shouldThrowException() {
        when(countryHouseRepository.findById("house-123")).thenReturn(Optional.of(dummyHouse));

        PhotoRequest request = new PhotoRequest();
        request.setUrl("texto-basura-sin-formato");

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            countryHouseService.addPhoto("owner-123", "house-123", request);
        });

        assertTrue(exception.getMessage().contains("La imagen debe ser una URL web válida"));
    }

    @Test
    void addPhoto_withWebUrlButNoImageExtension_shouldThrowException() {
        when(countryHouseRepository.findById("house-123")).thenReturn(Optional.of(dummyHouse));

        PhotoRequest request = new PhotoRequest();
        request.setUrl("https://www.google.com/search?algo-falso"); // No termina en formato de imagen (.jpg, .png...)

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            countryHouseService.addPhoto("owner-123", "house-123", request);
        });

        assertTrue(exception.getMessage().contains("no parece ser un formato de imagen soportado"));
    }

    @Test
    void addPhoto_withSizeExceedingLimit_shouldThrowException() {
        when(countryHouseRepository.findById("house-123")).thenReturn(Optional.of(dummyHouse));

        PhotoRequest request = new PhotoRequest();
        
        // Creamos una cadena de texto gigante (más de 7 millones de caracteres)
        StringBuilder sb = new StringBuilder();
        sb.append("data:image/png;base64,");
        for (int i = 0; i < 7000005; i++) {
            sb.append("A");
        }
        request.setUrl(sb.toString());

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            countryHouseService.addPhoto("owner-123", "house-123", request);
        });

        assertTrue(exception.getMessage().contains("excede el límite permitido"));
    }

    @Test
    void searchByFilters_withAllNullParams_shouldReturnMappedList() {
        // Preparar
        CountryHouse mockHouse = new CountryHouse();
        mockHouse.setId("house-1");
        mockHouse.setCode("CH-1");
        Population pop = new Population();
        pop.setName("Armenia");
        mockHouse.setPopulation(pop);
        Owner ownerMock = new Owner();
        ownerMock.setId("owner-1");
        ownerMock.setUserName("carlos");
        mockHouse.setOwner(ownerMock);

        when(countryHouseRepository.searchActiveByAdvancedFilters(
            null, null, null, null, null, null, null, null, null, null))
                .thenReturn(List.of(mockHouse));

        // Ejecutar
        List<CountryHouseResponse> results = countryHouseService.searchByFilters(
            null, null, null, null, null, null, null, null, null, null);

        // Verificar
        assertTrue(results.size() == 1);
        assertTrue(results.get(0).getId().equals("house-1"));
        assertTrue(results.get(0).getPopulationName().equals("Armenia"));
        assertTrue(results.get(0).getOwnerUserName().equals("carlos"));
    }

    @Test
    void searchByFilters_withSpecificFilters_shouldCallRepositoryWithFilters() {
        // Preparar
        CountryHouse mockHouse = new CountryHouse();
        mockHouse.setId("house-2");
        mockHouse.setCode("CH-2");
        Population pop = new Population();
        pop.setName("Salento");
        mockHouse.setPopulation(pop);
        Owner ownerMock = new Owner();
        ownerMock.setId("owner-1");
        ownerMock.setUserName("ana");
        mockHouse.setOwner(ownerMock);

        when(countryHouseRepository.searchActiveByAdvancedFilters(
            "Salento", null, 3, null, null, 2, null, null, null, null))
                .thenReturn(List.of(mockHouse));

        // Ejecutar
        List<CountryHouseResponse> results = countryHouseService.searchByFilters(
            "Salento", null, 3, null, null, 2, null, null, null, null);

        // Verificar
        assertTrue(results.size() == 1);
        assertTrue(results.get(0).getId().equals("house-2"));
        assertTrue(results.get(0).getPopulationName().equals("Salento"));
    }

    @Test
    void searchByFilters_whenNoResults_shouldReturnEmptyList() {
        when(countryHouseRepository.searchActiveByAdvancedFilters(
            "Filandia", null, 5, null, null, 3, null, null, null, null))
                .thenReturn(Collections.emptyList());

        // Ejecutar
        List<CountryHouseResponse> results = countryHouseService.searchByFilters(
            "Filandia", null, 5, null, null, 3, null, null, null, null);

        // Verificar
        assertTrue(results.isEmpty());
    }

    @Test
    void findByPopulation_shouldReturnMappedList_whenResultsFound() {
        // Preparar
        CountryHouse mockHouse = new CountryHouse();
        mockHouse.setId("house-pop-1");
        mockHouse.setCode("CH-POP-1");
        Population pop = new Population();
        pop.setName("Bogota");
        mockHouse.setPopulation(pop);
        Owner ownerMock = new Owner();
        ownerMock.setId("owner-test");
        ownerMock.setUserName("pedro");
        mockHouse.setOwner(ownerMock);

        when(countryHouseRepository.findActiveByPopulationName("Bogota"))
                .thenReturn(List.of(mockHouse));

        // Ejecutar
        List<CountryHouseResponse> results = countryHouseService.findByPopulation("Bogota");

        // Verificar
        assertTrue(results.size() == 1);
        assertTrue(results.get(0).getId().equals("house-pop-1"));
        assertTrue(results.get(0).getPopulationName().equals("Bogota"));
    }

    @Test
    void findByPopulation_shouldReturnEmptyList_whenNoResultsFound() {
        // Preparar
        when(countryHouseRepository.findActiveByPopulationName("Medellin"))
                .thenReturn(Collections.emptyList());

        // Ejecutar
        List<CountryHouseResponse> results = countryHouseService.findByPopulation("Medellin");

        // Verificar
        assertTrue(results.isEmpty());
    }

    @Test
    void checkAvailability_shouldThrowException_whenDateInPast() {
        LocalDate pastDate = LocalDate.now().minusDays(1);

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            countryHouseService.checkAvailability("CH-123", pastDate, 3);
        });

        assertTrue(exception.getMessage().contains("no puede ser en el pasado"));
    }

    @Test
    void checkAvailability_shouldThrowException_whenNightsIsZeroOrLess() {
        LocalDate validDate = LocalDate.now().plusDays(2);

        BusinessException exception1 = assertThrows(BusinessException.class, () -> {
            countryHouseService.checkAvailability("CH-123", validDate, 0);
        });
        assertTrue(exception1.getMessage().contains("mayor a 0"));

        BusinessException exception2 = assertThrows(BusinessException.class, () -> {
            countryHouseService.checkAvailability("CH-123", validDate, -2);
        });
        assertTrue(exception2.getMessage().contains("mayor a 0"));
    }

    @Test
    void addRentalPackage_shouldThrowException_whenPackageOverlaps() {
        // Arrange
        String houseId = "house-id";
        String ownerId = "owner-id";
        
        CountryHouse mockHouse = new CountryHouse();
        mockHouse.setId(houseId);
        Owner mockOwner = new Owner();
        mockOwner.setId(ownerId);
        mockHouse.setOwner(mockOwner);

        RentalPackage existingPkg = new RentalPackage();
        existingPkg.setId("pkg-old");
        existingPkg.setStartingDate(LocalDate.now().plusDays(5));
        existingPkg.setEndingDate(LocalDate.now().plusDays(10));
        
        when(countryHouseRepository.findById(houseId)).thenReturn(Optional.of(mockHouse));
        when(rentalPackageRepository.findByCountryHouse_Id(houseId))
                .thenReturn(List.of(existingPkg));

        RentalPackageRequest request = new RentalPackageRequest();
        request.setStartingDate(LocalDate.now().plusDays(8)); // Overlaps
        request.setEndingDate(LocalDate.now().plusDays(15));
        request.setPriceNight(100.0f);
        request.setTypeRental(co.uniquindio.rural_house.Rural_House.entity.enums.TypeRental.ENTIRE_HOUSE);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            countryHouseService.addRentalPackage(ownerId, houseId, request);
        });

        assertTrue(exception.getMessage().contains("se solapa con otro paquete existente"));
    }
}
