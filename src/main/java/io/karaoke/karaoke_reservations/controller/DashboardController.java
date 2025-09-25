package io.karaoke.karaoke_reservations.controller;

import io.karaoke.karaoke_reservations.domain.User;
import io.karaoke.karaoke_reservations.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final UserService userService;

    @GetMapping("/dashboard")
    public String showDashboard(Model model) {
        try {
            // Obtener el usuario autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user != null) {
                model.addAttribute("user", user);
                log.info("Usuario autenticado: {}", user.getEmail());
            } else {
                log.error("Usuario no encontrado para email: {}", email);
                model.addAttribute("error", "Usuario no encontrado");
                return "redirect:/login?error=user_not_found";
            }
            
        } catch (Exception e) {
            log.error("Error al cargar el dashboard: {}", e.getMessage());
            model.addAttribute("error", "Error al cargar el dashboard");
            return "redirect:/login?error=dashboard_error";
        }
        
        return "dashboard";
    }
}