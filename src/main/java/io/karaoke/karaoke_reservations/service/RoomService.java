package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.Room;
import io.karaoke.karaoke_reservations.repos.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final ReservationService reservationService;

    // Obtener todas las salas
    public List<Room> findAllRooms() {
        return roomRepository.findAll();
    }

    // Obtener solo salas disponibles
    public List<Room> findAllAvailableRooms() {
        return roomRepository.findByIsAvailableTrue();
    }

    // Obtener salas disponibles por capacidad
    public List<Room> findAvailableRoomsByCapacity(Integer numberOfPeople) {
        if (numberOfPeople == null || numberOfPeople < 2 || numberOfPeople > 15) {
            throw new IllegalArgumentException("El número de personas debe estar entre 2 y 15");
        }
        return roomRepository.findByIsAvailableTrueAndMaxCapacityGreaterThanEqual(numberOfPeople);
    }

    // Buscar sala por ID
    public Optional<Room> findById(Integer id) {
        return roomRepository.findById(id);
    }

    // Buscar sala por nombre
    public Optional<Room> findByName(String name) {
        return roomRepository.findByNameIgnoreCase(name);
    }

    // Crear nueva sala
    public Room createRoom(Room room) {
        validateRoom(room);
        
        // Limpiar y validar nombre
        room.setName(room.getName().trim());
        
        if (roomRepository.existsByNameIgnoreCase(room.getName())) {
            throw new IllegalArgumentException("Ya existe una sala con ese nombre: " + room.getName());
        }

        return roomRepository.save(room);
    }

    // Actualizar sala existente
    public Room updateRoom(Integer roomId, Room roomDetails) {
        Room existingRoom = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada con ID: " + roomId));

        // Validar y actualizar nombre si se proporciona
        if (roomDetails.getName() != null && !roomDetails.getName().trim().isEmpty()) {
            String newName = roomDetails.getName().trim();
            if (!newName.equalsIgnoreCase(existingRoom.getName()) && 
                roomRepository.existsByNameIgnoreCase(newName)) {
                throw new IllegalArgumentException("Ya existe una sala con ese nombre: " + newName);
            }
            existingRoom.setName(newName);
        }

        // Actualizar capacidad si se proporciona
        if (roomDetails.getMaxCapacity() != null) {
            if (roomDetails.getMaxCapacity() < 2 || roomDetails.getMaxCapacity() > 15) {
                throw new IllegalArgumentException("La capacidad máxima debe estar entre 2 y 15 personas");
            }
            existingRoom.setMaxCapacity(roomDetails.getMaxCapacity());
        }

        // Actualizar precio si se proporciona
        if (roomDetails.getPricePerHour() != null) {
            if (roomDetails.getPricePerHour() <= 0) {
                throw new IllegalArgumentException("El precio por hora debe ser mayor a 0");
            }
            existingRoom.setPricePerHour(roomDetails.getPricePerHour());
        }

        // Actualizar disponibilidad si se proporciona
        if (roomDetails.getIsAvailable() != null) {
            existingRoom.setIsAvailable(roomDetails.getIsAvailable());
        }

        return roomRepository.save(existingRoom);
    }

    // Eliminar sala
    public void deleteRoom(Integer roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new IllegalArgumentException("Sala no encontrada con ID: " + roomId);
        }
        roomRepository.deleteById(roomId);
    }

    // Cambiar disponibilidad de la sala
    public Room toggleRoomAvailability(Integer roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));
        room.setIsAvailable(!room.getIsAvailable());
        return roomRepository.save(room);
    }

    // Validar si una sala puede acomodar cierto número de personas
    public boolean canRoomAccommodate(Integer roomId, Integer numberOfPeople) {
        return roomRepository.findById(roomId)
                .map(room -> room.canAccommodate(numberOfPeople))
                .orElse(false);
    }

    // Validar si una sala está disponible (solo estado básico)
    public boolean isRoomAvailable(Integer roomId) {
        return roomRepository.findById(roomId)
                .map(Room::getIsAvailable)
                .orElse(false);
    }

    // NUEVO: Validar disponibilidad completa con fecha y hora
    public boolean isRoomAvailable(Integer roomId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        // Primero verificar si la sala existe y está disponible básicamente
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty() || !roomOpt.get().getIsAvailable()) {
            return false;
        }

        // Luego verificar si hay reservas conflictivas
        return reservationService.isRoomAvailable(roomId, date, startTime, endTime);
    }

    // Calcular precio para una reserva
    public Double calculateReservationPrice(Integer roomId, Double hours) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));
        return room.calculatePriceForHours(hours);
    }

    // Validaciones básicas de la sala
    private void validateRoom(Room room) {
        if (room.getName() == null || room.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la sala no puede estar vacío");
        }

        if (room.getMaxCapacity() == null || room.getMaxCapacity() < 2 || room.getMaxCapacity() > 15) {
            throw new IllegalArgumentException("La capacidad máxima debe estar entre 2 y 15 personas");
        }

        if (room.getPricePerHour() == null || room.getPricePerHour() <= 0) {
            throw new IllegalArgumentException("El precio por hora debe ser mayor a 0");
        }
    }
}