package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Extra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExtraRepository extends JpaRepository<Extra, Integer> {

    List<Extra> findByTypeIgnoreCase(String type);

    @Query("SELECT e FROM Extra e JOIN e.reservations r WHERE r.id = :reservationId")
    List<Extra> findExtrasByReservationId(@Param("reservationId") Integer reservationId);
}