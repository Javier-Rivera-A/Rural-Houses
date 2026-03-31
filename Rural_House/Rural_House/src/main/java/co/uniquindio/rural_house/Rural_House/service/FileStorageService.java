package co.uniquindio.rural_house.Rural_House.service;

import co.uniquindio.rural_house.Rural_House.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    private final Path storageLocation;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) throws IOException {
        this.storageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.storageLocation);
    }

    public String store(MultipartFile file) {
        // Validar que no esté vacío
        if (file == null || file.isEmpty()) {
            throw new BusinessException("El archivo de imagen no puede estar vacío");
        }
        // Validar tipo
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BusinessException("Tipo de imagen no permitido. Use JPG, PNG o WEBP");
        }
        // Validar tamaño
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BusinessException("La imagen no puede superar los 5MB");
        }

        String original = file.getOriginalFilename();
        String extension = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf("."))
                : ".jpg";

        String fileName = UUID.randomUUID() + extension;

        try {
            Path target = storageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo guardar la imagen: " + fileName, e);
        }

        return fileName;
    }

    public Path load(String fileName) {
        return storageLocation.resolve(fileName);
    }
}