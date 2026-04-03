package co.uniquindio.rural_house.Rural_House.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;


    @Data
    public class PhotoRequest {

        @NotBlank(message = "La URL de la foto es obligatoria")
        private String url;

        private String description;
    }
