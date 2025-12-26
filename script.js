document.addEventListener('DOMContentLoaded', () => {
  // GPS location button handler
  const gpsBtn = document.getElementById('gpsBtn');
  const locationInput = document.getElementById('locationInput');
  
  if(gpsBtn && locationInput){
    gpsBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      if(navigator.geolocation){
        gpsBtn.disabled = true;
        gpsBtn.style.opacity = '0.5';
        navigator.geolocation.getCurrentPosition(
          (position)=>{
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            // Use OpenStreetMap Nominatim API for reverse geocoding
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
              .then(response => response.json())
              .then(data => {
                // Try to get city name from the response
                const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown Location';
                locationInput.value = city;
                gpsBtn.disabled = false;
                gpsBtn.style.opacity = '1';
              })
              .catch(error => {
                console.error('Geocoding error:', error);
                alert('Could not determine city. Please enter manually.');
                gpsBtn.disabled = false;
                gpsBtn.style.opacity = '1';
              });
          },
          (error)=>{
            alert('Unable to get your location. Please enter manually.');
            gpsBtn.disabled = false;
            gpsBtn.style.opacity = '1';
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    });
  }

  // Hero Find Caregiver form
  const heroLocationInput = document.getElementById('heroLocationInput');
  const heroFindLocationBtn = document.getElementById('heroFindLocationBtn');
  const heroFindForm = document.getElementById('heroFindForm');
  
  if(heroFindLocationBtn && heroLocationInput){
    heroFindLocationBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      if(navigator.geolocation){
        heroFindLocationBtn.disabled = true;
        heroFindLocationBtn.style.opacity = '0.5';
        navigator.geolocation.getCurrentPosition(
          (position)=>{
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
              .then(response => response.json())
              .then(data => {
                const address = data.address || {};
                const city = address.city || address.town || address.village || address.county;
                if(city){
                  // Find matching option in select
                  const options = heroLocationInput.querySelectorAll('option');
                  let found = false;
                  options.forEach(option => {
                    if(option.textContent.includes(city)){
                      heroLocationInput.value = option.value;
                      found = true;
                    }
                  });
                  if(!found){
                    alert('City "' + city + '" not in our list. Please select from the dropdown.');
                  }
                } else {
                  alert('Could not determine your city. Please select manually.');
                }
                heroFindLocationBtn.disabled = false;
                heroFindLocationBtn.style.opacity = '1';
              })
              .catch(error => {
                console.error('Geocoding error:', error);
                alert('Could not determine location. Please select manually.');
                heroFindLocationBtn.disabled = false;
                heroFindLocationBtn.style.opacity = '1';
              });
          },
          (error)=>{
            alert('Location access denied. Please select your city manually.');
            heroFindLocationBtn.disabled = false;
            heroFindLocationBtn.style.opacity = '1';
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    });
  }

  // Hero Find Form submission
  if(heroFindForm){
    heroFindForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const location = heroLocationInput.value;
      if(!location){
        alert('Please enter a location');
        return;
      }

      // Remove any existing results
      const existingResults = document.getElementById('heroSearchResults');
      if(existingResults){
        existingResults.remove();
      }

      const hasAvailable = Math.random() < 0.7;
      let resultsHTML;

      if(hasAvailable){
        const numCaregivers = Math.floor(Math.random() * 5) + 3;
        resultsHTML = `
          <div id="heroSearchResults" style="text-align: center; margin-top: 16px; padding: 0;">
            <p style="color: #333; margin: 0 0 12px 0;"><strong>${numCaregivers} caregivers available near ${location}</strong></p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button id="heroCreateAccountBtn" class="btn" style="background: white; color: #06464E; border: 2px solid #06464E; font-weight: 600;">Create Account</button>
              <button id="heroLoginBtn" class="btn" style="background: linear-gradient(135deg, #67B3C2 0%, #06464E 100%); color: white; display: flex; align-items: center; gap: 8px; justify-content: center;"><img src="Assets/signinwhite.png" alt="Sign in" style="width: 16px; height: 16px;">Sign In</button>
            </div>
            <button id="heroCloseResultsBtn" type="button" style="margin-top: 12px; background: none; border: none; color: #999; cursor: pointer; font-size: 14px; text-decoration: underline;">Close</button>
          </div>
        `;
      } else {
        resultsHTML = `
          <div id="heroSearchResults" style="text-align: center; margin-top: 16px; padding: 0;">
            <p style="color: #333; margin: 0 0 12px 0;"><strong>No caregivers available in ${location} yet</strong></p>
            <p style="color: #666; margin: 0 0 12px 0; font-size: 14px;">Join our waitlist to be notified when caregivers become available.</p>
            <input type="email" placeholder="Enter your email" id="heroWaitlistEmail" style="width: 100%; max-width: 300px; padding: 8px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <button type="button" id="heroJoinWaitlistBtn" class="btn" style="background-color: #06464E; color: white; width: 100%; max-width: 300px;">Join Waitlist</button>
            <button id="heroCloseResultsBtn" type="button" style="margin-top: 12px; background: none; border: none; color: #999; cursor: pointer; font-size: 14px; text-decoration: underline; display: block; margin-left: auto; margin-right: auto;">Close</button>
          </div>
        `;
      }

      heroFindForm.insertAdjacentHTML('afterend', resultsHTML);
      
      const newResultsDiv = document.getElementById('heroSearchResults');
      
      // Move results inside the form's container before the "or" text
      const formContainer = heroFindForm.parentElement;
      const orText = formContainer.querySelector('[style*="color: #999"]');
      if(orText) {
        orText.parentElement.insertBefore(newResultsDiv, orText);
      }

      if(hasAvailable){
        const createAcctBtn = newResultsDiv.querySelector('#heroCreateAccountBtn');
        const loginBtn = newResultsDiv.querySelector('#heroLoginBtn');
        const closeBtn = newResultsDiv.querySelector('#heroCloseResultsBtn');
        
        createAcctBtn && createAcctBtn.addEventListener('click', ()=>{
          const signupModal = document.getElementById('signupModal');
          if(signupModal) signupModal.classList.remove('hidden');
        });
        
        loginBtn && loginBtn.addEventListener('click', ()=>{
          const loginModal = document.getElementById('loginModal');
          if(loginModal) loginModal.classList.remove('hidden');
        });
        
        closeBtn && closeBtn.addEventListener('click', ()=>{
          newResultsDiv.remove();
          heroFindForm.reset();
        });
      } else {
        const waitlistBtn = newResultsDiv.querySelector('#heroJoinWaitlistBtn');
        const closeBtn = newResultsDiv.querySelector('#heroCloseResultsBtn');
        waitlistBtn && waitlistBtn.addEventListener('click', ()=>{
          const email = newResultsDiv.querySelector('#heroWaitlistEmail').value;
          if(email){
            alert(`Thank you! We've added ${email} to the waitlist for ${location}.`);
            newResultsDiv.remove();
            heroFindForm.reset();
          }
        });
        closeBtn && closeBtn.addEventListener('click', ()=>{
          newResultsDiv.remove();
          heroFindForm.reset();
        });
      }
    });
  }

  // Welcome modal on page load
  const welcomeModal = document.getElementById('welcomeModal');
  const welcomeModalClose = document.getElementById('welcomeModalClose');
  const welcomeModalSignupBtn = document.getElementById('welcomeModalSignupBtn');
  
  if(welcomeModal){
    // Show modal on page load - DISABLED FOR NOW
    // setTimeout(()=> welcomeModal.classList.remove('hidden'), 500);
    
    // Close modal handlers
    if(welcomeModalClose){
      welcomeModalClose.addEventListener('click', (e)=> {
        e.stopPropagation();
        welcomeModal.classList.add('hidden');
      });
    }
    welcomeModal.addEventListener('click', e=> { if(e.target === welcomeModal) welcomeModal.classList.add('hidden'); });
    if(welcomeModalSignupBtn){
      welcomeModalSignupBtn.addEventListener('click', ()=> welcomeModal.classList.add('hidden'));
    }
  }

  // Hero video loop from 0-6 seconds
  const heroVideo = document.querySelector('.hero-video');
  if(heroVideo){
    heroVideo.addEventListener('timeupdate', ()=> {
      if(heroVideo.currentTime >= 6){
        heroVideo.currentTime = 0;
      }
    });
    heroVideo.currentTime = 0;
  }

  // Get Started button scroll to signup
  const getStartedBtn = document.getElementById('getStartedBtn');
  if(getStartedBtn){
    getStartedBtn.addEventListener('click', ()=> {
      const signupSection = document.querySelector('.signup-section');
      if(signupSection) signupSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  const loginClose = document.getElementById('loginClose');
  const signupClose = document.getElementById('signupClose');

  loginBtn && loginBtn.addEventListener('click', ()=> loginModal.classList.remove('hidden'));
  signupBtn && signupBtn.addEventListener('click', ()=> signupModal.classList.remove('hidden'));
  loginClose && loginClose.addEventListener('click', ()=> loginModal.classList.add('hidden'));
  signupClose && signupClose.addEventListener('click', ()=> signupModal.classList.add('hidden'));

  loginModal && loginModal.addEventListener('click', e=> { if(e.target === loginModal) loginModal.classList.add('hidden'); });
  signupModal && signupModal.addEventListener('click', e=> { if(e.target === signupModal) signupModal.classList.add('hidden'); });

  const loginForm = document.getElementById('loginForm');
  if(loginForm) loginForm.addEventListener('submit', e=> { e.preventDefault(); alert('Login successful!'); loginModal.classList.add('hidden'); loginForm.reset(); });

  const signupForm = document.getElementById('signupForm');
  if(signupForm) signupForm.addEventListener('submit', e=> { e.preventDefault(); const email = new FormData(signupForm).get('email'); alert('Welcome, ' + email + '!'); signupModal.classList.add('hidden'); signupForm.reset(); });

  // Social login buttons
  const googleBtn = document.getElementById('googleBtn');
  const facebookBtn = document.getElementById('facebookBtn');
  const appleBtn = document.getElementById('appleBtn');

  googleBtn && googleBtn.addEventListener('click', () => {
    alert('Redirecting to Google login...');
    loginModal.classList.add('hidden');
  });

  facebookBtn && facebookBtn.addEventListener('click', () => {
    alert('Redirecting to Facebook login...');
    loginModal.classList.add('hidden');
  });

  appleBtn && appleBtn.addEventListener('click', () => {
    alert('Redirecting to Apple login...');
    loginModal.classList.add('hidden');
  });

  const findBtn = document.getElementById('findBtn');
  const becomeBtn = document.getElementById('becomeBtn');
  const findSection = document.getElementById('find');
  const becomeSection = document.getElementById('become');
  const findBack = document.getElementById('findBack');
  const becomeBack = document.getElementById('becomeBack');

  function show(section){
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    section.classList.remove('hidden');
    window.scrollTo({top: section.offsetTop - 20, behavior:'smooth'});
  }

  findBtn && findBtn.addEventListener('click', ()=> show(findSection));
  becomeBtn && becomeBtn.addEventListener('click', ()=> show(becomeSection));
  findBack && findBack.addEventListener('click', ()=> { findSection.classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'}) });
  becomeBack && becomeBack.addEventListener('click', ()=> { becomeSection.classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'}) });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');

  function openMobileMenu(){
    mobileMenu.classList.remove('hidden');
    setTimeout(()=> mobileMenu.classList.add('open'));
    mobileMenu.setAttribute('aria-hidden','false');
    mobileMenuBtn && mobileMenuBtn.setAttribute('aria-expanded','true');
    mobileMenuBtn && mobileMenuBtn.classList.add('open');
  }
  function closeMobileMenu(){
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden','true');
    mobileMenuBtn && mobileMenuBtn.setAttribute('aria-expanded','false');
    mobileMenuBtn && mobileMenuBtn.classList.remove('open');
    setTimeout(()=> mobileMenu.classList.add('hidden'), 360);
  }

  mobileMenuBtn && mobileMenuBtn.addEventListener('click', openMobileMenu);
  mobileMenuClose && mobileMenuClose.addEventListener('click', closeMobileMenu);
  mobileMenu && mobileMenu.addEventListener('click', e=>{ if(e.target === mobileMenu) closeMobileMenu(); });

  // Mobile menu links
  document.querySelectorAll('.mobile-nav a').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const target = a.dataset.target;
      closeMobileMenu();
      if(target === 'find' && findSection) return setTimeout(()=> show(findSection),380);
      if(target === 'become' && becomeSection) return setTimeout(()=> show(becomeSection),380);
      // for other anchors, try to find an element with matching id
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        const id = href.slice(1);
        const el = document.getElementById(id);
        if(el) return setTimeout(()=> window.scrollTo({top: el.offsetTop - 20, behavior:'smooth'}),380);
      }
    });
  });

  // Desktop nav links (show/Become/scroll)
  document.querySelectorAll('.nav-links a').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const target = a.dataset.target;
      if(target === 'find' && findSection) return show(findSection);
      if(target === 'become' && becomeSection) return show(becomeSection);
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        const id = href.slice(1);
        const el = document.getElementById(id);
        if(el) return window.scrollTo({top: el.offsetTop - 20, behavior:'smooth'});
      }
    });
  });

  // Footer contact form
  const contactForm = document.getElementById('contactForm');
  const contactResult = document.getElementById('contactResult');
  if(contactForm){
    contactForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = new FormData(contactForm);
      const email = data.get('email');
      contactResult.innerHTML = `<div style="color:#67B3C2;margin-top:12px">Thanks for reaching out! We'll be in touch soon.</div>`;
      contactForm.reset();
      setTimeout(()=>{ contactResult.innerHTML = ''; }, 4000);
    });
  }

  // Footer nav links
  document.querySelectorAll('.footer-section a[href]').forEach(a=>{
    a.addEventListener('click', e=>{
      if(!a.getAttribute('href').startsWith('#')) return;
      e.preventDefault();
      const target = a.dataset.target;
      if(target === 'find' && findSection) return show(findSection);
      if(target === 'become' && becomeSection) return show(becomeSection);
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        const id = href.slice(1);
        const el = document.getElementById(id);
        if(el) return window.scrollTo({top: el.offsetTop - 20, behavior:'smooth'});
      }
    });
  });

  // Fake search handler
  const findForm = document.getElementById('findForm');
  const results = document.getElementById('results');
  if(findForm){
    findForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = new FormData(findForm);
      const location = data.get('location') || 'your area';
      results.innerHTML = '';
      
      // Randomly decide if there are caregivers available (70% chance yes, 30% chance no)
      const hasAvailable = Math.random() < 0.7;
      
      const div = document.createElement('div');
      div.style.textAlign = 'center';
      div.style.padding = '24px';
      div.style.backgroundColor = '#f5f5f5';
      div.style.borderRadius = '8px';
      div.style.marginTop = '16px';
      
      if(hasAvailable){
        // Show available caregivers
        const availableCount = Math.floor(Math.random() * 8) + 1;
        div.innerHTML = `
          <div style="font-size: 18px; font-weight: 600; color: #06464E; margin-bottom: 8px;">
            ${availableCount} caregiver${availableCount !== 1 ? 's' : ''} available near ${location}
          </div>
          <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
            Create an account or log in to view more details and get connected
          </div>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-large" style="background-color: #06464E; margin-top: 0;">Create Account</button>
            <button class="btn btn-large" style="background-color: #67B3C2; margin-top: 0;">Log In</button>
          </div>
        `;
      } else {
        // Show waitlist prompt
        div.innerHTML = `
          <div style="font-size: 18px; font-weight: 600; color: #06464E; margin-bottom: 8px;">
            No caregivers available in ${location} yet
          </div>
          <div style="font-size: 14px; color: #666; margin-bottom: 16px;">
            Join our waitlist and we'll notify you as soon as we expand to your area
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 12px;">
            <input type="email" placeholder="Enter your email" style="flex: 1; max-width: 250px; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px;" id="waitlistEmail" required>
            <button class="btn" style="margin-top: 0;">Join Waitlist</button>
          </div>
        `;
      }
      
      results.appendChild(div);
    });
  }

  // Fake apply handler
  const becomeForm = document.getElementById('becomeForm');
  const applyResult = document.getElementById('applyResult');
  if(becomeForm){
    becomeForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = new FormData(becomeForm);
      const firstname = data.get('firstname') || '';
      const lastname = data.get('lastname') || '';
      const name = (firstname + ' ' + lastname).trim() || 'Applicant';
      const email = data.get('email');
      applyResult.innerHTML = `<div class="card" style="color:#06464E;margin-top:16px;font-weight:600">Thanks, <strong>${name}</strong>! We're sending a detailed application to <strong>${email}</strong>. Check your inbox to get started.</div>`;
      becomeForm.reset();
      setTimeout(()=>{ applyResult.innerHTML = ''; }, 5000);
    });
  }

  // How It Works tabs with auto-circulation
  let tabAutoCirculate = true;
  let currentTabIndex = 0;
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  function switchTab(index){
    const btn = tabBtns[index];
    const tabName = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b=> b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=> p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById(tabName + '-tab');
    if(panel) panel.classList.add('active');
  }
  
  tabBtns.forEach((btn, index)=>{
    btn.addEventListener('click', ()=>{
      tabAutoCirculate = false;
      currentTabIndex = index;
      switchTab(currentTabIndex);
    });
  });
  
  // Auto-circulate tabs every 5 seconds
  setInterval(()=>{
    if(tabAutoCirculate && tabBtns.length > 0){
      currentTabIndex = (currentTabIndex + 1) % tabBtns.length;
      switchTab(currentTabIndex);
    }
  }, 5000);

  // Signup form handler
  const signupFormMain = document.getElementById('signupFormMain');
  const signupResult = document.getElementById('signupResult');
  if(signupFormMain){
    signupFormMain.addEventListener('submit', e=>{
      e.preventDefault();
      const data = new FormData(signupFormMain);
      const firstname = data.get('firstname') || '';
      const lastname = data.get('lastname') || '';
      const name = (firstname + ' ' + lastname).trim() || 'Friend';
      signupResult.innerHTML = `<div style="color:#06464E;margin-top:12px;font-weight:600">Account created! Welcome, ${name}. Check your email to get started.</div>`;
      signupFormMain.reset();
      setTimeout(()=>{ signupResult.innerHTML = ''; }, 4000);
    });
  }

  // Mission carousel
  let currentSlide = 0;
  let missionAutoCirculate = true;
  const titleBtns = document.querySelectorAll('.carousel-title-btn');
  const missionCards = document.querySelectorAll('.mission-card');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  
  function showSlide(index){
    titleBtns.forEach(b=> b.classList.remove('active'));
    missionCards.forEach(card=> card.classList.remove('active'));
    dots.forEach(dot=> dot.classList.remove('active'));
    titleBtns[index].classList.add('active');
    missionCards[index].classList.add('active');
    dots[index].classList.add('active');
  }
  
  titleBtns.forEach((btn, index)=>{
    btn.addEventListener('click', ()=>{
      currentSlide = index;
      showSlide(currentSlide);
      missionAutoCirculate = false;
    });
  });
  
  dots.forEach((dot, index)=>{
    dot.addEventListener('click', ()=>{
      currentSlide = index;
      showSlide(currentSlide);
      missionAutoCirculate = false;
    });
  });
  
  missionCards.forEach((card, index)=>{
    card.addEventListener('click', ()=>{
      currentSlide = index;
      showSlide(currentSlide);
      missionAutoCirculate = false;
    });
  });
  
  // Auto-circulate every 5 seconds
  setInterval(()=>{
    if(missionAutoCirculate){
      currentSlide = (currentSlide + 1) % missionCards.length;
      showSlide(currentSlide);
    }
  }, 5000);
});
