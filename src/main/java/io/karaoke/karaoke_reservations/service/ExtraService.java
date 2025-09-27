package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.Extra;
import io.karaoke.karaoke_reservations.repos.ExtraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ExtraService {

    private final ExtraRepository extraRepository;

    // Obtener todos los extras disponibles
    public List<Extra> findAllAvailable() {
        return extraRepository.findByIsAvailableTrue();
    }

    // Obtener todos los extras (incluyendo no disponibles)
    public List<Extra> findAll() {
        return extraRepository.findAll();
    }

    // Obtener extra por ID
    public Optional<Extra> findById(Integer id) {
        return extraRepository.findById(id);
    }

    // Obtener extras por tipo
    public List<Extra> findByType(String type) {
        return extraRepository.findByTypeIgnoreCaseAndIsAvailableTrue(type);
    }

    // Buscar extras por nombre
    public List<Extra> searchByName(String name) {
        return extraRepository.findByNameContainingIgnoreCase(name);
    }

    // Crear nuevo extra
    public Extra createExtra(Extra extra) {
        validateExtra(extra);
        
        // Limpiar y validar nombre
        extra.setName(extra.getName().trim());
        extra.setType(extra.getType().trim());
        
        if (extraRepository.existsByNameIgnoreCase(extra.getName())) {
            throw new IllegalArgumentException("Ya existe un extra con ese nombre: " + extra.getName());
        }

        return extraRepository.save(extra);
    }

    // Actualizar extra existente
    public Extra updateExtra(Integer extraId, Extra extraDetails) {
        Extra existingExtra = extraRepository.findById(extraId)
                .orElseThrow(() -> new IllegalArgumentException("Extra no encontrado con ID: " + extraId));

        // Validar y actualizar nombre si se proporciona
        if (extraDetails.getName() != null && !extraDetails.getName().trim().isEmpty()) {
            String newName = extraDetails.getName().trim();
            if (!newName.equalsIgnoreCase(existingExtra.getName()) && 
                extraRepository.existsByNameIgnoreCase(newName)) {
                throw new IllegalArgumentException("Ya existe un extra con ese nombre: " + newName);
            }
            existingExtra.setName(newName);
        }

        // Actualizar tipo si se proporciona
        if (extraDetails.getType() != null && !extraDetails.getType().trim().isEmpty()) {
            existingExtra.setType(extraDetails.getType().trim());
        }

        // Actualizar descripción si se proporciona
        if (extraDetails.getDescription() != null) {
            existingExtra.setDescription(extraDetails.getDescription().trim());
        }

        // Actualizar precio si se proporciona
        if (extraDetails.getPrice() != null) {
            if (extraDetails.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("El precio debe ser mayor a 0");
            }
            existingExtra.setPrice(extraDetails.getPrice());
        }

        // Actualizar disponibilidad si se proporciona
        if (extraDetails.getIsAvailable() != null) {
            existingExtra.setIsAvailable(extraDetails.getIsAvailable());
        }

        return extraRepository.save(existingExtra);
    }

    // Eliminar extra
    public void deleteExtra(Integer extraId) {
        if (!extraRepository.existsById(extraId)) {
            throw new IllegalArgumentException("Extra no encontrado con ID: " + extraId);
        }
        extraRepository.deleteById(extraId);
    }

    // Cambiar disponibilidad del extra
    public Extra toggleAvailability(Integer extraId) {
        Extra extra = extraRepository.findById(extraId)
                .orElseThrow(() -> new IllegalArgumentException("Extra no encontrado"));
        extra.setIsAvailable(!extra.getIsAvailable());
        return extraRepository.save(extra);
    }

    // Obtener tipos únicos de extras
    public List<String> getAvailableTypes() {
        return extraRepository.findDistinctTypes();
    }

    // Buscar extras por rango de precio
    public List<Extra> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice == null) minPrice = BigDecimal.ZERO;
        if (maxPrice == null) maxPrice = new BigDecimal("1000.00");
        
        if (minPrice.compareTo(maxPrice) > 0) {
            throw new IllegalArgumentException("El precio mínimo no puede ser mayor al máximo");
        }
        
        return extraRepository.findByPriceRange(minPrice, maxPrice);
    }

    // Validar extra
    private void validateExtra(Extra extra) {
        if (extra.getName() == null || extra.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del extra no puede estar vacío");
        }

        if (extra.getType() == null || extra.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("El tipo del extra no puede estar vacío");
        }

        if (extra.getPrice() == null || extra.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor a 0");
        }
    }

    // Verificar si un extra está disponible
    public boolean isExtraAvailable(Integer extraId) {
        return extraRepository.findById(extraId)
                .map(Extra::getIsAvailable)
                .orElse(false);
    }

    // Contar extras disponibles
    public long countAvailableExtras() {
        return extraRepository.findByIsAvailableTrue().size();
    }
}