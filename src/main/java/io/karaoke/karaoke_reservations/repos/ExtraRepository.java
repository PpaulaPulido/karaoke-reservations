package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Extra;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExtraRepository extends JpaRepository<Extra, Integer> {
    
    List<Extra> findByTypeIgnoreCase(String type);
}