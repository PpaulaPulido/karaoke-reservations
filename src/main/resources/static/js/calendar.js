class ReservationCalendar {
    constructor() {
        this.currentDate = new Date();
        this.reservations = {};
        this.init();
    }

    async init() {
        // No cargamos datos automáticamente, esperamos que vengan del backend
        this.renderCalendar();
        this.setupEventListeners();
        this.updateCalendarHeader();
        // Cargar reservas desde el backend y mostrarlas en el calendario
        try {
            await this.loadReservations();
        } catch (err) {
            console.error('Error cargando reservas en init():', err);
        }
    }

    /**
     * Carga las reservas desde el backend y actualiza el calendario.
     * Endpoint esperado: GET /api/reservations/calendar -> Array de reservas
     */
    async loadReservations() {
        try {
            // Endpoint que sirve el backend en este proyecto
            const resp = await fetch('/reservations/calendar/api', { method: 'GET', headers: { 'Accept': 'application/json' } });
            if (!resp.ok) {
                const body = await resp.text();
                console.error('Error al obtener reservaciones (status no OK):', resp.status, body);
                this.showNotification('Error al cargar reservaciones: ' + resp.status, 'error');
                return;
            }

            const contentType = resp.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                // Probablemente una redirección al login que devuelve HTML o similar
                const body = await resp.text();
                console.error('Respuesta inesperada al solicitar reservas (no JSON). Content-Type:', contentType);
                console.error('Cuerpo de la respuesta:', body);
                this.showNotification('No se recibieron datos JSON del servidor. ¿Estás autenticado?', 'error');
                return;
            }

            const data = await resp.json();
            // Reutilizamos setReservations para procesar y renderizar
            this.setReservations(data);
        } catch (err) {
            console.error('Excepción al cargar reservaciones:', err);
        }
    }

    // Método para recibir las reservas del backend (se llama externamente)
    setReservations(reservationsData) {
        // Aceptamos dos formatos:
        // - Array de reservas (cada reserva con reservationDate, startTime, ...)
        // - Objeto ya agrupado por fecha: { reservationsByDate: { 'YYYY-MM-DD': [..] } } o directamente { 'YYYY-MM-DD': [...] }
        if (!reservationsData) {
            this.reservations = {};
        } else if (Array.isArray(reservationsData)) {
            this.reservations = this.processReservationsData(reservationsData);
        } else if (reservationsData.reservationsByDate && typeof reservationsData.reservationsByDate === 'object') {
            // Normalizar cada reserva en el formato que espera la UI
            const normalized = {};
            const raw = reservationsData.reservationsByDate;
            for (const dateKey in raw) {
                if (!Array.isArray(raw[dateKey])) continue;
                normalized[dateKey] = raw[dateKey].map(r => ({
                    id: r.id,
                    roomName: (r.room && r.room.name) ? r.room.name : (r.roomName || 'Sala no especificada'),
                    time: this.formatTimeRange(r.startTime, r.endTime),
                    people: r.numberOfPeople || r.people || 0,
                    status: r.status || 'confirmed',
                    canCancel: this.canCancelReservation(r),
                    // mantener campos originales por si acaso
                    reservationDate: r.reservationDate,
                    startTime: r.startTime,
                    endTime: r.endTime
                }));
            }
            this.reservations = normalized;
        } else if (typeof reservationsData === 'object') {
            // Asumir que ya viene agrupado por fecha
            // Normalizar también si viene directamente como objeto por fecha
            const normalized = {};
            for (const dateKey in reservationsData) {
                if (!Array.isArray(reservationsData[dateKey])) continue;
                normalized[dateKey] = reservationsData[dateKey].map(r => ({
                    id: r.id,
                    roomName: (r.room && r.room.name) ? r.room.name : (r.roomName || 'Sala no especificada'),
                    time: this.formatTimeRange(r.startTime, r.endTime),
                    people: r.numberOfPeople || r.people || 0,
                    status: r.status || 'confirmed',
                    canCancel: this.canCancelReservation(r),
                    reservationDate: r.reservationDate,
                    startTime: r.startTime,
                    endTime: r.endTime
                }));
            }
            this.reservations = normalized;
        } else {
            this.reservations = {};
        }

        this.renderCalendar();
        console.log('Reservaciones actualizadas:', this.reservations);
    }

    // Procesar datos del backend al formato del calendario
    processReservationsData(apiData) {
        const reservationsByDate = {};
        
        if (!apiData || !Array.isArray(apiData)) {
            return reservationsByDate;
        }

        apiData.forEach(reservation => {
            try {
                const dateKey = this.formatDateKey(new Date(reservation.reservationDate));
                
                if (!reservationsByDate[dateKey]) {
                    reservationsByDate[dateKey] = [];
                }
                
                reservationsByDate[dateKey].push({
                    id: reservation.id,
                    roomName: reservation.room?.name || reservation.roomName || 'Sala no especificada',
                    time: this.formatTimeRange(reservation.startTime, reservation.endTime),
                    people: reservation.numberOfPeople,
                    status: reservation.status || 'confirmed',
                    canCancel: this.canCancelReservation(reservation)
                });
            } catch (error) {
                console.error('Error procesando reservación:', reservation, error);
            }
        });
        
        return reservationsByDate;
    }

    formatTimeRange(startTime, endTime) {
        if (!startTime || !endTime) return 'Horario no disponible';
        return `${startTime} - ${endTime}`;
    }

    canCancelReservation(reservation) {
        // Lógica para determinar si se puede cancelar
        const reservationDate = new Date(reservation.reservationDate);
        const now = new Date();
        
        // No se puede cancelar reservas pasadas
        if (reservationDate < now) return false;
        
        // Solo se pueden cancelar reservas confirmadas o pendientes
        return ['confirmed', 'pending'].includes(reservation.status);
    }

    // El resto del código del calendario se mantiene igual
    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;

        calendarGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        const startingDayAdjusted = startingDay === 0 ? 6 : startingDay - 1;

        // Días vacíos al inicio
        for (let i = 0; i < startingDayAdjusted; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.formatDateKey(date);
            const dayReservations = this.reservations[dateKey] || [];
            
            const dayElement = this.createDayElement(day, date, dayReservations);
            calendarGrid.appendChild(dayElement);
        }

        this.updateCalendarHeader();
    }

    createDayElement(day, date, dayReservations) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const isToday = this.isToday(date);
        const isPast = this.isPast(date);
        
        if (isToday) {
            dayElement.classList.add('today');
        }
        if (isPast) {
            dayElement.classList.add('past-day');
        }

        // Build a small preview showing the first reservation's room and time
        let previewHTML = '';
        if (dayReservations.length > 0) {
            const first = dayReservations[0];
            const room = first.roomName || (first.room && first.room.name) || 'Sala';
            const time = first.time || (first.startTime && first.endTime ? `${first.startTime} - ${first.endTime}` : 'Horario no disponible');
            const moreCount = dayReservations.length - 1;
            previewHTML = `
                <div class="reservation-preview">
                    <div class="preview-main">
                        <span class="preview-room">${room}</span>
                        <span class="preview-time">${time}</span>
                    </div>
                    ${moreCount > 0 ? `<div class="preview-more">+${moreCount} más</div>` : ''}
                </div>
            `;
        }

        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            ${previewHTML}
            <div class="reservations-info">
                ${dayReservations.length > 0 ? 
                    `<span class="reservation-count">${dayReservations.length} reserva${dayReservations.length !== 1 ? 's' : ''}</span>` :
                    `<span class="available-text">Disponible</span>`
                }
            </div>
        `;

        dayElement.addEventListener('click', () => {
            const dateKey = this.formatDateKey(date);
            this.showReservationDetails(dateKey, dayReservations);
        });

        return dayElement;
    }

    updateCalendarHeader() {
        const monthYearElement = document.getElementById('current-month-year');
        if (monthYearElement) {
            const options = { year: 'numeric', month: 'long' };
            monthYearElement.textContent = this.currentDate.toLocaleDateString('es-ES', options);
        }
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isPast(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    // Función de cancelación (conexión real al backend)
    async cancelReservation(reservationId) {
        if (!confirm('¿Estás seguro de que deseas cancelar esta reservación?\nEsta acción no se puede deshacer.')) {
            return;
        }

        // Deshabilitar el botón en la UI y mostrar spinner
        const btnSelector = `.reservation-item[data-reservation-id="${reservationId}"] .btn-cancel-reservation`;
        const btn = document.querySelector(btnSelector);
        let originalBtnHTML = null;
        if (btn) {
            originalBtnHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Cancelando...`;
        }

        try {
            const response = await fetch(`/reservations/${reservationId}/cancel`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': this.getCsrfToken()
                },
                redirect: 'follow'
            });

            // Intentar parsear JSON si el backend devuelve JSON; si no, tratar como éxito si response.ok
            let result = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try { result = await response.json(); } catch (e) { /* ignore */ }
            }

            if (response.ok && (!result || result.success === undefined || result.success === true)) {
                this.showNotification('Reservación cancelada exitosamente', 'success');

                // Refrescar datos desde el backend para mantener consistencia
                try {
                    await this.loadReservations();
                } catch (e) {
                    console.error('Error refrescando calendario después de cancelar:', e);
                    // Como fallback, eliminar localmente
                    this.removeReservationFromCalendar(reservationId);
                }

            } else {
                const msg = (result && result.message) ? result.message : 'Error al cancelar la reservación';
                throw new Error(msg);
            }
        } catch (error) {
            console.error('Error cancelando reservación:', error);
            this.showNotification(error.message, 'error');
        } finally {
            // Restaurar el botón si existe (si aún está en el DOM)
            try {
                if (btn && document.contains(btn)) {
                    btn.disabled = false;
                    btn.innerHTML = originalBtnHTML;
                }
            } catch (e) { /* ignore */ }
        }
    }

    // Remover reserva cancelada del calendario
    removeReservationFromCalendar(reservationId) {
        // Buscar y eliminar la reserva en todas las fechas
        for (const dateKey in this.reservations) {
            this.reservations[dateKey] = this.reservations[dateKey].filter(
                reservation => reservation.id !== reservationId
            );
            
            // Si no quedan reservas en esa fecha, eliminar la fecha
            if (this.reservations[dateKey].length === 0) {
                delete this.reservations[dateKey];
            }
        }
        
        this.renderCalendar();
        this.closeModal();
    }

    setupEventListeners() {
        document.getElementById('prev-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.querySelector('.close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('reservation-details-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    showReservationDetails(dateKey, reservations) {
        const modal = document.getElementById('reservation-details-modal');
        const modalDate = document.getElementById('modal-date');
        const modalContent = document.getElementById('modal-reservations-content');

        if (!modal || !modalDate || !modalContent) return;

        const date = new Date(dateKey + 'T00:00:00');
        modalDate.textContent = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (reservations.length === 0) {
            modalContent.innerHTML = `
                <div class="no-reservations-message">
                    <i class="fas fa-calendar-times"></i>
                    <p>No hay reservaciones para esta fecha</p>
                </div>
            `;
        } else {
            modalContent.innerHTML = reservations.map(reservation => `
                <div class="reservation-item" data-reservation-id="${reservation.id}">
                    <div class="reservation-header">
                        <h4>${reservation.roomName}</h4>
                        <span class="reservation-status ${reservation.status}">
                            ${this.getStatusText(reservation.status)}
                        </span>
                    </div>
                    <div class="reservation-details">
                        <div class="reservation-time">
                            <i class="fas fa-clock"></i> ${reservation.time}
                        </div>
                        <div class="reservation-people">
                            <i class="fas fa-users"></i> ${reservation.people} personas
                        </div>
                        <div class="reservation-id">
                            <i class="fas fa-hashtag"></i> #${reservation.id}
                        </div>
                    </div>
                    ${reservation.canCancel ? `
                        <div class="reservation-actions">
                            <button class="btn-cancel-reservation" 
                                    onclick="reservationCalendar.cancelReservation(${reservation.id})">
                                <i class="fas fa-times"></i> Cancelar Reserva
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('reservation-details-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    getCsrfToken() {
        return document.querySelector('meta[name="_csrf"]')?.getAttribute('content') || 
               document.querySelector('input[name="_csrf"]')?.value;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    getStatusText(status) {
        const statusMap = {
            'confirmed': 'Confirmada',
            'pending': 'Pendiente',
            'cancelled': 'Cancelada',
            'completed': 'Completada'
        };
        return statusMap[status] || status;
    }
}

// Inicializar el calendario
document.addEventListener('DOMContentLoaded', () => {
    window.reservationCalendar = new ReservationCalendar();
});
