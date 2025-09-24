package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.User;
import io.karaoke.karaoke_reservations.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return userRepository.existsByEmail(email.trim().toLowerCase());
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

        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
    }
}