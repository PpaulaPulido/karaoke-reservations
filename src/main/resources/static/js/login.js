import { 
    setupPasswordToggle, 
    validateEmail,
    showError,
    hideError
} from './validation.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const buttonText = loginButton.querySelector('.button-text');
    const buttonLoader = loginButton.querySelector('.button-loader');

    setupPasswordToggle("togglePassword", passwordInput.id);

    emailInput.addEventListener('blur', function() {
        if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'emailError', 'Por favor, ingresa un correo electrónico válido');
        } else {
            hideError(emailInput, 'emailError');
        }
    });

    passwordInput.addEventListener('blur', function() {
        if (passwordInput.value.length < 1) {
            showError(passwordInput, 'passwordError', 'La contraseña es obligatoria');
        } else {
            hideError(passwordInput, 'passwordError');
        }
    });

    // Validación antes del envío
    loginForm.addEventListener('submit', function(e) {
        let isValid = true;

        // Validar email
        if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'emailError', 'Por favor, ingresa un correo electrónico válido');
            isValid = false;
        } else {
            hideError(emailInput, 'emailError');
        }

        // Validar contraseña
        if (passwordInput.value.length < 1) {
            showError(passwordInput, 'passwordError', 'La contraseña es obligatoria');
            isValid = false;
        } else {
            hideError(passwordInput, 'passwordError');
        }

        if (!isValid) {
            e.preventDefault();
        } else {
            buttonText.style.display = 'none';
            buttonLoader.style.display = 'block';
            loginButton.disabled = true;
        }
    });

    emailInput.addEventListener('input', function() {
        if (validateEmail(emailInput.value)) {
            hideError(emailInput, 'emailError');
        }
    });

    passwordInput.addEventListener('input', function() {
        if (passwordInput.value.length > 0) {
            hideError(passwordInput, 'passwordError');
        }
    });
});