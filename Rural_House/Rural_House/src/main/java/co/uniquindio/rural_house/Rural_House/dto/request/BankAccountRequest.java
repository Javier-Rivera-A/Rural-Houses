package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BankAccountRequest {

    @NotBlank(message = "El número de cuenta es obligatorio")
    @Size(min = 10, message = "El número de cuenta debe tener al menos 10 caracteres")
    private String numberAccount;

    @NotBlank(message = "El banco es obligatorio")
    private String bank;

    @NotBlank(message = "El tipo de cuenta es obligatorio")
    private String accountType;

    private Double mount;
}
