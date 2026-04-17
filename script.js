const body = document.body;

// Removing obsolete math-based smooth scroll in favor of strict native browser implementation!

// ----- Modals (Page Transitions) ----- //
window.openContactForm = function(serviceName) {
    const modal = document.getElementById('contact-form-modal');
    if(modal) {
        const input = document.getElementById('hidden-service-input');
        const subtitleSpan = document.querySelector('#form-service-subtitle span');
        if (input) input.value = serviceName;
        if (subtitleSpan) subtitleSpan.textContent = serviceName;
        openModal('contact-form-modal');
    }
}

window.openModal = function(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.add('active');
        document.documentElement.style.overflow = 'hidden'; // iOS fix
        body.style.overflow = 'hidden'; // Lock background scroll
        // reset scroll position of the modal itself just in case
        modal.scrollTo(0, 0);
        // Deep linking hash update
        if (window.location.hash !== '#' + id) {
            history.replaceState(null, null, '#' + id);
        }
    }
}

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.remove('active');
        document.documentElement.style.overflow = ''; // Unlock iOS
        body.style.overflow = ''; // Unlock scroll
        // Remove deep linking hash cleanly
        if (window.location.hash === '#' + id) {
            history.replaceState(null, null, window.location.pathname + window.location.search);
        }
    }
}

// ----- Dark Mode Toggle ----- //
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
};
initTheme();


document.addEventListener('DOMContentLoaded', () => {
    // Deep Linking: Auto-open modal if hash exists
    if (window.location.hash && window.location.hash.includes('-modal')) {
        const targetModalId = window.location.hash.substring(1);
        setTimeout(() => {
            if (document.getElementById(targetModalId)) {
                window.openModal(targetModalId);
            }
        }, 150);
    }

    // Theme Button Event
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    // ----- Smooth Burger Menu ----- //
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if(menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            if(navLinks.classList.contains('open')) {
                body.style.overflow = 'hidden';
                menuToggle.classList.add('active');
            } else {
                body.style.overflow = '';
                menuToggle.classList.remove('active');
            }
        });

        // Close menu when clicking a link & Handle Smooth Scroll
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
                // Support explicit anchor scrolling
                const targetId = this.getAttribute('href');
                if (targetId && targetId !== '#') {
                    e.preventDefault();
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        // Native acceleration is instant and perfectly buttery
                        const topPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - 48;
                        window.scrollTo({
                            top: topPosition,
                            behavior: 'smooth'
                        });
                    }
                }
                
                navLinks.classList.remove('open');
                body.style.overflow = '';
                menuToggle.classList.remove('active');
            });
        });
    }

    // ----- Carousel Logic ----- //
    const track = document.getElementById('projects-carousel');
    if (track) {
        const slides = Array.from(track.children);
        const nextBtn = document.querySelector('.carousel-btn.next');
        const prevBtn = document.querySelector('.carousel-btn.prev');
        const dots = Array.from(document.querySelectorAll('.dot'));
        
        let currentIndex = 0;
        let slideInterval;

        const updateCarousel = (index) => {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            
            currentIndex = index;
            
            const slide = slides[currentIndex];
            const scrollPos = slide.offsetLeft - track.offsetLeft - (track.clientWidth - slide.clientWidth) / 2;
            
            // Temporarily disable scroll-snap to let native smoothscroll execute without jitter
            track.style.scrollSnapType = 'none';
            track.scrollTo({ left: scrollPos, behavior: 'smooth' });
            
            // Revert back so manual finger swipes still snap correctly
            setTimeout(() => { track.style.scrollSnapType = 'x mandatory'; }, 650);
            
            // Update dots
            dots.forEach(d => d.classList.remove('active'));
            if(dots[currentIndex]) {
                dots[currentIndex].classList.add('active');
            }
        };

        const startAutoplay = () => {
            slideInterval = setInterval(() => {
                updateCarousel(currentIndex + 1);
            }, 6000); // 6 sec interval
        };

        const stopAutoplay = () => {
            clearInterval(slideInterval);
            startAutoplay(); // Restart interval to prevent quick jumping
        };

        if(nextBtn) {
            nextBtn.addEventListener('click', () => {
                updateCarousel(currentIndex + 1);
                stopAutoplay();
            });
        }

        if(prevBtn) {
            prevBtn.addEventListener('click', () => {
                updateCarousel(currentIndex - 1);
                stopAutoplay();
            });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                updateCarousel(index);
                stopAutoplay();
            });
        });

        // Track manual scroll intelligently
        track.addEventListener('scroll', () => {
            const scrollPos = track.scrollLeft;
            const centerPos = scrollPos + track.clientWidth / 2;
            
            let closestSlide = 0;
            let closestDistance = Infinity;
            
            slides.forEach((slide, i) => {
                const slideCenter = slide.offsetLeft - track.offsetLeft + slide.clientWidth / 2;
                const dist = Math.abs(centerPos - slideCenter);
                if(dist < closestDistance) {
                    closestDistance = dist;
                    closestSlide = i;
                }
            });
            
            if (closestSlide !== currentIndex) {
                currentIndex = closestSlide;
                dots.forEach(d => d.classList.remove('active'));
                if(dots[currentIndex]) {
                    dots[currentIndex].classList.add('active');
                }
            }
        }, { passive: true });

        // Start autoplay on load
        startAutoplay();
    }

    // ----- Contact Form AJAX Submission ----- //
    const contactForm = document.querySelector('.apple-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            const isEn = document.documentElement.lang === 'en';
            
            submitBtn.textContent = isEn ? 'Sending...' : 'Отправка...';
            submitBtn.disabled = true;

            const formData = new FormData(this);
            // Convert standard FormSubmit URL to their AJAX endpoint
            const actionUrl = this.action.replace('formsubmit.co', 'formsubmit.co/ajax');

            fetch(actionUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if(data.success || data.success === "true") {
                    const formContent = this.closest('.form-content');
                    if (formContent) {
                        formContent.innerHTML = `
                            <div style="text-align: center; padding: 4rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 2rem;">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <h2 class="modal-title" style="margin-bottom: 1.5rem; font-size: 3rem;">${isEn ? 'Thank you!' : 'Спасибо!'}</h2>
                                <p style="font-size: 1.25rem; color: var(--text-gray); line-height: 1.6; max-width: 500px; margin: 0 auto;">${isEn ? 'Your request has been successfully sent. We will contact you shortly to discuss the project in detail.' : 'Ваша заявка успешно отправлена. Мы свяжемся с вами в ближайшее время для детального обсуждения проекта.'}</p>
                            </div>
                        `;
                    }
                } else {
                    alert(isEn ? 'An error occurred while sending. Please try again.' : 'Произошла ошибка при отправке. Пожалуйста, попробуйте снова.');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(isEn ? 'Connection error. Please check your internet and try again.' : 'Ошибка соединения. Пожалуйста, проверьте интернет и попробуйте еще раз.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        });
    }
});
