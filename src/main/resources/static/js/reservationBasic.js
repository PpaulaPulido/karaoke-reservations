import { 
    showError, 
    hideError, 
    validateReservationDate, 
    validateTime, 
    validateNumberOfPeople, 
    calculateAndFormatDuration
} from './validationBasicReserv.js';

class RealTimeValidation {
    constructor() {
        this.formData = {
            reservationDate: '',
            startTime: '',
            endTime: '',
            numberOfPeople: ''
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDateRestrictions();
        this.setupFormSubmission(); 
    }

    setupEventListeners() {
        // Event listeners para validación en tiempo real
        const reservationDateInput = document.getElementById('reservationDate');
        const startTimeInput = document.getElementById('startTime');
        const endTimeInput = document.getElementById('endTime');
        const numberOfPeopleInput = document.getElementById('numberOfPeople');

        // Validación de fecha
        if (reservationDateInput) {
            reservationDateInput.addEventListener('input', (e) => this.validateDateField(e.target));
            reservationDateInput.addEventListener('change', (e) => this.validateDateField(e.target));
            reservationDateInput.addEventListener('blur', (e) => this.validateDateField(e.target));
        }

        // Validación de hora de inicio
        if (startTimeInput) {
            startTimeInput.addEventListener('input', (e) => this.validateTimeFields());
            startTimeInput.addEventListener('change', (e) => this.validateTimeFields());
            startTimeInput.addEventListener('blur', (e) => this.validateTimeFields());
        }

        // Validación de hora de fin
        if (endTimeInput) {
            endTimeInput.addEventListener('input', (e) => this.validateTimeFields());
            endTimeInput.addEventListener('change', (e) => this.validateTimeFields());
            endTimeInput.addEventListener('blur', (e) => this.validateTimeFields());
        }

        // Validación de número de personas
        if (numberOfPeopleInput) {
            numberOfPeopleInput.addEventListener('input', (e) => this.validateNumberOfPeopleField(e.target));
            numberOfPeopleInput.addEventListener('change', (e) => this.validateNumberOfPeopleField(e.target));
            numberOfPeopleInput.addEventListener('blur', (e) => this.validateNumberOfPeopleField(e.target));
        }

        // Actualizar duración cuando cambien los tiempos
        if (startTimeInput && endTimeInput) {
            startTimeInput.addEventListener('change', () => this.updateDurationField());
            endTimeInput.addEventListener('change', () => this.updateDurationField());
        }
    }

    // NUEVO MÉTODO: Configurar la prevención del envío del formulario
    setupFormSubmission() {
        const form = document.getElementById('reservation-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                if (!this.validateCompleteForm()) {
                    e.preventDefault(); // ← Prevenir el envío del formulario
                    this.showGeneralError('Por favor, corrige todos los errores antes de enviar el formulario.');
                } else {
                    // Opcional: Mostrar mensaje de éxito o proceder con el envío
                    console.log('Formulario válido, se puede enviar');
                }
            });
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
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        } else {
            // Fallback: usar alert si no existe el contenedor
            alert(message);
        }
    }

    initializeDateRestrictions() {
        const dateInput = document.getElementById('reservationDate');
        if (!dateInput) return;
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Set min date to today
        dateInput.min = todayStr;
        
        // Set max date to 2 months from now
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 2);
        dateInput.max = maxDate.toISOString().split('T')[0];
    }

    validateDateField(input) {
        const value = input.value;
        const errorElement = document.getElementById('reservationDate-error');
        this.formData.reservationDate = value;
        hideError(input, errorElement);

        if (!value) {
            showError(input, errorElement, 'La fecha de reserva es obligatoria');
            return false;
        }

        const errors = validateReservationDate(value);
        if (errors.length > 0) {
            showError(input, errorElement, errors[0]);
            return false;
        }

        // Si la fecha es válida, actualizar restricciones de tiempo
        this.updateTimeRestrictions();
        return true;
    }

    validateTimeFields() {
        const startTimeInput = document.getElementById('startTime');
        const endTimeInput = document.getElementById('endTime');
        const startErrorElement = document.getElementById('startTime-error');
        const endErrorElement = document.getElementById('endTime-error');

        if (!startTimeInput || !endTimeInput || !startErrorElement || !endErrorElement) return false;

        // Actualizar datos del formulario
        this.formData.startTime = startTimeInput.value;
        this.formData.endTime = endTimeInput.value;

        // Limpiar errores anteriores
        hideError(startTimeInput, startErrorElement);
        hideError(endTimeInput, endErrorElement);

        // Si ambos campos están vacíos, no mostrar error
        if (!this.formData.startTime && !this.formData.endTime) {
            return true;
        }

        // Validar los tiempos
        const errors = validateTime(this.formData.startTime, this.formData.endTime, this.formData.reservationDate);
        
        if (errors.length > 0) {
            // Mostrar el mismo error en ambos campos
            showError(startTimeInput, startErrorElement, errors[0]);
            showError(endTimeInput, endErrorElement, errors[0]);
            return false;
        }

        return true;
    }

    validateNumberOfPeopleField(input) {
        const value = input.value;
        const errorElement = document.getElementById('numberOfPeople-error');
        
        // Actualizar datos del formulario
        this.formData.numberOfPeople = value;

        // Limpiar error anterior
        hideError(input, errorElement);

        if (!value || value.trim() === '') {
            showError(input, errorElement, 'El número de personas es obligatorio');
            return false;
        }

        const errors = validateNumberOfPeople(value);
        if (errors.length > 0) {
            showError(input, errorElement, errors[0]);
            return false;
        }

        return true;
    }

    updateTimeRestrictions() {
        const dateInput = document.getElementById('reservationDate');
        const startTimeInput = document.getElementById('startTime');
        
        if (!dateInput || !startTimeInput) return;
        
        const today = new Date().toISOString().split('T')[0];
        const selectedDate = dateInput.value;

        if (selectedDate === today) {
            // Para hoy, establecer hora mínima como hora actual + 4 horas
            const now = new Date();
            now.setHours(now.getHours() + 4);
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            startTimeInput.min = `${hours}:${minutes}`;
        } else {
            // Para fechas futuras, hora mínima es 18:00
            startTimeInput.min = '18:00';
        }
        
        // Horario de negocio: 18:00 a 02:00
        startTimeInput.max = '02:00';
    }

    updateDurationField() {
        const startTime = this.formData.startTime;
        const endTime = this.formData.endTime;
        const durationInput = document.getElementById('durationMinutes');
        
        if (!durationInput) return;

        if (startTime && endTime) {
            const durationFormatted = calculateAndFormatDuration(startTime, endTime);
            if (durationFormatted) {
                durationInput.value = durationFormatted;
            } else {
                durationInput.value = '';
            }
        } else {
            durationInput.value = '';
        }
    }

    // Método para validar todo el formulario antes de enviar
    validateCompleteForm() {
        const dateInput = document.getElementById('reservationDate');
        const startTimeInput = document.getElementById('startTime');
        const endTimeInput = document.getElementById('endTime');
        const peopleInput = document.getElementById('numberOfPeople');

        let isValid = true;

        // Validar fecha
        if (dateInput) {
            isValid = this.validateDateField(dateInput) && isValid;
        }

        // Validar tiempos
        isValid = this.validateTimeFields() && isValid;

        // Validar número de personas
        if (peopleInput) {
            isValid = this.validateNumberOfPeopleField(peopleInput) && isValid;
        }

        // También validar que se haya seleccionado una sala (si aplica)
        const roomIdInput = document.getElementById('selectedRoomId');
        if (roomIdInput && roomIdInput.required) {
            const roomErrorElement = document.getElementById('room-error');
            if (!roomIdInput.value) {
                showError(roomIdInput, roomErrorElement, 'Debes seleccionar una sala');
                isValid = false;
            } else {
                hideError(roomIdInput, roomErrorElement);
            }
        }

        return isValid;
    }

    // Método para obtener los datos del formulario validados
    getValidatedFormData() {
        if (this.validateCompleteForm()) {
            return { ...this.formData };
        }
        return null;
    }
}

export default RealTimeValidation;