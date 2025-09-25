import { sampleRooms, sampleExtras } from "./data.js";
import { 
    showError, 
    hideError, 
    validateReservationDate, 
    validateTime, 
    validateNumberOfPeople, 
    validateRoom, 
    validateCompleteForm
} from "./reservationValidation.js";

// Estado de la aplicación
let selectedExtras = [];
let currentRoom = null;
let formData = {
    reservationDate: '',
    startTime: '',
    endTime: '',
    numberOfPeople: '',
    room: '',
    celebrationType: ''
};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadFormData();
    setTimeout(fixSelectStyles, 100);
});

function fixSelectStyles() {
    const selects = document.querySelectorAll('select.form-input');
    selects.forEach(select => {
        select.style.cssText = `
            background-color: #1a1a2e !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 16px !important;
            padding: 1rem !important;
            font-size: 1rem !important;
            width: 100% !important;
        `;
        
        select.addEventListener('change', function() {
            this.style.color = '#ffffff';
        });
        select.style.color = '#ffffff';
    });
}

function initializePage() {
    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reservationDate').min = today;
    
    // Establecer fecha máxima (1 mes desde hoy)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    document.getElementById('reservationDate').max = maxDate.toISOString().split('T')[0];
    
    // Establecer hora mínima para hoy
    setMinTimeForToday();
    
    // Cargar opciones de salas
    loadRoomOptions();
    
    // Cargar opciones de extras
    loadExtraOptions();
    
    // Actualizar resumen inicial
    updateReservationSummary();
}

function setMinTimeForToday() {
    const dateInput = document.getElementById('reservationDate');
    const startTimeInput = document.getElementById('startTime');
    
    dateInput.addEventListener('change', function() {
        const today = new Date().toISOString().split('T')[0];
        const selectedDate = this.value;
        
        if (selectedDate === today) {
            // Para hoy: mínimo 4 horas después de la hora actual
            const now = new Date();
            now.setHours(now.getHours() + 4);
            
            // Redondear a los próximos 30 minutos
            const minutes = now.getMinutes();
            const roundedMinutes = minutes < 30 ? 30 : 0;
            if (roundedMinutes === 0) {
                now.setHours(now.getHours() + 1);
            }
            now.setMinutes(roundedMinutes, 0, 0);
            
            const minTime = now.toTimeString().slice(0, 5);
            startTimeInput.min = minTime;
        } else {
            // Para otros días: permitir desde las 10:00 AM
            startTimeInput.min = '10:00';
        }
    });
}

function setupEventListeners() {
    const form = document.getElementById('reservation-form');
    
    // IMPORTANTE: Prevenir el envío del formulario por defecto
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Esto previene el envío automático
        handleFormSubmit(event);
    });
    
    // Eventos de cambios en los campos
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('change', handleInputChange);
        input.addEventListener('input', handleInputChange);
    });
    
    // Eventos específicos para tiempo
    document.getElementById('startTime').addEventListener('change', function() {
        handleInputChange({ target: this });
        updateEndTimeOptions();
        validateTimeFields();
    });
    
    document.getElementById('endTime').addEventListener('change', function() {
        handleInputChange({ target: this });
        validateTimeFields();
    });
    
    // Evento de selección de sala
    document.getElementById('room').addEventListener('change', handleRoomSelection);
    
    // Evento de filtro de extras
    document.getElementById('extra-type-filter').addEventListener('change', filterExtras);
    
    // Eventos del modal
    document.querySelector('.close-modal').addEventListener('click', closeConfirmationModal);
    document.getElementById('cancel-confirmation').addEventListener('click', closeConfirmationModal);
    document.getElementById('confirm-reservation').addEventListener('click', confirmReservation);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('confirmation-modal')) {
            closeConfirmationModal();
        }
    });
}

function updateEndTimeOptions() {
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    
    if (!startTimeInput.value) return;
    
    const [startHours, startMinutes] = startTimeInput.value.split(':').map(Number);
    
    // Hora mínima: 30 minutos después
    const minTime = new Date(2000, 0, 1, startHours, startMinutes + 30);
    const minTimeString = minTime.toTimeString().slice(0, 5);
    
    // Hora máxima: 2 horas después
    const maxTime = new Date(2000, 0, 1, startHours + 2, startMinutes);
    const maxTimeString = maxTime.toTimeString().slice(0, 5);
    
    endTimeInput.min = minTimeString;
    endTimeInput.max = maxTimeString;
    
    // Si la hora fin actual no es válida, limpiarla
    if (endTimeInput.value && (endTimeInput.value < minTimeString || endTimeInput.value > maxTimeString)) {
        endTimeInput.value = '';
        formData.endTime = '';
        updateReservationSummary();
    }
}

function handleInputChange(event) {
    const input = event.target;
    const fieldName = input.name;
    const value = input.value;
    
    // Actualizar formData
    formData[fieldName] = value;
    
    // Validar campo en tiempo real
    validateFieldInRealTime(input);
    
    // Actualizar resumen inmediatamente
    updateReservationSummary();
}

