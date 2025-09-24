package io.karaoke.karaoke_reservations.controller;

import io.karaoke.karaoke_reservations.domain.User;
import io.karaoke.karaoke_reservations.dto.UserRegistrationDTO;
import io.karaoke.karaoke_reservations.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
@Slf4j
public class RegistrationController {

    private final UserService userService;

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        if (!model.containsAttribute("user")) {
            model.addAttribute("user", new UserRegistrationDTO());
        }
        return "register";
    }

    @GetMapping("/api/check-email")
    @ResponseBody
    public boolean checkEmail(@RequestParam String email) {
        return userService.emailExists(email);
    }

    @PostMapping("/register")
    public String registerUser(@Valid @ModelAttribute("user") UserRegistrationDTO userDTO,
            BindingResult result,
            RedirectAttributes redirectAttributes) {

        // Validar que las contraseñas coincidan
        if (userDTO.getPassword() != null && userDTO.getConfirmPassword() != null
                && !userDTO.getPassword().equals(userDTO.getConfirmPassword())) {
            result.rejectValue("confirmPassword", "error.user", "Las contraseñas no coinciden");
        }

        // Validar si el email ya existe
        if (userDTO.getEmail() != null && userService.emailExists(userDTO.getEmail())) {
            result.rejectValue("email", "error.user", "El email ya está registrado");
        }

        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.user", result);
            redirectAttributes.addFlashAttribute("user", userDTO);
            return "redirect:/register";
        }

        try {
            User user = new User();
            user.setFullName(userDTO.getFullName());
            user.setEmail(userDTO.getEmail());
            user.setPhoneNumber(userDTO.getPhoneNumber());
            user.setPassword(userDTO.getPassword());

            User savedUser = userService.registerUser(user);

            redirectAttributes.addFlashAttribute("success",
                    "¡Registro exitoso! Ahora puedes iniciar sesión.");

            return "redirect:/login";

        } catch (Exception e) {
            result.reject("error.global", "Error al registrar usuario: " + e.getMessage());
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.user", result);
            redirectAttributes.addFlashAttribute("user", userDTO);
            return "redirect:/register";
        }
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }
}