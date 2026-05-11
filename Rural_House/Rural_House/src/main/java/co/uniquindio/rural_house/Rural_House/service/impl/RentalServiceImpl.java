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
    private final BankAccountRepository bankAccountRepository;
    private final EmailService emailService;


    @Override
    @Transactional
    public RentalResponse makeRental(String customerId, RentalRequest request) {
        CountryHouse house = countryHouseService.getEntityByCode(request.getCountryHouseCode());
        LocalDate checkIn = request.getCheckInDate();
        LocalDate checkOut = checkIn.plusDays(request.getNumberNights());

        boolean isRoomRental = request.getTypeRental() == TypeRental.ROOMS;

        if (isRoomRental && (request.getBedroomCodes() == null || request.getBedroomCodes().isEmpty())) {
            throw new BusinessException("Debe seleccionar al menos una habitación para alquilar por habitaciones.");
        }

        // Verificar paquetes de alquiler para el período
        List<RentalPackage> packages = findPackagesForPeriod(house.getId(), checkIn, checkOut);
        if (packages.isEmpty()) {
            throw new BusinessException("No hay paquetes de alquiler disponibles para las fechas solicitadas");
        }

        // Verificar tipo de alquiler compatible con el paquete
        validateRentalType(packages, isRoomRental);

        // Verificar disponibilidad — sin solapamientos
        List<Rental> overlapping = rentalRepository.findOverlappingRentals(house.getId(), checkIn, checkOut);
        if (!overlapping.isEmpty()) {
            throw new BusinessException(
                "Las fechas solicitadas no están disponibles. Consulte la disponibilidad antes de reservar.");
        }

        // Calcular precio total
        float totalPrice = calculatePrice(packages, request.getNumberNights(), isRoomRental,
                request.getBedroomCodes() != null ? request.getBedroomCodes().size() : 0);

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
        
        // Notificar al cliente sobre la reserva creada
        if (customer != null) {
            float deposit = totalPrice * 0.20f;
            
            sendEmailSafely(
                customer.getEmail(),
                 "Reserva creada - Pendiente de pago",
                 "Su reserva " + saved.getRentalCode() + " fue creada exitosamente.\n\n " +
                 "Estado: PENDIENTE\n" +
                 "Valor total: " + totalPrice + "\n" +
                 "Anitcipo requerido: " + deposit + "\n\n" +
                 "Debe realizar el pago para confirmar la reserva." 
            );
        }

        //Notificar al propietario sobre una nueva reserva
        Owner owner = house.getOwner();
        if (owner != null) {
            
            sendEmailSafely(
                owner.getEmail(),
                "Nueva reserva pendiente",
                "Se ha creado una nueva reserva para su casa.\n\n" +
                "Código: " + saved.getRentalCode() + "\n" +
                "Cliente: " + (saved.getCustomer() != null ? saved.getCustomer().getUserName() : "No disponible") + "\n" +
                "Check-in: " + saved.getCheckInDate() + "\n" +
                "Check-out: " + saved.getCheckOutDate() + "\n" +
                "Valor: " + saved.getTotalPrice() + "\n" +
                "Estado: PENDIENTE DE PAGO"
            );
        }

        List<String> ownerBankAccounts = house.getOwner().getBankAccounts().stream().map(BankAccount::getNumberAccount).toList();

        RentalResponse response = toResponse(saved);
        response.setOwnerBankAccount(ownerBankAccounts);
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
    public void payRental(String customerId, String rentalId, PayRentalRequest request) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada: " + rentalId));
        
        if (rental.getCustomer() == null || !rental.getCustomer().getId().equals(customerId)) {
            throw new UnauthorizedException("No tienes permiso para pagar esta reserva");
        }

        // Estados inválidos
        if (rental.getState() == RentalState.CANCELLED){
            throw new BusinessException("No se puede pagar una reserva CANCELADA");
        }

        if (rental.getState() == RentalState.EXPIRED){
            throw new BusinessException("No se puede pagar una reserva EXPIRADA");
        }

        if (rental.getState() == RentalState.PAID) {
            throw new BusinessException("La reserva ya ha sido pagada");
        }

        // Total pagado hasta la fecha
        float totalPaid = paidRepository.findByRental_Id(rental.getId()).stream().map(Paid::getAmount).reduce(0f, Float::sum);

        // Saldo restante
        float remainingBalance = rental.getTotalPrice() - totalPaid;

        // Evitar sobrepago
        if(request.getAmount() > remainingBalance) {
            throw new BusinessException("El pago excede el saldo restante.\n" + "Saldo pendiente: " + remainingBalance);
        }

        // Obtener cuenta bancaria cliente
        BankAccount customerAccount = bankAccountRepository.findById(request.getCustomerBankAccountId()).orElseThrow(() -> new ResourceNotFoundException("Cuenta bancaria del cliente no encontrada"));

        // Validar que pertenece al cliente
        if (!customerAccount.getUser().getId().equals(customerId)) {
            throw new UnauthorizedException("La cuenta bancaria no pertenece al cliente.");
        }

        // Fondos suficientes
        if (customerAccount.getMount() < request.getAmount()) {
            throw new BusinessException("Fondos insuficientes.");
        }

        // Obtener propiietario
        Owner owner = rental.getCountryHouse().getOwner();


        //Obtener cuenta bancaria del propietario
        BankAccount ownerAccount = bankAccountRepository.findById(request.getOwnerBankAccountId()).orElseThrow(() -> new ResourceNotFoundException("Cuenta bancaria del propieatrio no encontrada."));

        // Valicar que pertenece al propietario
        if (!ownerAccount.getUser().getId().equals(owner.getId())) {
            throw new UnauthorizedException("La cuenta bancaria no pertenece al propietario.");
        }

        // Transferencia bancaria
        customerAccount.setMount(customerAccount.getMount() - request.getAmount());
        ownerAccount.setMount(ownerAccount.getMount() + request.getAmount());
        bankAccountRepository.save(customerAccount);
        bankAccountRepository.save(ownerAccount);

        // Registrar pago
        Paid payment = new Paid();
        payment.setPaidDate(LocalDate.now());
        payment.setAmount(request.getAmount());
        payment.setPaidState(PaidState.CONFIRMED);
        payment.setRental(rental);
        payment.setRentalId(rental.getId());
        payment.setBankAccount(customerAccount);
        paidRepository.save(payment);

        // Recalcular total pagado
        totalPaid += request.getAmount();
        remainingBalance = rental.getTotalPrice() - totalPaid;

        // Anticipo mínimo
        float minimumDeposit = rental.getTotalPrice() * 0.20f;
        
        // Actualizar estado
        if (totalPaid >= rental.getTotalPrice()) {
            rental.setState(RentalState.PAID);
        } else if (totalPaid >= minimumDeposit) {
            rental.setState(RentalState.CONFIRMED);
        }
        rentalRepository.save(rental);

        // Notificación al cliente
        String customerMessage =
                "Su pago de " + request.getAmount() + " fue procesado exitosamente.\n\n" +
                "Total pagado: " + totalPaid + "\n" +
                "Saldo restante: " + remainingBalance + "\n\n";
        if (remainingBalance <= 0) {
            customerMessage += "La reserva ha sido PAGADA COMPLETAMENTE.";
        } else {
            customerMessage += "La reserva está CONFIRMADA.";
        }

        sendEmailSafely(
                rental.getCustomer().getEmail(),
                "Pago procesado - Reserva " +
                        rental.getRentalCode(),
                customerMessage
        );

        //Notificación al propietario
        sendEmailSafely(
                owner.getEmail(),
                "Pago recibido - Reserva " + rental.getRentalCode(),
                "Se recibió un pago de " + request.getAmount() +
                    " para la reserva " + rental.getRentalCode() +
                    ".\n\nSaldo restante: " +
                    remainingBalance
        );

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

        // Notificar pago registrado
        if (rental.getCustomer() != null) {
            sendEmailSafely(
                rental.getCustomer().getEmail(),
                "Pago registrado - Reserva " + rental.getRentalCode(),
                "Se registro un pago de " + amount + " para su reserva."
            );
        }

        // Si el pago cubre el total → confirmar reserva
        float totalPaid = rental.getPayments().stream()
                .map(Paid::getAmount).reduce(0f, Float::sum) + amount;
        if (totalPaid >= rental.getTotalPrice()) {
            rental.setState(RentalState.CONFIRMED);
            rentalRepository.save(rental);

            sendEmailSafely(
                rental.getCustomer().getEmail(),
                "Reserva confirmada",
                "La reserva " + rental.getRentalCode() + " ha sido CONFIRMADA. El pago total fue completado"
            );
        }

        // Avisar al propietario de reservas con plazo de pago vencido (> 3 días)
        LocalDate expiryLimit = LocalDate.now().minusDays(3);
        rentalRepository.findExpiredPendingRentals(expiryLimit).stream()
                .filter(r -> r.getCountryHouse().getOwner().getId().equals(ownerId))
                .forEach(r -> {
                    r.setState(RentalState.EXPIRED);
                    rentalRepository.save(r);

                    if (r.getCustomer() != null) {
                        sendEmailSafely(
                            r.getCustomer().getEmail(), 
                            " Reserva expirada",
                            "La reserva " + r.getRentalCode() +
                            " expiró porque no se realizó el pago dentro del tiempo permitido."
                        );
                    }
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

        if (rental.getCustomer() != null) {
            sendEmailSafely(
                rental.getCustomer().getEmail(),
                "Reserva cancelada",
                "La reserva " +  rental.getRentalCode() + " ha sido CANCELADA por el propietario."
            );
        }
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

    private void validateRentalType(List<RentalPackage> packages, boolean isRoomRental) {
        boolean allowsEntire = packages.stream().anyMatch(p ->
                p.getTypeRental() == TypeRental.ENTIRE_HOUSE || p.getTypeRental() == TypeRental.BOTH);
        boolean allowsRooms = packages.stream().anyMatch(p ->
                p.getTypeRental() == TypeRental.ROOMS || p.getTypeRental() == TypeRental.BOTH);

        if (!isRoomRental && !allowsEntire) {
            throw new BusinessException("Los paquetes de estas fechas no permiten alquilar la casa entera");
        }
        if (isRoomRental && !allowsRooms) {
            throw new BusinessException("Los paquetes de estas fechas no permiten alquilar por habitaciones");
        }
    }

    private float calculatePrice(List<RentalPackage> packages, int nights, boolean isRoomRental, int numberOfRooms) {
        float pricePerNight = (float) packages.stream()
                .mapToDouble(RentalPackage::getPriceNight).average().orElse(0);
        // El precio de la casa entera NO es necesariamente precio/hab × nº hab (enunciado)
        return isRoomRental ? pricePerNight * numberOfRooms * nights : pricePerNight * nights;
    }

    private String generateRentalCode() {
        return "RES-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 1000);
    }

    private void verifyOwnerOfRental(String ownerId, Rental rental) {
        if (!rental.getCountryHouse().getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedException("No tienes permiso para gestionar esta reserva");
        }
    }

    private void sendEmailSafely(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            return;
        }
        try {
            emailService.sendEmail(to, subject, body);
        } catch (Exception e) {
            System.out.println("Error al enviar email: " + e.getMessage());
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
        float totalPrice = r.getTotalPrice();
        res.setTotalPrice(totalPrice);
        res.setRentalPlaceId(r.getRentalPlaceId());
        res.setCountryHouseCode(r.getCountryHouse().getCode());
        if (r.getCustomer() != null) {
            res.setCustomerUserName(r.getCustomer().getUserName());
        }
        float totalPaid = paidRepository.findByRental_Id(r.getId()).stream().map(Paid::getAmount).reduce(0f, Float::sum);
        float remainingBalance = Math.max(totalPrice - totalPaid, 0);
        float depositRequired = totalPrice * 0.20f;
        res.setTotalPaid(totalPaid);
        res.setRemainingBalance(remainingBalance);
        res.setDepositRequired(depositRequired);
        return res;
    }
}
