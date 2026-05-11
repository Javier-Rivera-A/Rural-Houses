package co.uniquindio.rural_house.Rural_House.service.impl;

import co.uniquindio.rural_house.Rural_House.service.EmailService;
import lombok.RequiredArgsConstructor;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Async
    @Override
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            System.out.println("Correo enviado correctamente a: " + to);
        } catch (Exception e) {
            System.out.println("Error enviando correo " + e.getMessage());
        }
    }
}
