class AdminReservationCalendar extends ReservationCalendar {
    constructor() {
        super();
        this.setupAdminFeatures();
    }

    setupAdminFeatures() {
        this.setupTabs();
        this.setupAdminEventListeners();
    }

    /**
     * Carga las reservas desde el backend para admin (todas las reservas)
     */
    async loadReservations() {
        try {
            // Endpoint específico para admin que devuelve todas las reservas
            const resp = await fetch('/reservations/calendar/api/admin', { 
                method: 'GET', 
                headers: { 'Accept': 'application/json' } 
            });
            
            if (!resp.ok) {
                if (resp.status === 403) {
                    this.showNotification('No tienes permisos de administrador', 'error');
                    return;
                }
                const body = await resp.text();
                console.error('Error al obtener reservaciones (status no OK):', resp.status, body);
                this.showNotification('Error al cargar reservaciones: ' + resp.status, 'error');
                return;
            }

            const contentType = resp.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const body = await resp.text();
                console.error('Respuesta inesperada al solicitar reservas (no JSON). Content-Type:', contentType);
                this.showNotification('No se recibieron datos JSON del servidor', 'error');
                return;
            }

            const data = await resp.json();
            this.setReservations(data);
        } catch (err) {
            console.error('Excepción al cargar reservaciones:', err);
            this.showNotification('Error de conexión al cargar reservaciones', 'error');
        }
    }

    // El resto de los métodos se mantienen igual...
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remover clase active de todos los botones y contenidos
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                // Activar pestaña clickeada
                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    setupAdminEventListeners() {
        // Botón de actualizar datos
        document.getElementById('refresh-data')?.addEventListener('click', () => {
            this.loadReservations();
        });

        // Botones de agregar sala y extra
        document.getElementById('add-room-btn')?.addEventListener('click', () => {
            this.showAddRoomForm();
        });

        document.getElementById('add-extra-btn')?.addEventListener('click', () => {
            this.showAddExtraForm();
        });
    }

    // Sobrescribir showReservationDetails para agregar funcionalidades de admin
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
                        <div class="reservation-status-group">
                            <span class="reservation-status ${reservation.status}">
                                ${this.getStatusText(reservation.status)}
                            </span>
                            ${reservation.status === 'completed' ? 
                                '<span class="badge-completed"><i class="fas fa-check-circle"></i> Completada</span>' : ''}
                        </div>
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
                        ${reservation.customer ? `
                            <div class="reservation-customer">
                                <i class="fas fa-user"></i> ${reservation.customer.name} - ${reservation.customer.phone || 'Sin teléfono'}
                            </div>
                            <div class="reservation-email">
                                <i class="fas fa-envelope"></i> ${reservation.customer.email}
                            </div>
                        ` : ''}
                    </div>
                    <div class="reservation-actions admin-actions">
                        ${reservation.canCancel ? `
                            <button class="btn-cancel-reservation" 
                                    onclick="adminReservationCalendar.cancelReservation(${reservation.id})">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        ` : ''}
                        
                        ${reservation.status !== 'completed' && reservation.status !== 'cancelled' ? `
                            <button class="btn-complete-reservation" 
                                    onclick="adminReservationCalendar.completeReservation(${reservation.id})">
                                <i class="fas fa-check"></i> Marcar como Completada
                            </button>
                        ` : ''}
                        
                        ${reservation.status === 'completed' ? `
                            <button class="btn-undo-complete" 
                                    onclick="adminReservationCalendar.undoCompleteReservation(${reservation.id})">
                                <i class="fas fa-undo"></i> Revertir Completada
                            </button>
                        ` : ''}

                        ${reservation.status === 'cancelled' ? `
                            <button class="btn-revert-cancelled" 
                                    onclick="adminReservationCalendar.revertCancelledReservation(${reservation.id})">
                                <i class="fas fa-undo"></i> Revertir Cancelación
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Nueva función para marcar reserva como completada
    async completeReservation(reservationId) {
        if (!confirm('¿Estás seguro de que deseas marcar esta reservación como COMPLETADA?\nEsta acción actualizará el estado de la reserva.')) {
            return;
        }

        const btn = document.querySelector(`.reservation-item[data-reservation-id="${reservationId}"] .btn-complete-reservation`);
        let originalBtnHTML = null;
        if (btn) {
            originalBtnHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Completando...`;
        }

        try {
            const response = await fetch(`/admin/reservations/${reservationId}/complete`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification(result.message || 'Reservación marcada como completada exitosamente', 'success');
                await this.loadReservations();
            } else {
                throw new Error(result.message || 'Error al completar la reservación');
            }
        } catch (error) {
            console.error('Error completando reservación:', error);
            this.showNotification(error.message, 'error');
        } finally {
            if (btn && document.contains(btn)) {
                btn.disabled = false;
                btn.innerHTML = originalBtnHTML;
            }
        }
    }

    // Función para revertir estado de completada
    async undoCompleteReservation(reservationId) {
        if (!confirm('¿Estás seguro de que deseas revertir el estado de COMPLETADA de esta reservación?')) {
            return;
        }

        const btn = document.querySelector(`.reservation-item[data-reservation-id="${reservationId}"] .btn-undo-complete`);
        let originalBtnHTML = null;
        if (btn) {
            originalBtnHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Revertiendo...`;
        }

        try {
            const response = await fetch(`/admin/reservations/${reservationId}/undo-complete`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification(result.message || 'Estado de reservación revertido exitosamente', 'success');
                await this.loadReservations();
            } else {
                throw new Error(result.message || 'Error al revertir la reservación');
            }
        } catch (error) {
            console.error('Error revirtiendo reservación:', error);
            this.showNotification(error.message, 'error');
        } finally {
            if (btn && document.contains(btn)) {
                btn.disabled = false;
                btn.innerHTML = originalBtnHTML;
            }
        }
    }

    async revertCancelledReservation(reservationId) {
        if (!confirm('¿Estás seguro de que deseas revertir la cancelación de esta reservación?')) {
            return;
        }

        const btn = document.querySelector(`.reservation-item[data-reservation-id="${reservationId}"] .btn-revert-cancelled`);
        let originalBtnHTML = null;
        if (btn) {
            originalBtnHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Revertiendo...`;
        }

        try {
            const response = await fetch(`/admin/reservations/${reservationId}/revert-cancelled`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification(result.message || 'Cancelación revertida exitosamente', 'success');
                await this.loadReservations(); // Reload reservations to show the change
            } else {
                throw new Error(result.message || 'Error al revertir la cancelación');
            }
        } catch (error) {
            console.error('Error revirtiendo cancelación:', error);
            this.showNotification(error.message, 'error');
        } finally {
            if (btn && document.contains(btn)) {
                btn.disabled = false;
                btn.innerHTML = originalBtnHTML;
            }
        }
    }

    showAddRoomForm() {
        // Implementar formulario para agregar sala
        alert('Funcionalidad para agregar sala - Próximamente');
    }

    showAddExtraForm() {
        // Implementar formulario para agregar extra
        alert('Funcionalidad para agregar extra - Próximamente');
    }

    // Sobrescribir canCancelReservation para admin
    canCancelReservation(reservation) {
        // Los administradores pueden cancelar cualquier reserva que no esté completada o ya cancelada
        return !['completed', 'cancelled'].includes(reservation.status);
    }
}

// Inicializar el calendario de admin
document.addEventListener('DOMContentLoaded', () => {
    window.adminReservationCalendar = new AdminReservationCalendar();
});