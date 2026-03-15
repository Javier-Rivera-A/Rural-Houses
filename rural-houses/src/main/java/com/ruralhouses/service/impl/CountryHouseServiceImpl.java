package com.ruralhouses.service.impl;

import com.ruralhouses.dto.request.*;
import com.ruralhouses.dto.response.*;
import com.ruralhouses.entity.*;
import com.ruralhouses.entity.enums.StateCountryHouse;
import com.ruralhouses.exception.BusinessException;
import com.ruralhouses.exception.ResourceNotFoundException;
import com.ruralhouses.exception.UnauthorizedException;
import com.ruralhouses.repository.*;
import com.ruralhouses.service.CountryHouseService;
import com.ruralhouses.service.OwnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CountryHouseServiceImpl implements CountryHouseService {

    private final CountryHouseRepository countryHouseRepository;
    private final RentalPackageRepository rentalPackageRepository;
    private final PopulationRepository populationRepository;
    private final RentalRepository rentalRepository;
    private final OwnerService ownerService;

    // ─── Operaciones del propietario ───────────────────────────────────────────

    @Override
    @Transactional
    public CountryHouseResponse register(String ownerId, CountryHouseRequest request) {
        validateHouseRules(request);

        if (countryHouseRepository.existsByCode(request.getCode())) {
            throw new BusinessException("El código '" + request.getCode() + "' ya está en uso");
        }

        Owner owner = ownerService.findById(ownerId);
        Population population = findOrCreatePopulation(request.getPopulationName());

        CountryHouse house = new CountryHouse();
        house.setCode(request.getCode());
        house.setDescription(request.getDescription());
        house.setPrivateBathrooms(request.getPrivateBathrooms());
        house.setPublicBathrooms(request.getPublicBathrooms());
        house.setGaragePlaces(request.getGaragePlaces());
        house.setOwner(owner);
        house.setPopulation(population);
        house.setStateCountryHouse(StateCountryHouse.ACTIVE);

        // UML: bedrooms: HashSet<Bedroom>
        for (BedroomRequest br : request.getBedrooms()) {
            Bedroom bedroom = new Bedroom();
            bedroom.setBedroomCode(br.getBedroomCode());
            bedroom.setBathroom(br.getBathroom() != null ? br.getBathroom() : false);
            bedroom.setNumberBeds(br.getNumberBeds());
            bedroom.setTypesOfBeds(br.getTypesOfBeds() != null ? br.getTypesOfBeds() : new ArrayList<>());
            bedroom.setCountryHouse(house);
            house.getBedrooms().add(bedroom);
        }

        // UML: diningRooms: ArrayList<Kitchen>
        for (KitchenRequest kr : request.getDiningRooms()) {
            Kitchen kitchen = new Kitchen();
            kitchen.setIdCocina(kr.getIdCocina() != null ? kr.getIdCocina() : UUID.randomUUID().toString());
            kitchen.setDishWasher(kr.getDishWasher() != null ? kr.getDishWasher() : false);
            kitchen.setWashingMachine(kr.getWashingMachine() != null ? kr.getWashingMachine() : false);
            kitchen.setCountryHouse(house);
            house.getDiningRooms().add(kitchen);
        }

        // UML: photo: ArrayList<Photo>
        if (request.getPhoto() != null) {
            for (PhotoRequest pr : request.getPhoto()) {
                Photo photo = new Photo();
                photo.setUrl(pr.getUrl());
                photo.setDescription(pr.getDescription());
                photo.setCountryHouse(house);
                house.getPhoto().add(photo);
            }
        }

        return toResponse(countryHouseRepository.save(house));
    }

    @Override
    @Transactional
    public CountryHouseResponse update(String ownerId, String houseId, CountryHouseRequest request) {
        verifyOwnership(ownerId, houseId);
        validateHouseRules(request);
        CountryHouse house = getEntityById(houseId);

        house.setDescription(request.getDescription());
        house.setPrivateBathrooms(request.getPrivateBathrooms());
        house.setPublicBathrooms(request.getPublicBathrooms());
        house.setGaragePlaces(request.getGaragePlaces());
        Population population = findOrCreatePopulation(request.getPopulationName());
        house.setPopulation(population);

        return toResponse(countryHouseRepository.save(house));
    }

    @Override
    @Transactional
    public void deactivate(String ownerId, String houseId) {
        verifyOwnership(ownerId, houseId);
        CountryHouse house = getEntityById(houseId);
        house.setStateCountryHouse(StateCountryHouse.DISABLED);
        countryHouseRepository.save(house);
    }

    // ─── Paquetes de alquiler ──────────────────────────────────────────────────

    @Override
    @Transactional
    public RentalPackageResponse addRentalPackage(String ownerId, String houseId, RentalPackageRequest request) {
        verifyOwnership(ownerId, houseId);
        if (request.getStartingDate().isAfter(request.getEndingDate())) {
            throw new BusinessException("La fecha de inicio no puede ser posterior a la de fin");
        }
        CountryHouse house = getEntityById(houseId);

        RentalPackage pkg = new RentalPackage();
        pkg.setStartingDate(request.getStartingDate());
        pkg.setEndingDate(request.getEndingDate());
        pkg.setPriceNight(request.getPriceNight());
        pkg.setTypeRental(request.getTypeRental());
        pkg.setCountryHouse(house);

        return toPackageResponse(rentalPackageRepository.save(pkg));
    }

    @Override
    @Transactional
    public RentalPackageResponse updateRentalPackage(String ownerId, String packageId, RentalPackageRequest request) {
        RentalPackage pkg = rentalPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete no encontrado: " + packageId));
        verifyOwnership(ownerId, pkg.getCountryHouse().getId());
        pkg.setStartingDate(request.getStartingDate());
        pkg.setEndingDate(request.getEndingDate());
        pkg.setPriceNight(request.getPriceNight());
        pkg.setTypeRental(request.getTypeRental());
        return toPackageResponse(rentalPackageRepository.save(pkg));
    }

    @Override
    @Transactional
    public void deleteRentalPackage(String ownerId, String packageId) {
        RentalPackage pkg = rentalPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete no encontrado: " + packageId));
        verifyOwnership(ownerId, pkg.getCountryHouse().getId());
        rentalPackageRepository.delete(pkg);
    }

    // ─── Búsquedas públicas ────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<CountryHouseResponse> findByPopulation(String populationName) {
        return countryHouseRepository.findActiveByPopulationName(populationName)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CountryHouseResponse findByCode(String code) {
        return toResponse(getEntityByCode(code));
    }

    @Override
    @Transactional(readOnly = true)
    public CountryHouseResponse findById(String id) {
        return toResponse(getEntityById(id));
    }

    // ─── Disponibilidad ───────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AvailabilityResponse checkAvailability(String houseCode, LocalDate checkIn, int nights) {
        CountryHouse house = getEntityByCode(houseCode);
        LocalDate checkOut = checkIn.plusDays(nights);

        List<Rental> overlapping = rentalRepository.findOverlappingRentals(house.getId(), checkIn, checkOut);

        AvailabilityResponse response = new AvailabilityResponse();
        response.setCountryHouseCode(houseCode);
        Map<LocalDate, AvailabilityResponse.DayAvailability> daily = new LinkedHashMap<>();

        for (int i = 0; i < nights; i++) {
            LocalDate date = checkIn.plusDays(i);
            AvailabilityResponse.DayAvailability day = new AvailabilityResponse.DayAvailability();

            List<RentalPackage> packages = rentalPackageRepository.findPackagesForDate(house.getId(), date);
            if (packages.isEmpty()) {
                day.setEntireHouseStatus("NOT_AVAILABLE");
                Map<Integer, String> rooms = new HashMap<>();
                house.getBedrooms().forEach(b -> rooms.put(b.getBedroomCode(), "NOT_AVAILABLE"));
                day.setBedroomsStatus(rooms);
            } else {
                boolean houseReserved = overlapping.stream()
                        .anyMatch(r -> !r.getCheckInDate().isAfter(date)
                                && !r.getCheckOutDate().isBefore(date)
                                && r.getRentalPlaceId().isEmpty());

                day.setEntireHouseStatus(houseReserved ? "RESERVED" : "FREE");

                Map<Integer, String> rooms = new HashMap<>();
                for (Bedroom bedroom : house.getBedrooms()) {
                    boolean roomReserved = overlapping.stream()
                            .anyMatch(r -> !r.getCheckInDate().isAfter(date)
                                    && !r.getCheckOutDate().isBefore(date)
                                    && r.getRentalPlaceId().contains(bedroom.getId()));
                    rooms.put(bedroom.getBedroomCode(), roomReserved ? "RESERVED" : "FREE");
                }
                day.setBedroomsStatus(rooms);
            }
            daily.put(date, day);
        }

        response.setDailyAvailability(daily);
        return response;
    }

    // ─── Helpers internos ─────────────────────────────────────────────────────

    @Override
    public CountryHouse getEntityByCode(String code) {
        return countryHouseRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Casa rural no encontrada con código: " + code));
    }

    @Override
    public CountryHouse getEntityById(String id) {
        return countryHouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Casa rural no encontrada con ID: " + id));
    }

    @Override
    public void verifyOwnership(String ownerId, String houseId) {
        CountryHouse house = getEntityById(houseId);
        if (!house.getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedException("No tienes permiso para modificar esta casa rural");
        }
    }

    private Population findOrCreatePopulation(String name) {
        return populationRepository.findByName(name).orElseGet(() -> {
            Population p = new Population();
            p.setName(name);
            return populationRepository.save(p);
        });
    }

    private void validateHouseRules(CountryHouseRequest request) {
        // UML: mínimo 3 habitaciones
        if (request.getBedrooms() == null || request.getBedrooms().size() < 3) {
            throw new BusinessException("La casa rural debe tener al menos 3 habitaciones");
        }
        // UML: mínimo 1 cocina/comedor
        if (request.getDiningRooms() == null || request.getDiningRooms().isEmpty()) {
            throw new BusinessException("La casa rural debe tener al menos 1 cocina");
        }
        // UML: mínimo 2 baños
        int totalBaths = (request.getPrivateBathrooms() != null ? request.getPrivateBathrooms() : 0)
                + (request.getPublicBathrooms() != null ? request.getPublicBathrooms() : 0);
        if (totalBaths < 2) {
            throw new BusinessException("La casa rural debe tener al menos 2 baños");
        }
    }

    // ─── Mapeo entidad → DTO response ─────────────────────────────────────────

    private CountryHouseResponse toResponse(CountryHouse h) {
        CountryHouseResponse r = new CountryHouseResponse();
        r.setId(h.getId());
        r.setCode(h.getCode());
        r.setDescription(h.getDescription());
        r.setPrivateBathrooms(h.getPrivateBathrooms());
        r.setPublicBathrooms(h.getPublicBathrooms());
        r.setGaragePlaces(h.getGaragePlaces());
        r.setStateCountryHouse(h.getStateCountryHouse());
        r.setPopulationName(h.getPopulation().getName());
        r.setOwnerUserName(h.getOwner().getUserName());

        r.setBedrooms(h.getBedrooms().stream().map(b -> {
            BedroomResponse br = new BedroomResponse();
            br.setId(b.getId());
            br.setBedroomCode(b.getBedroomCode());
            br.setBathroom(b.getBathroom());
            br.setNumberBeds(b.getNumberBeds());
            br.setTypesOfBeds(b.getTypesOfBeds());
            return br;
        }).collect(Collectors.toList()));

        // UML: diningRooms: ArrayList<Kitchen>
        r.setDiningRooms(h.getDiningRooms().stream().map(k -> {
            KitchenResponse kr = new KitchenResponse();
            kr.setIdCocina(k.getIdCocina());
            kr.setDishWasher(k.getDishWasher());
            kr.setWashingMachine(k.getWashingMachine());
            return kr;
        }).collect(Collectors.toList()));

        // UML: photo: ArrayList<Photo>
        r.setPhoto(h.getPhoto().stream().map(p -> {
            PhotoResponse pr = new PhotoResponse();
            pr.setId(p.getId());
            pr.setUrl(p.getUrl());
            pr.setDescription(p.getDescription());
            return pr;
        }).collect(Collectors.toList()));

        return r;
    }

    private RentalPackageResponse toPackageResponse(RentalPackage pkg) {
        RentalPackageResponse r = new RentalPackageResponse();
        r.setId(pkg.getId());
        r.setStartingDate(pkg.getStartingDate());
        r.setEndingDate(pkg.getEndingDate());
        r.setPriceNight(pkg.getPriceNight());
        r.setTypeRental(pkg.getTypeRental());
        r.setCountryHouseCode(pkg.getCountryHouse().getCode());
        return r;
    }
}
