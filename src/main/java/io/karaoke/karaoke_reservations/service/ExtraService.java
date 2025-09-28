package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.Extra;
import io.karaoke.karaoke_reservations.dto.ExtraDTO;
import io.karaoke.karaoke_reservations.repos.ExtraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ExtraService {

    private final ExtraRepository extraRepository;

    // Método que retorna DTOs en lugar de entidades
    public List<ExtraDTO> findAll() {
        return extraRepository.findAll().stream()
                .map(ExtraDTO::new) 
                .collect(Collectors.toList());
    }

    public List<ExtraDTO> findByType(String type) {
        return extraRepository.findByTypeIgnoreCase(type).stream()
                .map(ExtraDTO::new)
                .collect(Collectors.toList());
    }

    public Optional<Extra> findById(Integer id) {
        return extraRepository.findById(id);
    }

    public List<Extra> findAllById(List<Integer> ids) {
        return extraRepository.findAllById(ids);
    }

    public List<String> findDistinctTypes() {
        return extraRepository.findAll().stream()
                .map(Extra::getType)
                .distinct()
                .collect(Collectors.toList()); 
    }
}