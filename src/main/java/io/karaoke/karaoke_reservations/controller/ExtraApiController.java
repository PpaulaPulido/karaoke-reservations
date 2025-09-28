package io.karaoke.karaoke_reservations.controller;

import io.karaoke.karaoke_reservations.domain.Extra;
import io.karaoke.karaoke_reservations.service.ExtraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/extras")
@RequiredArgsConstructor
public class ExtraApiController {

    private final ExtraService extraService;

    @GetMapping
    public ResponseEntity<List<Extra>> getAllExtras() {
        List<Extra> extras = extraService.findAll();
        return ResponseEntity.ok(extras);
    }
}