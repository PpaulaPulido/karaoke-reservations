// consumor de las apis del controlador
class RoomManager {
    constructor() {
        this.availableRooms = [];
        this.selectedRoom = null;
        this.currentFilters = {
            numberOfPeople: 2
        };
    }

    async loadAvailableRooms(numberOfPeople = null) {
        try {
            let url = '/api/rooms/available';
            if (numberOfPeople && numberOfPeople >= 2 && numberOfPeople <= 15) {
                url = `/api/rooms/available-by-capacity?capacity=${numberOfPeople}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar salas');
            
            this.availableRooms = await response.json();
            this.renderRooms();
            return this.availableRooms;
        } catch (error) {
            console.error('Error loading rooms:', error);
            this.showError('Error cargando las salas disponibles. Intenta nuevamente.');
            return [];
        }
    }

    renderRooms() {
        const container = document.getElementById('rooms-container');
        if (!container) return;

        if (this.availableRooms.length === 0) {
            container.innerHTML = `
                <div class="no-rooms-message">
                    <i class="fas fa-door-closed"></i>
                    <h3>No hay salas disponibles</h3>
                    <p>No encontramos salas que cumplan con los criterios seleccionados.</p>
                    <p>Intenta ajustar la fecha, horario o número de personas.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.availableRooms.map(room => `
            <div class="room-card ${this.selectedRoom?.id === room.id ? 'selected' : ''}" 
                 data-room-id="${room.id}">
                <div class="room-header">
                    <h3>${room.name}</h3>
                    <span class="room-price">$${room.pricePerHour.toLocaleString()}/hora</span>
                </div>
                <div class="room-details">
                    <div class="room-capacity">
                        <i class="fas fa-users"></i>
                        Capacidad: ${room.minCapacity} - ${room.maxCapacity} personas
                    </div>
                    <div class="room-features">
                        <span class="room-status available">
                            <i class="fas fa-check-circle"></i>
                            Disponible
                        </span>
                    </div>
                    ${room.description ? `<div class="room-description">${room.description}</div>` : ''}
                </div>
                <button type="button" class="select-room-btn ${this.selectedRoom?.id === room.id ? 'selected' : ''}">
                    ${this.selectedRoom?.id === room.id ? 'Seleccionada' : 'Seleccionar'}
                </button>
            </div>
        `).join('');

        // Add event listeners
        this.attachRoomEventListeners();
    }

    attachRoomEventListeners() {
        const container = document.getElementById('rooms-container');
        if (!container) return;

        container.querySelectorAll('.room-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.select-room-btn')) return;
                this.selectRoom(card.dataset.roomId);
            });
        });

        container.querySelectorAll('.select-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const roomId = e.target.closest('.room-card').dataset.roomId;
                this.selectRoom(roomId);
            });
        });
    }

    selectRoom(roomId) {
        const room = this.availableRooms.find(r => r.id == roomId);
        if (!room) return;

        this.selectedRoom = room;
        document.getElementById('selectedRoomId').value = roomId;
        
        // Update UI
        this.updateRoomSelectionUI();
        
        // Clear room error
        this.hideRoomError();
        
        console.log('Sala seleccionada:', room.name);
    }

    updateRoomSelectionUI() {
        const container = document.getElementById('rooms-container');
        if (!container) return;

        container.querySelectorAll('.room-card').forEach(card => {
            const isSelected = card.dataset.roomId == this.selectedRoom?.id;
            card.classList.toggle('selected', isSelected);
            
            const button = card.querySelector('.select-room-btn');
            if (button) {
                button.textContent = isSelected ? 'Seleccionada' : 'Seleccionar';
                button.classList.toggle('selected', isSelected);
            }
        });
    }

    showError(message) {
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
        }
    }

    hideRoomError() {
        const errorElement = document.getElementById('room-error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    }

    showRoomError(message) {
        const errorElement = document.getElementById('room-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Hacer scroll al error
            errorElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    validateRoomSelection() {
        if (!this.selectedRoom) {
            this.showRoomError('Debes seleccionar una sala');
            return false;
        }
        
        this.hideRoomError();
        return true;
    }

    getSelectedRoom() {
        return this.selectedRoom;
    }

    clearSelection() {
        this.selectedRoom = null;
        document.getElementById('selectedRoomId').value = '';
        this.updateRoomSelectionUI();
    }
}

export default RoomManager;