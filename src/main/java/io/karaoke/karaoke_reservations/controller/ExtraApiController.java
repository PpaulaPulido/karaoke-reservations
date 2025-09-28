// src/main/java/io/karaoke/karaoke_reservations/controller/ExtraApiController.java
package io.karaoke.karaoke_reservations.controller;

import io.karaoke.karaoke_reservations.dto.ExtraDTO;
import io.karaoke.karaoke_reservations.service.ExtraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/extras")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExtraApiController {

    private final ExtraService extraService;

    @GetMapping
    public ResponseEntity<List<ExtraDTO>> getAllExtras() {
        try {
            List<ExtraDTO> extras = extraService.findAll(); // Ahora retorna DTOs
            return ResponseEntity.ok(extras);
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/by-type")
    public ResponseEntity<List<ExtraDTO>> getExtrasByType(@RequestParam String type) {
        try {
            List<ExtraDTO> extras = extraService.findByType(type);
            return ResponseEntity.ok(extras);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}