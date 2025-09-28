package io.karaoke.karaoke_reservations.controller;

import io.karaoke.karaoke_reservations.domain.Extra;
import io.karaoke.karaoke_reservations.domain.Reservation;
import io.karaoke.karaoke_reservations.domain.User;
import io.karaoke.karaoke_reservations.dto.CreateReservationRequest;
import io.karaoke.karaoke_reservations.service.ExtraService;
import io.karaoke.karaoke_reservations.service.ReservationService;
import io.karaoke.karaoke_reservations.service.RoomService;
import io.karaoke.karaoke_reservations.service.UserService;
import lombok.RequiredArgsConstructor;

import java.util.HashSet;
import java.util.Set;

import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final UserService userService;
    private final RoomService roomService;
    private final ExtraService extraService;

    @GetMapping("/my-reservations")
    public String getUserReservations(Authentication authentication, Model model) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);

        if (user != null) {
            model.addAttribute("reservations", reservationService.findByUser(user.getId()));
            model.addAttribute("user", user);
        }

        return "reservations";
    }

    // Mostrar formulario de nueva reserva
    @GetMapping("/new")
    public String showNewReservationForm(Authentication authentication, Model model) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);

        if (user == null) {
            return "redirect:/login";
        }

        model.addAttribute("user", user);
        return "new-reservation";
    }

    // Procesar creación de reserv
    @PostMapping("/create")
    public String createReservation(@ModelAttribute CreateReservationRequest request,
            Authentication authentication,
            Model model) {
        try {
            // Obtener usuario autenticado
            String email = authentication.getName();
            User user = userService.findByEmail(email);

            if (user == null) {
                model.addAttribute("error", "Usuario no encontrado");
                model.addAttribute("user", userService.findByEmail(authentication.getName()));
                return "new-reservation";
            }

            // Validar campos requeridos
            if (request.getReservationDate() == null || request.getStartTime() == null ||
                    request.getEndTime() == null || request.getNumberOfPeople() == null ||
                    request.getRoomId() == null || request.getTotalPrice() == null) {
                model.addAttribute("error", "Todos los campos obligatorios deben ser completados");
                model.addAttribute("user", user);
                return "new-reservation";
            }

            // Crear entidad Reservation
            Reservation reservation = new Reservation();
            reservation.setReservationDate(request.getReservationDate());
            reservation.setStartTime(request.getStartTime());
            reservation.setEndTime(request.getEndTime());
            reservation.setNumberOfPeople(request.getNumberOfPeople());
            reservation.setTotalPrice(request.getTotalPrice());

            // Establecer relaciones
            reservation.setUser(user);
            reservation.setRoom(roomService.findById(request.getRoomId())
                    .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada")));

            if (request.getExtraIds() != null && !request.getExtraIds().isEmpty()) {
                Set<Extra> extrasSet = new HashSet<>();

                for (Integer extraId : request.getExtraIds()) {
                    Optional<Extra> extraOpt = extraService.findById(extraId);
                    if (extraOpt.isPresent()) {
                        extrasSet.add(extraOpt.get());
                    }
                }

                reservation.setExtras(extrasSet);
            }

            Reservation savedReservation = reservationService.createReservation(reservation);
            return "redirect:/reservations/my-reservations?success=true";

        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            String email = authentication.getName();
            User user = userService.findByEmail(email);

            model.addAttribute("error", e.getMessage());
            model.addAttribute("user", user);
            model.addAttribute("reservationData", request);

            this.loadFormData(model);

            return "new-reservation";

        } catch (Exception e) {
            e.printStackTrace();
            String email = authentication.getName();
            User user = userService.findByEmail(email);

            model.addAttribute("error", "Error al crear la reserva: " + e.getMessage());
            model.addAttribute("user", user);
            model.addAttribute("reservationData", request);
            this.loadFormData(model);

            return "new-reservation";
        }
    }

    private void loadFormData(Model model) {
        // Cargar salas disponibles si es necesario
        model.addAttribute("availableRooms", roomService.findAvailableRooms());
        // Cargar extras si es necesario
        model.addAttribute("extras", extraService.findAll());
    }

    // Cancelar reserva
    @PostMapping("/{id}/cancel")
    public String cancelReservation(@PathVariable Integer id,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        try {
            // Verificar que la reserva pertenece al usuario
            String email = authentication.getName();
            User user = userService.findByEmail(email);

            Reservation reservation = reservationService.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

            if (!reservation.getUser().getId().equals(user.getId())) {
                redirectAttributes.addFlashAttribute("error", "No tienes permiso para cancelar esta reserva");
                return "redirect:/reservations/my-reservations";
            }

            reservationService.cancelReservation(id);
            redirectAttributes.addFlashAttribute("success", "Reserva cancelada exitosamente");

        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }

        return "redirect:/reservations/my-reservations";
    }

    // Completar reserva (para administradores o sistema)
    @PostMapping("/{id}/complete")
    public String completeReservation(@PathVariable Integer id,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        try {
            reservationService.completeReservation(id);
            redirectAttributes.addFlashAttribute("success", "Reserva marcada como completada");

        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }

        return "redirect:/reservations/my-reservations";
    }
}