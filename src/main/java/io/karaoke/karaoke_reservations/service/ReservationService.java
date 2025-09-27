package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.Reservation;
import io.karaoke.karaoke_reservations.domain.Room;
import io.karaoke.karaoke_reservations.domain.Extra;
import io.karaoke.karaoke_reservations.repos.ReservationRepository;
import io.karaoke.karaoke_reservations.repos.RoomRepository;
import io.karaoke.karaoke_reservations.repos.ExtraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final ExtraRepository extraRepository;

    private static final int MIN_DURATION = 30; // 30 minutos mínimo
    private static final int MAX_DURATION = 120; // 2 horas máximo
    private static final int MAX_DAYS_ADVANCE = 60; // 2 meses máximo

    // Crear reserva
    public Reservation createReservation(Reservation reservation) {
        validateReservation(reservation);
        calculateTotalPrice(reservation);
        return reservationRepository.save(reservation);
    }

    // Obtener reserva por ID
    public Optional<Reservation> findById(Integer id) {
        return reservationRepository.findById(id);
    }

    // Obtener reservas por usuario
    public List<Reservation> findByUser(Integer userId) {
        return reservationRepository.findByUserId(userId);
    }

    // Obtener reservas por sala
    public List<Reservation> findByRoom(Integer roomId) {
        return reservationRepository.findByRoomId(roomId);
    }

    // Obtener reservas por fecha
    public List<Reservation> findByDate(LocalDate date) {
        return reservationRepository.findByReservationDate(date);
    }

    // Obtener reservas futuras de un usuario
    public List<Reservation> findUpcomingByUser(Integer userId) {
        return reservationRepository.findUpcomingByUser(userId, LocalDate.now(), LocalTime.now());
    }

    // Verificar disponibilidad
    public boolean isRoomAvailable(Integer roomId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Reservation> conflicts = reservationRepository.findConflictingReservations(roomId, date, startTime, endTime);
        return conflicts.isEmpty();
    }

    // Eliminar reserva
    public void deleteReservation(Integer reservationId) {
        if (!reservationRepository.existsById(reservationId)) {
            throw new IllegalArgumentException("Reserva no encontrada");
        }
        reservationRepository.deleteById(reservationId);
    }

    // Validaciones de reserva
    private void validateReservation(Reservation reservation) {
        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(MAX_DAYS_ADVANCE);

        // Validar fecha
        if (reservation.getReservationDate().isBefore(today)) {
            throw new IllegalArgumentException("No se pueden hacer reservas en fechas pasadas");
        }
        if (reservation.getReservationDate().isAfter(maxDate)) {
            throw new IllegalArgumentException("Máximo 2 meses de anticipación");
        }

        // Validar duración
        long duration = ChronoUnit.MINUTES.between(reservation.getStartTime(), reservation.getEndTime());
        if (duration < MIN_DURATION) {
            throw new IllegalArgumentException("Duración mínima: 30 minutos");
        }
        if (duration > MAX_DURATION) {
            throw new IllegalArgumentException("Duración máxima: 2 horas");
        }

        // Validar número de personas
        if (reservation.getNumberOfPeople() < 2 || reservation.getNumberOfPeople() > 15) {
            throw new IllegalArgumentException("Número de personas debe ser entre 2 y 15");
        }

        // Validar sala
        Room room = roomRepository.findById(reservation.getRoom().getId())
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));

        if (!room.getIsAvailable()) {
            throw new IllegalArgumentException("La sala no está disponible");
        }

        if (reservation.getNumberOfPeople() > room.getMaxCapacity()) {
            throw new IllegalArgumentException("La sala no tiene capacidad para " + reservation.getNumberOfPeople() + " personas");
        }

        // Validar conflicto de horarios
        if (!isRoomAvailable(room.getId(), reservation.getReservationDate(), reservation.getStartTime(), reservation.getEndTime())) {
            throw new IllegalArgumentException("La sala no está disponible en el horario seleccionado");
        }
    }

    // Calcular precio total
    private void calculateTotalPrice(Reservation reservation) {
        Room room = reservation.getRoom();
        double hours = reservation.getDurationMinutes() / 60.0;
        BigDecimal roomPrice = BigDecimal.valueOf(room.getPricePerHour() * hours);

        BigDecimal extrasPrice = BigDecimal.ZERO;
        if (reservation.getExtras() != null) {
            for (Extra extra : reservation.getExtras()) {
                extrasPrice = extrasPrice.add(extra.getPrice());
            }
        }

        reservation.setTotalPrice(roomPrice.add(extrasPrice));
    }

    // Método simple para obtener estadísticas
    public long getReservationCount() {
        return reservationRepository.count();
    }

    public long getReservationCountByUser(Integer userId) {
        return reservationRepository.findByUserId(userId).size();
    }
}