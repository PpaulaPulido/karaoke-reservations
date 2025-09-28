// src/main/java/io/karaoke/karaoke_reservations/dto/ExtraDTO.java
package io.karaoke.karaoke_reservations.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import io.karaoke.karaoke_reservations.domain.Extra;

public class ExtraDTO {
    private Integer id;
    private String name;
    private String type;
    private String description;
    private BigDecimal price;
    private OffsetDateTime dateCreated;
    private OffsetDateTime lastUpdated;

    // Constructores
    public ExtraDTO() {}

    public ExtraDTO(Integer id, String name, String type, String description, 
                   BigDecimal price, OffsetDateTime dateCreated, OffsetDateTime lastUpdated) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
        this.price = price;
        this.dateCreated = dateCreated;
        this.lastUpdated = lastUpdated;
    }
    
    public ExtraDTO(Extra extra) {
        this.id = extra.getId();
        this.name = extra.getName();
        this.type = extra.getType();
        this.description = extra.getDescription();
        this.price = extra.getPrice();
        this.dateCreated = extra.getDateCreated();
        this.lastUpdated = extra.getLastUpdated();
    }

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public OffsetDateTime getDateCreated() { return dateCreated; }
    public void setDateCreated(OffsetDateTime dateCreated) { this.dateCreated = dateCreated; }

    public OffsetDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(OffsetDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}