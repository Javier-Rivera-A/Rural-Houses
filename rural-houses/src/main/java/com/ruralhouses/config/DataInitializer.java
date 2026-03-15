package com.ruralhouses.config;

import com.ruralhouses.dto.request.*;
import com.ruralhouses.entity.enums.TypeOfBed;
import com.ruralhouses.entity.enums.TypeRental;
import com.ruralhouses.service.CountryHouseService;
import com.ruralhouses.service.OwnerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    @Bean
    @Profile("dev")
    public CommandLineRunner initData(OwnerService ownerService, CountryHouseService houseService) {
        return args -> {
            log.info("=== Cargando datos de prueba ===");

            // Propietario de prueba
            RegisterOwnerRequest ownerReq = new RegisterOwnerRequest();
            ownerReq.setUserName("propietario1");
            ownerReq.setPassword("password123");
            ownerReq.setAccessWord("acceso123");
            ownerReq.setEmail("propietario@test.com");
            ownerReq.setPhone("600123456");

            var owner = ownerService.register(ownerReq);
            log.info("Propietario creado: {} (ID: {})", owner.getUserName(), owner.getId());

            // Casa rural de prueba
            CountryHouseRequest houseReq = new CountryHouseRequest();
            houseReq.setCode("CASA-001");
            houseReq.setDescription("Hermosa casa rural en los Andes colombianos");
            houseReq.setPrivateBathrooms((byte) 2);
            houseReq.setPublicBathrooms((byte) 1);
            houseReq.setGaragePlaces((byte) 2);
            houseReq.setPopulationName("Salento");

            // Habitaciones (UML: bedrooms: HashSet<Bedroom> — mínimo 3)
            BedroomRequest b1 = new BedroomRequest();
            b1.setBedroomCode(1); b1.setBathroom(true);
            b1.setNumberBeds((byte) 1); b1.setTypesOfBeds(List.of(TypeOfBed.DOUBLE));

            BedroomRequest b2 = new BedroomRequest();
            b2.setBedroomCode(2); b2.setBathroom(false);
            b2.setNumberBeds((byte) 2); b2.setTypesOfBeds(List.of(TypeOfBed.SIMPLE, TypeOfBed.SIMPLE));

            BedroomRequest b3 = new BedroomRequest();
            b3.setBedroomCode(3); b3.setBathroom(false);
            b3.setNumberBeds((byte) 1); b3.setTypesOfBeds(List.of(TypeOfBed.SIMPLE));

            houseReq.setBedrooms(List.of(b1, b2, b3));

            // Cocinas/comedores (UML: diningRooms: ArrayList<Kitchen> — mínimo 1)
            KitchenRequest k1 = new KitchenRequest();
            k1.setIdCocina("COC-001");
            k1.setDishWasher(true);
            k1.setWashingMachine(true);
            houseReq.setDiningRooms(List.of(k1));

            // Fotos (UML: photo: ArrayList<Photo>)
            PhotoRequest p1 = new PhotoRequest();
            p1.setUrl("https://example.com/foto1.jpg");
            p1.setDescription("Fachada exterior");
            houseReq.setPhoto(List.of(p1));

            var house = houseService.register(owner.getId(), houseReq);
            log.info("Casa rural creada: {} (ID: {})", house.getCode(), house.getId());

            // Paquete de alquiler — julio por semanas
            RentalPackageRequest pkg = new RentalPackageRequest();
            pkg.setStartingDate(LocalDate.of(2025, 7, 1));
            pkg.setEndingDate(LocalDate.of(2025, 7, 7));
            pkg.setPriceNight(80.0f);
            pkg.setTypeRental(TypeRental.BOTH);
            houseService.addRentalPackage(owner.getId(), house.getId(), pkg);

            log.info("=== Datos de prueba listos ===");
            log.info("H2 Console: http://localhost:8080/h2-console (jdbc:h2:mem:ruraldb / sa / sin password)");
        };
    }
}
