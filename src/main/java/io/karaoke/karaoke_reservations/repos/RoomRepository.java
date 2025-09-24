package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;


public interface RoomRepository extends JpaRepository<Room, Integer> {
}
