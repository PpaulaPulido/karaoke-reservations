package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.User;
import io.karaoke.karaoke_reservations.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public boolean emailExists(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return userRepository.existsByEmailIgnoreCase(email.trim());
    }

    public User registerUser(User user) {
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("El email no puede estar vacío");
        }
        
        user.setEmail(user.getEmail().trim().toLowerCase());
        user.setFullName(user.getFullName().trim());
        
        if (user.getPhoneNumber() != null) {
            user.setPhoneNumber(user.getPhoneNumber().trim());
        }

        if (emailExists(user.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setIsAdmin(false); // Siempre false para registros normales
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElse(null);
    }

    public Optional<User> findById(Integer id) {
        return userRepository.findById(id);
    }

    public List<User> findAllUsers() {
        return userRepository.findByIsAdminFalse();
    }

    public List<User> findAllAdmins() {
        return userRepository.findByIsAdminTrue();
    }

    public User updateUser(Integer userId, User userDetails) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (userDetails.getFullName() != null) {
            existingUser.setFullName(userDetails.getFullName().trim());
        }

        if (userDetails.getPhoneNumber() != null) {
            existingUser.setPhoneNumber(userDetails.getPhoneNumber().trim());
        }

        // El email no se puede cambiar para evitar conflictos
        // El isAdmin solo lo puede cambiar un administrador (se maneja en otro método)

        return userRepository.save(existingUser);
    }

    public void deleteUser(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        userRepository.deleteById(userId);
    }

    // Método solo para administradores
    public User createAdminUser(User user) {
        if (emailExists(user.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        user.setEmail(user.getEmail().trim().toLowerCase());
        user.setFullName(user.getFullName().trim());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setIsAdmin(true);
        
        return userRepository.save(user);
    }

    public boolean isAdmin(Integer userId) {
        return userRepository.findById(userId)
                .map(User::getIsAdmin)
                .orElse(false);
    }
}