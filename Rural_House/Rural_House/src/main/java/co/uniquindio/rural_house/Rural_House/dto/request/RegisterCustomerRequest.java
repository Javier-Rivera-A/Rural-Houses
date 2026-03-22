package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO para el registro de clientes.
 * A diferencia del propietario, el cliente no tiene accessWord.
 */
@Data
public class RegisterCustomerRequest {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, max = 30, message = "El nombre de usuario debe tener entre 4 y 30 caracteres")
    @Pattern(
        regexp = "^[a-zA-Z0-9_.-]+$",
        message = "El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos"
    )
    private String userName;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$",
        message = "La contraseña debe contener al menos una mayúscula, un número y un carácter especial"
    )
    private String password;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido (ejemplo: usuario@dominio.com)")
    private String email;

    @Pattern(
        regexp = "^\\+?[0-9]{7,15}$",
        message = "El teléfono debe contener entre 7 y 15 dígitos numéricos (puede incluir '+' al inicio)"
    )
    private String phone;
}
