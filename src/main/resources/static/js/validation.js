export function setupPasswordToggle(buttonId, inputId) {
    const toggleButton = document.getElementById(buttonId);
    const passwordInput = document.getElementById(inputId);

    // Verificamos que los elementos existan antes de agregar el listener
    if (!toggleButton || !passwordInput) {
        console.error(`Error: No se encontró el botón con ID '${buttonId}' o el campo con ID '${inputId}'.`);
        return;
    }

    toggleButton.addEventListener("click", function () {
        const isPassword = passwordInput.type === "password";
        // Aquí está el cambio clave: usamos toggleButton para buscar los elementos
        const eyeOpen = toggleButton.querySelector('.eye-open');
        const eyeClosed = toggleButton.querySelector('.eye-closed');

        passwordInput.type = isPassword ? "text" : "password";
        eyeOpen.style.display = isPassword ? "none" : "block";
        eyeClosed.style.display = isPassword ? "block" : "none";
        toggleButton.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
}

// Efectos de focus en los inputs
export function setupInputEffects() {
    const inputs = document.querySelectorAll('.form-input');

    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function () {
            this.parentElement.classList.remove('focused');
        });
    });
}

// =============================================
// VALIDACIÓN DE CONTRASEÑA MEJORADA
// =============================================

export function validatePassword(password) {
    if (!password) {
        return { isValid: false, error: 'La contraseña es obligatoria' };
    }

    // Validar longitud
    if (password.length < 8) {
        return { isValid: false, error: 'Mínimo 8 caracteres' };
    }

    if (password.length > 15) {
        return { isValid: false, error: 'Máximo 15 caracteres' };
    }

    // Validar requisitos específicos
    const requirements = {
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[@$!%*?&.#^_-]/.test(password),
        validLength: password.length >= 8 && password.length <= 15
    };

    // Verificar qué requisitos faltan
    const missingRequirements = [];
    
    if (!requirements.hasUpperCase) {
        missingRequirements.push('una mayúscula');
    }
    
    if (!requirements.hasLowerCase) {
        missingRequirements.push('una minúscula');
    }
    
    if (!requirements.hasSpecialChar) {
        missingRequirements.push('un carácter especial (@$!%*?&.#^-_)');
    }

    // Si faltan requisitos, retornar error
    if (missingRequirements.length > 0) {
        const errorMessage = `La contraseña debe contener ${missingRequirements.join(', ')}`;
        return { 
            isValid: false, 
            error: errorMessage,
            missingRequirements: missingRequirements
        };
    }

    // Calcular fortaleza adicional
    const strength = calculatePasswordStrength(password);
    const strengthInfo = getStrengthInfo(strength);

    return {
        isValid: true,
        strength: strength,
        strengthInfo: strengthInfo,
        requirements: requirements
    };
}

export function validatePasswordMatch(password, confirmPassword) {
    if (!confirmPassword) {
        return { isValid: false, error: 'Confirma tu contraseña' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Las contraseñas no coinciden' };
    }

    return { isValid: true };
}

/**
 * Calcula la fortaleza de la contraseña (0-5)
 */
export function calculatePasswordStrength(password) {
    let score = 0;

    // Longitud básica
    if (password.length >= 8) score += 1;
    
    // Caracteres requeridos
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[@$!%*?&.#^_-]/.test(password)) score += 1;

    // Longitud adicional
    if (password.length >= 12) score += 1;

    return Math.min(score, 5);
}

/**
 * Obtiene información de fortaleza
 */
function getStrengthInfo(score) {
    const strengthLevels = [
        { text: 'Muy débil', color: '#dc3545', width: '20%', className: 'strength-very-weak' },
        { text: 'Débil', color: '#ff6b6b', width: '40%', className: 'strength-weak' },
        { text: 'Moderada', color: '#ffc107', width: '60%', className: 'strength-medium' },
        { text: 'Fuerte', color: '#17a2b8', width: '80%', className: 'strength-strong' },
        { text: 'Muy fuerte', color: '#28a745', width: '100%', className: 'strength-very-strong' }
    ];

    return strengthLevels[score] || strengthLevels[0];
}

/**
 * Configura el indicador de fuerza de contraseña en tiempo real
 */
export function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('strengthText');
    const errorElement = document.getElementById('passwordError');

    if (!passwordInput || !strengthBar || !strengthText) return;

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        // Validar en tiempo real
        const validationResult = validatePassword(password);
        const strength = calculatePasswordStrength(password);
        
        // Actualizar barra de fuerza
        updatePasswordStrength(strength, strengthBar, strengthText);
        
        // Mostrar/ocultar errores
        if (password.length === 0) {
            hideError(passwordInput, errorElement);
            strengthText.textContent = 'Seguridad de la contraseña';
        } else if (!validationResult.isValid) {
            showError(passwordInput, errorElement, validationResult.error);
        } else {
            hideError(passwordInput, errorElement);
        }
    });

    // Validar también al perder foco
    passwordInput.addEventListener('blur', function() {
        const password = this.value;
        const validationResult = validatePassword(password);
        
        if (!validationResult.isValid && password.length > 0) {
            showError(passwordInput, errorElement, validationResult.error);
        }
    });

    // Limpiar error al enfocar
    passwordInput.addEventListener('focus', function() {
        hideError(passwordInput, errorElement);
    });
}