function validateFieldInRealTime(input) {
    const fieldName = input.name;
    const value = input.value;
    const errorElement = document.getElementById(`${fieldName}-error`);
    
    // Ocultar error inicialmente
    hideError(input, errorElement);
    
    let errors = [];
    
    switch(fieldName) {
        case 'reservationDate':
            errors = validateReservationDate(value);
            break;
            
        case 'numberOfPeople':
            const number = parseInt(value) || 0;
            errors = validateNumberOfPeople(number, currentRoom);
            break;
            
        case 'room':
            errors = validateRoom(value, sampleRooms);
            break;
    }
    
    // Mostrar error si existe
    if (errors.length > 0) {
        showError(input, errorElement, errors[0]);
    }
}

function validateTimeFields() {
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const startTimeError = document.getElementById('start-time-error');
    const endTimeError = document.getElementById('end-time-error');
    
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    
    // Ocultar errores inicialmente
    hideError(startTimeInput, startTimeError);
    hideError(endTimeInput, endTimeError);
    
    if (!startTime && !endTime) return;
    
    const errors = validateTime(startTime, endTime, formData.reservationDate);
    
    if (errors.length > 0) {
        showError(startTimeInput, startTimeError, errors[0]);
        showError(endTimeInput, endTimeError, errors[0]);
    }
}

function validateForm() {
    // Validar todos los campos
    const errors = validateCompleteForm(formData, currentRoom, sampleRooms);
    
    // Limpiar todos los errores primero
    document.querySelectorAll('.error-message').forEach(errorElement => {
        errorElement.style.display = 'none';
        errorElement.classList.remove('show');
    });
    
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error');
    });
    
    // Mostrar errores encontrados
    let hasErrors = false;
    Object.keys(errors).forEach(fieldName => {
        const input = document.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (input && errorElement && errors[fieldName]) {
            showError(input, errorElement, errors[fieldName]);
            hasErrors = true;
        }
    });
    
    // Validación especial para tiempo
    validateTimeFields();
    if (document.querySelector('#start-time-error.show') || document.querySelector('#end-time-error.show')) {
        hasErrors = true;
    }
    
    return !hasErrors; // Retorna true si NO hay errores
}

function loadFormData() {
    formData.user = {
        id: 1,
        fullName: document.querySelector('.user-details h3').textContent
    };
}

function loadRoomOptions() {
    const roomSelect = document.getElementById('room');
    roomSelect.innerHTML = '<option value="">Selecciona una sala</option>';
    
    sampleRooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.name} (${room.minCapacity}-${room.maxCapacity} personas)`;
        option.disabled = !room.available;
        roomSelect.appendChild(option);
    });
}

function loadExtraOptions() {
    const extrasGrid = document.getElementById('extras-grid');
    extrasGrid.innerHTML = '';
    
    sampleExtras.forEach(extra => {
        const extraCard = document.createElement('div');
        extraCard.className = 'extra-card';
        extraCard.setAttribute('data-type', extra.type);
        extraCard.setAttribute('data-extra-id', extra.id);
        extraCard.innerHTML = `
            <div class="extra-header">
                <div class="extra-name">${extra.name}</div>
                <div class="extra-type">${extra.type}</div>
            </div>
            <div class="extra-price">$${extra.price.toLocaleString()}</div>
            <div class="extra-description">${extra.description}</div>
        `;
        
        extraCard.addEventListener('click', () => toggleExtraSelection(extra, extraCard));
        extrasGrid.appendChild(extraCard);
    });
}

function handleRoomSelection(event) {
    const roomId = parseInt(event.target.value);
    currentRoom = sampleRooms.find(room => room.id === roomId);
    
    const roomInfo = document.getElementById('room-info');
    const roomDescription = document.getElementById('room-description');
    const roomCapacity = document.getElementById('room-capacity');
    const roomAvailability = document.getElementById('room-availability');
    
    if (currentRoom) {
        roomInfo.style.display = 'block';
        roomDescription.textContent = currentRoom.description;
        roomCapacity.textContent = `${currentRoom.minCapacity} - ${room.maxCapacity} personas`;
        roomAvailability.textContent = currentRoom.available ? 'Disponible' : 'No disponible';
        roomAvailability.style.color = currentRoom.available ? 'var(--success-color)' : 'var(--error-color)';
        
        // Validar número de personas con la nueva sala
        const peopleInput = document.getElementById('numberOfPeople');
        if (peopleInput.value) {
            validateFieldInRealTime(peopleInput);
        }
    } else {
        roomInfo.style.display = 'none';
    }
    
    updateReservationSummary();
}

function filterExtras() {
    const filterValue = document.getElementById('extra-type-filter').value;
    const extraCards = document.querySelectorAll('.extra-card');
    
    extraCards.forEach(card => {
        if (filterValue === 'all' || card.getAttribute('data-type') === filterValue) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function toggleExtraSelection(extra, card) {
    const isSelected = selectedExtras.some(selected => selected.id === extra.id);
    
    if (isSelected) {
        selectedExtras = selectedExtras.filter(selected => selected.id !== extra.id);
        card.classList.remove('selected');
    } else {
        selectedExtras.push(extra);
        card.classList.add('selected');
    }
    
    updateSelectedExtrasList();
    updateReservationSummary();
}

function updateSelectedExtrasList() {
    const selectedExtrasContainer = document.getElementById('selected-extras');
    const selectedExtrasList = document.getElementById('selected-extras-list');
    
    if (selectedExtras.length === 0) {
        selectedExtrasContainer.style.display = 'none';
        return;
    }
    
    selectedExtrasContainer.style.display = 'block';
    selectedExtrasList.innerHTML = selectedExtras.map(extra => `
        <div class="selected-extra-item">
            ${extra.name} - $${extra.price.toLocaleString()}
            <button class="remove-extra" onclick="window.removeExtra(${extra.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Función global para remover extras
