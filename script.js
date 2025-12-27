document.addEventListener('DOMContentLoaded', () => {
  // Backend API base URL (set your Render URL here)
  const API_BASE = window.API_BASE || 'https://assured-hearts-backend.onrender.com';
  async function postJSON(path, body){
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(()=>({}));
    if(!res.ok){
      throw new Error(json.error || `Request failed (${res.status})`);
    }
    return json;
  }
  // Banner helper
  function showBanner(message, type='success'){
    const existing = document.getElementById('globalBanner');
    if(existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'globalBanner';
    const base = 'position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 12px 16px; border-radius: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.12); font-weight: 700; min-width: 280px; text-align: center;';
    const styles = {
      success: 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;',
      error: 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;',
      info: 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;'
    };
    div.setAttribute('style', base + (styles[type] || styles.success));
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(()=>{ div.style.opacity = '0'; div.style.transition = 'opacity 300ms'; setTimeout(()=> div.remove(), 300); }, 2500);
  }
  // Flash message support across redirects
  const flashMsg = localStorage.getItem('flash_message');
  if(flashMsg){
    showBanner(flashMsg, 'success');
    localStorage.removeItem('flash_message');
  }
  // Render auth UI in navbar
  function ensureMobileAuthContainer(){
    const panel = document.getElementById('mobileMenu');
    if(!panel) return null;
    let mobileAuth = panel.querySelector('.mobile-auth');
    if(!mobileAuth){
      mobileAuth = document.createElement('div');
      mobileAuth.className = 'mobile-auth';
      panel.appendChild(mobileAuth);
    }
    return mobileAuth;
  }

  function renderAuthNav(){
    const navAuth = document.querySelector('.nav-auth');
    const mobileAuth = ensureMobileAuthContainer();
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');
    const userName = localStorage.getItem('user_name');

    function renderAuth(container, variant){
      if(!container) return;
      container.innerHTML = '';
      if(userId){
        const dashLink = document.createElement('a');
        dashLink.href = userType === 'provider' ? 'caregiver-dashboard.html' : 'parent-dashboard.html';
        dashLink.textContent = 'My Dashboard';
        dashLink.className = 'btn-auth signup';
        dashLink.style.display = 'flex';
        dashLink.style.alignItems = 'center';
        dashLink.style.gap = '6px';
        dashLink.style.justifyContent = variant === 'mobile' ? 'center' : '';

        const includeDesktopSigned = (variant !== 'mobile') && !window.matchMedia('(max-width: 768px)').matches;
        let signed = null;
        if(variant === 'mobile' || includeDesktopSigned){
          signed = document.createElement('span');
          signed.textContent = `Signed in as ${userName || 'Member'}`;
          if(variant === 'mobile'){
            signed.className = 'signed-label';
          } else {
            signed.style.color = '#06464E';
            signed.style.fontWeight = '500';
            signed.style.fontSize = '12px';
            signed.style.margin = '0 8px';
          }
        }

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn-auth login';
        logoutBtn.textContent = 'Log out';
        logoutBtn.style.marginLeft = variant === 'mobile' ? '0' : '4px';
        logoutBtn.addEventListener('click', ()=>{
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_type');
          localStorage.removeItem('user_name');
          localStorage.setItem('flash_message', 'You have been logged out.');
          if(typeof closeMobileMenu === 'function') closeMobileMenu();
          window.location.href = 'index.html';
        });

        if(variant === 'mobile'){
          container.appendChild(dashLink);
          if(signed) container.appendChild(signed);
          container.appendChild(logoutBtn);
        } else {
          container.appendChild(dashLink);
          if(signed) container.appendChild(signed);
          container.appendChild(logoutBtn);
        }
      } else {
        const loginBtnEl = document.createElement('button');
        loginBtnEl.className = 'btn-auth login';
        loginBtnEl.textContent = 'Sign In';
        loginBtnEl.addEventListener('click', (e)=>{
          e.preventDefault();
          if(typeof closeMobileMenu === 'function') closeMobileMenu();
          const modal = document.getElementById('loginModal');
          if(modal) modal.classList.remove('hidden');
          else window.location.href = 'create-account.html';
        });

        const signupEl = document.createElement('a');
        signupEl.className = 'btn-auth signup';
        signupEl.textContent = 'Sign up';
        signupEl.href = 'account-signup.html';
        signupEl.style.textAlign = 'center';
        signupEl.addEventListener('click', ()=>{ if(typeof closeMobileMenu === 'function') closeMobileMenu(); });

        container.appendChild(loginBtnEl);
        container.appendChild(signupEl);
      }
    }

    if(navAuth) renderAuth(navAuth, 'desktop');
    if(mobileAuth) renderAuth(mobileAuth, 'mobile');
  }
  renderAuthNav();
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
                showBanner('Could not determine city. Please enter manually.', 'error');
                gpsBtn.disabled = false;
                gpsBtn.style.opacity = '1';
              });
          },
          (error)=>{
            showBanner('Unable to get your location. Please enter manually.', 'info');
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
                    showBanner('City "' + city + '" not in our list. Please select from the dropdown.', 'info');
                  }
                } else {
                  showBanner('Could not determine your city. Please select manually.', 'info');
                }
                heroFindLocationBtn.disabled = false;
                heroFindLocationBtn.style.opacity = '1';
              })
              .catch(error => {
                console.error('Geocoding error:', error);
                showBanner('Could not determine location. Please select manually.', 'error');
                heroFindLocationBtn.disabled = false;
                heroFindLocationBtn.style.opacity = '1';
              });
          },
          (error)=>{
            showBanner('Location access denied. Please select your city manually.', 'info');
            heroFindLocationBtn.disabled = false;
            heroFindLocationBtn.style.opacity = '1';
          }
        );
      } else {
        showBanner('Geolocation is not supported by your browser.', 'info');
      }
    });
  }

  // Hero Find Form submission
  if(heroFindForm){
    heroFindForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const location = heroLocationInput.value;
      if(!location){
        showBanner('Please enter a location', 'info');
        return;
      }

      // Remove any existing results
      const existingResults = document.getElementById('heroSearchResults');
      if(existingResults){
        existingResults.remove();
      }
      let numCaregivers = 0;
      try{
        const res = await fetch(`${API_BASE}/search?city=${encodeURIComponent(location)}`);
        const data = await res.json();
        numCaregivers = Number(data.caregivers || 0);
      }catch(err){
        console.warn('Search API failed, falling back.', err);
      }
      const hasAvailable = numCaregivers > 0;
      // Persist availability flag and last searched location
      localStorage.setItem('care_available', hasAvailable ? 'true' : 'false');
      localStorage.setItem('last_search_location', location);
      let resultsHTML;
      const isSignedIn = !!localStorage.getItem('user_id');

      if(hasAvailable){
        if(isSignedIn){
          resultsHTML = `
            <div id=\"heroSearchResults\" style=\"text-align: center; margin-top: 16px; padding: 0;\">
              <p style=\"color: #333; margin: 0 0 12px 0;\"><strong>${numCaregivers} caregivers available near ${location}</strong></p>
              <div style=\"display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;\">
                <button type=\"button\" id=\"heroApplyBtn\" class=\"btn\" style=\"background: linear-gradient(135deg, #67B3C2 0%, #06464E 100%); color: white; font-weight: 600;\">Apply Today</button>
              </div>
              <div id=\"heroPreview\" style=\"margin-top: 12px;\"></div>
              <button id=\"heroCloseResultsBtn\" type=\"button\" style=\"margin-top: 12px; background: none; border: none; color: #999; cursor: pointer; font-size: 14px; text-decoration: underline;\">Close</button>
            </div>
          `;
        } else {
          resultsHTML = `
            <div id="heroSearchResults" style="text-align: center; margin-top: 16px; padding: 0;">
              <p style="color: #333; margin: 0 0 12px 0;"><strong>${numCaregivers} caregivers available near ${location}</strong></p>
              <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button type="button" id="heroLoginBtn" class="btn" style="background: linear-gradient(135deg, #67B3C2 0%, #06464E 100%); color: white; display: flex; align-items: center; gap: 8px; justify-content: center;"><img src="Assets/signinwhite.png" alt="Sign in" style="width: 16px; height: 16px;">Sign in to apply</button>
                <button type="button" id="heroCreateAccountBtn" class="btn" style="background: white; color: #06464E; border: 2px solid #06464E; font-weight: 600;">Create Account</button>
              </div>
              <div id=\"heroPreview\" style=\"margin-top: 12px;\"></div>
              <button id="heroCloseResultsBtn" type="button" style="margin-top: 12px; background: none; border: none; color: #999; cursor: pointer; font-size: 14px; text-decoration: underline;">Close</button>
            </div>
          `;
        }
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
        const closeBtn = newResultsDiv.querySelector('#heroCloseResultsBtn');
        if(isSignedIn){
          const applyBtn = newResultsDiv.querySelector('#heroApplyBtn');
          applyBtn && applyBtn.addEventListener('click', (e)=>{
            e.preventDefault();
            localStorage.setItem('care_available', 'true');
            window.location.href = 'request-childcare.html';
          });
        } else {
          const createAcctBtn = newResultsDiv.querySelector('#heroCreateAccountBtn');
          const loginBtn = newResultsDiv.querySelector('#heroLoginBtn');
          createAcctBtn && createAcctBtn.addEventListener('click', (e)=>{
            e.preventDefault();
            localStorage.setItem('care_available', 'true');
            window.location.href = 'account-signup.html';
          });
          loginBtn && loginBtn.addEventListener('click', (e)=>{
            e.preventDefault();
            localStorage.setItem('care_available', 'true');
            localStorage.setItem('post_login_target', 'request-childcare');
            const loginModal = document.getElementById('loginModal');
            if(loginModal) loginModal.classList.remove('hidden');
          });
        }

        closeBtn && closeBtn.addEventListener('click', ()=>{
          newResultsDiv.remove();
          heroFindForm.reset();
        });
      } else {
        const waitlistBtn = newResultsDiv.querySelector('#heroJoinWaitlistBtn');
        const closeBtn = newResultsDiv.querySelector('#heroCloseResultsBtn');
        waitlistBtn && waitlistBtn.addEventListener('click', async ()=>{
          const email = newResultsDiv.querySelector('#heroWaitlistEmail').value;
          if(email){
            try{
              await postJSON('/forms/waitlist', { email, city: location });
              showBanner(`Thank you! We've added ${email} to the waitlist for ${location}.`, 'success');
              newResultsDiv.remove();
              heroFindForm.reset();
            }catch(err){
              showBanner('Failed to add to waitlist. Please try again.', 'error');
              console.error('Waitlist error:', err);
            }
          }
        });
        closeBtn && closeBtn.addEventListener('click', ()=>{
          newResultsDiv.remove();
          heroFindForm.reset();
        });
      }
    });
  }

  // Fallback delegation in case dynamic listeners miss
  document.addEventListener('click', (evt)=>{
    const target = evt.target.closest('#heroLoginBtn, #heroCreateAccountBtn, #heroApplyBtn');
    if(!target) return;
    evt.preventDefault();
    if(target.id === 'heroCreateAccountBtn'){
      localStorage.setItem('care_available', 'true');
      window.location.href = 'account-signup.html';
    } else if(target.id === 'heroLoginBtn'){
      localStorage.setItem('care_available', 'true');
      localStorage.setItem('post_login_target', 'request-childcare');
      const loginModal = document.getElementById('loginModal');
      if(loginModal) loginModal.classList.remove('hidden');
    } else if(target.id === 'heroApplyBtn'){
      localStorage.setItem('care_available', 'true');
      window.location.href = 'request-childcare.html';
    }
  });

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
      welcomeModalSignupBtn.addEventListener('click', ()=> {
        welcomeModal.classList.add('hidden');
        window.location.href = 'account-signup.html';
      });
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
  const signupChoiceModal = document.getElementById('signupChoiceModal');
  const loginClose = document.getElementById('loginClose');
  const signupClose = document.getElementById('signupClose');

  loginBtn && loginBtn.addEventListener('click', ()=> {
    if(loginModal){
      loginModal.classList.remove('hidden');
    } else {
      window.location.href = 'create-account.html';
    }
  });
  signupBtn && signupBtn.addEventListener('click', (e)=> { 
    e.preventDefault();
    window.location.href = 'signup.html';
  });
  loginClose && loginClose.addEventListener('click', ()=> loginModal.classList.add('hidden'));
  signupClose && signupClose.addEventListener('click', ()=> signupModal.classList.add('hidden'));

  loginModal && loginModal.addEventListener('click', e=> { if(e.target === loginModal) loginModal.classList.add('hidden'); });
  signupModal && signupModal.addEventListener('click', e=> { if(e.target === signupModal) signupModal.classList.add('hidden'); });

  // Sign up choice modal
  if(signupChoiceModal){
    const signupChoiceClose = signupChoiceModal.querySelector('.modal-close');
    if(signupChoiceClose) signupChoiceClose.addEventListener('click', ()=> signupChoiceModal.classList.add('hidden'));
    signupChoiceModal.addEventListener('click', e=> { if(e.target === signupChoiceModal) signupChoiceModal.classList.add('hidden'); });
    const parentBtn = signupChoiceModal.querySelector('#signupAsParentBtn');
    const caregiverBtn = signupChoiceModal.querySelector('#signupAsCaregiverBtn');
    if(parentBtn) parentBtn.addEventListener('click', ()=> window.location.href = 'account-signup.html');
    if(caregiverBtn) caregiverBtn.addEventListener('click', ()=> window.location.href = 'apply.html');
  }

  const loginForm = document.getElementById('loginForm');
  if(loginForm) loginForm.addEventListener('submit', async (e)=> {
    e.preventDefault();
    const fd = new FormData(loginForm);
    const email = fd.get('email');
    const password = fd.get('password');
    try{
      const resp = await postJSON('/forms/login', { email, password });
      localStorage.setItem('user_id', String(resp.userId));
      localStorage.setItem('user_type', resp.type || 'parent');
      if(resp.name) localStorage.setItem('user_name', resp.name);
      localStorage.setItem('flash_message', 'Login successful!');
      loginModal.classList.add('hidden');
      loginForm.reset();
      renderAuthNav();
      const target = localStorage.getItem('post_login_target');
      if(target === 'request-childcare'){
        window.location.href = 'request-childcare.html';
      } else {
        window.location.href = 'parent-dashboard.html';
      }
    }catch(err){
      showBanner('Invalid email or password. Please try again.', 'error');
      console.error(err);
    }
  });

  const signupForm = document.getElementById('signupForm');
  if(signupForm) signupForm.addEventListener('submit', e=> { e.preventDefault(); const email = new FormData(signupForm).get('email'); alert('Welcome, ' + email + '!'); signupModal.classList.add('hidden'); signupForm.reset(); });

  // Social login buttons
  const googleBtn = document.getElementById('googleBtn');
  const facebookBtn = document.getElementById('facebookBtn');
  const appleBtn = document.getElementById('appleBtn');

  googleBtn && googleBtn.addEventListener('click', () => {
    showBanner('Redirecting to Google login...', 'info');
    loginModal.classList.add('hidden');
  });

  facebookBtn && facebookBtn.addEventListener('click', () => {
    showBanner('Redirecting to Facebook login...', 'info');
    loginModal.classList.add('hidden');
  });

  appleBtn && appleBtn.addEventListener('click', () => {
    showBanner('Redirecting to Apple login...', 'info');
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
      const target = a.dataset.target;
      const href = a.getAttribute('href') || '';
      const isHash = href.startsWith('#');

      // Handle in-page navigation
      if(target === 'find' && findSection){
        e.preventDefault();
        closeMobileMenu();
        return setTimeout(()=> show(findSection),380);
      }
      if(target === 'become' && becomeSection){
        e.preventDefault();
        closeMobileMenu();
        return setTimeout(()=> show(becomeSection),380);
      }
      if(isHash){
        e.preventDefault();
        closeMobileMenu();
        const id = href.slice(1);
        const el = document.getElementById(id);
        if(el) return setTimeout(()=> window.scrollTo({top: el.offsetTop - 20, behavior:'smooth'}),380);
      }

      // Default: allow normal navigation but close the menu for a tidy UX
      closeMobileMenu();
    });
  });

  // Desktop nav links (show/Become/scroll)
  document.querySelectorAll('.nav-links a').forEach(a=>{
    a.addEventListener('click', e=>{
      const target = a.dataset.target;
      const href = a.getAttribute('href') || '';
      const isHash = href.startsWith('#');

      if(target === 'find' && findSection){
        e.preventDefault();
        return show(findSection);
      }
      if(target === 'become' && becomeSection){
        e.preventDefault();
        return show(becomeSection);
      }
      if(isHash){
        e.preventDefault();
        const id = href.slice(1);
        const el = document.getElementById(id);
        if(el) return window.scrollTo({top: el.offsetTop - 20, behavior:'smooth'});
      }
      // otherwise let the browser follow the link normally
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

  // Search handler - show auth options
  const findForm = document.getElementById('findForm');
  const results = document.getElementById('results');
  if(findForm){
    findForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = new FormData(findForm);
      const location = data.get('location') || 'your area';
      results.innerHTML = '';
      
      const div = document.createElement('div');
      div.style.textAlign = 'center';
      div.style.padding = '32px';
      div.style.backgroundColor = '#f5f5f5';
      div.style.borderRadius = '8px';
      div.style.marginTop = '16px';
      
      div.innerHTML = `
        <div style="font-size: 20px; font-weight: 600; color: #06464E; margin-bottom: 8px;">
          Great! We have caregivers in ${location}
        </div>
        <div style="font-size: 14px; color: #666; margin-bottom: 24px;">
          Sign in or create an account to browse and connect with caregivers
        </div>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button id="resultsSignup" class="btn btn-large" style="background-color: #06464E; margin-top: 0; padding: 12px 24px; font-size: 16px;">Create an account</button>
          <button id="resultsLogin" class="btn btn-large" style="background-color: #67B3C2; margin-top: 0; padding: 12px 24px; font-size: 16px;">Sign in to apply</button>
        </div>
      `;
      
      results.appendChild(div);
      
      // Attach modal handlers to the result buttons
      document.getElementById('resultsSignup').addEventListener('click', ()=> document.getElementById('signupModal').classList.remove('hidden'));
      document.getElementById('resultsLogin').addEventListener('click', ()=> document.getElementById('loginModal').classList.remove('hidden'));
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
      const userType = data.get('userType');
      const firstname = data.get('firstname') || '';
      const lastname = data.get('lastname') || '';
      
      if(userType === 'parent'){
        window.location.href = 'parent-dashboard.html';
      } else if(userType === 'caregiver'){
        window.location.href = 'caregiver-dashboard.html';
      }
    });
  }

  // Parent signup -> send basic intake to backend
  const parentSignupForm = document.getElementById('parentSignupForm');
  if(parentSignupForm){
    parentSignupForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(parentSignupForm);
      const name = `${fd.get('firstName') || ''} ${fd.get('lastName') || ''}`.trim();
      const email = fd.get('email');
      const phone = fd.get('phone');
      const password = fd.get('password');
      const city = fd.get('city');
      const province = fd.get('province');
      try{
        const response = await postJSON('/forms/parent', { name, email, phone, password, city, province });
        localStorage.setItem('user_id', response.userId);
        const banner = document.getElementById('parentSuccessBanner');
        if(banner){
          parentSignupForm.style.display = 'none';
          banner.classList.remove('hidden');
          setTimeout(()=>{ window.location.href = 'find-childcare.html'; }, 2500);
        } else {
          showBanner('Thanks! Your account has been created.', 'success');
          parentSignupForm.reset();
        }
      }catch(err){
        showBanner('There was a problem creating your account. Please try again.', 'error');
        console.error(err);
      }
    });
  }

  // Provider application -> send intake to backend
  const applicationForm = document.getElementById('applicationForm');
  if(applicationForm){
    applicationForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(applicationForm);
      const name = `${fd.get('firstName') || ''} ${fd.get('lastName') || ''}`.trim();
      const email = fd.get('email');
      const phone = fd.get('phone');
      const password = fd.get('password');
      const confirmPassword = fd.get('confirmPassword');
      const experience = fd.get('experience');
      const city = fd.get('city');
      const province = fd.get('province');
      
      // Validate passwords match
      if (password !== confirmPassword) {
        showBanner('Passwords do not match', 'error');
        return;
      }
      
      try{
        await postJSON('/forms/provider', { name, email, phone, password, experience, meta: { city, province } });
        const successMsg = document.getElementById('successMessage');
        if(successMsg){
          applicationForm.style.display = 'none';
          successMsg.classList.remove('hidden');
          setTimeout(()=>{ window.location.href = 'become-provider.html'; }, 2500);
        } else {
          showBanner('Application received! We\'ll be in touch soon.', 'success');
          applicationForm.reset();
        }
      }catch(err){
        showBanner('Submission failed. Please try again.', 'error');
        console.error(err);
      }
    });
  }

  // Child demographics form -> send child info to backend
  const childDemographicsForm = document.getElementById('childDemographicsForm');
  if(childDemographicsForm){
    childDemographicsForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(childDemographicsForm);
      const childName = fd.get('childName');
      const childAge = fd.get('childAge');
      const frequency = fd.get('frequency');
      const preferredSchedule = fd.get('preferredSchedule');
      const specialNeeds = fd.get('specialNeeds');
      
      // Get user_id from URL or localStorage (set after parent login)
      const user_id = parseInt(localStorage.getItem('user_id')) || null;
      
      if(!user_id){
        showBanner('Please log in to add child profiles.', 'info');
        setTimeout(() => window.location.href = 'account-signup.html', 1500);
        return;
      }

      try{
        const payload = {
          user_id,
          name: childName,
          ages: childAge ? [parseInt(childAge)] : [],
          frequency,
          preferredSchedule,
          specialNeeds
        };
        
        await postJSON('/forms/children', payload);
        const banner = document.getElementById('childSuccessBanner');
        if(banner){
          childDemographicsForm.style.display = 'none';
          banner.style.display = 'block';
          setTimeout(()=>{ window.location.href = 'find-childcare.html'; }, 2500);
        } else {
          showBanner('Child profile created!', 'success');
          childDemographicsForm.reset();
        }
      }catch(err){
        showBanner('There was a problem saving the child profile. Please try again.', 'error');
        console.error(err);
      }
    });
  }

  // Request childcare quick action guard
  const requestAction = document.getElementById('requestChildcareAction');
  if(requestAction){
    requestAction.addEventListener('click', (e)=>{
      const hasAccount = !!(parseInt(localStorage.getItem('user_id'))||null);
      const available = localStorage.getItem('care_available') === 'true';
      if(!hasAccount){
        e.preventDefault();
        alert('Please create an account first.');
        window.location.href = 'account-signup.html';
        return;
      }
      if(!available){
        e.preventDefault();
        alert('Please check caregiver availability in your area first.');
        window.location.href = 'find-childcare.html';
      }
    });
  }

  // Mission carousel (only runs if carousel elements exist)
  const titleBtns = document.querySelectorAll('.carousel-title-btn');
  const missionCards = document.querySelectorAll('.mission-card');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  
  if(titleBtns.length > 0 && missionCards.length > 0 && dots.length > 0){
    let currentSlide = 0;
    let missionAutoCirculate = true;
    
    function showSlide(index){
      titleBtns.forEach(b=> b.classList.remove('active'));
      missionCards.forEach(card=> card.classList.remove('active'));
      dots.forEach(dot=> dot.classList.remove('active'));
      if(titleBtns[index]) titleBtns[index].classList.add('active');
      if(missionCards[index]) missionCards[index].classList.add('active');
      if(dots[index]) dots[index].classList.add('active');
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
      if(missionAutoCirculate && missionCards.length > 0){
        currentSlide = (currentSlide + 1) % missionCards.length;
        showSlide(currentSlide);
      }
    }, 5000);
  }
});
