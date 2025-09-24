import { 
    setupPasswordToggle, 
    setupPasswordStrength, 
    setupInputEffects,
    setupRealTimeNameValidation,
    setupRealTimeEmailValidation,
    setupRealTimePasswordValidation,
} from './validation.js';

document.addEventListener("DOMContentLoaded", function() {
    
    loadPhoneLibrary().then(() => {
        setupAllValidations();
    }).catch(error => {
        console.error("Error cargando librería de teléfono:", error);
        setupBasicValidations();
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");

    let timeout = null;

    emailInput.addEventListener("input", function() {
        clearTimeout(timeout);

        // Espera 500ms después de que el usuario deja de escribir
        timeout = setTimeout(() => {
            const email = emailInput.value.trim();
            if (email.length === 0) {
                emailError.textContent = "";
                return;
            }

            fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
                .then(response => response.json())
                .then(exists => {
                    if (exists) {
                        emailError.textContent = "El email ya está registrado";
                        emailError.style.color = "red";
                    } else {
                        emailError.textContent = "";
                    }
                })
                .catch(err => {
                    console.error("Error al verificar email:", err);
                });
        }, 500);
    });
});


async function loadPhoneLibrary() {
    return new Promise((resolve, reject) => {
        if (window.intlTelInput) {
            console.log("Librería de teléfono ya cargada");
            resolve();
            return;
        }

        const existingCSS = document.querySelector('link[href*="intl-tel-input"]');
        if (!existingCSS) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/css/intlTelInput.css';
            document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/intlTelInput.min.js';
        
        script.onload = () => {
            console.log("Librería de teléfono cargada correctamente");
            setTimeout(resolve, 100);
        };
        
        script.onerror = () => {
            console.error("Error cargando librería de teléfono");
            reject(new Error('No se pudo cargar intl-tel-input'));
        };
        
        document.head.appendChild(script);
    });
}

async function setupAllValidations() {
    try {
        const { setupRealTimePhoneValidation } = await import('./validation.js');
        
        setupRealTimeNameValidation();
        setupRealTimeEmailValidation();
        setupRealTimePhoneValidation();
        setupPasswordToggle("togglePassword", "password");
        setupPasswordToggle("toggleConfirmPassword", "confirmPassword");
        setupPasswordStrength();
        setupRealTimePasswordValidation();
        setupInputEffects();

        console.log("Todas las validaciones configuradas correctamente");
        
    } catch (error) {
        console.error("Error configurando validaciones:", error);
        setupBasicValidations();
    }
}

function setupBasicValidations() {    
    try {
        setupRealTimeNameValidation();
        setupRealTimeEmailValidation();
        setupPasswordToggle("togglePassword", "password");
        setupPasswordToggle("toggleConfirmPassword", "confirmPassword");
        setupPasswordStrength();
        setupRealTimePasswordValidation();
        setupInputEffects();
        
        setupBasicPhoneValidation();
        
        console.log("Validaciones básicas configuradas");
        
    } catch (error) {
        console.error("Error configurando validaciones básicas:", error);
    }
}

function setupBasicPhoneValidation() {
    const phoneInput = document.getElementById('phoneNumber');
    const errorElement = document.getElementById('phoneError');
    
    if (!phoneInput || !errorElement) return;
    
    phoneInput.addEventListener('input', function() {
        const phone = this.value.trim();
        
        if (!phone) {
            showError(phoneInput, errorElement, 'El número de teléfono es obligatorio');
            return;
        }
        
        if (!/^[\d+\s\-()]{10,}$/.test(phone)) {
            showError(phoneInput, errorElement, 'Número de teléfono inválido');
            return;
        }
        
        hideError(phoneInput, errorElement);
    });
}

function showError(input, errorElement, message) {
    if (input && errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('show');
        input.classList.add('error');
        input.classList.remove('valid');
    }
}

function hideError(input, errorElement) {
    if (input && errorElement) {
        errorElement.style.display = 'none';
        errorElement.classList.remove('show');
        input.classList.remove('error');
        input.classList.add('valid');
    }
}
