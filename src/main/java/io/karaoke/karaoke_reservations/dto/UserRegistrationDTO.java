package io.karaoke.karaoke_reservations.dto;

import io.karaoke.karaoke_reservations.validation.ValidEmail;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(exclude = { "password", "confirmPassword" }) // Excluir contraseñas del toString
public class UserRegistrationDTO {

    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    @Pattern(regexp = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]{2,100}$", message = "El nombre solo puede contener letras y espacios")
    private String fullName;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    @ValidEmail(message = "El dominio del email no es válido")
    private String email;

    @Size(max = 20, message = "El número de teléfono no puede exceder 20 caracteres")
    @Pattern(regexp = "^[+]?[0-9\\s\\-\\(\\)]{0,20}$", message = "El formato del teléfono no es válido")
    private String phoneNumber;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 15, message = "La contraseña debe tener entre 8 y 15 caracteres, con un caracter especial")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&.#^-_])[A-Za-z\\d@$!%*?&.#^-_]{8,15}$", message = "La contraseña debe contener al menos una mayúscula, una minúscula y un carácter especial")
    private String password;

    @NotBlank(message = "Debes confirmar la contraseña")
    private String confirmPassword;

    // Constructor por defecto
    public UserRegistrationDTO() {
    }

    // Constructor para testing
    public UserRegistrationDTO(String fullName, String email, String password, String confirmPassword) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.confirmPassword = confirmPassword;
    }
}