package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserNameRequest {
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, max = 30, message = "El nombre de usuario debe tener entre 4 y 30 caracteres")
    @Pattern(
        regexp = "^[a-zA-Z0-9_.-]+$",
        message = "El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos"
    )
    private String userName;
}
