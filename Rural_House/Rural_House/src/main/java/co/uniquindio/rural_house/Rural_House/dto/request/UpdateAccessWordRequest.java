package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateAccessWordRequest {
    @NotBlank(message = "La palabra de acceso es obligatoria")
    @Size(min = 4, message = "La palabra de acceso debe tener al menos 4 caracteres")
    private String accessWord;
}
