package io.karaoke.karaoke_reservations.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Entity
@Table(name = "rooms")
@Getter
@Setter
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private Integer minCapacity; 

    @Column(nullable = false)
    private Integer maxCapacity; 

    @Column(nullable = false)
    private Boolean isAvailable = true; 

    @Column(nullable = false)
    private Double pricePerHour; 

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "room")
    @JsonIgnore // evita error con lazy
    private Set<Reservation> reservations = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private OffsetDateTime dateCreated;

    @LastModifiedDate
    @Column(nullable = false)
    private OffsetDateTime lastUpdated;

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public Room() {
        this.isAvailable = true;
    }

    // Constructor con parámetros básicos 
    public Room(String name, Integer minCapacity, Integer maxCapacity, Double pricePerHour, String description) {
        this();
        this.name = name;
        this.minCapacity = minCapacity;
        this.maxCapacity = maxCapacity;
        this.pricePerHour = pricePerHour;
        this.description = description;
    }

    // Método para validar capacidad
    public boolean canAccommodate(Integer numberOfPeople) {
        return numberOfPeople != null && 
               numberOfPeople >= this.minCapacity && 
               numberOfPeople <= this.maxCapacity;
    }

    // Método para calcular precio basado en duración
    public Double calculatePriceForHours(Double hours) {
        if (hours == null || hours <= 0) return 0.0;
        return this.pricePerHour * hours;
    }
}