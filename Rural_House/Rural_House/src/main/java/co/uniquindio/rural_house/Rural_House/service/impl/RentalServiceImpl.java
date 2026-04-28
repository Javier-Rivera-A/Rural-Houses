package co.uniquindio.rural_house.Rural_House.service.impl;

import co.uniquindio.rural_house.Rural_House.dto.request.*;
import co.uniquindio.rural_house.Rural_House.dto.response.*;
import co.uniquindio.rural_house.Rural_House.entity.*;
import co.uniquindio.rural_house.Rural_House.entity.enums.*;
import co.uniquindio.rural_house.Rural_House.exception.*;
import co.uniquindio.rural_house.Rural_House.repository.*;
import co.uniquindio.rural_house.Rural_House.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RentalServiceImpl implements RentalService {

    private final RentalRepository rentalRepository;
    private final CustomerRepository customerRepository;
    private final RentalPackageRepository rentalPackageRepository;
    private final PaidRepository paidRepository;
    private final CountryHouseService countryHouseService;
    private final OwnerRepository ownerRepository;

    @Override
    @Transactional
    public RentalResponse makeRental(String customerId, RentalRequest request) {
        CountryHouse house = countryHouseService.getEntityByCode(request.getCountryHouseCode());
        LocalDate checkIn = request.getCheckInDate();
        LocalDate checkOut = checkIn.plusDays(request.getNumberNights());

        TypeRental requestedType = request.getTypeRental();
        boolean isRoomRental = requestedType == TypeRental.ROOMS;

        // Validar que si pide ROOMS, vengan las habitaciones
        if (isRoomRental && (request.getBedroomCodes() == null || request.getBedroomCodes().isEmpty())) {
            throw new BusinessException("Si desea rentar por habitaciones debe indicar los códigos de las habitaciones");
        }

        // Validar que si pide ENTIRE_HOUSE, no mande habitaciones
        if (!isRoomRental && request.getBedroomCodes() != null && !request.getBedroomCodes().isEmpty()) {
            throw new BusinessException("Si desea rentar la casa completa no debe indicar habitaciones específicas");
        }

        // Verificar paquetes disponibles para el período
        List<RentalPackage> packages = findPackagesForPeriod(house.getId(), checkIn, checkOut);
        if (packages.isEmpty()) {
            throw new BusinessException("No hay paquetes de alquiler disponibles para las fechas solicitadas");
        }

        // Verificar que el paquete permita el tipo de renta solicitado
        validateRentalType(packages, requestedType);

        // Verificar disponibilidad sin solapamientos
        List<Rental> overlapping = rentalRepository.findOverlappingRentals(house.getId(), checkIn, checkOut);
        if (!overlapping.isEmpty()) {
            throw new BusinessException(
                    "Las fechas solicitadas no están disponibles. Consulte la disponibilidad antes de reservar.");
        }

        // Calcular precio total
        float totalPrice = calculatePrice(packages, request.getNumberNights(), isRoomRental);

        Customer customer = customerId != null
                ? customerRepository.findById(customerId).orElse(null)
                : null;

        Rental rental = new Rental();
        rental.setRentalCode(generateRentalCode());
        rental.setCheckInDate(checkIn);
        rental.setCheckOutDate(checkOut);
        rental.setNumberNights(request.getNumberNights());
        rental.setState(RentalState.PENDING);
        rental.setContactPhoneNumber(request.getContactPhoneNumber());
        rental.setTotalPrice(totalPrice);
        rental.setCustomer(customer);
        rental.setCountryHouse(house);

        // UML: rentalPlaceId: ArrayList<String>
        if (isRoomRental) {
            List<String> bedroomIds = house.getBedrooms().stream()
                    .filter(b -> request.getBedroomCodes().contains(String.valueOf(b.getBedroomCode())))
                    .map(Bedroom::getId)
                    .collect(Collectors.toList());
            rental.setRentalPlaceId(bedroomIds);
        }

        Rental saved = rentalRepository.save(rental);

        String ownerBankAccount = house.getOwner().getBankAccounts().stream()
                .findFirst().map(BankAccount::getNumberAccount).orElse("No disponible");

        RentalResponse response = toResponse(saved);
        response.setOwnerBankAccount(ownerBankAccount);
        response.setDepositRequired(totalPrice * 0.20f);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public RentalResponse findByCode(String rentalCode) {
        Rental rental = rentalRepository.findByRentalCode(rentalCode)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada: " + rentalCode));
        return toResponse(rental);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalResponse> findByCustomer(String customerId) {
        return rentalRepository.findByCustomer_Id(customerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalResponse> findByCountryHouse(String houseId) {
        return rentalRepository.findByCountryHouse_Id(houseId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void registerPayment(String ownerId, String rentalId, Float amount) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada: " + rentalId));
        verifyOwnerOfRental(ownerId, rental);

        Paid payment = new Paid();
        payment.setPaidDate(LocalDate.now());
        payment.setAmount(amount);
        payment.setPaidState(PaidState.CONFIRMED);
        payment.setRental(rental);
        payment.setRentalId(rental.getId()); // UML: rentalId: String
        paidRepository.save(payment);

        // Si el pago cubre el total → confirmar reserva
        float totalPaid = rental.getPayments().stream()
                .map(Paid::getAmount).reduce(0f, Float::sum) + amount;
        if (totalPaid >= rental.getTotalPrice()) {
            rental.setState(RentalState.CONFIRMED);
            rentalRepository.save(rental);
        }

        // Avisar al propietario de reservas con plazo de pago vencido (> 3 días)
        LocalDate expiryLimit = LocalDate.now().minusDays(3);
        rentalRepository.findExpiredPendingRentals(expiryLimit).stream()
                .filter(r -> r.getCountryHouse().getOwner().getId().equals(ownerId))
                .forEach(r -> {
                    r.setState(RentalState.EXPIRED);
                    rentalRepository.save(r);
                });
    }

    @Override
    @Transactional
    public void cancelRental(String ownerId, String rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada: " + rentalId));
        verifyOwnerOfRental(ownerId, rental);
        rental.setState(RentalState.CANCELLED);
        rentalRepository.save(rental);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalResponse> getExpiredPendingRentals(String ownerId) {
        LocalDate expiryLimit = LocalDate.now().minusDays(3);
        return rentalRepository.findExpiredPendingRentals(expiryLimit).stream()
                .filter(r -> r.getCountryHouse().getOwner().getId().equals(ownerId))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private List<RentalPackage> findPackagesForPeriod(String houseId, LocalDate from, LocalDate to) {
        List<RentalPackage> result = new ArrayList<>();
        LocalDate current = from;
        while (!current.isAfter(to.minusDays(1))) {
            List<RentalPackage> pkgs = rentalPackageRepository.findPackagesForDate(houseId, current);
            if (pkgs.isEmpty()) return Collections.emptyList();
            result.addAll(pkgs);
            current = current.plusDays(1);
        }
        return result;
    }

    private void validateRentalType(List<RentalPackage> packages, TypeRental requestedType) {
        if (requestedType == TypeRental.ENTIRE_HOUSE) {
            boolean allowed = packages.stream().anyMatch(p ->
                    p.getTypeRental() == TypeRental.ENTIRE_HOUSE || p.getTypeRental() == TypeRental.BOTH);
            if (!allowed) {
                throw new BusinessException(
                        "Los paquetes de estas fechas no permiten alquilar la casa completa. " +
                                "Solo se puede alquilar por habitaciones.");
            }
        } else if (requestedType == TypeRental.ROOMS) {
            boolean allowed = packages.stream().anyMatch(p ->
                    p.getTypeRental() == TypeRental.ROOMS || p.getTypeRental() == TypeRental.BOTH);
            if (!allowed) {
                throw new BusinessException(
                        "Los paquetes de estas fechas no permiten alquilar por habitaciones. " +
                                "Solo se puede alquilar la casa completa.");
            }
        }
    }

    private float calculatePrice(List<RentalPackage> packages, int nights, boolean isRoomRental) {
        float pricePerNight = packages.stream()
                .findFirst()
                .map(RentalPackage::getPriceNight)
                .orElse(0f);
        return pricePerNight * nights;
    }

    private String generateRentalCode() {
        return "RES-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 1000);
    }

    private void verifyOwnerOfRental(String ownerId, Rental rental) {
        if (!rental.getCountryHouse().getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedException("No tienes permiso para gestionar esta reserva");
        }
    }

    private RentalResponse toResponse(Rental r) {
        RentalResponse res = new RentalResponse();
        res.setId(r.getId());
        res.setRentalCode(r.getRentalCode());
        res.setRentalDayMade(r.getRentalDayMade());
        res.setCheckInDate(r.getCheckInDate());
        res.setCheckOutDate(r.getCheckOutDate());
        res.setNumberNights(r.getNumberNights());
        res.setState(r.getState());
        res.setContactPhoneNumber(r.getContactPhoneNumber());
        res.setTotalPrice(r.getTotalPrice());
        res.setRentalPlaceId(r.getRentalPlaceId()); // UML: rentalPlaceId
        res.setCountryHouseCode(r.getCountryHouse().getCode());
        if (r.getCustomer() != null) res.setCustomerUserName(r.getCustomer().getUserName());
        return res;
    }


    @Override
    @Transactional
    public RentalResponse cancelRentalByCustomer(String customerId, String rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada: " + rentalId));

        if (rental.getCustomer() == null || !rental.getCustomer().getId().equals(customerId)) {
            throw new UnauthorizedException("No tienes permiso para cancelar esta reserva");
        }

        if (rental.getState() != RentalState.PENDING) {
            throw new BusinessException("Solo se pueden cancelar reservas en estado pendiente");
        }

        rental.setState(RentalState.CANCELLED);

        Rental saved = rentalRepository.save(rental);

        return toResponse(saved);
    }
}
