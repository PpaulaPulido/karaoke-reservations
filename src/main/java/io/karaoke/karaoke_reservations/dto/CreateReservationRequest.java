package io.karaoke.karaoke_reservations.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class CreateReservationRequest {
    private LocalDate reservationDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer numberOfPeople;
    private Integer roomId;
    private List<Integer> extraIds = new ArrayList<>(); 
    private BigDecimal totalPrice;
    
    public CreateReservationRequest() {}
    public LocalDate getReservationDate() { return reservationDate; }
    public void setReservationDate(LocalDate reservationDate) { this.reservationDate = reservationDate; }
    
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    
    public Integer getNumberOfPeople() { return numberOfPeople; }
    public void setNumberOfPeople(Integer numberOfPeople) { this.numberOfPeople = numberOfPeople; }
    
    public Integer getRoomId() { return roomId; }
    public void setRoomId(Integer roomId) { this.roomId = roomId; }
    
    public List<Integer> getExtraIds() { return extraIds; }
    public void setExtraIds(List<Integer> extraIds) { this.extraIds = extraIds; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}