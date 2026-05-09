package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdatePhoneRequest {
    @Pattern(
        regexp = "^\\+?[0-9]{7,15}$",
        message = "El teléfono debe contener entre 7 y 15 dígitos numéricos (puede incluir '+' al inicio)"
    )
    private String phone;
}
