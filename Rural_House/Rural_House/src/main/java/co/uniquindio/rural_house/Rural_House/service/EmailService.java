package co.uniquindio.rural_house.Rural_House.service;

public interface EmailService {
    void sendReservationConfirmedEmail(String to, String rentalCode);

    void sendNewReservationNotification(
            String to,
            String rentalCode,
            String houseCode
    );

    void sendExpiredRentalAlertEmail(String to, String rentalCode);
}