window.removeExtra = function(extraId) {
    selectedExtras = selectedExtras.filter(extra => extra.id !== extraId);
    
    const extraCard = document.querySelector(`.extra-card[data-extra-id="${extraId}"]`);
    if (extraCard) {
        extraCard.classList.remove('selected');
    }
    
    updateSelectedExtrasList();
    updateReservationSummary();
}

function updateReservationSummary() {
    document.getElementById('summary-date').textContent = 
        formData.reservationDate ? formatDate(formData.reservationDate) : '-';
    
    document.getElementById('summary-time').textContent = 
        formData.startTime && formData.endTime ? 
        `${formData.startTime.substring(0, 5)} - ${formData.endTime.substring(0, 5)}` : '-';
    
    document.getElementById('summary-people').textContent = 
        formData.numberOfPeople || '-';
    
    document.getElementById('summary-room').textContent = 
        currentRoom ? currentRoom.name : '-';
    
    const extrasText = selectedExtras.length > 0 ? 
        selectedExtras.map(extra => extra.name).join(', ') : 'Ninguno';
    document.getElementById('summary-extras').textContent = extrasText;
    
    const total = calculateTotal();
    document.getElementById('summary-total').textContent = `$${total.toLocaleString()}`;
}

function calculateTotal() {
    let total = 0;
    
    if (currentRoom) {
        total += currentRoom.basePrice;
    }
    
    selectedExtras.forEach(extra => {
        total += extra.price;
    });
    
    return total;
}

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', options);
}

// FUNCIÓN CRÍTICA CORREGIDA - Ahora sí previene el envío con errores
function handleFormSubmit(event) {
    console.log('Validando formulario...');
    
    // Validar el formulario
    const isValid = validateForm();
    
    if (!isValid) {
        console.log('Formulario tiene errores, no se puede enviar');
        showNotification('Por favor, corrige los errores en el formulario', 'error');
        return false; // Detener el envío
    }
    
    console.log('Formulario válido, mostrando modal de confirmación');
    prepareConfirmationModal();
    document.getElementById('confirmation-modal').style.display = 'block';
    
    return false; // Siempre prevenir el envío por defecto
}

function prepareConfirmationModal() {
    const confirmationDetails = document.getElementById('confirmation-details');
    
    confirmationDetails.innerHTML = `
        <div class="summary-item">
            <span class="summary-label">Fecha:</span>
            <span>${formatDate(formData.reservationDate)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Horario:</span>
            <span>${formData.startTime.substring(0, 5)} - ${formData.endTime.substring(0, 5)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Personas:</span>
            <span>${formData.numberOfPeople}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Sala:</span>
            <span>${currentRoom.name}</span>
        </div>
        ${formData.celebrationType ? `
        <div class="summary-item">
            <span class="summary-label">Celebración:</span>
            <span>${formData.celebrationType}</span>
        </div>
        ` : ''}
        <div class="summary-item">
            <span class="summary-label">Extras:</span>
            <span>${selectedExtras.length > 0 ? selectedExtras.map(extra => extra.name).join(', ') : 'Ninguno'}</span>
        </div>
        <div class="summary-item total">
            <span class="summary-label">Total:</span>
            <span>$${calculateTotal().toLocaleString()}</span>
        </div>
    `;
}

function closeConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
}

function confirmReservation() {
    // Aquí enviarías el formulario real a Spring Boot
    const form = document.getElementById('reservation-form');
    
    // Crear inputs hidden para los datos que no están en el form original
    const roomInput = document.createElement('input');
    roomInput.type = 'hidden';
    roomInput.name = 'roomId';
    roomInput.value = formData.room;
    form.appendChild(roomInput);
    
    const extrasInput = document.createElement('input');
    extrasInput.type = 'hidden';
    extrasInput.name = 'extras';
    extrasInput.value = JSON.stringify(selectedExtras.map(extra => extra.id));
    form.appendChild(extrasInput);
    
    // Enviar el formulario real a Spring Boot
    form.submit();
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);