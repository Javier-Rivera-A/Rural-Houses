package co.uniquindio.rural_house.Rural_House.service.impl;

import co.uniquindio.rural_house.Rural_House.service.EmailService;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendReservationConfirmedEmail(String to, String rentalCode) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("Reserva confirmada - Rural Houses");
        message.setText(
                "Hola,\n\n" +
                        "Tu reserva con código " + rentalCode + " ha sido confirmada correctamente.\n\n" +
                        "Gracias por usar Rural Houses."
        );

        mailSender.send(message);
    }

    @Override
    public void sendNewReservationNotification(
            String to,
            String rentalCode,
            String houseCode
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);

        message.setSubject("Nueva reserva recibida - Rural Houses");

        message.setText(
                "Hola propietario,\n\n" +
                        "Se ha registrado una nueva reserva.\n\n" +
                        "Código de reserva: " + rentalCode + "\n" +
                        "Casa rural: " + houseCode + "\n\n" +
                        "Ingrese al sistema para revisar la solicitud."
        );

        mailSender.send(message);
    }

    @Override
    public void sendExpiredRentalAlertEmail(String to, String rentalCode) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("Alerta de pago vencido - Rural Houses");
        message.setText(
                "Hola propietario,\n\n" +
                        "La reserva con código " + rentalCode + " tiene el pago vencido.\n\n" +
                        "Han pasado más de 3 días sin que se registre el pago correspondiente.\n" +
                        "Puedes revisar la reserva en el sistema y decidir si deseas cancelarla.\n\n" +
                        "Rural Houses"
        );

        mailSender.send(message);
    }
}