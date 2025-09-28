package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Reservation;
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

       // Verificar disponibilidad de sala (reservas que se solapan)
       @Query("SELECT r FROM Reservation r WHERE r.room.id = :roomId AND r.reservationDate = :date " +
                     "AND ((r.startTime < :endTime AND r.endTime > :startTime))")
       List<Reservation> findConflictingReservations(
                     @Param("roomId") Integer roomId,
                     @Param("date") LocalDate date,
                     @Param("startTime") LocalTime startTime,
                     @Param("endTime") LocalTime endTime);

       // Reservas futuras de un usuario
       @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND " +
                     "(r.reservationDate > :today OR (r.reservationDate = :today AND r.endTime > :currentTime))")
       List<Reservation> findUpcomingByUser(
                     @Param("userId") Integer userId,
                     @Param("today") LocalDate today,
                     @Param("currentTime") LocalTime currentTime);

       // Comprobar si un usuario tiene reservas que se solapan
       @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND r.reservationDate = :date " +
                     "AND ((r.startTime < :endTime AND r.endTime > :startTime))")
       List<Reservation> findConflictingReservationsByUser(
                     @Param("userId") Integer userId,
                     @Param("date") LocalDate date,
                     @Param("startTime") LocalTime startTime,
                     @Param("endTime") LocalTime endTime);
}
