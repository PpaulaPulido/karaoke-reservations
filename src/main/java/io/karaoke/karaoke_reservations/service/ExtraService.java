package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.Extra;
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

    public List<Extra> findAll() {
        return extraRepository.findAll();
    }

    public List<Extra> findByType(String type) {
        return extraRepository.findAll().stream()
                .filter(extra -> extra.getType().equalsIgnoreCase(type))
                .collect(Collectors.toList());
    }

    public Optional<Extra> findById(Integer id) {
        return extraRepository.findById(id);
    }

    public List<Extra> findAllById(List<Integer> ids) {
        return extraRepository.findAllById(ids);
    }

    public Extra save(Extra extra) {
        return extraRepository.save(extra);
    }

    public void deleteById(Integer id) {
        extraRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return extraRepository.existsById(id);
    }
}