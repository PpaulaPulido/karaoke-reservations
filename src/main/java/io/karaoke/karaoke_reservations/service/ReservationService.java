package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.Reservation;
import io.karaoke.karaoke_reservations.domain.ReservationStatus;
import io.karaoke.karaoke_reservations.domain.Room;
import io.karaoke.karaoke_reservations.repos.ReservationRepository;
import io.karaoke.karaoke_reservations.repos.RoomRepository;
import io.karaoke.karaoke_reservations.repos.ExtraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final ExtraRepository extraRepository;

    private static final int MIN_DURATION = 30;
    private static final int MAX_DURATION = 120;
    private static final int MAX_DAYS_ADVANCE = 60;

    // Crear reserva
    public Reservation createReservation(Reservation reservation) {
        validateReservation(reservation);

        Room room = reservation.getRoom();
        room.setIsAvailable(false);
        roomRepository.save(room);
        Reservation savedReservation = reservationRepository.save(reservation);
        return savedReservation;
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
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty() || !roomOpt.get().getIsAvailable()) {
            return false;
        }

        List<Reservation> conflicts = findConflictingReservationsComplete(roomId, date, startTime, endTime, null);
        return conflicts.isEmpty();
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
        long duration;
        boolean crossesMidnight = reservation.getEndTime().isBefore(reservation.getStartTime());

        if (crossesMidnight) {
            duration = ChronoUnit.MINUTES.between(reservation.getStartTime(), LocalTime.MAX) +
                    ChronoUnit.MINUTES.between(LocalTime.MIN, reservation.getEndTime()) + 1;
        } else {
            // Horario normal
            duration = ChronoUnit.MINUTES.between(reservation.getStartTime(), reservation.getEndTime());
        }

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
            throw new IllegalArgumentException(
                    "La sala no tiene capacidad para " + reservation.getNumberOfPeople() + " personas");
        }

        // Verificar conflictos - EXCLUYENDO la reserva actual si ya tiene ID
        Integer excludeReservationId = reservation.getId(); // Será null para nuevas reservas

        List<Reservation> roomConflicts = findConflictingReservationsComplete(
                room.getId(),
                reservation.getReservationDate(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                excludeReservationId);

        if (!roomConflicts.isEmpty()) {
            throw new IllegalArgumentException("La sala no está disponible en el horario seleccionado");
        }

        // Validar conflictos por usuario
        if (hasUserConflictingReservationsComplete(reservation.getUser().getId(), 
                reservation.getReservationDate(),
                reservation.getStartTime(), 
                reservation.getEndTime(),
                excludeReservationId)) {
            throw new IllegalArgumentException("Ya tienes una reserva CONFIRMED en ese horario");
        }
    }

    // Método para encontrar conflictos de sala (incluye medianoche)
    private List<Reservation> findConflictingReservationsComplete(Integer roomId, LocalDate date,
            LocalTime startTime, LocalTime endTime, Integer excludeReservationId) {
        boolean crossesMidnight = endTime.isBefore(startTime);

        List<Reservation> conflicts;

        if (crossesMidnight) {
            // Caso 1: Reserva que cruza medianoche
            List<Reservation> conflicts1 = reservationRepository.findConflictingReservations(
                    roomId, date, startTime, LocalTime.MAX, excludeReservationId);

            List<Reservation> conflicts2 = reservationRepository.findConflictingReservations(
                    roomId, date.plusDays(1), LocalTime.MIN, endTime, excludeReservationId);

            conflicts = new ArrayList<>();
            conflicts.addAll(conflicts1);
            conflicts.addAll(conflicts2);
        } else {
            // Caso 2: Reserva normal (no cruza medianoche)
            conflicts = reservationRepository.findConflictingReservations(
                    roomId, date, startTime, endTime, excludeReservationId);
        }
        
        return conflicts;
    }

    // Método para validar conflictos por usuario (incluye medianoche)
    private boolean hasUserConflictingReservationsComplete(Integer userId, LocalDate date,
            LocalTime startTime, LocalTime endTime, Integer excludeReservationId) {
        
        boolean crossesMidnight = endTime.isBefore(startTime);
        
        List<Reservation> conflicts;

        if (crossesMidnight) {
            // Caso 1: Reserva que cruza medianoche - verificar en dos partes
            List<Reservation> conflicts1 = reservationRepository.findConflictingReservationsByUserComplete(
                    userId, date, startTime, LocalTime.MAX, excludeReservationId);

            List<Reservation> conflicts2 = reservationRepository.findConflictingReservationsByUserComplete(
                    userId, date.plusDays(1), LocalTime.MIN, endTime, excludeReservationId);

            conflicts = new ArrayList<>();
            conflicts.addAll(conflicts1);
            conflicts.addAll(conflicts2);
        } else {
            // Caso 2: Reserva normal (no cruza medianoche)
            conflicts = reservationRepository.findConflictingReservationsByUserComplete(
                    userId, date, startTime, endTime, excludeReservationId);
        }

        return !conflicts.isEmpty();
    }

    // Método simplificado para uso externo (sin excludeReservationId)
    public boolean hasUserConflictingReservations(Integer userId, LocalDate date, 
            LocalTime startTime, LocalTime endTime) {
        return hasUserConflictingReservationsComplete(userId, date, startTime, endTime, null);
    }

    public void deleteReservation(Integer reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        // Liberar la sala
        Room room = reservation.getRoom();
        room.setIsAvailable(true);
        roomRepository.save(room);

        reservationRepository.deleteById(reservationId);
    }

    // Cancelar reserva
    public void cancelReservation(Integer reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        // Solo permitir cancelar reservas futuras
        if (reservation.getReservationDate().isBefore(LocalDate.now()) ||
                (reservation.getReservationDate().equals(LocalDate.now()) &&
                        reservation.getStartTime().isBefore(LocalTime.now()))) {
            throw new IllegalArgumentException("No se puede cancelar una reserva pasada");
        }

        // Cambiar estado a CANCELLED en lugar de eliminar
        reservation.setStatus(ReservationStatus.CANCELLED);

        // Liberar la sala
        Room room = reservation.getRoom();
        room.setIsAvailable(true);
        roomRepository.save(room);

        reservationRepository.save(reservation); // Guardar el cambio de estado
    }

    // Nuevo método para marcar reserva como completada
    public void completeReservation(Integer reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        // Solo permitir completar reservas pasadas
        if (reservation.getReservationDate().isAfter(LocalDate.now()) ||
                (reservation.getReservationDate().equals(LocalDate.now()) &&
                        reservation.getEndTime().isAfter(LocalTime.now()))) {
            throw new IllegalArgumentException("No se puede completar una reserva futura");
        }

        reservation.setStatus(ReservationStatus.COMPLETED);
        reservationRepository.save(reservation);
    }

    // Método para obtener reservas por estado
    public List<Reservation> findByStatus(ReservationStatus status) {
        return reservationRepository.findByStatus(status);
    }

    public long getReservationCountByUser(Integer userId) {
        return reservationRepository.findByUserId(userId).size();
    }
}