/**
 * Actualiza la visualización de la fuerza de la contraseña
 */
export function updatePasswordStrength(score, bar, text) {
    // Reset classes
    bar.className = 'strength-fill';
    text.className = 'strength-text';
    
    const strengthInfo = getStrengthInfo(score);

    if (score === 0) {
        bar.style.width = '0%';
        bar.style.backgroundColor = '#e9ecef';
        text.textContent = 'Seguridad de la contraseña';
        text.style.color = '#6c757d';
    } else {
        bar.style.width = strengthInfo.width;
        bar.style.backgroundColor = strengthInfo.color;
        bar.classList.add(strengthInfo.className);
        text.textContent = strengthInfo.text;
        text.style.color = strengthInfo.color;
        text.classList.add(strengthInfo.className + '-text');
    }
}

/**
 * Configura validación en tiempo real para confirmar contraseña
 */
export function setupRealTimePasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const confirmErrorElement = document.getElementById('confirmPasswordError');

    if (!passwordInput || !confirmInput || !confirmErrorElement) return;

    // Validar confirmación mientras escribe
    confirmInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const confirmPassword = this.value;
        
        if (confirmPassword.length === 0) {
            hideError(confirmInput, confirmErrorElement);
            return;
        }

        const validationResult = validatePasswordMatch(password, confirmPassword);
        
        if (!validationResult.isValid) {
            showError(confirmInput, confirmErrorElement, validationResult.error);
        } else {
            hideError(confirmInput, confirmErrorElement);
        }
    });

    // Validar también al perder foco
    confirmInput.addEventListener('blur', function() {
        const password = passwordInput.value;
        const confirmPassword = this.value;
        
        if (confirmPassword.length > 0) {
            const validationResult = validatePasswordMatch(password, confirmPassword);
            
            if (!validationResult.isValid) {
                showError(confirmInput, confirmErrorElement, validationResult.error);
            }
        }
    });

    // Limpiar error al enfocar
    confirmInput.addEventListener('focus', function() {
        hideError(confirmInput, confirmErrorElement);
    });

    // También validar cuando cambie la contraseña principal
    passwordInput.addEventListener('input', function() {
        const confirmPassword = confirmInput.value;
        
        if (confirmPassword.length > 0) {
            const validationResult = validatePasswordMatch(this.value, confirmPassword);
            
            if (!validationResult.isValid) {
                showError(confirmInput, confirmErrorElement, validationResult.error);
            } else {
                hideError(confirmInput, confirmErrorElement);
            }
        }
    });
}

