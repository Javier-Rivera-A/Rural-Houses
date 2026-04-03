package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PhotoRequest {
    private String url;
    private String description;
}
