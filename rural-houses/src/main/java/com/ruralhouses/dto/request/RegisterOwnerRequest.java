package com.ruralhouses.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterOwnerRequest {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String userName;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    @NotBlank(message = "La palabra de acceso es obligatoria")
    private String accessWord;

    @Email(message = "Email inválido")
    private String email;

    private String phone;
}
