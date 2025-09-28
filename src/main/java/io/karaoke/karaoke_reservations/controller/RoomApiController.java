package io.karaoke.karaoke_reservations.controller;

import io.karaoke.karaoke_reservations.dto.RoomDTO;
import io.karaoke.karaoke_reservations.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoomApiController {

    private final RoomService roomService;

    
    // Obtener todas las salas disponibles
    @GetMapping("/available")
    public ResponseEntity<List<RoomDTO>> getAvailableRooms() {
        try {
            List<RoomDTO> availableRooms = roomService.findAllAvailableRoomsAsDTO();
            return ResponseEntity.ok(availableRooms);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Obtener salas disponibles filtradas por capacidad
    @GetMapping("/available-by-capacity")
    public ResponseEntity<List<RoomDTO>> getAvailableRoomsByCapacity(@RequestParam Integer capacity) {
        try {
            if (capacity == null || capacity < 2 || capacity > 15) {
                return ResponseEntity.badRequest().build();
            }
            List<RoomDTO> rooms = roomService.findAvailableRoomsByCapacityAsDTO(capacity);
            return ResponseEntity.ok(rooms);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    //  Verificar disponibilidad de una sala en fecha y hora específicas
    @GetMapping("/check-availability")
    public ResponseEntity<Map<String, Boolean>> checkRoomAvailability(
            @RequestParam Integer roomId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        
        try {
            LocalDate reservationDate = LocalDate.parse(date);
            LocalTime start = LocalTime.parse(startTime);
            LocalTime end = LocalTime.parse(endTime);
            
            boolean isAvailable = roomService.isRoomAvailable(roomId, reservationDate, start, end);
            
            return ResponseEntity.ok(Map.of("available", isAvailable));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("available", false));
        }
    }

    // Verificar si una sala puede acomodar cierto número de personas
    @GetMapping("/{id}/can-accommodate")
    public ResponseEntity<Map<String, Boolean>> canRoomAccommodate(
            @PathVariable Integer id, 
            @RequestParam Integer people) {
        
        try {
            if (people == null || people < 2 || people > 15) {
                return ResponseEntity.badRequest().body(Map.of("canAccommodate", false));
            }
            
            boolean canAccommodate = roomService.canRoomAccommodate(id, people);
            return ResponseEntity.ok(Map.of("canAccommodate", canAccommodate));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("canAccommodate", false));
        }
    }
}