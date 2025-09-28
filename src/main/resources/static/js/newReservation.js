import RealTimeValidation from "./reservationBasic.js";
import RoomManager from './roomManager.js';
import ExtrasManager from './extrasManager.js';
import SummaryReservation from './summaryReservation.js';

class ReservationApp {
    constructor() {
        this.validator = null;
        this.roomManager = null;
        this.extrasManager = null;
        this.summaryReservation = null;
        this.init();
    }

    async init() {
        this.validator = new RealTimeValidation();
        this.roomManager = new RoomManager();
        this.extrasManager = new ExtrasManager();
        this.summaryReservation = new SummaryReservation(this.validator, this.roomManager, this.extrasManager);

        // Hacer disponibles globalmente
        window.realTimeValidator = this.validator;
        window.roomManager = this.roomManager;
        window.extrasManager = this.extrasManager;
        window.summaryReservation = this.summaryReservation;

        await this.roomManager.loadAvailableRooms();

        this.setupRoomFilters();
        this.setupFormValidation();
        this.setupModalEvents();

        console.log('Sistema de reservas inicializado correctamente');
    }

    setupRoomFilters() {
        // Actualizar salas cuando cambie el número de personas
        const peopleInput = document.getElementById('numberOfPeople');
        if (peopleInput) {
            peopleInput.addEventListener('change', async (e) => {
                const numberOfPeople = parseInt(e.target.value);
                if (numberOfPeople >= 2 && numberOfPeople <= 15) {
                    await this.roomManager.loadAvailableRooms(numberOfPeople);
                }
            });

            peopleInput.addEventListener('input', async (e) => {
                const numberOfPeople = parseInt(e.target.value);
                if (numberOfPeople >= 2 && numberOfPeople <= 15) {
                    setTimeout(async () => {
                        await this.roomManager.loadAvailableRooms(numberOfPeople);
                    }, 300);
                }
            });
        }

        // Actualizar salas cuando cambien la fecha u horario
        const filterInputs = ['reservationDate', 'startTime', 'endTime'];
        filterInputs.forEach(inputName => {
            const input = document.getElementById(inputName);
            if (input) {
                input.addEventListener('change', async (e) => {
                    setTimeout(async () => {
                        const formData = this.validator.formData;
                        if (formData.reservationDate && formData.startTime && formData.endTime) {
                            await this.roomManager.loadAvailableRooms(formData.numberOfPeople);
                        }
                    }, 500);
                });
            }
        });
    }