// =================================================================================================
// VALIDACIÓN DE EMAIL
// =============================================

const VALID_DOMAINS = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'mail.com', 'gmx.com', 'etb.net.co', 'une.net.co', 'epm.net.co',
    'telecom.com.co', 'colombia.com', 'latinmail.com', 'hotmail.com.co',
    'outlook.com.co', 'misena.edu.co', 'sena.edu.co', 'unal.edu.co'
];

const NONSENSE_WORDS = [
    'asdf', 'qwerty', 'zxcv', 'test', 'demo', 'temp', 'fake', 'example',
    'abc', '123', 'aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff', 'ggg', 'hhh',
    'iii', 'jjj', 'kkk', 'lll', 'mmm', 'nnn', 'ooo', 'ppp', 'qqq', 'rrr',
    'sss', 'ttt', 'uuu', 'vvv', 'www', 'xxx', 'yyy', 'zzz',
    'dsfh', 'sdfh', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 'jklm',
    'suehfs', 'dshfvf', 'wehf', 'kdhf', 'jshdf', 'hsdf', 'lalala',
    'blabla', 'hdsuhfdvc', '5tytyt', '5654645', 'hfdjsk', 'kdhfj'
];

const REPETITIVE_NUMBERS = [
    '111', '222', '333', '444', '555', '666', '777', '888', '999', '000',
    '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543'
];

export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'El email es obligatorio' };
    }

    email = email.trim().toLowerCase();

    // Validación básica de formato
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { isValid: false, error: 'Formato de email no válido' };
    }

    const [localPart, domain] = email.split('@');

    // 1. Validar que no sea solo números antes del @
    if (/^\d+$/.test(localPart)) {
        return { isValid: false, error: 'El email no puede contener solo números antes del @' };
    }

    // 2. Validar longitud mínima antes del @
    if (localPart.length < 3) {
        return { isValid: false, error: 'El email debe tener al menos 3 caracteres antes del @' };
    }

    // 3. Validar longitud máxima antes del @
    if (localPart.length > 30) {
        return { isValid: false, error: 'El email no puede tener más de 30 caracteres antes del @' };
    }

    // 4. Validar que comience con letra o número
    if (!/^[a-zA-Z0-9]/.test(localPart)) {
        return { isValid: false, error: 'El email debe comenzar con una letra o número' };
    }

    // 5. Validar que termine con letra o número
    if (!/[a-zA-Z0-9]$/.test(localPart)) {
        return { isValid: false, error: 'El email debe terminar con una letra o número' };
    }

    // 6. Validar caracteres repetitivos (más de 2 caracteres iguales seguidos)
    if (/(.)\1{2,}/.test(localPart)) {
        return { isValid: false, error: 'El email contiene caracteres repetitivos (ej: aaa, bbb)' };
    }

    // 7. Validar palabras incoherentes
    if (containsNonsense(localPart)) {
        return { isValid: false, error: 'El email contiene palabras sin sentido común' };
    }

    // 8. Validar secuencias numéricas repetitivas
    if (containsRepetitiveNumbers(localPart)) {
        return { isValid: false, error: 'El email contiene secuencias numéricas repetitivas' };
    }

    // 9. Validar solo vocales
    if (/^[aeiou]+$/i.test(localPart)) {
        return { isValid: false, error: 'El email no puede contener solo vocales' };
    }

    // 10. Validar solo consonantes (más de 5 consecutivas)
    if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(localPart)) {
        return { isValid: false, error: 'El email contiene demasiadas consonantes seguidas' };
    }

    // 11. Validar patrones alternantes (lalala, blabla, etc.)
    if (hasAlternatingPattern(localPart)) {
        return { isValid: false, error: 'El email contiene patrones repetitivos (ej: lalala, blabla)' };
    }

    // 12. Validar secuencias incoherentes
    if (hasIncoherentSequence(localPart)) {
        return { isValid: false, error: 'El email contiene secuencias incoherentes' };
    }

    // 13. Validar proporción vocal/consonante
    const vowelCount = (localPart.match(/[aeiou]/gi) || []).length;
    const consonantCount = (localPart.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
    
    if (vowelCount === 0 && consonantCount > 0) {
        return { isValid: false, error: 'El email debe contener al menos una vocal' };
    }

    // 14. Validar dominio reconocido
    if (!isValidDomain(domain)) {
        return {
            isValid: false,
            error: 'Dominio de email no reconocido. Use proveedores válidos como Gmail, Yahoo, Outlook, etc.'
        };
    }

    // 15. Validar estructura del dominio
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
        return { isValid: false, error: 'Dominio de email no válido' };
    }

    return { isValid: true, email: email };
}

