// Funciones auxiliares para mostrar/ocultar errores
export function showError(input, errorElement, message) {
    if (typeof input === 'string') input = document.getElementById(input);
    if (typeof errorElement === 'string') errorElement = document.getElementById(errorElement);

    if (input && errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('show');
        input.classList.add('error');
        input.classList.remove('valid');
    }
}

export function hideError(input, errorElement) {
    if (typeof input === 'string') input = document.getElementById(input);
    if (typeof errorElement === 'string') errorElement = document.getElementById(errorElement);

    if (input && errorElement) {
        errorElement.style.display = 'none';
        errorElement.classList.remove('show');
        input.classList.remove('error');
        input.classList.add('valid');
    }
}

/** Comprueba si la fecha corresponde a un día abierto: jueves(4), viernes(5), sábado(6), domingo(0)*/
function isOpenDay(dateString) {
    const d = new Date(dateString + 'T00:00:00');
    const day = d.getDay(); // 0=domingo, 1=lunes, ... 6=sábado
    return day === 0 || day === 4 || day === 5 || day === 6;
}

// Valida si una hora cae dentro del horario permitido: 18:00 - 02:00.
function isValidBusinessHour(timeString) {
    if (!timeString) return false;
    const [h, m] = timeString.split(':').map(Number);
    const minutes = h * 60 + m;

    // 18:00 -> 1080 ; 23:59 -> 1439 ; 00:00 -> 0 ; 02:00 -> 120
    const inEvening = minutes >= 1080 && minutes <= 1439;
    const afterMidnight = minutes >= 0 && minutes <= 120;
    return inEvening || afterMidnight;
}

function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

/**Calcula duración en minutos soportando cruce por medianoche*/
function calculateDurationMinutes(start, end) {
    if (!start || !end) return 0;
    
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    if (s <= e) return e - s;
    return (1440 - s) + e;
}

/**  Validaciones para la hora de inicio*/
function validateStartTimeRules(startTime, reservationDate) {
    const errors = [];

    if (!startTime) {
        errors.push('La hora de inicio es obligatoria');
        return errors;
    }

    if (!isValidBusinessHour(startTime)) {
        errors.push('El horario de atención es de 6:00 PM a 2:00 AM');
        return errors;
    }

    // Si la fecha es hoy, exigir reserva con al menos 4 horas de anticipación
    if (reservationDate) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        if (reservationDate === todayStr) {
            const now = new Date();
            const [startHours, startMinutes] = startTime.split(':').map(Number);
            
            // Crear fecha de inicio seleccionada
            const startDateTime = new Date(today);
            startDateTime.setHours(startHours, startMinutes, 0, 0);
            
            // Si la hora de inicio es después de medianoche (0-2 AM), ajustar al día siguiente
            if (startHours >= 0 && startHours <= 2) {
                startDateTime.setDate(startDateTime.getDate() + 1);
            }
            
            // Calcular diferencia en horas
            const diffMs = startDateTime - now;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            if (diffHours < 4) {
                errors.push('Debes reservar con al menos 4 horas de anticipación para el día de hoy');
            }
        }
    }

    return errors;
}

/** Valida fecha de reserva*/
export function validateReservationDate(dateString) {
    const errors = [];

    if (!dateString) {
        errors.push('La fecha de reserva es obligatoria');
        return errors;
    }

    const selectedDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular fecha máxima (2 meses desde hoy)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    maxDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        errors.push('La fecha no puede ser anterior a hoy');
    }

    if (selectedDate > maxDate) {
        errors.push('Solo puedes reservar hasta 2 meses a partir de la fecha actual');
    }

    if (!isOpenDay(dateString)) {
        errors.push('Solo puedes reservar de jueves a domingo');
    }

    return errors;
}

/**Valida horario completo: inicio y fin*/
export function validateTime(startTime, endTime, reservationDate) {
    const errors = [];

    // Validar hora de inicio
    const startErrors = validateStartTimeRules(startTime, reservationDate);
    if (startErrors.length > 0) {
        errors.push(...startErrors);
    }

    // Validar hora de fin
    if (!endTime) {
        errors.push('La hora de fin es obligatoria');
    } else if (!isValidBusinessHour(endTime)) {
        errors.push('El horario de atención es de 6:00 PM a 2:00 AM');
    }

    // Si ambos tiempos están presentes, validar relación entre ellos
    if (startTime && endTime && errors.length === 0) {
        const duration = calculateDurationMinutes(startTime, endTime);

        if (duration <= 0) {
            errors.push('La hora de fin debe ser posterior a la hora de inicio');
        } else {
            if (duration < 30) errors.push('La reserva debe ser de al menos 30 minutos');
            if (duration > 120) errors.push('La reserva no puede exceder las 2 horas');
        }

        // Validar que no sea en el pasado si es para hoy
        if (reservationDate) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            if (reservationDate === todayStr) {
                const now = new Date();
                const [endHours, endMinutes] = endTime.split(':').map(Number);
                
                // Crear fecha de fin seleccionada
                const endDateTime = new Date(today);
                endDateTime.setHours(endHours, endMinutes, 0, 0);
                
                // Si la hora de fin es después de medianoche (0-2 AM), ajustar al día siguiente
                if (endHours >= 0 && endHours <= 2) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                }
                
                if (endDateTime < now) {
                    errors.push('No puedes reservar para un horario que ya pasó');
                }
            }
        }
    }

    return errors;
}

/** Validación número de personas */
export function validateNumberOfPeople(number, room = null) {
    const errors = [];

    if (!number || number === '') {
        errors.push('El número de personas es obligatorio');
        return errors;
    }

    const num = parseInt(number);
    
    if (isNaN(num)) {
        errors.push('El número de personas debe ser un valor válido');
        return errors;
    }

    if (num < 2) {
        errors.push('El número de personas debe ser al menos 2');
    }

    if (num > 15) {
        errors.push('El número máximo de personas por reserva es 15');
    }

    // Validaciones adicionales si hay una sala seleccionada
    if (room) {
        if (num < room.minCapacity) {
            errors.push(`Esta sala requiere un mínimo de ${room.minCapacity} personas`);
        }
        if (num > room.maxCapacity) {
            errors.push(`Esta sala admite un máximo de ${room.maxCapacity} personas`);
        }
    }

    return errors;
}

// calcular duracion
export function calculateAndFormatDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    
    const duration = calculateDurationMinutes(startTime, endTime);
    if (duration <= 0) return null;
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours === 0) {
        return `${minutes} min`;
    } else if (minutes === 0) {
        return `${hours} h`;
    } else {
        return `${hours}h ${minutes}min`;
    }
}

export { calculateDurationMinutes };
