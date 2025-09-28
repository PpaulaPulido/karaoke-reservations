import { sampleExtras } from './data.js';

class ExtrasManager {
    constructor() {
        this.availableExtras = [];
        this.selectedExtras = new Set(); 
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.availableExtras = sampleExtras;
        this.renderExtras();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filtro por tipo
        const filterSelect = document.getElementById('extra-type-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderExtras();
            });
        }
    }

    renderExtras() {
        const container = document.getElementById('extras-grid');
        if (!container) return;

        // Filtrar extras según el tipo seleccionado
        const filteredExtras = this.currentFilter === 'all' 
            ? this.availableExtras 
            : this.availableExtras.filter(extra => 
                extra.type.toLowerCase().includes(this.currentFilter.toLowerCase())
            );

        if (filteredExtras.length === 0) {
            container.innerHTML = `
                <div class="no-extras-message">
                    <i class="fas fa-gift"></i>
                    <h3>No hay extras disponibles</h3>
                    <p>No encontramos extras del tipo seleccionado.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredExtras.map(extra => `
            <div class="extra-card ${this.selectedExtras.has(extra.id) ? 'selected' : ''}" 
                 data-extra-id="${extra.id}">
                <div class="extra-header">
                    <h4>${extra.name}</h4>
                    <span class="extra-type ${this.getTypeClass(extra.type)}">${extra.type}</span>
                </div>
                <div class="extra-description">${extra.description}</div>
                <div class="extra-footer">
                    <span class="extra-price">$${extra.price.toLocaleString()}</span>
                    <button type="button" class="toggle-extra-btn ${this.selectedExtras.has(extra.id) ? 'selected' : ''}">
                        <i class="fas fa-${this.selectedExtras.has(extra.id) ? 'check' : 'plus'}"></i>
                        ${this.selectedExtras.has(extra.id) ? 'Seleccionado' : 'Agregar'}
                    </button>
                </div>
            </div>
        `).join('');

        this.attachExtrasEventListeners();
        this.updateSelectedExtrasList();
    }

    getTypeClass(type) {
        const typeMap = {
            'Decoración': 'decoracion',
            'Bebida': 'bebida', 
            'Comida': 'comida'
        };
        return typeMap[type] || 'default';
    }

    attachExtrasEventListeners() {
        const container = document.getElementById('extras-grid');
        if (!container) return;

        container.querySelectorAll('.extra-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.toggle-extra-btn')) return;
                this.toggleExtra(card.dataset.extraId);
            });
        });

        container.querySelectorAll('.toggle-extra-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const extraId = parseInt(e.target.closest('.extra-card').dataset.extraId);
                this.toggleExtra(extraId);
            });
        });
    }

    toggleExtra(extraId) {
        const extra = this.availableExtras.find(e => e.id === extraId);
        if (!extra) return;

        if (this.selectedExtras.has(extraId)) {
            this.selectedExtras.delete(extraId);
        } else {
            this.selectedExtras.add(extraId);
        }

        // Actualizar UI
        this.renderExtras();
        
        // Animación de confirmación
        this.showSelectionFeedback(extraId);
    }

    showSelectionFeedback(extraId) {
        const card = document.querySelector(`[data-extra-id="${extraId}"]`);
        if (card) {
            card.classList.add('feedback-animation');
            setTimeout(() => {
                card.classList.remove('feedback-animation');
            }, 600);
        }
    }

    updateSelectedExtrasList() {
        const container = document.getElementById('selected-extras');
        const list = document.getElementById('selected-extras-list');
        
        if (!container || !list) return;

        if (this.selectedExtras.size === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        const selectedExtrasData = Array.from(this.selectedExtras).map(id => 
            this.availableExtras.find(extra => extra.id === id)
        );

        list.innerHTML = selectedExtrasData.map(extra => `
            <div class="selected-extra-item" data-extra-id="${extra.id}">
                <div class="selected-extra-info">
                    <span class="selected-extra-name">${extra.name}</span>
                    <span class="selected-extra-price">$${extra.price.toLocaleString()}</span>
                </div>
                <button type="button" class="remove-extra-btn" onclick="extrasManager.removeExtra(${extra.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeExtra(extraId) {
        this.selectedExtras.delete(extraId);
        this.renderExtras();
    }

    getSelectedExtras() {
        return Array.from(this.selectedExtras).map(id => 
            this.availableExtras.find(extra => extra.id === id)
        );
    }

    getSelectedExtrasTotal() {
        return Array.from(this.selectedExtras).reduce((total, id) => {
            const extra = this.availableExtras.find(e => e.id === id);
            return total + (extra?.price || 0);
        }, 0);
    }

    clearSelection() {
        this.selectedExtras.clear();
        this.renderExtras();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.extrasManager = new ExtrasManager();
});

export default ExtrasManager;