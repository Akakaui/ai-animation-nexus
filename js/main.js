/**
 * AI Animation Nexus - Main Script Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. Countdown Timer (Time-based application deadline)
  // ==========================================================================
  const deadline = new Date('July 23, 2026 12:00:00 UTC').getTime();
  
  const updateCountdown = () => {
    const now = new Date().getTime();
    const difference = deadline - now;
    
    if (difference <= 0) {
      document.getElementById('countdownTimer').innerHTML = "<div class='time-block'>Closed</div>";
      return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
  };
  
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ==========================================================================
  // 2. Global Timezone Switcher Component
  // ==========================================================================
  const tzButtons = document.querySelectorAll('.tz-btn');
  const localTimeVal = document.getElementById('localTimeVal');
  const localTzVal = document.getElementById('localTzVal');
  
  tzButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tzButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const targetTime = btn.getAttribute('data-time');
      const targetTz = btn.getAttribute('data-tz');
      
      localTimeVal.textContent = targetTime;
      localTzVal.textContent = targetTz;
      
      // GSAP pulse animation on display update
      gsap.fromTo('.tz-time-group', 
        { scale: 0.95, opacity: 0.8 }, 
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    });
  });

  // ==========================================================================
  // 3. Collapsible FAQ Accordions with Plus to Minus Transitions
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-accordion-item');
  
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const body = item.querySelector('.faq-body');
    
    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      
      // Close other open accordions
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-body').style.height = '0px';
          otherItem.querySelector('.faq-header').setAttribute('aria-expanded', 'false');
        }
      });
      
      if (isOpen) {
        item.classList.remove('active');
        body.style.height = '0px';
        header.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        body.style.height = body.scrollHeight + 'px';
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ==========================================================================
  // 4. GSAP Squiggle Shape Boiling / Morphing Effect
  // ==========================================================================
  // We animate the scale and rotation of sketch elements rapidly to create the
  // classic hand-drawn "boiling" line effect (shapes squiggling alive)
  gsap.to('.sketch-svg', {
    scaleX: 'random(0.97, 1.03)',
    scaleY: 'random(0.97, 1.03)',
    rotation: 'random(-2, 2)',
    skewX: 'random(-1, 1)',
    duration: 0.12,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
    stagger: {
      amount: 0.2,
      from: "random"
    }
  });

  // Wobbly animation for the doodles too
  gsap.to('.doodle-leaf, .doodle-arrow', {
    rotation: '+=3',
    y: '+=2',
    x: '+=1',
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  // ==========================================================================
  // 5. Interactive Flashcard Application Form Deck (Deck slider & navigation)
  // ==========================================================================
  const formPanel = document.getElementById('formPanel');
  const formBackdrop = document.getElementById('formBackdrop');
  const triggerFormBtns = document.querySelectorAll('.trigger-form-btn');
  const formBackHomeBtn = document.getElementById('formBackHomeBtn');
  
  const flashCards = document.querySelectorAll('.flash-card');
  const prevBtns = document.querySelectorAll('.prev-card-btn');
  const nextBtns = document.querySelectorAll('.next-card-btn');
  const submitFormBtn = document.getElementById('submitFormBtn');
  
  const currentStepNum = document.getElementById('currentStepNum');
  const totalStepsNum = document.getElementById('totalStepsNum');
  const progressBarFill = document.getElementById('progressBarFill');
  
  let activeStep = 1;
  const totalSteps = flashCards.length;
  totalStepsNum.textContent = totalSteps;

  // Open Form Panel
  const openForm = () => {
    formPanel.classList.add('active');
    formBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock main page scroll
    
    // Reset to step 1 when opening
    goToStep(1);
    
    // Quick GSAP reveal
    gsap.fromTo('.form-panel', 
      { x: '100%' }, 
      { x: '0%', duration: 0.4, ease: 'power2.out' }
    );
  };

  // Close Form Panel
  const closeForm = () => {
    formPanel.classList.remove('active');
    formBackdrop.classList.remove('active');
    document.body.style.overflow = ''; // Release scroll
  };

  // Form Trigger Events
  triggerFormBtns.forEach(btn => btn.addEventListener('click', openForm));
  formBackHomeBtn.addEventListener('click', closeForm);
  formBackdrop.addEventListener('click', closeForm);

  // Deck Navigation Function
  const goToStep = (step) => {
    if (step < 1 || step > totalSteps) return;
    
    activeStep = step;
    currentStepNum.textContent = activeStep;
    
    // Update progress bar percentage
    const progressPercent = (activeStep / totalSteps) * 100;
    progressBarFill.style.width = `${progressPercent}%`;

    // Slide transition logic for cards
    flashCards.forEach((card, index) => {
      const cardStep = parseInt(card.getAttribute('data-step'));
      card.classList.remove('active', 'passed');
      
      if (cardStep === activeStep) {
        card.classList.add('active');
        // Auto-focus input if it exists inside the active card
        const firstInput = card.querySelector('input, textarea, select');
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 350);
        }
      } else if (cardStep < activeStep) {
        card.classList.add('passed');
      }
    });
  };

  // Next / Prev Button events
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStepInputs(activeStep)) {
        goToStep(activeStep + 1);
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(activeStep - 1);
    });
  });

  // ==========================================================================
  // 6. Form Field Validation and State Checking
  // ==========================================================================
  const inputs = document.querySelectorAll('.form-input, .form-select');
  
  // Real-time validation listener
  inputs.forEach(input => {
    const handler = () => {
      checkStepValidity(activeStep);
    };
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
  });

  // Validate fields for a specific step
  const validateStepInputs = (step) => {
    const card = document.querySelector(`.flash-card[data-step="${step}"]`);
    if (!card) return true;
    
    const requiredInputs = card.querySelectorAll('[required]');
    let allValid = true;
    
    requiredInputs.forEach(input => {
      if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
          allValid = false;
        }
      } else if (input.value.trim() === '') {
        allValid = false;
      }
    });
    
    return allValid;
  };

  // Enable/Disable step buttons based on input validity
  const checkStepValidity = (step) => {
    const card = document.querySelector(`.flash-card[data-step="${step}"]`);
    if (!card) return;
    
    const isValid = validateStepInputs(step);
    const nextBtn = card.querySelector('.next-action-btn');
    const submitBtn = card.querySelector('#submitFormBtn');
    
    if (nextBtn) {
      nextBtn.disabled = !isValid;
    }
    if (submitBtn) {
      submitBtn.disabled = !isValid;
    }
  };

  // Run validation checks on init
  for (let i = 1; i <= totalSteps; i++) {
    checkStepValidity(i);
  }

  // Swipe Gestures Support (Swipe left/right to move through cards)
  let touchStartX = 0;
  let touchEndX = 0;
  const cardDeck = document.getElementById('flashCardDeck');
  
  cardDeck.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  cardDeck.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  }, { passive: true });

  const handleSwipeGesture = () => {
    const threshold = 50;
    const diff = touchStartX - touchEndX;
    
    // Swipe Left -> Next Card
    if (diff > threshold && activeStep < totalSteps) {
      if (validateStepInputs(activeStep)) {
        goToStep(activeStep + 1);
      } else {
        // Shake active card if validation fails
        const activeCard = document.querySelector(`.flash-card[data-step="${activeStep}"]`);
        gsap.to(activeCard, { x: -10, duration: 0.05, repeat: 3, yoyo: true, onComplete: () => {
          gsap.set(activeCard, { x: 0 });
        }});
      }
    }
    // Swipe Right -> Prev Card
    if (diff < -threshold && activeStep > 1) {
      goToStep(activeStep - 1);
    }
  };

  // ==========================================================================
  // 7. Form Submission Handling
  // ==========================================================================
  const applicationForm = document.getElementById('applicationForm');
  
  submitFormBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (!validateStepInputs(5)) return;
    
    // Animation response feedback
    submitFormBtn.disabled = true;
    const originalText = submitFormBtn.innerHTML;
    submitFormBtn.innerHTML = 'Redirecting to checkout...';
    
    // Simulate API redirect to Paystack payment gateway
    setTimeout(() => {
      // Direct redirection to Payment page
      // In a real staging environment, this moves to the payment page.
      // For presentation/demo, we simulate redirecting.
      window.location.href = 'payment.html';
    }, 1000);
  });
});
