// ---------- showError / hideError (exportadas) ----------
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
// ---------------------------------------------------------

// reservationValidation.js

/**
 * Muestra y oculta errores (se espera que showError/hideError existan en el otro archivo
 * si no, copia de tu versión actual).
 * Aquí solo exporto las validaciones principales.
 */

export function validateReservationDate(dateString) {
    const errors = [];

    if (!dateString) {
        errors.push('La fecha de reserva es obligatoria');
        return errors;
    }

    const selectedDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setHours(0,0,0,0);

    if (selectedDate < today) {
        errors.push('La fecha no puede ser anterior a hoy');
    }

    if (selectedDate > maxDate) {
        errors.push('Solo puedes reservar hasta un mes a partir de la fecha actual');
    }

    if (!isOpenDay(dateString)) {
        errors.push('Solo puedes reservar de jueves a domingo');
    }

    return errors;
}

/**
 * Comprueba si la fecha corresponde a un día abierto: jueves(4), viernes(5), sábado(6), domingo(0)
 */
function isOpenDay(dateString) {
    const d = new Date(dateString + 'T00:00:00');
    const day = d.getDay(); // 0=domingo, 1=lunes, ... 6=sábado
    return day === 0 || day === 4 || day === 5 || day === 6;
}

/**
 * Valida si una hora cae dentro del horario permitido: 18:00 - 02:00.
 * timeString en formato "HH:MM"
 */
function isValidBusinessHour(timeString) {
    if (!timeString) return false;
    const [h, m] = timeString.split(':').map(Number);
    const minutes = h * 60 + m;

    // 18:00 -> 1080 ; 23:59 -> 1439 ; 00:00 -> 0 ; 02:00 -> 120
    const inEvening = minutes >= 1080 && minutes <= 1439;
    const afterMidnight = minutes >= 0 && minutes <= 120;
    return inEvening || afterMidnight;
}

/**
 * Convierte "HH:MM" a minutos desde medianoche (0-1439)
 */
function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Calcula duración en minutos soportando cruce por medianoche
 */
function durationMinutes(start, end) {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    if (s <= e) return e - s;
    // cruza medianoche:  e + (1440 - s)
    return (1440 - s) + e;
}

/**
 * Validaciones de reglas para la hora de inicio
 */
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
        const todayStr = new Date().toISOString().split('T')[0];
        if (reservationDate === todayStr) {
            const now = new Date();
            const selected = new Date(reservationDate + 'T' + startTime);
            // Si seleccionado cruza medianoche, selected será la misma fecha; comparar minutos:
            const diffHours = (selected - now) / (1000 * 60 * 60);
            // Si selected moment es menor que now pero la intención es seleccionar un horario after midnight,
            // la comparación anterior puede fallar. Para simplificar: exigir 4 horas con base en minutos absolutos:
            if (diffHours < 4) {
                errors.push('Debes reservar con al menos 4 horas de anticipación para el día de hoy');
            }
        }
    }

    return errors;
}

/**
 * Valida horario completo: inicio y fin
 * Permite reservas que crucen medianoche (ej: 23:00 - 01:00)
 * Duración mínima: 30 min. Duración máxima: 2 horas (120 min).
 */
export function validateTime(startTime, endTime, reservationDate) {
    const errors = [];

    const startErrors = validateStartTimeRules(startTime, reservationDate);
    errors.push(...startErrors);

    if (!endTime) {
        errors.push('La hora de fin es obligatoria');
        return errors;
    }

    if (!isValidBusinessHour(endTime)) {
        errors.push('El horario de atención es de 6:00 PM a 2:00 AM');
        return errors;
    }

    if (startTime && endTime) {
        // duración correcta (soportando medianoche)
        const dur = durationMinutes(startTime, endTime);

        if (dur <= 0) {
            errors.push('La hora de fin debe ser posterior a la hora de inicio');
        } else {
            if (dur < 30) errors.push('La reserva debe ser de al menos 30 minutos');
            if (dur > 120) errors.push('La reserva no puede exceder las 2 horas');
        }

        // Si fecha es hoy, asegurarse que fin no sea menor que ahora (caso no cubre cruces medianoche)
        if (reservationDate) {
            const todayStr = new Date().toISOString().split('T')[0];
            if (reservationDate === todayStr) {
                // comprobar que el horario final no sea anterior al ahora real si no cruza medianoche
                const now = new Date();
                // construir un Date para endTime; si endTime <= startTime se asume siguiente día en el cálculo
                let endDate = new Date(reservationDate + 'T' + endTime);
                if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
                    // end is next day
                    endDate = new Date(new Date(reservationDate + 'T' + endTime).getTime() + 24*60*60*1000);
                }
                if (endDate < now) {
                    errors.push('No puedes reservar para un horario que ya pasó');
                }
            }
        }
    }

    return errors;
}

/**
 * Validación número de personas (igual a la tuya, con mensajes idénticos)
 */
export function validateNumberOfPeople(number, room) {
    const errors = [];

    if (!number || number < 2) {
        errors.push('El número de personas debe ser al menos 2');
        return errors;
    }

    if (number > 15) {
        errors.push('El número máximo de personas por reserva es 15');
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
 * Validación sala (mantengo la lógica actual)
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
 * validateCompleteForm: se apoya en las funciones anteriores (igual a tu flujo)
 */
export function validateCompleteForm(formData, currentRoom, rooms) {
    const errors = {};

    // fecha
    if (!formData.reservationDate) {
        errors.reservationDate = 'La fecha de reserva es obligatoria';
    } else {
        const dErr = validateReservationDate(formData.reservationDate);
        if (dErr.length) errors.reservationDate = dErr[0];
    }

    // horario
    if (!formData.startTime || !formData.endTime) {
        if (!formData.startTime) errors.startTime = 'La hora de inicio es obligatoria';
        if (!formData.endTime) errors.endTime = 'La hora de fin es obligatoria';
    } else {
        const tErr = validateTime(formData.startTime, formData.endTime, formData.reservationDate);
        if (tErr.length) {
            errors.startTime = tErr[0];
            errors.endTime = tErr[0];
        }
    }

    // personas
    if (!formData.numberOfPeople) {
        errors.numberOfPeople = 'El número de personas es obligatorio';
    } else {
        const n = parseInt(formData.numberOfPeople);
        if (isNaN(n)) {
            errors.numberOfPeople = 'El número de personas debe ser un valor válido';
        } else {
            const pErr = validateNumberOfPeople(n, currentRoom);
            if (pErr.length) errors.numberOfPeople = pErr[0];
        }
    }

    // sala
    if (!formData.room) {
        errors.room = 'Debes seleccionar una sala';
    } else {
        const rErr = validateRoom(formData.room, rooms);
        if (rErr.length) errors.room = rErr[0];
    }

    return errors;
}
