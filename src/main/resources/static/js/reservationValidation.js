/**
 * Muestra error en el campo
 */
export function showError(input, errorElement, message) {
    if (typeof input === 'string') {
        input = document.getElementById(input);
    }
    if (typeof errorElement === 'string') {
        errorElement = document.getElementById(errorElement);
    }

    if (input && errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('show');
        input.classList.add('error');
        input.classList.remove('valid');
    }
}

/**
 * Oculta error del campo
 */
export function hideError(input, errorElement) {
    if (typeof input === 'string') {
        input = document.getElementById(input);
    }
    if (typeof errorElement === 'string') {
        errorElement = document.getElementById(errorElement);
    }

    if (input && errorElement) {
        errorElement.style.display = 'none';
        errorElement.classList.remove('show');
        input.classList.remove('error');
        input.classList.add('valid');
    }
}

/**
 * Valida la fecha de reserva
 */
export function validateReservationDate(dateString) {
    const errors = [];
    
    if (!dateString) {
        errors.push('La fecha de reserva es obligatoria');
        return errors;
    }
    
    const selectedDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        errors.push('La fecha no puede ser anterior a hoy');
    }
    
    if (selectedDate > maxDate) {
        errors.push('Solo puedes reservar hasta un mes a partir de la fecha actual');
    }
    
    return errors;
}

/**
 * Valida si una hora está dentro del horario permitido (10:00 AM - 11:59 PM)
 */
function isValidBusinessHour(timeString) {
    if (!timeString) return false;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Horario permitido: 10:00 AM (600 min) - 11:59 PM (1439 min)
    return totalMinutes >= 600 && totalMinutes <= 1439;
}

/**
 * Valida si la hora de inicio cumple con las reglas
 */
function validateStartTimeRules(startTime, reservationDate) {
    const errors = [];
    
    if (!startTime) {
        errors.push('La hora de inicio es obligatoria');
        return errors;
    }
    
    // Validar horario comercial (10:00 AM - 11:59 PM)
    if (!isValidBusinessHour(startTime)) {
        errors.push('El horario de atención es de 10:00 AM a 11:59 PM');
        return errors;
    }
    
    // Si la fecha de reserva es hoy, validar que sea al menos 4 horas después de la hora actual
    const today = new Date().toISOString().split('T')[0];
    if (reservationDate === today) {
        const now = new Date();
        const selectedStartTime = new Date(reservationDate + 'T' + startTime);
        const timeDifference = (selectedStartTime - now) / (1000 * 60 * 60); // diferencia en horas
        
        if (timeDifference < 4) {
            errors.push('Debes reservar con al menos 4 horas de anticipación para el día de hoy');
        }
    }
    
    return errors;
}

/**
 * Valida el horario completo
 */
export function validateTime(startTime, endTime, reservationDate) {
    const errors = [];
    
    // Validaciones de hora de inicio
    const startTimeErrors = validateStartTimeRules(startTime, reservationDate);
    errors.push(...startTimeErrors);
    
    // Validaciones de hora de fin
    if (!endTime) {
        errors.push('La hora de fin es obligatoria');
    } else {
        // Validar horario comercial para hora de fin
        if (!isValidBusinessHour(endTime)) {
            errors.push('El horario de atención es de 10:00 AM a 11:59 PM');
        }
        
        // Validar que hora fin sea posterior a hora inicio
        if (startTime && endTime && startTime >= endTime) {
            errors.push('La hora de fin debe ser posterior a la hora de inicio');
        }
        
        // Validar duración mínima (30 minutos) y máxima (2 horas)
        if (startTime && endTime && startTime < endTime) {
            const start = new Date('2000-01-01T' + startTime);
            const end = new Date('2000-01-01T' + endTime);
            const duration = (end - start) / (1000 * 60); // duración en minutos
            
            if (duration < 30) {
                errors.push('La reserva debe ser de al menos 30 minutos');
            }
            
            if (duration > 120) {
                errors.push('La reserva no puede exceder las 2 horas');
            }
        }
        
        // Validar que no sea en el pasado (solo si la fecha es hoy)
        if (reservationDate) {
            const today = new Date().toISOString().split('T')[0];
            if (reservationDate === today) {
                const now = new Date();
                const selectedEndTime = new Date(reservationDate + 'T' + endTime);
                
                if (selectedEndTime < now) {
                    errors.push('No puedes reservar para un horario que ya pasó');
                }
            }
        }
    }
    
    return errors;
}

/**
 * Valida el número de personas
 */
export function validateNumberOfPeople(number, room) {
    const errors = [];
    
    if (!number || number < 2) {
        errors.push('El número de personas debe ser al menos 2');
        return errors;
    }
    
    if (number > 15) {
        errors.push('El número máximo de personas por reserva es 15');
        return errors;
    }
    
    if (room) {
        if (number < room.minCapacity) {
            errors.push(`Esta sala requiere un mínimo de ${room.minCapacity} personas`);
        }
        
        if (number > room.maxCapacity) {
            errors.push(`Esta sala admite un máximo de ${room.maxCapacity} personas`);
        }
    }
    
    return errors;
}

/**
 * Valida la selección de sala
 */
export function validateRoom(roomId, rooms) {
    const errors = [];
    
    if (!roomId) {
        errors.push('Debes seleccionar una sala');
        return errors;
    }
    
    const room = rooms.find(r => r.id === parseInt(roomId));
    if (!room) {
        errors.push('Sala no válida');
    } else if (!room.available) {
        errors.push('Esta sala no está disponible');
    }
    
    return errors;
}

/**
 * Valida todo el formulario
 */
export function validateCompleteForm(formData, currentRoom, rooms) {
    const errors = {};
    
    // Validar fecha
    if (!formData.reservationDate) {
        errors.reservationDate = 'La fecha de reserva es obligatoria';
    } else {
        const dateErrors = validateReservationDate(formData.reservationDate);
        if (dateErrors.length > 0) {
            errors.reservationDate = dateErrors[0];
        }
    }
    
    // Validar horario
    if (!formData.startTime || !formData.endTime) {
        if (!formData.startTime) errors.startTime = 'La hora de inicio es obligatoria';
        if (!formData.endTime) errors.endTime = 'La hora de fin es obligatoria';
    } else {
        const timeErrors = validateTime(formData.startTime, formData.endTime, formData.reservationDate);
        if (timeErrors.length > 0) {
            errors.startTime = timeErrors[0];
            errors.endTime = timeErrors[0];
        }
    }
    
    // Validar número de personas
    if (!formData.numberOfPeople) {
        errors.numberOfPeople = 'El número de personas es obligatorio';
    } else {
        const number = parseInt(formData.numberOfPeople);
        if (isNaN(number)) {
            errors.numberOfPeople = 'El número de personas debe ser un valor válido';
        } else {
            const peopleErrors = validateNumberOfPeople(number, currentRoom);
            if (peopleErrors.length > 0) {
                errors.numberOfPeople = peopleErrors[0];
            }
        }
    }
    
    // Validar sala
    if (!formData.room) {
        errors.room = 'Debes seleccionar una sala';
    } else {
        const roomErrors = validateRoom(formData.room, rooms);
        if (roomErrors.length > 0) {
            errors.room = roomErrors[0];
        }
    }
    
    return errors;
}