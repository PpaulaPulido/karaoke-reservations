package io.karaoke.karaoke_reservations.dto;

import io.karaoke.karaoke_reservations.domain.ReservationStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.List;

public class ReservationHistoryDTO {
    private Integer id;
    private String roomName;
    private LocalDate reservationDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer numberOfPeople;
    private BigDecimal totalPrice; 
    private ReservationStatus status;
    private Integer durationMinutes;
    private OffsetDateTime dateCreated;  
    private List<ExtraDTO> extras;


    public ReservationHistoryDTO(Integer id, String roomName, LocalDate reservationDate,
            LocalTime startTime, LocalTime endTime, Integer numberOfPeople,
            BigDecimal totalPrice, ReservationStatus status, Integer durationMinutes, 
            OffsetDateTime dateCreated) { 
        this.id = id;
        this.roomName = roomName;
        this.reservationDate = reservationDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.numberOfPeople = numberOfPeople;
        this.totalPrice = totalPrice;
        this.status = status;
        this.durationMinutes = durationMinutes;
        this.dateCreated = dateCreated;
    }

    // Constructor vacío
    public ReservationHistoryDTO() {
    }

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public LocalDate getReservationDate() {
        return reservationDate;
    }

    public void setReservationDate(LocalDate reservationDate) {
        this.reservationDate = reservationDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Integer getNumberOfPeople() {
        return numberOfPeople;
    }

    public void setNumberOfPeople(Integer numberOfPeople) {
        this.numberOfPeople = numberOfPeople;
    }

    public BigDecimal getTotalPrice() {  
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public OffsetDateTime getDateCreated() { 
        return dateCreated;
    }

    public void setDateCreated(OffsetDateTime dateCreated) { 
        this.dateCreated = dateCreated;
    }

    public List<ExtraDTO> getExtras() {
        return extras;
    }

    public void setExtras(List<ExtraDTO> extras) {
        this.extras = extras;
    }
}