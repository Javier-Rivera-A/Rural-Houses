package co.uniquindio.rural_house.Rural_House.service.impl;

import co.uniquindio.rural_house.Rural_House.service.EmailService;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendEmail(String to, String subject, String body) {
        System.out.println("===========================================");
        System.out.println("Enviando email a: " + to);
        System.out.println("Asunto: " + subject);
        System.out.println("Mensaje:\n" + body);
        System.out.println("===========================================");
    }
}
