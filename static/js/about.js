// ===== ANIMATED SKILL BARS =====
const animateSkillBars = () => {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.style.width;
                
                // Reset and animate
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
                
                observer.unobserve(bar);
            }
        });
    }, {
        threshold: 0.5
    });
    
    skillBars.forEach(bar => observer.observe(bar));
};

animateSkillBars();

// ===== CONTACT FORM HANDLING =====
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };
    
    console.log('Form submitted:', formData);
    
    // Show success message
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = '✓ Message Sent!';
    submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    // Reset form
    contactForm.reset();
    
    // Reset button after 3 seconds
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.background = '';
    }, 3000);
});

// ===== FORM VALIDATION =====
const formInputs = contactForm.querySelectorAll('input, textarea');

formInputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value.trim() === '') {
            input.style.borderColor = 'var(--danger)';
        } else {
            input.style.borderColor = 'var(--success)';
        }
    });
    
    input.addEventListener('focus', () => {
        input.style.borderColor = 'var(--accent-primary)';
    });
});

// ===== SOCIAL ICON ANIMATIONS =====
const socialIcons = document.querySelectorAll('.social-icon');

socialIcons.forEach((icon, index) => {
    icon.style.animationDelay = `${index * 0.1}s`;
    
    icon.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Add click animation
        icon.style.transform = 'scale(0.9) translateY(-5px)';
        setTimeout(() => {
            icon.style.transform = 'scale(1) translateY(-5px)';
        }, 100);
        
        console.log(`Clicked social icon: ${icon.title}`);
    });
});

// ===== TIMELINE ANIMATION =====
const timelineItems = document.querySelectorAll('.timeline-item');

const observeTimeline = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });
    
    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(item);
    });
};

observeTimeline();

// ===== SKILL CATEGORY HOVER EFFECTS =====
const skillCategories = document.querySelectorAll('.skill-category');

skillCategories.forEach(category => {
    category.addEventListener('mouseenter', () => {
        category.style.transform = 'translateY(-5px)';
    });
    
    category.addEventListener('mouseleave', () => {
        category.style.transform = 'translateY(0)';
    });
});

// ===== HIGHLIGHT ITEMS ANIMATION =====
const highlightItems = document.querySelectorAll('.highlight-item');

highlightItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
    }, 300 + (index * 150));
});

// ===== CONTACT METHOD ANIMATION =====
const contactMethods = document.querySelectorAll('.contact-method');

const observeContactMethods = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    }, {
        threshold: 0.3
    });
    
    contactMethods.forEach((method, index) => {
        method.style.opacity = '0';
        method.style.transform = 'translateX(-20px)';
        method.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(method);
    });
};

observeContactMethods();

// ===== CALCULATE TOTAL SKILL PERCENTAGE =====
const calculateAverageSkill = () => {
    const percentages = Array.from(document.querySelectorAll('.skill-percentage'))
        .map(el => parseInt(el.textContent));
    
    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    console.log(`Average skill level: ${average.toFixed(1)}%`);
};

calculateAverageSkill();

// ===== EMAIL COPY TO CLIPBOARD =====
const emailLinks = document.querySelectorAll('a[href^="mailto:"]');

emailLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const email = link.textContent;
        
        // Copy to clipboard
        navigator.clipboard.writeText(email).then(() => {
            // Show tooltip
            const tooltip = document.createElement('span');
            tooltip.textContent = 'Copied!';
            tooltip.style.cssText = `
                position: absolute;
                background: var(--success);
                color: white;
                padding: 0.3rem 0.8rem;
                border-radius: 0.5rem;
                font-size: 0.85rem;
                margin-left: 10px;
                animation: fadeIn 0.3s ease;
            `;
            
            link.parentElement.appendChild(tooltip);
            
            setTimeout(() => {
                tooltip.remove();
            }, 2000);
        });
    });
});

// ===== PROFILE IMAGE ANIMATION =====
const avatarLarge = document.querySelector('.avatar-large');

if (avatarLarge) {
    avatarLarge.addEventListener('mouseenter', () => {
        avatarLarge.style.transform = 'scale(1.05) rotate(5deg)';
        avatarLarge.style.transition = 'transform 0.3s ease';
    });
    
    avatarLarge.addEventListener('mouseleave', () => {
        avatarLarge.style.transform = 'scale(1) rotate(0deg)';
    });
}

// ===== SCROLL PROGRESS INDICATOR (Optional) =====
const createScrollProgress = () => {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: var(--accent-gradient);
        width: 0%;
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrollPercentage + '%';
    });
};

createScrollProgress();