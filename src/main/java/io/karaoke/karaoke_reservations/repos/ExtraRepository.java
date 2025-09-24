package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Extra;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ExtraRepository extends JpaRepository<Extra, Integer> {
}
