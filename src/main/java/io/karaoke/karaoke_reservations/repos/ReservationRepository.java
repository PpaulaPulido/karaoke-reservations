package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Reservation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    List<Reservation> findAllByExtrasId(Integer extraId);
    List<Reservation> findByUserId(Integer userId);
    List<Reservation> findByRoomId(Integer roomId);
    List<Reservation> findByStatus(String status);
}