/**
 * Verifica si contiene palabras incoherentes
 */
function containsNonsense(localPart) {
    return NONSENSE_WORDS.some(word => {
        const regex = new RegExp(word, 'i');
        return regex.test(localPart);
    });
}

/**
 * Verifica si contiene secuencias numéricas repetitivas
 */
function containsRepetitiveNumbers(localPart) {
    return REPETITIVE_NUMBERS.some(sequence => {
        return localPart.includes(sequence);
    });
}

/**
 * Valida el dominio contra lista de dominios reconocidos
 */
function isValidDomain(domain) {
    // Verificar contra lista de dominios reconocidos
    const isRecognizedDomain = VALID_DOMAINS.some(validDomain =>
        domain === validDomain || domain.endsWith('.' + validDomain)
    );

    if (isRecognizedDomain) return true;

    // Si no está en la lista, verificar estructura básica pero mostrar advertencia
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
}

/**
 * Configura validación en tiempo real para email
 */
/**
 * Configura validación en tiempo real para email con verificación de existencia
 */
export function setupRealTimeEmailValidation() {
    const emailInput = document.getElementById('email');
    const errorElement = document.getElementById('emailError');

    if (!emailInput || !errorElement) {
        return;
    }

    let timeout = null;

    emailInput.addEventListener('input', function() {
        clearTimeout(timeout);
        
        // Validación básica inmediata
        const email = this.value.trim();
        const basicValidation = validateEmail(email);
        
        if (!basicValidation.isValid) {
            showError(emailInput, errorElement, basicValidation.error);
            return;
        } else {
            hideError(emailInput, errorElement);
        }

        // Espera 800ms después de que el usuario deja de escribir para verificar con el servidor
        timeout = setTimeout(() => {
            if (email.length === 0) {
                hideError(emailInput, errorElement);
                return;
            }

            // Verificar con el servidor si el email existe
            fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(exists => {
                    if (exists) {
                        showError(emailInput, errorElement, 'El email ya está registrado en el sistema');
                    } else {
                        hideError(emailInput, errorElement);
                    }
                })
                .catch(error => {
                    console.error('Error al verificar email:', error);
                });
        }, 800);
    });

    // Validar al perder foco
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email) {
            const validation = validateEmail(email);
            if (!validation.isValid) {
                showError(emailInput, errorElement, validation.error);
            }
        }
    });

    // Limpiar error al enfocar
    emailInput.addEventListener('focus', function() {
        hideError(emailInput, errorElement);
    });
}

/** Valida email en tiempo real y muestra errores */
function validateEmailRealTime(input, errorElement) {
    const email = input.value.trim();

    if (!email) {
        showError(input, errorElement, 'El email es obligatorio');
        return false;
    }

    const result = validateEmail(email);

    if (!result.isValid) {
        showError(input, errorElement, result.error);
        return false;
    }

    // Si es válido, normalizar el email
    if (result.email && result.email !== email) {
        input.value = result.email;
    }

    hideError(input, errorElement);
    return true;
}


