// new-reservation.js
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

    document.addEventListener('DOMContentLoaded', function() {
        initializePage();
        setupEventListeners();
        loadFormData();
        // Removed fixSelectStyles() call
    });

    function initializePage() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('reservationDate');
        dateInput.min = today;

        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 1);
        dateInput.max = maxDate.toISOString().split('T')[0];

        setMinTimeForToday();
        loadRoomOptions().catch(console.error);
        loadExtraOptions();
        updateReservationSummary();
    }

    function setMinTimeForToday() {
        const dateInput = document.getElementById('reservationDate');
        const startTimeInput = document.getElementById('startTime');

        dateInput.addEventListener('change', function() {
            const todayStr = new Date().toISOString().split('T')[0];
            const selectedDate = this.value;

            if (selectedDate === todayStr) {
                // Para hoy: mínimo 4 horas después
                const now = new Date();
                now.setHours(now.getHours() + 4);
                // redondeo a media hora
                const mins = now.getMinutes();
                if (mins > 0 && mins <= 30) now.setMinutes(30,0,0);
                else if (mins > 30) { now.setMinutes(0,0,0); now.setHours(now.getHours()+1); }

                const hhmm = now.toTimeString().slice(0,5);
                startTimeInput.min = hhmm;
            } else {
                // no restringir por ahora: permitir desde 18:00 (negocio)
                startTimeInput.min = '18:00';
            }

            // cada vez que cambia la fecha, recargar salas y validar fecha
            formData.reservationDate = selectedDate;
            validateFieldInRealTime(document.getElementById('reservationDate'));
            loadRoomOptions().catch(console.error); // recargar disponibilidad
            updateReservationSummary();
        });
    }

    function setupEventListeners() {
        const form = document.getElementById('reservation-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleFormSubmit();
            });
        }

        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('input', handleInputChange);
            input.addEventListener('change', handleInputChange);
        });

        const startInput = document.getElementById('startTime');
        const endInput = document.getElementById('endTime');

        if (startInput) startInput.addEventListener('change', () => {
            updateEndTimeOptions();
            validateTimeFields();
            loadRoomOptions().catch(console.error); // recargar salas según horario
        });

        if (endInput) endInput.addEventListener('change', () => {
            validateTimeFields();
            loadRoomOptions().catch(console.error);
        });

        const roomSelect = document.getElementById('room');
        if (roomSelect) roomSelect.addEventListener('change', handleRoomSelection);

        const extraFilter = document.getElementById('extra-type-filter');
        if (extraFilter) extraFilter.addEventListener('change', filterExtras);
    }

    function updateEndTimeOptions() {
        const start = document.getElementById('startTime').value;
        const endEl = document.getElementById('endTime');
        if (!start) return;

        // permitimos mínimo 30 minutos y máximo 2 horas; manejar cruce de medianoche
        const [h, m] = start.split(':').map(Number);
        const startMinutes = h*60 + m;

        let minMinutes = startMinutes + 30;
        let maxMinutes = startMinutes + 120;

        // Convertir minutos a formato HH:MM (0-1439), pero si supera 1440 restamos 1440 para horario del día siguiente.
        function minutesToHHMM(mins) {
            const normalized = mins % 1440;
            const hh = Math.floor(normalized/60);
            const mm = normalized % 60;
            return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
        }

        endEl.min = minutesToHHMM(minMinutes);
        endEl.max = minutesToHHMM(maxMinutes);

        // Si end actual fuera inválido, limpiarlo
        const cur = endEl.value;
        if (cur) {
            // comparar duracion actual usando función duration simple:
            try {
                const toMin = (t)=>{const [hh,mm]=t.split(':').map(Number);return hh*60+mm;};
                const sM = toMin(start), eM = toMin(cur);
                const dur = sM <= eM ? eM - sM : (1440 - sM) + eM;
                if (dur < 30 || dur > 120) {
                    endEl.value = '';
                    formData.endTime = '';
                }
            } catch(e) {
                endEl.value = '';
                formData.endTime = '';
            }
        }
    }

    function handleInputChange(e) {
        const target = e.target;
        const name = target.name;
        formData[name] = target.value;
        validateFieldInRealTime(target);

        // si cambia fecha o hora, recargar salas
        if (name === 'reservationDate' || name === 'startTime' || name === 'endTime') {
            loadRoomOptions().catch(console.error);
        }

        updateReservationSummary();
    }

    function validateFieldInRealTime(input) {
        const name = input.name;
        const value = input.value;
        const errorEl = document.getElementById(`${name}-error`);
        hideError(input, errorEl);

        let errors = [];
        if (name === 'reservationDate') errors = validateReservationDate(value);
        else if (name === 'numberOfPeople') errors = validateNumberOfPeople(parseInt(value)||0, currentRoom);
        else if (name === 'room') errors = validateRoom(value, sampleRooms);

        if (errors && errors.length) showError(input, errorEl, errors[0]);
    }

    function validateTimeFields() {
        const startEl = document.getElementById('startTime');
        const endEl = document.getElementById('endTime');
        const sErr = document.getElementById('start-time-error');
        const eErr = document.getElementById('end-time-error');

        hideError(startEl, sErr);
        hideError(endEl, eErr);

        if (!startEl.value && !endEl.value) return;

        const errs = validateTime(startEl.value, endEl.value, formData.reservationDate);
        if (errs && errs.length) {
            showError(startEl, sErr, errs[0]);
            showError(endEl, eErr, errs[0]);
        }
    }

    function validateForm() {
        const errors = validateCompleteForm(formData, currentRoom, sampleRooms);

        // limpiar errores previos
        document.querySelectorAll('.error-message').forEach(el => { el.style.display='none'; el.classList.remove('show'); });
        document.querySelectorAll('.form-input').forEach(i => i.classList.remove('error'));

        let hasErrors = false;
        Object.keys(errors).forEach(field => {
            const input = document.querySelector(`[name="${field}"]`);
            const errEl = document.getElementById(`${field}-error`);
            if (input && errEl && errors[field]) {
                showError(input, errEl, errors[field]);
                hasErrors = true;
            }
        });

        validateTimeFields();
        if (document.querySelector('#start-time-error.show') || document.querySelector('#end-time-error.show')) hasErrors = true;

        return !hasErrors;
    }

    function loadFormData() {
        formData.user = { id: 1 };
        const userNameEl = document.querySelector('.user-details h3');
        if (userNameEl) formData.user.fullName = userNameEl.textContent;
    }

    async function loadRoomOptions() {
        const roomSelect = document.getElementById('room');
        if (!roomSelect) return;
        roomSelect.innerHTML = '<option value="">Selecciona una sala</option>';

        const date = formData.reservationDate;
        const start = formData.startTime;
        const end = formData.endTime;

        // Si no hay date/start/end simplemente renderiza estado básico (solo disabled por available)
        if (!date || !start || !end) {
            sampleRooms.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = `${r.name} (${r.minCapacity}-${r.maxCapacity} personas)`;
                if (!r.available) opt.disabled = true;
                roomSelect.appendChild(opt);
            });
            return;
        }

        // Si hay fecha y horario, comprobar disponibilidad para cada sala en paralelo
        const checks = sampleRooms.map(async (r) => {
            const free = await isRoomFree(r, date, start, end);
            return { room: r, free };
        });

        const results = await Promise.all(checks);

        results.forEach(({ room: r, free }) => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = `${r.name} (${r.minCapacity}-${r.maxCapacity} personas)`;
            if (!r.available || !free) {
                opt.disabled = true;
                if (!free) opt.textContent += ' — Ocupada';
            }
            roomSelect.appendChild(opt);
        });
    }

    /**
     * isRoomFree async: consulta al backend si la sala está libre en el rango dado.
     * Endpoint esperado: GET /api/reservations/check?roomId=1&date=YYYY-MM-DD&start=HH:MM&end=HH:MM
     * Devuelve booleano.
     */
    async function isRoomFree(room, date, startTime, endTime) {
        if (!date || !startTime || !endTime) return true;
        if (!room.available) return false;

        try {
            const url = `/api/reservations/check?roomId=${encodeURIComponent(room.id)}&date=${encodeURIComponent(date)}&start=${encodeURIComponent(startTime)}&end=${encodeURIComponent(endTime)}`;
            const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
            if (!resp.ok) {
                // Si falla, asumimos libre para no bloquear UX — pero logueamos
                console.error('Error comprobando disponibilidad:', resp.status, await resp.text());
                return true;
            }
            const json = await resp.json();
            // Esperamos { free: true } o { free: false }
            return !!json.free;
        } catch (err) {
            console.error('Excepción comprobando disponibilidad:', err);
            // Fallback: no bloquear por error de red
            return true;
        }
    }

    function handleRoomSelection(ev) {
        const id = parseInt(ev.target.value);
        currentRoom = sampleRooms.find(r => r.id === id) || null;
        // actualizar info UI
        const info = document.getElementById('room-info');
        if (currentRoom) {
            if (info) {
                const desc = document.getElementById('room-description');
                const cap = document.getElementById('room-capacity');
                const avail = document.getElementById('room-availability');
                if (desc) desc.textContent = currentRoom.description || '';
                if (cap) cap.textContent = `${currentRoom.minCapacity} - ${currentRoom.maxCapacity} personas`;
                if (avail) avail.textContent = currentRoom.available ? 'Disponible' : 'No disponible';
                info.style.display = 'block';
            }
        } else {
            if (info) info.style.display = 'none';
        }
        updateReservationSummary();
    }

    function loadExtraOptions() {
        const grid = document.getElementById('extras-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        sampleExtras.forEach(extra => {
            const card = document.createElement('div');
            card.className = 'extra-card';
            card.setAttribute('data-extra-id', extra.id);
            card.innerHTML = `
                <div class="extra-header">
                    <div class="extra-name">${extra.name}</div>
                    <div class="extra-type">${extra.type}</div>
                </div>
                <div class="extra-price">$${extra.price}</div>
                <div class="extra-description">${extra.description}</div>
            `;
            card.addEventListener('click', () => toggleExtraSelection(extra, card));
            grid.appendChild(card);
        });
    }

    function toggleExtraSelection(extra, el) {
        const idx = selectedExtras.findIndex(s => s.id === extra.id);
        if (idx >= 0) {
            selectedExtras.splice(idx,1);
            el.classList.remove('selected');
        } else {
            selectedExtras.push(extra);
            el.classList.add('selected');
        }
        updateSelectedExtrasList();
        updateReservationSummary();
    }

    function updateSelectedExtrasList() {
        const container = document.getElementById('selected-extras');
        const list = document.getElementById('selected-extras-list');
        if (!container || !list) return;
        if (!selectedExtras.length) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        list.innerHTML = selectedExtras.map(e => `<div>${e.name} - $${e.price} <button onclick="window.removeExtra(${e.id})">x</button></div>`).join('');
    }

    window.removeExtra = function(id) {
        selectedExtras = selectedExtras.filter(e => e.id !== id);
        const card = document.querySelector(`.extra-card[data-extra-id="${id}"]`);
        if (card) card.classList.remove('selected');
        updateSelectedExtrasList();
        updateReservationSummary();
    };

    function updateReservationSummary() {
        document.getElementById('summary-date').textContent = formData.reservationDate ? formatDate(formData.reservationDate) : '-';
        document.getElementById('summary-time').textContent = (formData.startTime && formData.endTime) ? `${formData.startTime} - ${formData.endTime}` : '-';
        document.getElementById('summary-people').textContent = formData.numberOfPeople || '-';
        document.getElementById('summary-room').textContent = currentRoom ? currentRoom.name : '-';
        document.getElementById('summary-extras').textContent = selectedExtras.length ? selectedExtras.map(e => e.name).join(', ') : 'Ninguno';
        document.getElementById('summary-total').textContent = `$${calculateTotal().toLocaleString()}`;
    }

    function calculateTotal() {
        let total = 0;
        if (currentRoom) total += currentRoom.basePrice || 0;
        selectedExtras.forEach(e => total += e.price || 0);
        return total;
    }

    function formatDate(dateString) {
        const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
        return new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', opts);
    }

    function handleFormSubmit() {
        if (!validateForm()) {
            // mostrar mensaje simple en formulario
            const general = document.getElementById('form-general-error');
            if (general) { general.textContent = 'Corrige los errores antes de continuar'; general.style.display = 'block'; }
            return false;
        }

        // preparar modal de confirmación si existe
        const modal = document.getElementById('confirmation-modal');
        prepareConfirmationModal();
        if (modal) modal.style.display = 'block';
        return false;
    }

    function prepareConfirmationModal() {
        const details = document.getElementById('confirmation-details');
        if (!details) return;
        details.innerHTML = `
            <div>Fecha: ${formatDate(formData.reservationDate)}</div>
            <div>Horario: ${formData.startTime} - ${formData.endTime}</div>
            <div>Personas: ${formData.numberOfPeople}</div>
            <div>Sala: ${currentRoom ? currentRoom.name : '-'}</div>
            <div>Extras: ${selectedExtras.length ? selectedExtras.map(e => e.name).join(', ') : 'Ninguno'}</div>
            <div>Total: $${calculateTotal().toLocaleString()}</div>
        `;
    }

    function closeConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) modal.style.display = 'none';
    }

    function confirmReservation() {
        // crear inputs hidden y submit
        const form = document.getElementById('reservation-form');
        if (!form) return;
        const roomInput = document.createElement('input'); roomInput.type='hidden'; roomInput.name='roomId'; roomInput.value = formData.room || '';
        const extrasInput = document.createElement('input'); extrasInput.type='hidden'; extrasInput.name='extras'; extrasInput.value = JSON.stringify(selectedExtras.map(e=>e.id));
        form.appendChild(roomInput); form.appendChild(extrasInput);
        form.submit();
    }

// Solución de emergencia para selects no visibles
function fixSelects() {
    const selects = document.querySelectorAll('select.form-input');
    selects.forEach(select => {
        // Forzar estilos inline
        select.style.backgroundColor = '#1a1a2e';
        select.style.color = '#ffffff';
        select.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        select.style.padding = '12px 16px';
        select.style.borderRadius = '8px';
        select.style.fontSize = '16px';
        select.style.width = '100%';
        select.style.appearance = 'menulist';
        select.style.WebkitAppearance = 'menulist';
        select.style.MozAppearance = 'menulist';
        
        // Remover cualquier wrapper conflictivo
        const parent = select.parentElement;
        if (parent.classList.contains('select-wrapper') || 
            parent.classList.contains('custom-select')) {
            parent.style.position = 'relative';
            parent.style.zIndex = 'auto';
        }
    });
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    fixSelects();
    
    // Re-ejecutar después de cargar dinámicamente las opciones
    setTimeout(fixSelects, 100);
    setTimeout(fixSelects, 500);
});

// También ejecutar cuando cambien las opciones
document.addEventListener('change', function(e) {
    if (e.target.tagName === 'SELECT') {
        setTimeout(fixSelects, 50);
    }
});