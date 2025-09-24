package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;


public interface UserRepository extends JpaRepository<User, Integer> {
}
