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
public class AdminController {

    private final UserService userService;

    @GetMapping("/admin/dashboard")
    public String showAdminDashboard(Model model) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user != null && user.isAdmin()) {
                model.addAttribute("user", user);
                model.addAttribute("isAdmin", true);
                log.info("Acceso concedido a admin dashboard para: {}", user.getEmail());
                return "admin-dashboard"; // Tu template para admin
            } else {
                log.warn("Intento de acceso no autorizado a admin dashboard: {}", email);
                return "redirect:/dashboard?error=unauthorized";
            }
            
        } catch (Exception e) {
            log.error("Error al cargar admin dashboard: {}", e.getMessage());
            return "redirect:/dashboard?error=admin_error";
        }
    }
}
