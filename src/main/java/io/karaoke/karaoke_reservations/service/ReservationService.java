package io.karaoke.karaoke_reservations.service;

import io.karaoke.karaoke_reservations.events.BeforeDeleteExtra;
import io.karaoke.karaoke_reservations.repos.ReservationRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;

    public ReservationService(final ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    @EventListener(BeforeDeleteExtra.class)
    public void on(final BeforeDeleteExtra event) {
        reservationRepository.findAllByExtrasId(event.getId()).forEach(reservation ->
                reservation.getExtras().removeIf(extra -> extra.getId().equals(event.getId())));
        
        reservationRepository.saveAll(reservationRepository.findAllByExtrasId(event.getId()));
    }
}
