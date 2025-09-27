package io.karaoke.karaoke_reservations.repos;

import io.karaoke.karaoke_reservations.domain.Extra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ExtraRepository extends JpaRepository<Extra, Integer> {
    
    // Extras disponibles
    List<Extra> findByIsAvailableTrue();
    
    // Extras por tipo
    List<Extra> findByTypeIgnoreCase(String type);
    
    // Extras disponibles por tipo
    List<Extra> findByTypeIgnoreCaseAndIsAvailableTrue(String type);
    
    // Buscar por nombre
    List<Extra> findByNameContainingIgnoreCase(String name);
    
    // Verificar si existe por nombre
    boolean existsByNameIgnoreCase(String name);
    
    // Obtener por nombre exacto
    Optional<Extra> findByNameIgnoreCase(String name);
    
    // Obtener tipos únicos disponibles
    @Query("SELECT DISTINCT e.type FROM Extra e WHERE e.isAvailable = true")
    List<String> findDistinctTypes();
    
    // Extras por rango de precio
    @Query("SELECT e FROM Extra e WHERE e.price BETWEEN :minPrice AND :maxPrice AND e.isAvailable = true")
    List<Extra> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice);
}