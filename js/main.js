/**
 * AI Animation Nexus - Main Script Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ============================================================================
  // 1. Configured enrollment window and payment state
  // ============================================================================
  const formatMoney = (amount, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  const updateCountdown = (deadline) => {
    const difference = deadline - Date.now();
    if (difference <= 0) return false;
    document.getElementById('days').textContent = String(Math.floor(difference / 86400000)).padStart(2, '0');
    document.getElementById('hours').textContent = String(Math.floor((difference % 86400000) / 3600000)).padStart(2, '0');
    document.getElementById('minutes').textContent = String(Math.floor((difference % 3600000) / 60000)).padStart(2, '0');
    document.getElementById('seconds').textContent = String(Math.floor((difference % 60000) / 1000)).padStart(2, '0');
    return true;
  };
  const loadEnrollmentConfig = async () => {
    const status = document.getElementById('applicationStatus');
    const label = document.getElementById('countdownLabel');
    const note = document.getElementById('paymentWindowNote');
    try {
      const config = await (await fetch('/api/config')).json();
      const currency = config.paymentCurrency || 'USD';
      const price = formatMoney(Number(config.paymentAmountMajor || 2.99), currency);
      let deadline = null;
      if (config.paymentWindowStart) {
        const start = new Date(config.paymentWindowStart);
        const freeEnd = new Date(start.getTime() + Number(config.paymentFreeDays || 20) * 86400000);
        const paidEnd = new Date(freeEnd.getTime() + Number(config.paymentPaidDays || 10) * 86400000);
        if (config.paymentMode === 'free') {
          status.textContent = 'Applications Open · Free enrollment';
          label.textContent = 'Free enrollment closes in';
          note.textContent = `Enroll at no charge during the opening window. Payment activates after that at ${price}.`;
          deadline = freeEnd.getTime();
        } else if (config.paymentMode === 'paid') {
          status.textContent = `Applications Open · ${price}`;
          label.textContent = 'Paid enrollment closes in';
          note.textContent = `The opening window has ended. Reserve your seat now for ${price}.`;
          deadline = paidEnd.getTime();
        } else {
          status.textContent = 'Applications Closed';
          label.textContent = 'Enrollment window closed';
          note.textContent = 'Applications are currently closed.';
          document.querySelectorAll('.trigger-form-btn, #navApplyBtn').forEach(button => { button.disabled = true; button.setAttribute('aria-disabled', 'true'); });
        }
      } else if (config.paymentMode === 'free') {
        status.textContent = 'Applications Open · Free enrollment';
        label.textContent = 'Opening window';
        note.textContent = `Enrollment is currently free. Payment activates for the final 10 days at ${price}.`;
      }
      if (deadline) {
        const tick = () => { if (!updateCountdown(deadline)) window.location.reload(); };
        tick(); setInterval(tick, 1000);
      }
    } catch (error) {
      console.warn('Could not load enrollment configuration', error);
      status.textContent = 'Applications Open';
      label.textContent = 'Enrollment window';
    }
  };
  loadEnrollmentConfig();

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
  
  submitFormBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!validateStepInputs(5)) return;
    
    submitFormBtn.disabled = true;
    const originalText = submitFormBtn.innerHTML;
    submitFormBtn.innerHTML = 'Saving...';
    
    const formData = {
      fullName: document.getElementById('fullName')?.value || document.querySelector('[data-step="2"] input[type="text"]')?.value,
      email: document.getElementById('emailAddress')?.value || document.querySelector('[data-step="2"] input[type="email"]')?.value,
      whatsapp: document.getElementById('whatsappNumber')?.value || document.querySelector('[data-step="3"] input[type="tel"]')?.value,
      goals: document.getElementById('goals')?.value || document.querySelector('[data-step="4"] textarea')?.value,
      portfolio: document.getElementById('portfolio')?.value || document.querySelector('[data-step="5"] input[type="url"]')?.value,
      referral: document.getElementById('referral')?.value || document.querySelector('[data-step="5"] select')?.value
    };
    
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('nexus_email', formData.email);
        if (data.accessCode) localStorage.setItem('nexus_access_code', data.accessCode);
        window.location.href = data.paymentRequired ? 'payment.html' : 'confirmation.html';
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
        submitFormBtn.disabled = false;
        submitFormBtn.innerHTML = originalText;
      }
    } catch (err) {
      console.error('Form submission error:', err);
      alert('We could not save your application. Please check your connection and try again.');
      submitFormBtn.disabled = false;
      submitFormBtn.innerHTML = originalText;
    }
  });
  
  // ==========================================================================
  // 8. 2026 Dangling Tag Physics Effect (Shoe Tag)
  // ==========================================================================
  const yearTag = document.getElementById('yearTag');
  
  if (yearTag && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let currentRotation = 0;
    let targetRotation = 0;
    let velocity = 0;
    let lastScrollY = 0;
    
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const scrollDelta = scrollY - lastScrollY;
      lastScrollY = scrollY;
      
      if (Math.abs(scrollDelta) > 5) {
        targetRotation = scrollDelta > 0 ? 15 : -8;
        
        gsap.killTweensOf(yearTag.querySelector('.tag-body'));
        
        gsap.to(yearTag.querySelector('.tag-body'), {
          rotation: targetRotation,
          duration: 0.8,
          ease: 'elastic.out(1, 0.3)'
        });
      }
    }, { passive: true });
    
    gsap.to(yearTag.querySelector('.tag-body'), {
      rotation: -3,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});
