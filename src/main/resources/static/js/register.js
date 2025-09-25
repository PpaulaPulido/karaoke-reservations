import { 
    setupPasswordToggle, 
    setupPasswordStrength, 
    setupInputEffects,
    setupRealTimeNameValidation,
    setupRealTimeEmailValidation,
    setupRealTimePasswordValidation,
    validateFullName,
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validatePhoneNumber,
    showError,
    hideError
} from './validation.js';

const validationState = {
    fullName: false,
    email: false,
    phoneNumber: false,
    password: false,
    confirmPassword: false
};

document.addEventListener("DOMContentLoaded", function() {
    
    loadPhoneLibrary().then(() => {
        setupAllValidations();
        setupFormSubmission();
    }).catch(error => {
        console.error("Error cargando librería de teléfono:", error);
        setupBasicValidations();
        setupFormSubmission(); 
    });
});

// Función para configurar la validación del envío del formulario
function setupFormSubmission() {
    const registerForm = document.getElementById("registerForm");
    const registerButton = document.getElementById("registerButton");
    
    if (!registerForm) return;
    
    registerForm.addEventListener("submit", function(event) {
        event.preventDefault(); // Prevenir envío por defecto
        
        // Validar todos los campos antes de enviar
        if (validateAllFields()) {
            submitForm();
        } else {
            // Mostrar mensaje de error general
            showMessage("Por favor, corrige los errores en el formulario antes de enviar.", "error");
            scrollToFirstError();
        }
    });
}


function validateAllFields() {
    let allValid = true;
    
    // Validar nombre completo
    if (!validateFullNameField()) allValid = false;
    
    // Validar email
    if (!validateEmailField()) allValid = false;
    
    // Validar teléfono
    if (!validatePhoneField()) allValid = false;
    
    // Validar contraseña
    if (!validatePasswordField()) allValid = false;
    
    // Validar confirmación de contraseña
    if (!validateConfirmPasswordField()) allValid = false;
    
    return allValid;
}

// Función de validación para nombre completo
function validateFullNameField() {
    const fullNameInput = document.getElementById("fullName");
    const fullNameError = document.getElementById("fullNameError");
    const fullName = fullNameInput.value.trim();
    
    const result = validateFullName(fullName);
    
    if (!result.isValid) {
        showError(fullNameInput, fullNameError, result.error);
        validationState.fullName = false;
        return false;
    }
    
    hideError(fullNameInput, fullNameError);
    validationState.fullName = true;
    return true;
}

// Función de validación para email
function validateEmailField() {
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    const email = emailInput.value.trim();
    
    const result = validateEmail(email);
    
    if (!result.isValid) {
        showError(emailInput, emailError, result.error);
        validationState.email = false;
        return false;
    }

    if (!checkEmailExistsSync(email)) {
        showError(emailInput, emailError, "El email ya está registrado en el sistema");
        validationState.email = false;
        return false;
    }
    
    hideError(emailInput, emailError);
    validationState.email = true;
    return true;
}

// Función de validación para teléfono
function validatePhoneField() {
    const phoneInput = document.getElementById("phoneNumber");
    const phoneError = document.getElementById("phoneError");
    
    const iti = window.intlTelInputGlobals.getInstance(phoneInput);
    
    const result = validatePhoneNumber(phoneInput, iti);
    
    if (!result.isValid) {
        showError(phoneInput, phoneError, result.error);
        validationState.phoneNumber = false;
        return false;
    }
    
    hideError(phoneInput, phoneError);
    validationState.phoneNumber = true;
    return true;
}

// Función de validación para contraseña
function validatePasswordField() {
    const passwordInput = document.getElementById("password");
    const passwordError = document.getElementById("passwordError");
    const password = passwordInput.value;
    
    const result = validatePassword(password);
    
    if (!result.isValid) {
        showError(passwordInput, passwordError, result.error);
        validationState.password = false;
        return false;
    }
    
    hideError(passwordInput, passwordError);
    validationState.password = true;
    return true;
}

// Función de validación para confirmar contraseña
function validateConfirmPasswordField() {
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    const result = validatePasswordMatch(password, confirmPassword);
    
    if (!result.isValid) {
        showError(confirmPasswordInput, confirmPasswordError, result.error);
        validationState.confirmPassword = false;
        return false;
    }
    
    hideError(confirmPasswordInput, confirmPasswordError);
    validationState.confirmPassword = true;
    return true;
}

function checkEmailExistsSync(email) {
    return true;
}

// Función para enviar el formulario
function submitForm() {
    const registerForm = document.getElementById("registerForm");
    const registerButton = document.getElementById("registerButton");
    const buttonText = registerButton.querySelector(".button-text");
    const buttonLoader = registerButton.querySelector(".button-loader");
    
    // Mostrar loading
    buttonText.style.display = "none";
    buttonLoader.style.display = "block";
    registerButton.disabled = true;
    
    // Enviar formulario
    registerForm.submit();
}

// Función para hacer scroll al primer error
function scrollToFirstError() {
    const firstError = document.querySelector('.error');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
    }
}

// Función para mostrar mensajes
function showMessage(message, type) {
    const messageContainer = document.getElementById("messageContainer");
    const messageContent = document.getElementById("messageContent");
    
    if (messageContainer && messageContent) {
        messageContent.textContent = message;
        messageContainer.className = `message-container ${type}`;
        messageContainer.style.display = 'block';
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

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
            validationState.phoneNumber = false;
            return;
        }
        
        if (!/^[\d+\s\-()]{10,}$/.test(phone)) {
            showError(phoneInput, errorElement, 'Número de teléfono inválido');
            validationState.phoneNumber = false;
            return;
        }
        
        hideError(phoneInput, errorElement);
        validationState.phoneNumber = true;
    });
}