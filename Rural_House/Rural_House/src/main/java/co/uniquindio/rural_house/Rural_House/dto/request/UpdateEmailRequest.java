package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateEmailRequest {
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido (ejemplo: usuario@dominio.com)")
    private String email;
}
