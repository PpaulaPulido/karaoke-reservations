package io.karaoke.karaoke_reservations.controller;

import io.karaoke.karaoke_reservations.domain.Extra;
import io.karaoke.karaoke_reservations.domain.Reservation;
import io.karaoke.karaoke_reservations.domain.ReservationStatus;
import io.karaoke.karaoke_reservations.domain.User;
import io.karaoke.karaoke_reservations.dto.CreateReservationRequest;
import io.karaoke.karaoke_reservations.dto.ReservationHistoryDTO;
import io.karaoke.karaoke_reservations.service.ExtraService;
import io.karaoke.karaoke_reservations.service.ReservationService;
import io.karaoke.karaoke_reservations.service.RoomService;
import io.karaoke.karaoke_reservations.service.UserService;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
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

    // Endpoint JSON para el calendario
    @GetMapping("/calendar/api")
    @ResponseBody
    public Object getCalendarReservations(Authentication authentication) {
        // Devolver las reservas agrupadas por fecha, filtrando por el usuario autenticado
        try {
            Integer currentUserId = null;
            if (authentication != null) {
                String email = authentication.getName();
                if (email != null) {
                    User user = userService.findByEmail(email);
                    if (user != null) {
                        currentUserId = user.getId();
                    }
                }
            }

            java.util.Map<String, java.util.List<java.util.Map<String, Object>>> byDate = reservationService.getReservationsGroupedByDateForUser(currentUserId);

            java.util.Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("reservationsByDate", byDate);
            return resp;
        } catch (Exception e) {
            e.printStackTrace();
            java.util.Map<String, Object> err = new java.util.HashMap<>();
            err.put("error", "Error cargando reservas: " + e.getMessage());
            return err;
        }
    }

    @GetMapping("/history")
    public String getReservationHistory(
            Authentication authentication,
            @RequestParam(value = "filter", defaultValue = "all") String filter,
            @RequestParam(value = "sort", defaultValue = "date_desc") String sort,
            Model model) {

        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);

            if (user == null) {
                model.addAttribute("error", "Usuario no encontrado");
                model.addAttribute("user", null);
                model.addAttribute("reservations", new ArrayList<ReservationHistoryDTO>());
                model.addAttribute("totalReservations", 0);
                model.addAttribute("completedCount", 0);
                model.addAttribute("cancelledCount", 0);
                model.addAttribute("confirmedCount", 0);
                model.addAttribute("filteredCount", 0);
                model.addAttribute("currentFilter", filter);
                model.addAttribute("currentSort", sort);
                return "reservation-history";
            }

            List<ReservationHistoryDTO> allReservations = reservationService.findReservationHistoryByUser(user.getId());

            // Aplicar filtros
            List<ReservationHistoryDTO> filteredReservations = filterReservationsDTO(allReservations, filter);

            // Aplicar ordenamiento 
            List<ReservationHistoryDTO> sortedReservations = sortReservationsDTO(filteredReservations, sort);

            // Calcular estadísticas usando el nuevo método para DTOs
            long completedCount = countByStatusDTO(allReservations, ReservationStatus.COMPLETED);
            long cancelledCount = countByStatusDTO(allReservations, ReservationStatus.CANCELLED);
            long confirmedCount = countByStatusDTO(allReservations, ReservationStatus.CONFIRMED);

            // Agregar todos los atributos al modelo
            model.addAttribute("reservations", sortedReservations);
            model.addAttribute("user", user);
            model.addAttribute("currentFilter", filter);
            model.addAttribute("currentSort", sort);
            model.addAttribute("totalReservations", allReservations.size());
            model.addAttribute("filteredCount", sortedReservations.size());
            model.addAttribute("completedCount", completedCount);
            model.addAttribute("cancelledCount", cancelledCount);
            model.addAttribute("confirmedCount", confirmedCount);

        } catch (Exception e) {
            e.printStackTrace();

            model.addAttribute("error", "Error al cargar el historial: " + e.getMessage());
            model.addAttribute("user", null);
            model.addAttribute("reservations", new ArrayList<ReservationHistoryDTO>());
            model.addAttribute("totalReservations", 0);
            model.addAttribute("completedCount", 0);
            model.addAttribute("cancelledCount", 0);
            model.addAttribute("confirmedCount", 0);
            model.addAttribute("filteredCount", 0);
            model.addAttribute("currentFilter", "all");
            model.addAttribute("currentSort", "date_desc");
        }

        return "reservation-history";
    }

    // Métodos auxiliares adaptados para DTOs
    private List<ReservationHistoryDTO> filterReservationsDTO(List<ReservationHistoryDTO> reservations, String filter) {
        return reservations.stream()
                .filter(reservation -> {
                    if (reservation == null)
                        return false;

                    switch (filter.toLowerCase()) {
                        case "completed":
                            return reservation.getStatus() == ReservationStatus.COMPLETED;
                        case "cancelled":
                            return reservation.getStatus() == ReservationStatus.CANCELLED;
                        case "confirmed":
                            return reservation.getStatus() == ReservationStatus.CONFIRMED;
                        case "past":
                            if (reservation.getReservationDate() == null)
                                return false;
                            return reservation.getReservationDate().isBefore(LocalDate.now()) ||
                                    (reservation.getReservationDate().equals(LocalDate.now()) &&
                                            reservation.getEndTime() != null &&
                                            reservation.getEndTime().isBefore(LocalTime.now()));
                        case "upcoming":
                            if (reservation.getReservationDate() == null)
                                return false;
                            return reservation.getReservationDate().isAfter(LocalDate.now()) ||
                                    (reservation.getReservationDate().equals(LocalDate.now()) &&
                                            reservation.getStartTime() != null &&
                                            reservation.getStartTime().isAfter(LocalTime.now()));
                        default:
                            return true; // "all"
                    }
                })
                .collect(Collectors.toList());
    }

   
    private List<ReservationHistoryDTO> sortReservationsDTO(List<ReservationHistoryDTO> reservations, String sort) {
        Comparator<ReservationHistoryDTO> comparator;

        switch (sort) {
            case "date_asc":
                comparator = Comparator.comparing(ReservationHistoryDTO::getReservationDate)
                        .thenComparing(ReservationHistoryDTO::getStartTime);
                break;
            case "price_desc":
                comparator = (r1, r2) -> {
                    BigDecimal price1 = r1.getTotalPrice();
                    BigDecimal price2 = r2.getTotalPrice();
                    if (price1 == null && price2 == null)
                        return 0;
                    if (price1 == null)
                        return 1;
                    if (price2 == null)
                        return -1;
                    return price2.compareTo(price1); 
                };
                break;
            case "price_asc":
                comparator = (r1, r2) -> {
                    BigDecimal price1 = r1.getTotalPrice();
                    BigDecimal price2 = r2.getTotalPrice();
                    if (price1 == null && price2 == null)
                        return 0;
                    if (price1 == null)
                        return 1;
                    if (price2 == null)
                        return -1;
                    return price1.compareTo(price2); 
                };
                break;
            case "people_desc":
                comparator = (r1, r2) -> {
                    Integer people1 = r1.getNumberOfPeople();
                    Integer people2 = r2.getNumberOfPeople();
                    if (people1 == null && people2 == null)
                        return 0;
                    if (people1 == null)
                        return 1;
                    if (people2 == null)
                        return -1;
                    return Integer.compare(people2, people1);
                };
                break;
            default: // "date_desc"
                comparator = Comparator.comparing(ReservationHistoryDTO::getReservationDate)
                        .thenComparing(ReservationHistoryDTO::getStartTime)
                        .reversed();
        }

        return reservations.stream()
                .sorted(comparator)
                .collect(Collectors.toList());
    }

    private long countByStatusDTO(List<ReservationHistoryDTO> reservations, ReservationStatus status) {
        return reservations.stream()
                .filter(r -> r != null && r.getStatus() == status)
                .count();
    }
}