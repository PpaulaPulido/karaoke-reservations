package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.Reservation;
import io.karaoke.karaoke_reservations.domain.Room;
import io.karaoke.karaoke_reservations.dto.RoomDTO;
import io.karaoke.karaoke_reservations.repos.ReservationRepository;
import io.karaoke.karaoke_reservations.repos.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository; 

    public List<RoomDTO> findAllAvailableRoomsAsDTO() {
        List<Room> rooms = roomRepository.findByIsAvailableTrue();
        return rooms.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<RoomDTO> findAvailableRoomsByCapacityAsDTO(Integer numberOfPeople) {
        if (numberOfPeople == null || numberOfPeople < 2 || numberOfPeople > 15) {
            throw new IllegalArgumentException("El número de personas debe estar entre 2 y 15");
        }
        List<Room> rooms = roomRepository.findByIsAvailableTrueAndMaxCapacityGreaterThanEqual(numberOfPeople);
        return rooms.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private RoomDTO convertToDTO(Room room) {
        String description = room.getDescription() != null ? room.getDescription() : "";
        
        return new RoomDTO(
            room.getId(),
            room.getName(),
            room.getMinCapacity(),
            room.getMaxCapacity(),
            room.getIsAvailable(),
            BigDecimal.valueOf(room.getPricePerHour()),
            description
        );
    }

    public boolean isRoomAvailable(Integer roomId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty() || !roomOpt.get().getIsAvailable()) {
            return false;
        }
        
        List<Reservation> conflicts = reservationRepository.findConflictingReservations(roomId, date, startTime, endTime);
        return conflicts.isEmpty(); 
    }

    public boolean canRoomAccommodate(Integer roomId, Integer numberOfPeople) {
        return roomRepository.findById(roomId)
                .map(room -> room.getMinCapacity() <= numberOfPeople && room.getMaxCapacity() >= numberOfPeople)
                .orElse(false);
    }

    public Optional<Room> findById(Integer id) {
        return roomRepository.findById(id);
    }

    public Room save(Room room) {
        return roomRepository.save(room);
    }

    public void updateRoomAvailability(Integer roomId, boolean isAvailable) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));
        room.setIsAvailable(isAvailable);
        roomRepository.save(room);
    }

    public List<Room> findAll() {
        return roomRepository.findAll();
    }


    public List<Room> findOccupiedRooms() {
        return roomRepository.findByIsAvailableFalse();
    }

    public List<Room> findAvailableRooms() {
        return roomRepository.findByIsAvailableTrue();
    }

    public void releaseRoom(Integer roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));
        room.setIsAvailable(true);
        roomRepository.save(room);
    }
}