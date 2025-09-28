package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.domain.Room;
import io.karaoke.karaoke_reservations.dto.RoomDTO;
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
        return roomOpt.isPresent() && roomOpt.get().getIsAvailable();
    }

    public boolean canRoomAccommodate(Integer roomId, Integer numberOfPeople) {
        return roomRepository.findById(roomId)
                .map(room -> room.getMinCapacity() <= numberOfPeople && room.getMaxCapacity() >= numberOfPeople)
                .orElse(false);
    }

    public Optional<Room> findById(Integer id) {
        return roomRepository.findById(id);
    }
}