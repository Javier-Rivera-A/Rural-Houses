package co.uniquindio.rural_house.Rural_House.controller;

import co.uniquindio.rural_house.Rural_House.dto.request.LoginRequest;
import co.uniquindio.rural_house.Rural_House.dto.request.RegisterOwnerRequest;
import co.uniquindio.rural_house.Rural_House.dto.response.ApiResponse;
import co.uniquindio.rural_house.Rural_House.dto.response.AuthResponse;
import co.uniquindio.rural_house.Rural_House.entity.Owner;
import co.uniquindio.rural_house.Rural_House.service.JwtService;
import co.uniquindio.rural_house.Rural_House.service.OwnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final OwnerService ownerService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(
            @Valid @RequestBody RegisterOwnerRequest request
    ) {
        Owner owner = ownerService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Owner registered successfully", owner.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        Owner owner = ownerService.login(request);
        String token = jwtService.generateToken(owner);

        AuthResponse authResponse = new AuthResponse(
                token,
                "Bearer",
                owner.getId(),
                owner.getUserName()
        );

        return ResponseEntity.ok(
                ApiResponse.ok("Login successful", authResponse)
        );
    }
}