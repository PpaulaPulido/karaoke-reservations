document.addEventListener('DOMContentLoaded', () => {
    // Asegúrate de que reservationCalendar esté inicializado
    if (window.reservationCalendar) {
        loadCalendarReservations();
    } else {
        // Si por alguna razón no está listo, reintentar o loguear un error
        console.error('reservationCalendar no está disponible. Reintentando en 100ms...');
        setTimeout(loadCalendarReservations, 100);
    }

    async function loadCalendarReservations() {
        try {
            console.log('Cargando reservaciones para el calendario desde el backend...');
            const response = await fetch('/reservations/calendar/api');
            
            if (response.ok) {
                const data = await response.json();
                if (window.reservationCalendar) {
                    window.reservationCalendar.setReservations(data.reservationsByDate);
                }
                console.log('Reservaciones del calendario cargadas exitosamente:', data);
            } else {
                // Intentar leer el mensaje de error del servidor
                let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.text();
                    console.error('Respuesta de error:', errorData);
                    if (errorData) {
                        const parsedError = JSON.parse(errorData);
                        errorMessage = parsedError.message || parsedError.error || errorMessage;
                    }
                } catch (parseError) {
                    console.error('No se pudo parsear la respuesta de error:', parseError);
                }
                
                console.error(errorMessage);
                if (window.reservationCalendar) {
                    window.reservationCalendar.showNotification(errorMessage, 'error');
                }
            }
        } catch (error) {
            console.error('Error de red cargando reservaciones para el calendario:', error);
            if (window.reservationCalendar) {
                window.reservationCalendar.showNotification('Error de conexión al cargar reservaciones: ' + error.message, 'error');
            }
        }
    }
});