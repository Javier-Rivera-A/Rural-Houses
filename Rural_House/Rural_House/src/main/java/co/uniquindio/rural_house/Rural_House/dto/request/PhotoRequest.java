package co.uniquindio.rural_house.Rural_House.dto.request;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class PhotoRequest {
    private MultipartFile file;
    private String description;
}