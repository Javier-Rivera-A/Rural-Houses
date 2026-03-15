package com.ruralhouses.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas: registro, login, búsquedas y disponibilidad
                .requestMatchers("/api/owners/register", "/api/owners/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/houses/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                // Resto requiere autenticación (en producción con JWT)
                .anyRequest().permitAll()  // Cambia a .authenticated() al integrar JWT
            )
            .headers(headers -> headers.frameOptions(fo -> fo.disable())); // H2 console

        return http.build();
    }
}
