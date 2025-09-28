class SummaryReservation {
    constructor(validator, roomManager, extrasManager) {
        this.validator = validator;
        this.roomManager = roomManager;
        this.extrasManager = extrasManager;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSummary(); 
    }

    setupEventListeners() {
        // Escuchar cambios en los campos básicos
        const basicFields = ['reservationDate', 'startTime', 'endTime', 'numberOfPeople'];
        basicFields.forEach(fieldName => {
            const input = document.getElementById(fieldName);
            if (input) {
                input.addEventListener('change', () => this.updateSummary());
                input.addEventListener('input', () => this.updateSummary());
            }
        });

        // Escuchar cambios en la selección de sala
        if (this.roomManager) {
            this.setupRoomObserver();
        }

        // Escuchar cambios en los extras
        if (this.extrasManager) {
            this.setupExtrasObserver();
        }

        // Escuchar cambios en el campo de duración (calculado)
        const durationInput = document.getElementById('durationMinutes');
        if (durationInput) {
            this.setupDurationObserver(durationInput);
        }
    }

    setupRoomObserver() {
        // Guardar referencia a los métodos originales
        this.roomManager._originalSelectRoom = this.roomManager.selectRoom;
        this.roomManager._originalLoadRooms = this.roomManager.loadAvailableRooms;

        this.roomManager.selectRoom = (roomId) => {
            const result = this.roomManager._originalSelectRoom(roomId);
            this.updateSummary();
            return result;
        };

        this.roomManager.loadAvailableRooms = async (numberOfPeople) => {
            const result = await this.roomManager._originalLoadRooms(numberOfPeople);
            this.updateSummary();
            return result;
        };
    }

    setupExtrasObserver() {
        this.extrasManager._originalToggleExtra = this.extrasManager.toggleExtra;
        this.extrasManager._originalRemoveExtra = this.extrasManager.removeExtra;

        this.extrasManager.toggleExtra = (extraId) => {
            const result = this.extrasManager._originalToggleExtra(extraId);
            this.updateSummary();
            return result;
        };

        this.extrasManager.removeExtra = (extraId) => {
            const result = this.extrasManager._originalRemoveExtra(extraId);
            this.updateSummary();
            return result;
        };
    }

    setupDurationObserver(durationInput) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    this.updateSummary();
                }
            });
        });

        observer.observe(durationInput, { attributes: true, attributeFilter: ['value'] });
    }

    updateSummary() {
        try {
            this.updateBasicInfo();
            this.updateRoomInfo();
            this.updateExtrasInfo();
            this.updatePricing();
        } catch (error) {
            console.error('Error actualizando el resumen:', error);
        }
    }

    updateBasicInfo() {
        const formData = this.validator?.formData || {};

        // Fecha
        const dateElement = document.getElementById('summary-date');
        if (dateElement) {
            dateElement.textContent = formData.reservationDate 
                ? this.formatDate(formData.reservationDate)
                : '-';
        }

        // Horario
        const timeElement = document.getElementById('summary-time');
        if (timeElement) {
            if (formData.startTime && formData.endTime) {
                timeElement.textContent = `${this.formatTime(formData.startTime)} - ${this.formatTime(formData.endTime)}`;
            } else {
                timeElement.textContent = '-';
            }
        }

        // Personas
        const peopleElement = document.getElementById('summary-people');
        if (peopleElement) {
            peopleElement.textContent = formData.numberOfPeople || '-';
        }

        // Duración
        const durationElement = document.getElementById('summary-duration');
        if (durationElement) {
            const durationInput = document.getElementById('durationMinutes');
            durationElement.textContent = durationInput?.value || '-';
        }
    }

    updateRoomInfo() {
        const roomElement = document.getElementById('summary-room');
        const selectedRoom = this.roomManager?.getSelectedRoom();
        
        if (roomElement) {
            roomElement.textContent = selectedRoom ? selectedRoom.name : '-';
        }

        this.updateRoomPrice();
    }

    updateRoomPrice() {
        const roomPriceElement = document.getElementById('summary-room-price');
        const selectedRoom = this.roomManager?.getSelectedRoom();

        if (!roomPriceElement) return;

        if (!selectedRoom) {
            roomPriceElement.textContent = '$0';
            return;
        }

        try {
            const roomPrice = selectedRoom.pricePerHour || 0;
            roomPriceElement.textContent = `$${roomPrice.toLocaleString()}`;
        } catch (error) {
            console.error('Error mostrando precio de la sala:', error);
            roomPriceElement.textContent = '$0';
        }
    }


    calculateDurationMinutes(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);
        let duration = end - start;
        
        // Manejar reservas que cruzan la medianoche
        if (duration < 0) duration += 24 * 60;
        
        return Math.max(0, duration); // Asegurar que no sea negativo
    }

    timeToMinutes(timeString) {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    updateExtrasInfo() {
        const extrasElement = document.getElementById('summary-extras');
        const selectedExtras = this.extrasManager?.getSelectedExtras() || [];

        if (extrasElement) {
            if (selectedExtras.length === 0) {
                extrasElement.textContent = 'Ninguno';
                extrasElement.style.color = '#718096';
            } else {
                const extrasList = selectedExtras.map(extra => extra.name).join(', ');
                extrasElement.textContent = extrasList;
                extrasElement.style.color = '#2d3748';
            }
        }
    }

    updatePricing() {
        const totalElement = document.getElementById('summary-total');
        if (!totalElement) return;

        let total = 0;

        try {
            // Precio FIJO de la sala (no depende de la duración)
            const selectedRoom = this.roomManager?.getSelectedRoom();
            
            if (selectedRoom) {
                total += selectedRoom.pricePerHour || 0;
            }

            // Precio de los extras
            const selectedExtras = this.extrasManager?.getSelectedExtras() || [];
            const extrasTotal = selectedExtras.reduce((sum, extra) => sum + (extra.price || 0), 0);
            total += extrasTotal;

            // Actualizar total
            totalElement.textContent = `$${total.toLocaleString()}`;
            
            // Animación de actualización
            this.animateTotalUpdate(totalElement);
        } catch (error) {
            console.error('Error actualizando precios:', error);
            totalElement.textContent = '$0';
        }
    }

    animateTotalUpdate(element) {
        element.classList.add('price-update');
        setTimeout(() => {
            element.classList.remove('price-update');
        }, 500);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    formatTime(timeString) {
        if (!timeString) return '';
        
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            
            return `${displayHour}:${minutes} ${period}`;
        } catch (error) {
            return timeString;
        }
    }

    // Método para obtener el total calculado
    getCalculatedTotal() {
        let total = 0;

        try {
            // Precio FIJO de la sala
            const selectedRoom = this.roomManager?.getSelectedRoom();
            
            if (selectedRoom) {
                total += selectedRoom.pricePerHour || 0;
            }

            // Precio de los extras
            const selectedExtras = this.extrasManager?.getSelectedExtras() || [];
            total += selectedExtras.reduce((sum, extra) => sum + (extra.price || 0), 0);
        } catch (error) {
            console.error('Error calculando total:', error);
        }

        return total;
    }

    // Método para limpiar el resumen
    clearSummary() {
        const elementsToClear = [
            'summary-date', 'summary-time', 'summary-people', 'summary-duration',
            'summary-room', 'summary-room-price', 'summary-extras', 'summary-total'
        ];

        elementsToClear.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'summary-room-price' || id === 'summary-total') {
                    element.textContent = '$0';
                } else if (id === 'summary-extras') {
                    element.textContent = 'Ninguno';
                    element.style.color = '#718096';
                } else {
                    element.textContent = '-';
                }
            }
        });
    }
}

export default SummaryReservation;