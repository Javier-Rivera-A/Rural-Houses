package co.uniquindio.rural_house.Rural_House.service.impl;


import co.uniquindio.rural_house.Rural_House.dto.request.*;
        import co.uniquindio.rural_house.Rural_House.dto.response.*;
        import co.uniquindio.rural_house.Rural_House.entity.enums.*;
        import co.uniquindio.rural_house.Rural_House.repository.*;
        import co.uniquindio.rural_house.Rural_House.service.*;
        import co.uniquindio.rural_house.Rural_House.entity.*;
        import co.uniquindio.rural_house.Rural_House.exception.*;
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
                validatePhoto(pr);
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

        // Actualizar Habitaciones
        house.getBedrooms().clear();
        for (BedroomRequest br : request.getBedrooms()) {
            Bedroom bedroom = new Bedroom();
            bedroom.setBedroomCode(br.getBedroomCode());
            bedroom.setBathroom(br.getBathroom() != null ? br.getBathroom() : false);
            bedroom.setNumberBeds(br.getNumberBeds());
            bedroom.setTypesOfBeds(br.getTypesOfBeds() != null ? br.getTypesOfBeds() : new ArrayList<>());
            bedroom.setCountryHouse(house);
            house.getBedrooms().add(bedroom);
        }

        // Actualizar Cocinas
        house.getDiningRooms().clear();
        if (request.getDiningRooms() != null) {
            for (KitchenRequest kr : request.getDiningRooms()) {
                Kitchen kitchen = new Kitchen();
                kitchen.setIdCocina(kr.getIdCocina() != null ? kr.getIdCocina() : UUID.randomUUID().toString());
                kitchen.setDishWasher(kr.getDishWasher() != null ? kr.getDishWasher() : false);
                kitchen.setWashingMachine(kr.getWashingMachine() != null ? kr.getWashingMachine() : false);
                kitchen.setCountryHouse(house);
                house.getDiningRooms().add(kitchen);
            }
        }

        // Actualizar Fotos
        house.getPhoto().clear();
        if (request.getPhoto() != null) {
            for (PhotoRequest pr : request.getPhoto()) {
                validatePhoto(pr);
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
    public void deactivate(String ownerId, String houseId) {
        verifyOwnership(ownerId, houseId);
        CountryHouse house = getEntityById(houseId);
        house.setStateCountryHouse(StateCountryHouse.DISABLED);
        countryHouseRepository.save(house);
    }

    @Override
    @Transactional
    public void reactivate(String ownerId, String houseId){
        verifyOwnership(ownerId, houseId);
        CountryHouse house = getEntityById(houseId);
        house.setStateCountryHouse(StateCountryHouse.ACTIVE);
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
        
        validatePackageNoOverlap(houseId, null, request.getStartingDate(), request.getEndingDate());

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
        
        if (request.getStartingDate().isAfter(request.getEndingDate())) {
            throw new BusinessException("La fecha de inicio no puede ser posterior a la de fin");
        }
        
        validatePackageNoOverlap(pkg.getCountryHouse().getId(), packageId, request.getStartingDate(), request.getEndingDate());

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
    public List<CountryHouseResponse> searchByFilters(
        String populationName, 
        String code,
        Integer minBedrooms, 
        Integer minBathrooms,
        Integer minKitchens,
        Integer minGaragePlaces,
        Boolean hasPrivateBathroom,
        Boolean hasDishwasher,
        Boolean hasWashingMachine,
        String bedTypeStr) {

        TypeOfBed bedTypeEnum = null;
        if (bedTypeStr != null && !bedTypeStr.isBlank() && !bedTypeStr.equalsIgnoreCase("todas")) {
            if (bedTypeStr.equalsIgnoreCase("simples") || bedTypeStr.equalsIgnoreCase("simple")) {
                bedTypeEnum = TypeOfBed.SIMPLE;
            } else if (bedTypeStr.equalsIgnoreCase("dobles") || bedTypeStr.equalsIgnoreCase("double")) {
                bedTypeEnum = TypeOfBed.DOUBLE;
            }
        }

        return countryHouseRepository.searchActiveByAdvancedFilters(
            populationName, code, minBedrooms, minBathrooms, minKitchens, minGaragePlaces, 
            hasPrivateBathroom, hasDishwasher, hasWashingMachine, bedTypeEnum)
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

    @Override
    @Transactional(readOnly = true)
    public List<CountryHouseResponse> findAll(){
        return countryHouseRepository.findAllActive()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CountryHouseResponse> findByOwner(String ownerId) {
        return countryHouseRepository.findByOwner_Id(ownerId)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─── Disponibilidad ───────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AvailabilityResponse checkAvailability(String houseCode, LocalDate checkIn, int nights) {
        
        if (checkIn == null) {
            throw new BusinessException("La fecha de ingreso (checkIn) es obligatoria");
        }
        if (checkIn.isBefore(LocalDate.now())) {
            throw new BusinessException("La fecha de ingreso no puede ser en el pasado");
        }
        if (nights <= 0) {
            throw new BusinessException("El número de noches debe ser mayor a 0");
        }

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
        // Mínimo 3 habitaciones
        if (request.getBedrooms() == null || request.getBedrooms().size() < 3) {
            throw new BusinessException("La casa rural debe tener al menos 3 habitaciones");
        }

        // Mínimo 1 cocina
        if (request.getDiningRooms() == null || request.getDiningRooms().isEmpty()) {
            throw new BusinessException("La casa rural debe tener al menos 1 cocina");
        }

        // Mínimo 2 baños
        int totalBaths = (request.getPrivateBathrooms() != null ? request.getPrivateBathrooms() : 0)
                + (request.getPublicBathrooms() != null ? request.getPublicBathrooms() : 0);

        if (totalBaths < 2) {
            throw new BusinessException("La casa rural debe tener al menos 2 baños");
        }

        //código único de habitaciones
        Set<Integer> bedroomCodes = new HashSet<>();

        for (BedroomRequest bedroom : request.getBedrooms()) {
            if (bedroom.getBedroomCode() == null) {
                throw new BusinessException("Cada habitación debe tener un código");
            }

            if (!bedroomCodes.add(bedroom.getBedroomCode())) {
                throw new BusinessException(
                        "El código de habitación '" + bedroom.getBedroomCode() + "' está repetido"
                );
            }
        }
    }

    private void validatePackageNoOverlap(String houseId, String packageIdToExclude, LocalDate newStart, LocalDate newEnd) {
        List<RentalPackage> existingPackages = rentalPackageRepository.findByCountryHouse_Id(houseId);
        for (RentalPackage p : existingPackages) {
            if (packageIdToExclude != null && p.getId().equals(packageIdToExclude)) {
                continue;
            }
            if (!newStart.isAfter(p.getEndingDate()) && !newEnd.isBefore(p.getStartingDate())) {
                throw new BusinessException("El paquete se solapa con otro paquete existente (" + p.getStartingDate() + " a " + p.getEndingDate() + ")");
            }
        }
    }

    private void validatePhoto(PhotoRequest request) {
        String url = request.getUrl();
        if (url == null || url.isBlank()) {
            throw new BusinessException("La URL de la imagen es obligatoria");
        }
        
        if (url.length() > 7000000) {
            throw new BusinessException("El tamaño de la imagen excede el límite permitido (aprox. 5MB)");
        }

        String lowerUrl = url.toLowerCase();
        boolean isWebLink = lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://");
        boolean isBase64 = lowerUrl.startsWith("data:image/");
        
        if (!isWebLink && !isBase64) {
            throw new BusinessException("La imagen debe ser una URL web válida (http/https) o una cadena Base64 (data:image/...)");
        }
        
        if (isWebLink) {
            boolean hasValidExtension = lowerUrl.contains(".jpg") || lowerUrl.contains(".jpeg") || 
            lowerUrl.contains(".png") || lowerUrl.contains(".webp") || lowerUrl.contains(".gif") || 
            lowerUrl.contains("unsplash") || lowerUrl.contains("image");
            
            if (!hasValidExtension) {
                // Warning rather than exception, as some modern APIs don't expose extension
                // But to strictly cover the validation requirement:
                throw new BusinessException("La URL provista no parece ser un formato de imagen soportado (.jpg, .png, .webp)");
            }
        }
    }

    private boolean isHouseAvailable(CountryHouse house, LocalDate checkIn, int nights) {
        LocalDate checkOut = checkIn.plusDays(nights);

        List<Rental> overlapping = rentalRepository.findOverlappingRentals(house.getId(), checkIn, checkOut);

        for (int i = 0; i < nights; i++) {
            LocalDate date = checkIn.plusDays(i);

            // Debe existir al menos un paquete para esa fecha
            List<RentalPackage> packages = rentalPackageRepository.findPackagesForDate(house.getId(), date);
            if (packages.isEmpty()) {
                return false;
            }

            // La casa completa no debe estar reservada para esa fecha
            boolean houseReserved = overlapping.stream()
                    .anyMatch(r -> !r.getCheckInDate().isAfter(date)
                            && !r.getCheckOutDate().isBefore(date)
                            && r.getRentalPlaceId().isEmpty());

            if (houseReserved) {
                return false;
            }
        }

        return true;
    }

    private int similarityScore(CountryHouse original, CountryHouse candidate) {
        int score = 0;

        int originalBedrooms = original.getBedrooms() != null ? original.getBedrooms().size() : 0;
        int candidateBedrooms = candidate.getBedrooms() != null ? candidate.getBedrooms().size() : 0;
        int bedroomsDiff = Math.abs(originalBedrooms - candidateBedrooms);

        int originalBathrooms = (original.getPrivateBathrooms() != null ? original.getPrivateBathrooms() : 0)
                + (original.getPublicBathrooms() != null ? original.getPublicBathrooms() : 0);

        int candidateBathrooms = (candidate.getPrivateBathrooms() != null ? candidate.getPrivateBathrooms() : 0)
                + (candidate.getPublicBathrooms() != null ? candidate.getPublicBathrooms() : 0);

        int bathroomsDiff = Math.abs(originalBathrooms - candidateBathrooms);

        int originalGarage = original.getGaragePlaces() != null ? original.getGaragePlaces() : 0;
        int candidateGarage = candidate.getGaragePlaces() != null ? candidate.getGaragePlaces() : 0;
        int garageDiff = Math.abs(originalGarage - candidateGarage);

        int originalKitchens = original.getDiningRooms() != null ? original.getDiningRooms().size() : 0;
        int candidateKitchens = candidate.getDiningRooms() != null ? candidate.getDiningRooms().size() : 0;
        int kitchensDiff = Math.abs(originalKitchens - candidateKitchens);

        // Más peso a habitaciones y baños
        score += Math.max(0, 10 - bedroomsDiff * 3);
        score += Math.max(0, 8 - bathroomsDiff * 2);
        score += Math.max(0, 4 - garageDiff);
        score += Math.max(0, 3 - kitchensDiff);

        return score;
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

    //Fotos
    @Override
    @Transactional
    public PhotoResponse addPhoto(String ownerId, String houseId, PhotoRequest request) {
        verifyOwnership(ownerId, houseId);
        validatePhoto(request);

        CountryHouse house = getEntityById(houseId);

        Photo photo = new Photo();
        photo.setUrl(request.getUrl());
        photo.setDescription(request.getDescription());
        photo.setCountryHouse(house);

        house.getPhoto().add(photo);

        CountryHouse savedHouse = countryHouseRepository.save(house);

        Photo savedPhoto = savedHouse.getPhoto()
                .get(savedHouse.getPhoto().size() - 1);

        PhotoResponse response = new PhotoResponse();
        response.setId(savedPhoto.getId());
        response.setUrl(savedPhoto.getUrl());
        response.setDescription(savedPhoto.getDescription());

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CountryHouseResponse> suggestAlternatives(String houseCode, LocalDate checkIn, int nights) {
        CountryHouse originalHouse = getEntityByCode(houseCode);

        // Si la casa original sí está disponible, no sugerimos alternativas
        if (isHouseAvailable(originalHouse, checkIn, nights)) {
            return Collections.emptyList();
        }

        List<CountryHouse> candidates = countryHouseRepository
                .findActiveByPopulationName(originalHouse.getPopulation().getName())
                .stream()
                .filter(house -> !house.getId().equals(originalHouse.getId()))
                .filter(house -> isHouseAvailable(house, checkIn, nights))
                .sorted(Comparator.comparingInt((CountryHouse house) -> similarityScore(originalHouse, house)).reversed())
                .limit(5)
                .toList();

        return candidates.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalPackageResponse> getRentalPackagesByHouse(String houseId) {
        CountryHouse house = getEntityById(houseId);

        return rentalPackageRepository.findByCountryHouse_Id(house.getId())
                .stream()
                .map(this::toPackageResponse)
                .collect(Collectors.toList());
    }
}
