package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Integer> {

    // Encontrar salas disponibles
    List<Room> findByIsAvailableTrue();
    
    List<Room> findByIsAvailableFalse();

    // Encontrar salas por capacidad mínima requerida
    List<Room> findByIsAvailableTrueAndMaxCapacityGreaterThanEqual(Integer minCapacity);

    // Consulta para verificar si una sala existe por nombre
    boolean existsByNameIgnoreCase(String name);

    // Encontrar sala por nombre exacto
    Optional<Room> findByNameIgnoreCase(String name);


}