// =============================================
// VALIDACIÓN DE TELÉFONO EN TIEMPO REAL 
// =============================================
export function setupRealTimePhoneValidation() {
    const phoneInput = document.getElementById('phoneNumber');
    const errorElement = document.getElementById('phoneError');
    
    if (!phoneInput || !errorElement) {
        console.error('No se encontró el campo phoneNumber o phoneError');
        return null;
    }
    
    console.log('✅ Configurando validación de teléfono en tiempo real');
    
    // Inicializar intl-tel-input
    const iti = initPhoneInput(phoneInput);
    
    if (!iti) {
        console.error('Error al inicializar intl-tel-input');
        return null;
    }
    
    let timeout;
    phoneInput.addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            console.log('Validando teléfono:', this.value);
            validatePhoneRealTime(this, errorElement, iti);
        }, 500);
    });
    
    phoneInput.addEventListener('blur', function() {
        validatePhoneRealTime(this, errorElement, iti);
    });
    
    phoneInput.addEventListener('focus', function() {
        hideError(this, errorElement);
    });
    
    return iti;
}

/** Inicializa intl-tel-input simplificado */
export function initPhoneInput(phoneInput) {
    if (!phoneInput) return null;

    const iti = window.intlTelInput(phoneInput, {
        initialCountry: "auto",
        geoIpLookup: function (success, failure) {
            fetch("https://ipapi.co/json")
                .then(res => res.json())
                .then(data => success(data.country_code))
                .catch(() => {
                    console.log('No se pudo detectar país, usando CO por defecto');
                    success('co');
                });
        },
        preferredCountries: ['co', 'us', 'mx', 'es', 'ar', 'pe', 'cl', 'br', 'fr', 'de', 'it', 'uk'],
        separateDialCode: true,
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
        customPlaceholder: function (selectedCountryPlaceholder) {
            return "Ej: " + selectedCountryPlaceholder;
        }
    });

    // Borrar placeholder vacío
    phoneInput.placeholder = "";

    return iti;
}

/**
 * Valida teléfono en tiempo real 
 */
function validatePhoneRealTime(input, errorElement, iti) {
    const phone = input.value.trim();
    
    if (!phone) {
        showError(input, errorElement, 'El número de teléfono es obligatorio');
        return false;
    }

    const result = validatePhoneNumber(input, iti);
    
    if (!result.isValid) {
        showError(input, errorElement, result.error);
        return false;
    }
    
    // Si es válido, ocultar error y formatear automáticamente
    hideError(input, errorElement);
    
    // Formatear número automáticamente si es válido
    if (result.international && result.international !== phone) {
        input.value = result.international;
    }
    
    return true;
}

export function validatePhoneNumber(phoneInput, iti = null) {
    if (!phoneInput || !phoneInput.value.trim()) {
        return { isValid: false, error: "El número de teléfono es obligatorio" };
    }

    if (!iti) {
        iti = window.intlTelInputGlobals.getInstance(phoneInput);
    }
    
    if (!iti) {
        return { isValid: false, error: "Error en la validación del teléfono" };
    }

    if (!iti.isValidNumber()) {
        const errorCode = iti.getValidationError();
        const errorMessage = getPhoneErrorMessage(errorCode);
        return { isValid: false, error: errorMessage };
    }

    // Solo retornar información básica de validación
    return {
        isValid: true,
        international: iti.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL)
    };
}

/**
 * Mensajes de error para códigos de validación
 */
function getPhoneErrorMessage(errorCode) {
    switch (errorCode) {
        case 1: return "El número de teléfono es demasiado corto.";
        case 2: return "El código de país es inválido.";
        case 3: return "El número de teléfono es demasiado corto.";
        case 4: return "El número de teléfono es demasiado largo.";
        case 5: return "No es un número de teléfono válido.";
        case 6: return "El número solo es válido localmente.";
        default: return "Número de teléfono inválido.";
    }
}

