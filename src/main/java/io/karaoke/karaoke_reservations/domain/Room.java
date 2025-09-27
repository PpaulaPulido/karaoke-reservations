package io.karaoke.karaoke_reservations.domain;

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
    private Integer maxCapacity; // Máximo de personas (2-15)

    @Column(nullable = false)
    private Boolean isAvailable = true; // Disponibilidad de la sala

    @Column(nullable = false)
    private Double pricePerHour; // Precio por hora

    @OneToMany(mappedBy = "room")
    private Set<Reservation> reservations = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private OffsetDateTime dateCreated;

    @LastModifiedDate
    @Column(nullable = false)
    private OffsetDateTime lastUpdated;

    // Método para compatibilidad
    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    // Constructor por defecto
    public Room() {
        this.isAvailable = true;
    }

    // Constructor con parámetros básicos
    public Room(String name, Integer maxCapacity, Double pricePerHour) {
        this();
        this.name = name;
        this.maxCapacity = maxCapacity;
        this.pricePerHour = pricePerHour;
    }

    // Método utilitario para validar capacidad
    public boolean canAccommodate(Integer numberOfPeople) {
        return numberOfPeople != null && numberOfPeople >= 2 && numberOfPeople <= this.maxCapacity;
    }

    // Método para calcular precio basado en duración
    public Double calculatePriceForHours(Double hours) {
        if (hours == null || hours <= 0) return 0.0;
        return this.pricePerHour * hours;
    }
}