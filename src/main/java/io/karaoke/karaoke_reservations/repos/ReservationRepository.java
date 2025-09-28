package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Reservation;
import io.karaoke.karaoke_reservations.domain.ReservationStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

       // Reservas por usuario
       List<Reservation> findByUserId(Integer userId);

       // Reservas por sala
       List<Reservation> findByRoomId(Integer roomId);

       // Reservas por fecha
       List<Reservation> findByReservationDate(LocalDate date);

       // Reservas entre fechas
       List<Reservation> findByReservationDateBetween(LocalDate startDate, LocalDate endDate);

       // Reservas por estado
       List<Reservation> findByStatus(ReservationStatus status);

       // En ReservationRepository
       List<Reservation> findByRoomIdAndReservationDate(Integer roomId, LocalDate reservationDate);

       // Verificar disponibilidad de sala (reservas que se solapan)
       @Query("SELECT r FROM Reservation r WHERE r.room.id = :roomId AND r.reservationDate = :date " +
                     "AND r.status != io.karaoke.karaoke_reservations.domain.ReservationStatus.CANCELLED " +
                     "AND (" +
                     // Caso 1: Reserva normal (no cruza medianoche)
                     "(r.startTime <= r.endTime AND :startTime <= :endTime AND r.startTime < :endTime AND r.endTime > :startTime) "
                     +
                     "OR " +
                     // Caso 2: Reserva existente cruza medianoche, nueva reserva no cruza
                     "(r.startTime > r.endTime AND :startTime <= :endTime AND (r.startTime < :endTime OR r.endTime > :startTime)) "
                     +
                     "OR " +
                     // Caso 3: Nueva reserva cruza medianoche, reserva existente no cruza
                     "(r.startTime <= r.endTime AND :startTime > :endTime AND (r.startTime < :endTime OR r.endTime > :startTime)) "
                     +
                     "OR " +
                     // Caso 4: Ambas reservas cruzan medianoche
                     "(r.startTime > r.endTime AND :startTime > :endTime)" +
                     ") " +
                     "AND (:excludeReservationId IS NULL OR r.id != :excludeReservationId)")
       List<Reservation> findConflictingReservations(
                     @Param("roomId") Integer roomId,
                     @Param("date") LocalDate date,
                     @Param("startTime") LocalTime startTime,
                     @Param("endTime") LocalTime endTime,
                     @Param("excludeReservationId") Integer excludeReservationId);

       // Método para validar conflictos por usuario (incluye medianoche y
       // excluye CANCELLED)
       @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND r.reservationDate = :date " +
                     "AND r.status != io.karaoke.karaoke_reservations.domain.ReservationStatus.CANCELLED " +
                     "AND (" +
                     // Caso 1: Reserva normal (no cruza medianoche)
                     "(r.startTime <= r.endTime AND :startTime <= :endTime AND r.startTime < :endTime AND r.endTime > :startTime) "
                     +
                     "OR " +
                     // Caso 2: Reserva existente cruza medianoche, nueva reserva no cruza
                     "(r.startTime > r.endTime AND :startTime <= :endTime AND (r.startTime < :endTime OR r.endTime > :startTime)) "
                     +
                     "OR " +
                     // Caso 3: Nueva reserva cruza medianoche, reserva existente no cruza
                     "(r.startTime <= r.endTime AND :startTime > :endTime AND (r.startTime < :endTime OR r.endTime > :startTime)) "
                     +
                     "OR " +
                     // Caso 4: Ambas reservas cruzan medianoche
                     "(r.startTime > r.endTime AND :startTime > :endTime)" +
                     ") " +
                     "AND (:excludeReservationId IS NULL OR r.id != :excludeReservationId)")
       List<Reservation> findConflictingReservationsByUserComplete(
                     @Param("userId") Integer userId,
                     @Param("date") LocalDate date,
                     @Param("startTime") LocalTime startTime,
                     @Param("endTime") LocalTime endTime,
                     @Param("excludeReservationId") Integer excludeReservationId);

       // Reservas futuras de un usuario
       @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND " +
                     "(r.reservationDate > :today OR (r.reservationDate = :today AND r.endTime > :currentTime))")
       List<Reservation> findUpcomingByUser(
                     @Param("userId") Integer userId,
                     @Param("today") LocalDate today,
                     @Param("currentTime") LocalTime currentTime);

}