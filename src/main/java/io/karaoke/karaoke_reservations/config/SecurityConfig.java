package io.karaoke.karaoke_reservations.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                // Permite acceso público a estas rutas
                .requestMatchers("/", "/index", "/home", "/css/**", "/js/**", "/images/**", "/webjars/**").permitAll()
                .requestMatchers("/register", "/login", "/auth/**").permitAll() 
                .anyRequest().authenticated() //requiere autenticación
            )
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/auth/login") 
                .defaultSuccessUrl("/dashboard")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/auth/logout")
                .logoutSuccessUrl("/")
                .permitAll()
            )
            .csrf(csrf -> csrf.disable()); // Deshabilitar CSRF temporalmente para desarrollo
        
        return http.build();
    }
}