// =================================================================================================
/** Valida nombre completo con reglas */
export function validateFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return { isValid: false, error: 'El nombre completo es obligatorio' };
    }

    fullName = fullName.trim();

    // 1. Validar longitud básica
    if (fullName.length < 2) {
        return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
    }

    if (fullName.length > 100) {
        return { isValid: false, error: 'El nombre no puede exceder 100 caracteres' };
    }

    // 2. Validar que solo contenga letras, espacios y acentos
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(fullName)) {
        return { isValid: false, error: 'El nombre solo puede contener letras y espacios' };
    }

    // 3. Dividir en palabras y validar cantidad
    const words = fullName.split(' ').filter(word => word.length > 0);

    if (words.length < 2) {
        return { isValid: false, error: 'Ingresa al menos un nombre y un apellido' };
    }

    // 4. Validar cada palabra individualmente
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordValidation = validateWord(word, i, words);

        if (!wordValidation.isValid) {
            return wordValidation;
        }
    }

    // 5. Validar patrones repetitivos entre palabras
    const repetitivePatternError = validateRepetitivePatterns(words);
    if (repetitivePatternError) {
        return { isValid: false, error: repetitivePatternError };
    }

    // 6. Auto-formatear nombre (capitalizar)
    const formattedName = words.map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    return { isValid: true, fullName: formattedName };
}

/**
 * Valida una palabra individual con reglas estrictas
 */
function validateWord(word, index, allWords) {
    // 1. Longitud mínima de cada palabra
    if (word.length < 3) {
        return { isValid: false, error: `Cada palabra debe tener al menos 3 letras ("${word}" tiene ${word.length})` };
    }

    // 2. No permitir solo vocales
    if (/^[aeiouáéíóúAEIOUÁÉÍÓÚ]+$/.test(word)) {
        return { isValid: false, error: `"${word}" no puede contener solo vocales` };
    }

    // 3. Validar proporción vocal/consonante
    const vowels = word.match(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/gi) || [];
    const consonants = word.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZñÑ]/gi) || [];

    if (vowels.length === 0) {
        return { isValid: false, error: `"${word}" debe contener al menos una vocal` };
    }

    // 4. Detectar letras repetidas (más de 2 veces seguidas)
    if (/(.)\1{2,}/.test(word)) {
        const repeated = word.match(/(.)\1{2,}/)[0];
        return { isValid: false, error: `"${word}" contiene letras repetidas (${repeated})` };
    }

    // 5. Detectar patrones alternantes (ama, ala, etc.)
    if (hasAlternatingPattern(word)) {
        return { isValid: false, error: `"${word}" tiene un patrón repetitivo (ej: ama, ala, ese)` };
    }

    // 6. Detectar secuencias incoherentes (jhjh, rhrh, etc.)
    if (hasIncoherentSequence(word)) {
        return { isValid: false, error: `"${word}" tiene una secuencia incoherente` };
    }

    // 7. Validar que no sea palabra repetida consecutiva
    if (index > 0 && word.toLowerCase() === allWords[index - 1].toLowerCase()) {
        return { isValid: false, error: `No puedes repetir la misma palabra consecutivamente` };
    }

    return { isValid: true };
}

/**
 * Detecta patrones alternantes 
 */
