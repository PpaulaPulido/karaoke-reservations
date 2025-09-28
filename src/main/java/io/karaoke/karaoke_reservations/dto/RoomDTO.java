package io.karaoke.karaoke_reservations.dto;

import java.math.BigDecimal;

public class RoomDTO {
    private Integer id;
    private String name;
    private Integer minCapacity;
    private Integer maxCapacity;
    private Boolean isAvailable;
    private BigDecimal pricePerHour;
    private String description;

    // Constructor
    public RoomDTO(Integer id, String name, Integer minCapacity, Integer maxCapacity, 
                  Boolean isAvailable, BigDecimal pricePerHour, String description) {
        this.id = id;
        this.name = name;
        this.minCapacity = minCapacity;
        this.maxCapacity = maxCapacity;
        this.isAvailable = isAvailable != null ? isAvailable : false;
        this.pricePerHour = pricePerHour;
        this.description = description;
    }
    
    public RoomDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getMinCapacity() { return minCapacity; }
    public void setMinCapacity(Integer minCapacity) { this.minCapacity = minCapacity; }

    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public BigDecimal getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(BigDecimal pricePerHour) { this.pricePerHour = pricePerHour; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}