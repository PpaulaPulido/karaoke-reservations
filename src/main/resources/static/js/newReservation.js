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
        await this.extrasManager.loadExtras();

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
                        if (this.validator.updateFormData) {
                            this.validator.updateFormData();
                        }
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
        if (this.validator.updateFormData) {
            this.validator.updateFormData();
        }

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
        }
    }

    updateConfirmationDetails() {
        const detailsContainer = document.getElementById('confirmation-details');
        if (!detailsContainer) return;

        if (this.validator.updateFormData) {
            this.validator.updateFormData();
        }

        const formData = this.validator.formData;
        const selectedRoom = this.roomManager.getSelectedRoom();
        const selectedExtras = this.extrasManager.getSelectedExtras();

        if (this.summaryReservation.updateSummary) {
            this.summaryReservation.updateSummary();
        }

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
        }
    }

    async confirmReservation() {
        const confirmBtn = document.getElementById('confirm-reservation');
        const originalText = confirmBtn.innerHTML;

        if (this.validator.updateFormData) {
            this.validator.updateFormData();
        }

        // Mostrar estado de carga
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;

        try {
            this.addExtrasToForm();
            this.addTotalToForm();
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

        if (!form || !submitBtn) {
            this.showGeneralError('Error interno del sistema. Por favor, recarga la página.');
            return;
        }

        // Prevenir envío duplicado
        if (submitBtn.disabled) {
            return;
        }

        if (this.validator.updateFormData) {
            this.validator.updateFormData();
        }

        // Mostrar estado de carga
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;

        try {
            // 1. Verificar que los datos necesarios estén presentes
            const formData = this.validator.formData;
            const selectedRoom = this.roomManager.getSelectedRoom();

            if (!formData.reservationDate || !formData.startTime || !formData.endTime ||
                !formData.numberOfPeople || !selectedRoom) {
                this.showGeneralError('Faltan datos requeridos para la reserva.');
                return;
            }

            // 2. Añadir total y extras al formulario
            this.addTotalToForm();
            this.addExtrasToForm();

            // 3. Verificar que el total se haya establecido correctamente
            const totalInput = document.getElementById('totalPriceInput');
            if (!totalInput || !totalInput.value || totalInput.value === '0') {
                this.showGeneralError('Error en el cálculo del total. Por favor, verifica los datos.');
                return;
            }

            // 4. Preparar datos del formulario
            const formDataToSend = new FormData(form);

            // 5. Enviar la solicitud
            const response = await fetch(form.action, {
                method: 'POST',
                body: formDataToSend,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            // 6. Procesar respuesta
            const responseText = await response.text();

            if (response.redirected) {
                window.location.href = response.url;
            } else if (response.ok) {
                document.open();
                document.write(responseText);
                document.close();

                // Reinicializar la aplicación JavaScript
                setTimeout(() => {
                    new ReservationApp();
                }, 100);
            } else {
                this.showGeneralError('Error del servidor: ' + response.status);
            }

        } catch (error) {
            console.error('Error enviando formulario:', error);
            this.showGeneralError('Error al crear la reserva. Por favor, intenta nuevamente.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            this.closeConfirmationModal();
        }
    }

    // Método auxiliar para mostrar errores del servidor
    displayServerErrors(errorData) {
        if (errorData.errors) {
            // Múltiples errores de validación
            const errorMessages = Object.values(errorData.errors).flat();
            this.showGeneralError('Errores de validación: ' + errorMessages.join(', '));
        } else if (errorData.message) {
            // Error único
            this.showGeneralError(errorData.message);
        } else {
            this.showGeneralError('Error desconocido del servidor.');
        }
    }

    // Método para añadir el total
    addTotalToForm() {
        try {
            if (this.validator.updateFormData) {
                this.validator.updateFormData();
            }

            if (this.summaryReservation.updateSummary) {
                this.summaryReservation.updateSummary();
            }

            const total = this.summaryReservation.getCalculatedTotal();
            const totalInput = document.getElementById('totalPriceInput');

            if (totalInput) {
                totalInput.value = total;
            } else {
                const form = document.getElementById('reservation-form');
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'totalPrice';
                input.id = 'totalPriceInput';
                input.value = total;
                form.appendChild(input);
            }
        } catch (error) {
            console.error('Error en addTotalToForm:', error);
        }
    }

    // Método para añadir extras
    addExtrasToForm() {
        try {
            const form = document.getElementById('reservation-form');
            const selectedExtras = this.extrasManager.getSelectedExtras();

            // Limpiar inputs anteriores de extras
            const existingExtraInputs = form.querySelectorAll('input[name="extraIds"]');
            existingExtraInputs.forEach(input => input.remove());

            // Agregar inputs para cada extra
            selectedExtras.forEach(extra => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'extraIds';
                input.value = extra.id;
                form.appendChild(input);
            });

        } catch (error) {
            console.error('Error en addExtrasToForm:', error);
        }
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

document.addEventListener('DOMContentLoaded', () => {
    new ReservationApp();
});