function hasAlternatingPattern(word) {
    if (word.length < 3) return false;

    const lowerWord = word.toLowerCase();

    // Patrón: carácter1-carácter2-carácter1 (ama, ere, ici, etc.)
    for (let i = 0; i <= lowerWord.length - 3; i++) {
        const segment = lowerWord.substring(i, i + 3);
        if (segment[0] === segment[2] && segment[0] !== segment[1]) {
            // Verificar que no sea un patrón válido en español
            const validPatterns = ['ama', 'ene', 'ere', 'iri', 'oro', 'oso', 'asa', 'ese', 'isi'];
            if (!validPatterns.includes(segment)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Detecta secuencias incoherentes
 */
function hasIncoherentSequence(word) {
    if (word.length < 4) return false;

    const lowerWord = word.toLowerCase();

    for (let i = 0; i <= lowerWord.length - 4; i++) {
        const segment = lowerWord.substring(i, i + 4);
        if (segment[0] === segment[2] && segment[1] === segment[3] && segment[0] !== segment[1]) {
            // Solo marcar como incoherente si no son combinaciones comunes en español
            const commonCombinations = ['papa', 'mama', 'coco', 'bebe', 'dada', 'nene'];
            if (!commonCombinations.includes(segment)) {
                return true;
            }
        }
    }

    // Detectar muchas consonantes seguidas (más de 3)
    if (/[bcdfghjklmnpqrstvwxyzñ]{4,}/i.test(word)) {
        return true;
    }

    return false;
}

/**
 * Valida patrones repetitivos entre palabras
 */
function validateRepetitivePatterns(words) {
    // Verificar palabras muy similares consecutivas
    for (let i = 0; i < words.length - 1; i++) {
        const current = words[i].toLowerCase();
        const next = words[i + 1].toLowerCase();

        if (areWordsSimilar(current, next)) {
            return 'Las palabras son demasiado similares entre sí';
        }

        if (current.length === 2 && next.length === 2 &&
            current[0] === next[0] && current !== next) {
            return 'Patrón de palabras repetitivo detectado';
        }
    }

    return null;
}

/**
 * Verifica si dos palabras son muy similares
 */
function areWordsSimilar(word1, word2) {
    if (Math.abs(word1.length - word2.length) > 1) return false;

    const minLength = Math.min(word1.length, word2.length);
    let differences = 0;

    for (let i = 0; i < minLength; i++) {
        if (word1[i] !== word2[i]) {
            differences++;
            if (differences > 1) return false;
        }
    }

    return differences <= 1;
}

/**
 * Configura validación en tiempo real para nombre completo
 */
export function setupRealTimeNameValidation() {
    const nameInput = document.getElementById('fullName');
    const errorElement = document.getElementById('fullNameError');

    if (!nameInput || !errorElement) {
        console.error('No se encontró el campo fullName o fullNameError');
        return;
    }

    console.log('✅ Configurando validación de nombre en tiempo real');

    // Validar mientras escribe (con debounce)
    let timeout;
    nameInput.addEventListener('input', function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            console.log('Validando nombre:', this.value);
            validateNameRealTime(this, errorElement);
        }, 300);
    });

    // Validar al perder foco
    nameInput.addEventListener('blur', function () {
        validateNameRealTime(this, errorElement);
    });

    // Limpiar error al enfocar
    nameInput.addEventListener('focus', function () {
        hideError(this, errorElement);
    });
}

/**
 * Valida nombre en tiempo real y muestra errores
 */
function validateNameRealTime(input, errorElement) {
    const name = input.value.trim();

    if (!name) {
        showError(input, errorElement, 'El nombre completo es obligatorio');
        return false;
    }

    const result = validateFullName(name);

    if (!result.isValid) {
        showError(input, errorElement, result.error);
        return false;
    }

    // Auto-formatear si es válido
    if (result.fullName && result.fullName !== name) {
        input.value = result.fullName;
    }

    hideError(input, errorElement);
    return true;
}

/**
 * Muestra error en el campo
 */
export function showError(input, errorElement, message) {
    if (typeof input === 'string') {
        input = document.getElementById(input);
    }
    if (typeof errorElement === 'string') {
        errorElement = document.getElementById(errorElement);
    }

    if (input && errorElement) {
        console.log('Mostrando error:', message);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('show');
        input.classList.add('error');
        input.classList.remove('valid');
    }
}

/**
 * Oculta error del campo
 */
export function hideError(input, errorElement) {
    if (typeof input === 'string') {
        input = document.getElementById(input);
    }
    if (typeof errorElement === 'string') {
        errorElement = document.getElementById(errorElement);
    }

    if (input && errorElement) {
        errorElement.style.display = 'none';
        errorElement.classList.remove('show');
        input.classList.remove('error');
        input.classList.add('valid');
    }
}