    setupModalEvents() {
        // Botón para cerrar modal
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeConfirmationModal());
        }

        // Botón cancelar en el modal
        const cancelBtn = document.getElementById('cancel-confirmation');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeConfirmationModal());
        }

        // Botón confirmar en el modal
        const confirmBtn = document.getElementById('confirm-reservation');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmReservation());
        }

        // Cerrar modal al hacer click fuera del contenido
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeConfirmationModal();
                }
            });
        }
    }

    setupFormValidation() {
        const form = document.getElementById('reservation-form');
        const submitBtn = document.getElementById('submit-btn');

        if (form && submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showConfirmationModal();
            });
        }
    }

    showConfirmationModal() {
        // Validar formulario antes de mostrar el modal
        const isBasicFormValid = this.validator.validateCompleteForm();
        const isRoomSelected = this.roomManager.validateRoomSelection();

        if (!isBasicFormValid || !isRoomSelected) {
            this.showGeneralError('Por favor, completa todos los campos requeridos y selecciona una sala.');
            this.scrollToFirstError();
            return;
        }

        // Actualizar los detalles en el modal
        this.updateConfirmationDetails();

        // Mostrar el modal
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }
    }

    updateConfirmationDetails() {
        const detailsContainer = document.getElementById('confirmation-details');
        if (!detailsContainer) return;

        const formData = this.validator.formData;
        const selectedRoom = this.roomManager.getSelectedRoom();
        const selectedExtras = this.extrasManager.getSelectedExtras();
        const total = this.summaryReservation.getCalculatedTotal();

        const detailsHTML = `
            <div class="confirmation-item">
                <strong>Fecha:</strong> ${formData.reservationDate ? this.formatDate(formData.reservationDate) : '-'}
            </div>
            <div class="confirmation-item">
                <strong>Horario:</strong> ${formData.startTime && formData.endTime ?
                `${this.formatTime(formData.startTime)} - ${this.formatTime(formData.endTime)}` : '-'}
            </div>
            <div class="confirmation-item">
                <strong>Personas:</strong> ${formData.numberOfPeople || '-'}
            </div>
            <div class="confirmation-item">
                <strong>Sala:</strong> ${selectedRoom ? selectedRoom.name : '-'}
            </div>
            <div class="confirmation-item">
                <strong>Extras:</strong> ${selectedExtras.length > 0 ?
                selectedExtras.map(extra => extra.name).join(', ') : 'Ninguno'}
            </div>
            <div class="confirmation-item total">
                <strong>Total:</strong> $${total.toLocaleString()}
            </div>
        `;

        detailsContainer.innerHTML = detailsHTML;
    }

    closeConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
        }
    }

    async confirmReservation() {
        const confirmBtn = document.getElementById('confirm-reservation');
        const originalText = confirmBtn.innerHTML;

        // Mostrar estado de carga
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;

        try {
            // ✅ AGREGAR: Asegurar que los extras se añaden antes de enviar
            this.addExtrasToForm();
            await this.submitForm();
        } catch (error) {
            console.error('Error confirmando reserva:', error);
            this.showGeneralError('Error al crear la reserva. Por favor, intenta nuevamente.');
        } finally {
            // Restaurar botón
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }

    async submitForm() {
        const form = document.getElementById('reservation-form');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Mostrar estado de carga
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;

        try {
            // ✅ AGREGAR: Asegurar que los extras se añaden al formulario
            this.addExtrasToForm();

            // Preparar datos del formulario
            const formData = new FormData(form);

            // ✅ DEBUG: Ver qué datos se están enviando
            console.log('Datos del formulario:');
            for (let [key, value] of formData.entries()) {
                console.log(key + ': ' + value);
            }

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'text/html, application/xhtml+xml',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                // ✅ Redirección exitosa
                window.location.href = '/reservations/my-reservations?success=true';
            } else if (response.status === 400) {
                // Manejar errores de validación
                try {
                    const errorData = await response.json();
                    this.displayServerErrors(errorData);
                } catch (e) {
                    this.showGeneralError('Error en la validación de datos');
                }
            } else {
                throw new Error('Error del servidor: ' + response.status);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showGeneralError('Error al crear la reserva. Por favor, intenta nuevamente.');
        } finally {
            // ✅ Asegurar que el botón se restaura siempre
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            this.closeConfirmationModal();
        }
    }

    addTotalToForm() {
        const form = document.getElementById('reservation-form');
        const total = this.summaryReservation.getCalculatedTotal();

        // Limpiar input anterior
        document.querySelectorAll('input[name="totalPrice"]').forEach(input => input.remove());

        // Agregar input con el total
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'totalPrice';
        input.value = total;
        form.appendChild(input);
    }

    addExtrasToForm() {
        const form = document.getElementById('reservation-form');
        const selectedExtras = this.extrasManager.getSelectedExtras();

        // Limpiar inputs anteriores de extras
        const existingExtraInputs = form.querySelectorAll('input[name="extraIds"]');
        existingExtraInputs.forEach(input => input.remove());

        // Agregar inputs para cada extra
        selectedExtras.forEach(extra => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'extraIds'; // ✅ debe coincidir con el DTO
            input.value = extra.id;
            form.appendChild(input);
        });

        console.log('Extras añadidos al formulario:', selectedExtras.map(e => e.id));
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-ES');
    }

    formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${period}`;
    }

    showGeneralError(message) {
        const errorContainer = document.getElementById('constraint-messages');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="constraint-message error">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                </div>
            `;
            errorContainer.style.display = 'block';
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    scrollToFirstError() {
        const errorElements = document.querySelectorAll('.error-message.show');
        if (errorElements.length > 0) {
            errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const roomError = document.getElementById('room-error');
        if (roomError && roomError.style.display === 'block') {
            roomError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new ReservationApp();
});