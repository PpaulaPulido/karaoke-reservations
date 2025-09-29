class HistorialReservas {
    constructor() {
        this.init();
    }

    init() {
        this.configurarEventos();
        this.animarEstadisticas();
        this.configurarAnimacionesSuaves();
        this.configurarEstadosCarga();
    }

    animarEstadisticas() {
        const tarjetasEstadisticas = document.querySelectorAll('.stat-card');

        tarjetasEstadisticas.forEach((tarjeta, indice) => {
            tarjeta.style.animationDelay = `${indice * 0.1}s`;
            const contador = tarjeta.querySelector('.counter');

            // Obtener el valor directamente del texto del elemento
            let objetivo = 0;
            const textoContador = contador.textContent.trim();

            if (textoContador && textoContador !== 'null' && textoContador !== 'undefined') {
                objetivo = parseInt(textoContador);
            }

            // Si no se puede parsear, usar data-count como respaldo
            if (isNaN(objetivo)) {
                const dataCount = tarjeta.getAttribute('data-count');
                objetivo = dataCount ? parseInt(dataCount) : 0;
            }

            // Asegurar que objetivo sea un número
            if (isNaN(objetivo)) {
                objetivo = 0;
            }

            // Animar desde 0 hasta el objetivo
            this.animarContador(contador, objetivo, 1500);
        });
    }

    animarContador(elemento, objetivo, duracion) {
        let inicio = 0;
        const incremento = objetivo / (duracion / 16);

        // Asegurar que el elemento muestre 0 inicialmente
        elemento.textContent = '0';

        const temporizador = setInterval(() => {
            inicio += incremento;
            if (inicio >= objetivo) {
                elemento.textContent = objetivo.toString();
                clearInterval(temporizador);
            } else {
                elemento.textContent = Math.floor(inicio).toString();
            }
        }, 16);
    }

    configurarEventos() {
        // Filtros y ordenamiento
        document.getElementById('filter-select').addEventListener('change', (e) => {
            this.mostrarCarga();
            setTimeout(() => this.aplicarFiltros(), 300);
        });

        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.mostrarCarga();
            setTimeout(() => this.aplicarFiltros(), 300);
        });

        this.configurarInteraccionesTarjetas();
    }

    aplicarFiltros() {
        const filtro = document.getElementById('filter-select').value;
        const orden = document.getElementById('sort-select').value;

        // Simular carga
        this.mostrarCarga();

        setTimeout(() => {
            window.location.href = `/reservations/history?filter=${filtro}&sort=${orden}`;
        }, 800);
    }

    configurarInteraccionesTarjetas() {
        const tarjetas = document.querySelectorAll('.reservation-card');

        tarjetas.forEach(tarjeta => {
            tarjeta.addEventListener('mouseenter', () => {
                tarjeta.classList.add('hover');
            });

            tarjeta.addEventListener('mouseleave', () => {
                tarjeta.classList.remove('hover');
            });

            // Animación al hacer clic
            tarjeta.addEventListener('click', (e) => {
                if (!e.target.closest('.action-buttons')) {
                    tarjeta.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        tarjeta.style.transform = '';
                    }, 150);
                }
            });
        });
    }

    configurarAnimacionesSuaves() {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.style.opacity = '1';
                    entrada.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reservation-card').forEach(tarjeta => {
            observador.observe(tarjeta);
        });
    }

    configurarEstadosCarga() {
        // Agregar estado de carga a los botones
        document.querySelectorAll('button').forEach(boton => {
            boton.addEventListener('click', function() {
                if (this.classList.contains('btn-cancel')) {
                    const htmlOriginal = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
                    this.disabled = true;

                    setTimeout(() => {
                        this.innerHTML = htmlOriginal;
                        this.disabled = false;
                    }, 2000);
                }
            });
        });
    }

    mostrarCarga() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    ocultarCarga() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    // Cancelar reserva
    cancelarReserva(reservaId) {
        if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
            this.mostrarCarga();

            fetch(`/reservations/${reservaId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-TOKEN': this.obtenerTokenCSRF()
                }
            })
            .then(respuesta => {
                if (respuesta.ok) {
                    this.mostrarExito('Reserva cancelada exitosamente');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    throw new Error('Error al cancelar la reserva');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.mostrarError('Error al cancelar la reserva');
                this.ocultarCarga();
            });
        }
    }

    mostrarExito(mensaje) {
        this.mostrarNotificacion(mensaje, 'success');
    }

    mostrarError(mensaje) {
        this.mostrarNotificacion(mensaje, 'error');
    }

    mostrarNotificacion(mensaje, tipo) {
        const notificacion = document.createElement('div');
        notificacion.className = `notification ${tipo}`;
        notificacion.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            <span>${mensaje}</span>
        `;

        document.body.appendChild(notificacion);

        setTimeout(() => notificacion.classList.add('show'), 100);

        setTimeout(() => {
            notificacion.classList.remove('show');
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }

    obtenerTokenCSRF() {
        return document.querySelector('input[name="_csrf"]')?.value || '';
    }
}

// Función global para cancelar reservas
function cancelarReserva(reservaId) {
    new HistorialReservas().cancelarReserva(reservaId);
}

// Función para corregir estilos de selects
function corregirSelects() {
    const selects = document.querySelectorAll('select.form-input');
    selects.forEach(select => {
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
        const padre = select.parentElement;
        if (padre.classList.contains('select-wrapper') || 
            padre.classList.contains('custom-select')) {
            padre.style.position = 'relative';
            padre.style.zIndex = 'auto';
        }
    });
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    new HistorialReservas();
    corregirSelects();

    // Agregar estilos para las notificaciones
    const estilo = document.createElement('style');
    estilo.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: var(--shadow);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 10000;
        }
        .notification.show {
            transform: translateX(0);
        }
        .notification.success {
            background: var(--success-color);
        }
        .notification.error {
            background: var(--error-color);
        }
        .notification i {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(estilo);
});

// Ocultar loading cuando la página esté completamente cargada
window.addEventListener('load', () => {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
});