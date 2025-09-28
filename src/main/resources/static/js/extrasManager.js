class ExtrasManager {
    constructor() {
        this.availableExtras = [];
        this.selectedExtras = new Set();
        this.currentFilter = 'all';
    }

    async loadExtras() {
        try {
            const response = await fetch('/api/extras');
            if (!response.ok) throw new Error('Error al cargar extras');
            
            this.availableExtras = await response.json();
            this.renderExtras();
            this.updateSelectedExtrasUI();
            return this.availableExtras;
        } catch (error) {
            console.error('Error loading extras:', error);
            this.showError('Error cargando los servicios adicionales. Intenta nuevamente.');
            return [];
        }
    }

    renderExtras() {
        const container = document.getElementById('extras-grid');
        if (!container) return;

        //Filtrar extras basado en la selección actual
        const filteredExtras = this.currentFilter === 'all' 
            ? this.availableExtras 
            : this.availableExtras.filter(extra => 
                extra.type.toLowerCase().includes(this.currentFilter.toLowerCase()));

        if (filteredExtras.length === 0) {
            container.innerHTML = `
                <div class="no-extras-message">
                    <i class="fas fa-gift"></i>
                    <p>No hay servicios disponibles ${this.currentFilter === 'all' ? '' : 'en esta categoría'}.</p>
                </div>
            `;
            return;
        }

        //Renderizar las tarjetas de extras
        container.innerHTML = filteredExtras.map(extra => `
            <div class="extra-card ${this.isSelected(extra.id) ? 'selected' : ''}" 
                 data-extra-id="${extra.id}">
                <div class="extra-header">
                    <h4>${extra.name}</h4>
                    <span class="extra-price">$${extra.price.toLocaleString()}</span>
                </div>
                <div class="extra-type">
                    <span class="type-badge ${this.getTypeClass(extra.type)}">${extra.type}</span>
                </div>
                <div class="extra-description">
                    ${extra.description || 'Servicio adicional disponible.'}
                </div>
                <div class="extra-actions">
                    <button type="button" class="toggle-extra-btn ${this.isSelected(extra.id) ? 'selected' : ''}">
                        ${this.isSelected(extra.id) ? 
                            '<i class="fas fa-check"></i> Seleccionado' : 
                            '<i class="fas fa-plus"></i> Agregar'}
                    </button>
                </div>
            </div>
        `).join('');

        this.attachExtrasEventListeners();
    }

    getTypeClass(type) {
        const typeMap = {
            'decoración': 'decoracion',
            'comida': 'comida',
            'bebida': 'bebida'
        };
        return typeMap[type.toLowerCase()] || 'default';
    }

    attachExtrasEventListeners() {
        const container = document.getElementById('extras-grid');
        if (!container) return;

        container.querySelectorAll('.toggle-extra-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const extraId = parseInt(e.target.closest('.extra-card').dataset.extraId);
                this.toggleExtra(extraId);
            });
        });

        container.querySelectorAll('.extra-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.toggle-extra-btn')) return;
                const extraId = parseInt(card.dataset.extraId);
                this.toggleExtra(extraId);
            });
        });

        const filterSelect = document.getElementById('extra-type-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderExtras();
            });
        }
    }

    toggleExtra(extraId) {
        if (this.selectedExtras.has(extraId)) {
            this.selectedExtras.delete(extraId);
        } else {
            this.selectedExtras.add(extraId);
        }
        this.renderExtras();
        this.updateSelectedExtrasUI();
    }

    isSelected(extraId) {
        return this.selectedExtras.has(extraId);
    }

    updateSelectedExtrasUI() {
        const selectedContainer = document.getElementById('selected-extras');
        const selectedList = document.getElementById('selected-extras-list');
        
        if (!selectedContainer || !selectedList) return;

        if (this.selectedExtras.size === 0) {
            selectedContainer.style.display = 'none';
            return;
        }

        selectedContainer.style.display = 'block';
        
        const selectedExtrasDetails = Array.from(this.selectedExtras).map(extraId => {
            return this.availableExtras.find(e => e.id === extraId);
        }).filter(extra => extra !== undefined);

        selectedList.innerHTML = selectedExtrasDetails.map(extra => `
            <div class="selected-extra-item">
                <span class="selected-extra-name">${extra.name}</span>
                <span class="selected-extra-type">${extra.type}</span>
                <span class="selected-extra-price">$${extra.price.toLocaleString()}</span>
                <button type="button" class="remove-extra-btn" data-extra-id="${extra.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        selectedList.querySelectorAll('.remove-extra-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const extraId = parseInt(e.target.closest('.remove-extra-btn').dataset.extraId);
                this.toggleExtra(extraId);
            });
        });
    }

    getSelectedExtras() {
        return Array.from(this.selectedExtras).map(extraId => {
            return this.availableExtras.find(e => e.id === extraId);
        }).filter(extra => extra !== undefined);
    }

    getSelectedExtraIds() {
        return Array.from(this.selectedExtras);
    }

    clearSelection() {
        this.selectedExtras.clear();
        this.renderExtras();
        this.updateSelectedExtrasUI();
    }

    showError(message) {
        console.error('ExtrasManager Error:', message);
    }
}

export default ExtrasManager;