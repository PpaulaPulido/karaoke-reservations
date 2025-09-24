// =======================
// Navbar Scroll Effect
// =======================
export function initNavbarScroll() {
    window.addEventListener("scroll", function () {
        const navbar = document.querySelector(".navbar");
        if (navbar) {
            navbar.classList.toggle("scrolled", window.scrollY > 50);
        }
    });
}

// =======================
// Recommendation Cards
// =======================
export function initRecommendationCards() {
    const recommendationCards = document.querySelectorAll('.recommendation-card');
    if (!recommendationCards.length) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';
            }
        });
    }, observerOptions);

    recommendationCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.95)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);

        // Hover
        card.addEventListener('mouseenter', () => card.classList.add('card-active'));
        card.addEventListener('mouseleave', () => card.classList.remove('card-active'));

        // Click
        card.addEventListener('click', function () {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => this.style.transform = '', 150);
            console.log('Card clicked:', this.querySelector('h5')?.textContent);
        });
    });
}

// =======================
// Experience Section
// =======================
export function initExperienceSection() {
    const experienceSection = document.querySelector('.experience');
    if (!experienceSection) return;

    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');

                const tagItems = entry.target.querySelectorAll('.tag-item');
                tagItems.forEach((tag, index) => {
                    setTimeout(() => {
                        tag.style.opacity = '1';
                        tag.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }
        });
    }, observerOptions);

    observer.observe(experienceSection);

    // Preparar tags
    const tagItems = experienceSection.querySelectorAll('.tag-item');
    tagItems.forEach(tag => {
        tag.style.opacity = '0';
        tag.style.transform = 'translateY(20px)';
        tag.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    // Hover tags
    tagItems.forEach(tag => {
        tag.addEventListener('mouseenter', () => tag.style.zIndex = '10');
        tag.addEventListener('mouseleave', () => tag.style.zIndex = '1');
    });

    // CTA button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function () {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);
            console.log('CTA button clicked - Descubrir experiencia');
        });
    }

    // Play button
    const playButton = document.querySelector('.play-button');
    if (playButton) {
        playButton.addEventListener('click', function (e) {
            e.stopPropagation();
            this.style.transform = 'scale(1.2)';
            setTimeout(() => this.style.transform = 'scale(1)', 200);
            console.log('Play button clicked - Ver video de experiencia');
        });
    }

    // Parallax floating neons
    window.addEventListener('scroll', function () {
        const scrolled = window.pageYOffset;
        const rect = experienceSection.getBoundingClientRect();

        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const rate = scrolled * -0.3;
            const floatingNeons = experienceSection.querySelectorAll('.floating-neon');
            floatingNeons.forEach((neon, index) => {
                neon.style.transform = `translateY(${rate * (index + 1) * 0.3}px)`;
            });
        }
    });

    // Footer badges hover
    const footerBadges = document.querySelectorAll('.footer-badges span');
    footerBadges.forEach(badge => {
        badge.addEventListener('mouseenter', () => badge.style.transform = 'translateY(-3px) scale(1.05)');
        badge.addEventListener('mouseleave', () => badge.style.transform = 'translateY(0) scale(1)');
    });
}

// =======================
// Hero Section
// =======================
export function initHeroSection() {
    const hero = document.querySelector('.hero');
    const heroTitle = document.querySelector('.hero-title');
    const buttonHero = document.querySelector('.btn-hero');
    const background = document.querySelector('.main-container');

    if (!hero || !heroTitle) return;

    // Floating notes
    (function createFloatingNotes() {
        const floatingContainer = document.createElement('div');
        floatingContainer.className = 'floating-music-notes';
        const notes = ['♩', '♪', '♫', '♬', '🎵'];

        notes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = 'music-note';
            noteElement.textContent = note;
            noteElement.style.animationDelay = `${index * 1.5}s`;
            floatingContainer.appendChild(noteElement);
        });

        hero.appendChild(floatingContainer);
    })();

    // Typewriter effect
    (function typeWriterEffect() {
        const originalText = heroTitle.innerHTML;
        const highlight = heroTitle.querySelector('.highlight')?.textContent;
        if (highlight) {
            heroTitle.innerHTML = originalText.replace(
                highlight, `<span class="highlight">${highlight}</span>`
            );
        }
    })();

    // Button particles
    if (buttonHero) {
        buttonHero.addEventListener('mouseenter', function () {
            createParticles(this);
        });
    }

    function createParticles(button) {
        const particles = ['🎤', '🎵', '🌟', '✨', '🎶'];
        const rect = button.getBoundingClientRect();

        particles.forEach((particle, i) => {
            const particleEl = document.createElement('div');
            particleEl.textContent = particle;
            particleEl.style.position = 'absolute';
            particleEl.style.fontSize = '1.2rem';
            particleEl.style.pointerEvents = 'none';
            particleEl.style.zIndex = '1000';
            particleEl.style.animation = `particleFloat 1s ease-out forwards ${i * 0.1}s`;

            particleEl.style.left = `${rect.left + rect.width / 2}px`;
            particleEl.style.top = `${rect.top}px`;

            document.body.appendChild(particleEl);
            setTimeout(() => particleEl.remove(), 1000);
        });
    }

    // Particle styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0% { opacity: 1; transform: translate(0, 0) scale(1); }
            100% { opacity: 0; transform: translate(${Math.random() * 100 - 50}px, -100px) scale(0); }
        }
    `;
    document.head.appendChild(style);

    // Parallax
    window.addEventListener('scroll', function () {
        const scrolled = window.pageYOffset;
        if (hero && background) {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate * 0.3}px)`;
            background.style.backgroundPosition = `center ${rate * 0.1}px`;
        }
    });

    // Sound effects
    const buttons = document.querySelectorAll('.btn-hero, .btn-register, .btn-login');
    buttons.forEach(button => {
        button.addEventListener('click', playClickSound);
        button.addEventListener('mouseenter', playHoverSound);
    });

    function playClickSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 523.25;
        gainNode.gain.value = 0.1;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    function playHoverSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 659.25;
        gainNode.gain.value = 0.05;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    console.log('🎵 Hero effects initialized');
}
