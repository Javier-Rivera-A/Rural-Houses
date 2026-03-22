package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String userName;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
