import RealTimeValidation from "./reservationBasic.js";
import RoomManager from './roomManager.js';

class ReservationApp {
    constructor() {
        this.validator = null;
        this.roomManager = null;
        this.init();
    }

    async init() {
        // Inicializar validaciones en tiempo real
        this.validator = new RealTimeValidation();
        
        // Inicializar gestor de salas
        this.roomManager = new RoomManager();
        
        // Hacer disponibles globalmente
        window.realTimeValidator = this.validator;
        window.roomManager = this.roomManager;

        // Cargar salas disponibles
        await this.roomManager.loadAvailableRooms();

        // Configurar filtros
        this.setupRoomFilters();
        
        // Configurar validación del formulario
        this.setupFormValidation();
        
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
                    }, 900);
                });
            }
        });
    }

    setupFormValidation() {
        const form = document.getElementById('reservation-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        // 1. Validar campos básicos
        const isBasicFormValid = this.validator.validateCompleteForm();
        
        // 2. Validar selección de sala
        const isRoomSelected = this.roomManager.validateRoomSelection();
        
        if (!isBasicFormValid || !isRoomSelected) {
            this.showGeneralError('Por favor, completa todos los campos requeridos y selecciona una sala.');
            this.scrollToFirstError();
            return;
        }

        // 3. Si todo está válido, enviar el formulario
        this.submitForm();
    }

    async submitForm() {
        const form = document.getElementById('reservation-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Mostrar estado de carga
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando reserva...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form)
            });

            if (response.ok) {
                window.location.href = '/reservations?success=true';
            } else {
                throw new Error('Error del servidor');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showGeneralError('Error al crear la reserva. Por favor, intenta nuevamente.');
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
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
