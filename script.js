document.addEventListener('DOMContentLoaded', () => {
  // Backend API base URL: prefer injected, otherwise default to hosted backend
  const API_BASE = window.API_BASE || 'https://assured-hearts-backend.onrender.com';

  async function postJSON(path, body){
    let res;
    try{
      res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }catch(err){
      throw new Error(`Network error contacting API at ${API_BASE}. Is the backend running?`);
    }
    let json = {};
    try{
      json = await res.json();
    }catch(_err){
      // non-JSON response
    }
    if(!res.ok){
      const msg = json.error || json.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return json || {};
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
    // Hide marketing signup block on homepage when a user is signed in (especially parents)
    const signupSection = document.querySelector('.signup-section');
    if(signupSection && userId && userType === 'parent'){
      signupSection.style.display = 'none';
    }

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
          else window.location.href = 'signup.html';
        });

        const signupEl = document.createElement('a');
        signupEl.className = 'btn-auth signup';
        signupEl.textContent = 'Sign up';
        signupEl.href = 'signup.html';
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

  async function renderHeroProviders(location, isSignedIn, container){
    try{
      if(!location){
        container.innerHTML = `
          <div style="text-align:left;">
            <p style="color:#333; margin:0;"><strong>Please choose a city to see caregivers.</strong></p>
          </div>
        `;
        return;
      }
      const resp = await fetch(`${API_BASE}/forms/providers?city=${encodeURIComponent(location)}`);
      let providers = [];
      if(resp.ok){
        const data = await resp.json();
        providers = Array.isArray(data.providers) ? data.providers : [];
      }
      if(providers.length === 0){
        container.innerHTML = `
          <div style="text-align:left;">
            <p style="color:#333; margin:0 0 6px 0;"><strong>Caregivers are available in ${location}, but profiles are still loading.</strong></p>
            <p style="color:#6b7280; margin:0;">Please try again in a moment.</p>
          </div>
        `;
        return;
      }
      const isParentDashboard = document.body.classList.contains('parent-dashboard');
      if(isParentDashboard){
        const userId = localStorage.getItem('user_id') || 'guest';
        const savedKey = `saved_caregivers_${userId}`;
        let savedIds = [];
        const selectedRange = window.parentSelectedTimeRange || null;
        const parseTimeToMinutes = (value)=>{
          if(!value) return null;
          const raw = String(value).trim();
          const ampmMatch = raw.match(/(am|pm)/i);
          const clean = raw.replace(/[^0-9:]/g, '');
          const parts = clean.split(':');
          if(parts.length < 2) return null;
          let hours = parseInt(parts[0], 10);
          let mins = parseInt(parts[1], 10);
          if(Number.isNaN(hours) || Number.isNaN(mins)) return null;
          if(ampmMatch){
            const isPm = ampmMatch[0].toLowerCase() === 'pm';
            if(hours === 12) hours = isPm ? 12 : 0;
            else if(isPm) hours += 12;
          }
          return hours * 60 + mins;
        };
        const resolveSchedule = (availability) => {
          if(!availability) return {};
          if(availability.schedule && typeof availability.schedule === 'object') return availability.schedule;
          return availability;
        };
        const matchesSelectedTime = (availability)=>{
          if(!selectedRange || selectedRange.startMinutes == null || selectedRange.endMinutes == null) return false;
          if(!availability) return false;
          const schedule = resolveSchedule(availability);
          const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
          const dateKey = selectedRange.date ? days[new Date(`${selectedRange.date}T00:00:00`).getDay()] : null;
          const daysToCheck = dateKey ? [dateKey] : days;
          return daysToCheck.some((day)=>{
            const dayAvailability = schedule[day];
            if(!dayAvailability) return false;
            const slots = Array.isArray(dayAvailability)
              ? dayAvailability
              : Array.isArray(dayAvailability.slots)
                ? dayAvailability.slots
                : [dayAvailability];
            return slots.some((slot)=>{
              if(!slot) return false;
              const fromVal = slot.from || slot.start;
              const toVal = slot.to || slot.end;
              if(!fromVal || !toVal) return false;
              const fromMinutes = parseTimeToMinutes(fromVal);
              const toMinutes = parseTimeToMinutes(toVal);
              if(fromMinutes == null || toMinutes == null) return false;
              return selectedRange.startMinutes >= fromMinutes && selectedRange.endMinutes <= toMinutes;
            });
          });
        };
        if(Array.isArray(window.parentSavedCaregivers)){
          savedIds = window.parentSavedCaregivers.map(String);
        } else {
          try{
            savedIds = JSON.parse(localStorage.getItem(savedKey) || '[]').map(String);
          }catch(_err){
            savedIds = [];
          }
        }
        const renderVerifyIcons = (p, dark=false) => {
          const mk = (active, label, emoji) => {
            const cls = dark ? 'verify-chip verify-chip-dark' : 'verify-chip';
            return `<span class="${cls}${active ? ' is-active' : ''}" title="${label}">${emoji}</span>`;
          };
          return `
            <div class="verify-chip-row">
              ${mk(p.cpr_certified, 'CPR / First Aid verified', '❤')}
              ${mk(p.consent_background_check, 'Background check verified', '🛡')}
              ${mk(p.caregiver_insurance, 'Caregiver insurance verified', '✓')}
            </div>
          `;
        };
        const normalizeProviders = providers.map((p, idx)=> {
            const displayName = p.name || `Caregiver ${idx + 1}`;
            const initials = displayName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'CG';
            const pid = String(p.user_id || p.id || '');
            const city = p.city || location;
            const availability = p.availability ? (typeof p.availability === 'string' ? JSON.parse(p.availability) : p.availability) : {};
            const schedule = availability && availability.schedule ? availability.schedule : availability;
            const matchesSelected = matchesSelectedTime(availability);
            let availabilityText = 'Availability not provided';
            if(availability.status === 'immediate') availabilityText = 'Available immediately';
            if(availability.status === 'next24') availabilityText = 'Available in the next 24 hours';
            const bookLink = pid ? `parent-dashboard.html?provider_id=${encodeURIComponent(pid)}&provider_name=${encodeURIComponent(displayName)}` : 'parent-dashboard.html';
            const profileLink = pid ? `caregiver-profile.html?provider_id=${encodeURIComponent(pid)}` : '#';
            const certText = p.certifications || 'Certifications on file';
            const sessionCountRaw = p.session_count ?? p.sessions_count ?? p.total_sessions ?? p.completed_sessions ?? p.session_total ?? p.sessions;
            const sessionCount = Array.isArray(sessionCountRaw) ? sessionCountRaw.length : (Number(sessionCountRaw) || 0);
            return {
              id: pid,
              displayName,
              initials,
              city,
              availabilityText,
              certText,
              matchesSelected,
              bookLink,
              profileLink,
              sessionCount,
              verifyIcons: renderVerifyIcons(p, true)
            };
          });

        const persistSaved = (ids)=>{
          const unique = Array.from(new Set(ids));
          savedIds = unique;
          localStorage.setItem(savedKey, JSON.stringify(unique));
          if(Array.isArray(window.parentSavedCaregivers)) window.parentSavedCaregivers = unique;
          if(typeof window.updateParentSavedCaregivers === 'function'){
            window.updateParentSavedCaregivers(unique);
          }
        };

        const buildRow = (p, isSaved)=> `
          <div class="parent-provider-row" data-provider="${p.id}" data-profile="${p.profileLink}" tabindex="0">
            <div class="parent-provider-main">
              <div class="parent-provider-avatar">${p.initials}</div>
              <div class="parent-provider-body">
                <div class="parent-provider-top">
                  <div>
                    <div class="parent-provider-name-row">
                      <div class="parent-provider-name">${p.displayName}</div>
                      ${p.verifyIcons}
                    </div>
                    <div class="parent-provider-meta">${p.city} · ${p.certText}</div>
                  </div>
                  <div class="parent-provider-save-wrap">
                    <button type="button" class="parent-provider-save${isSaved ? ' is-saved' : ''}" data-action="save" aria-pressed="${isSaved ? 'true' : 'false'}">
                      <svg class="save-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" fill="currentColor"/>
                      </svg>
                      <span class="save-label">${isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                    <div class="parent-provider-session-count">${p.sessionCount === 1 ? '1 session' : `${p.sessionCount} sessions`}</div>
                  </div>
                </div>
            <div class="parent-provider-tags">
              ${p.matchesSelected ? '<span class="parent-provider-tag highlight">Available for your selected time</span>' : ''}
              <span>${p.availabilityText}</span>
            </div>
          </div>
        </div>
            <div class="parent-provider-actions">
              <a class="parent-provider-btn ghost" href="${p.profileLink}" data-action="profile" data-provider="${p.id}">View profile</a>
              <button type="button" class="parent-provider-btn ghost" data-action="message" data-provider="${p.id}" data-name="${p.displayName}">Message</button>
              <a class="parent-provider-btn primary" href="${p.bookLink}" data-action="book" data-provider="${p.id}" data-name="${p.displayName}">Book</a>
            </div>
          </div>
        `;

        const renderList = (list, emptyText)=> {
          if(list.length === 0){
            return `<div class="parent-provider-empty">${emptyText}</div>`;
          }
          return list.map(p => buildRow(p, savedIds.includes(p.id))).join('');
        };

        const renderParentResults = (activeTab = 'all')=>{
          const sorter = (a, b) => Number(b.matchesSelected) - Number(a.matchesSelected);
          const allProviders = selectedRange ? normalizeProviders.slice().sort(sorter) : normalizeProviders;
          const savedProviders = selectedRange
            ? normalizeProviders.filter(p => savedIds.includes(p.id)).sort(sorter)
            : normalizeProviders.filter(p => savedIds.includes(p.id));
          const tabProviders = activeTab === 'saved' ? savedProviders : allProviders;
          const tabTitle = activeTab === 'saved' ? 'Saved caregivers' : (activeTab === 'ideal' ? 'Ideal matches' : 'Browse all');
          const emptyText = activeTab === 'saved'
            ? 'No saved caregivers yet. Tap Save to keep caregivers here.'
            : 'No caregivers available in this city yet.';

          container.innerHTML = `
            <div class="parent-results-wrap">
              <div class="parent-results-tabs" role="tablist" aria-label="Caregiver results">
                <button class="parent-results-tab${activeTab === 'all' ? ' is-active' : ''}" type="button" data-tab="all">Browse all <span class="parent-results-count">${allProviders.length}</span></button>
                <button class="parent-results-tab${activeTab === 'ideal' ? ' is-active' : ''}" type="button" data-tab="ideal">Ideal matches <span class="parent-results-count">${allProviders.length}</span></button>
                <button class="parent-results-tab${activeTab === 'saved' ? ' is-active' : ''}" type="button" data-tab="saved">Saved <span class="parent-results-count">${savedProviders.length}</span></button>
              </div>
              <div class="parent-results-header">
                <div>
                  <div class="parent-results-title">${tabTitle}</div>
                  <div class="parent-results-sub">${allProviders.length} caregivers available near ${location}</div>
                </div>
                <button class="parent-results-close" type="button">Close</button>
              </div>
              <div class="parent-results-list">
                ${renderList(tabProviders, emptyText)}
              </div>
            </div>
          `;

          container.querySelectorAll('.parent-results-tab').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              renderParentResults(btn.dataset.tab || 'all');
            });
          });
          const closeBtn = container.querySelector('.parent-results-close');
          if(closeBtn){
            closeBtn.addEventListener('click', ()=>{
              container.remove();
              if(heroFindForm) heroFindForm.reset();
            });
          }
          container.querySelectorAll('.parent-provider-row').forEach(row=>{
            row.addEventListener('click', (e)=>{
              if(e.target.closest('button') || e.target.closest('a')) return;
              const profile = row.dataset.profile;
              if(profile && profile !== '#'){
                row.classList.add('is-pressed');
                setTimeout(()=> row.classList.remove('is-pressed'), 180);
                window.location.href = profile;
              }
            });
            row.addEventListener('keydown', (e)=>{
              if(e.key !== 'Enter') return;
              const profile = row.dataset.profile;
              if(profile && profile !== '#') window.location.href = profile;
            });
          });
          container.querySelectorAll('.parent-provider-save').forEach(btn=>{
            btn.addEventListener('click', (e)=>{
              e.preventDefault();
              const row = btn.closest('.parent-provider-row');
              const pid = row ? row.dataset.provider : '';
              if(!pid) return;
              const isSaved = savedIds.includes(pid);
              const updated = isSaved ? savedIds.filter(id => id !== pid) : [...savedIds, pid];
              persistSaved(updated);
              renderParentResults(activeTab);
            });
          });
          container.querySelectorAll('.parent-provider-btn[data-action="message"]').forEach(btn=>{
            btn.addEventListener('click', (e)=>{
              e.preventDefault();
              const pid = btn.dataset.provider;
              const name = btn.dataset.name || 'Caregiver';
              if(window.showChatWidget && pid) window.showChatWidget(pid, name);
            });
          });
          container.querySelectorAll('.parent-provider-btn[data-action="book"]').forEach(btn=>{
            btn.addEventListener('click', async (e)=>{
              e.preventDefault();
              const pid = btn.dataset.provider;
              const name = btn.dataset.name || 'Caregiver';
              if(document.body.classList.contains('parent-dashboard') && typeof window.startDashboardBooking === 'function'){
                await window.startDashboardBooking(pid, name, btn);
              } else if(pid){
                window.location.href = `parent-dashboard.html?provider_id=${encodeURIComponent(pid)}&provider_name=${encodeURIComponent(name)}`;
              }
            });
          });
        };

        renderParentResults();
        return;
      }
      const caregiversHTML = providers.map((p, idx)=> {
        const displayName = p.name || 'Caregiver ' + (idx + 1);
        const initials = displayName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'CG';
        const city = p.city || location;
        const pid = p.user_id || p.id || '';
        const availability = p.availability ? (typeof p.availability === 'string' ? JSON.parse(p.availability) : p.availability) : {};
        const renderVerifyIcons = (p) => {
          const mk = (active, label, emoji) => `<span class="verify-chip" style="background:${active ? 'rgba(6,70,78,0.12)' : '#f3f4f6'}; color:${active ? '#06464E' : '#9ca3af'}; border:1px solid ${active ? 'rgba(6,70,78,0.3)' : '#e5e7eb'};" title="${label}">${emoji}</span>`;
          return `<div class="verify-chip-row" style="display:flex; gap:6px; flex-wrap:wrap;">${[
            mk(p.cpr_certified, 'CPR / First Aid verified', '❤'),
            mk(p.consent_background_check, 'Background check verified', '🛡'),
            mk(p.caregiver_insurance, 'Caregiver insurance verified', '✓')
          ].join('')}</div>`;
        };
        let availabilityTag = '';
        let availabilityText = 'Availability not provided';
        if(availability.status === 'immediate'){
          availabilityTag = '<span style="background:#ecfdf3; color:#166534; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700;">Available immediately</span>';
          availabilityText = 'Available immediately';
        }
        if(availability.status === 'next24'){
          availabilityTag = '<span style="background:#eff6ff; color:#1d4ed8; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700;">Available in next 24h</span>';
          availabilityText = 'Available in the next 24 hours';
        }
        const bookLink = pid ? `parent-dashboard.html?provider_id=${encodeURIComponent(pid)}&provider_name=${encodeURIComponent(displayName)}` : 'parent-dashboard.html';
        const profileLink = pid ? `caregiver-profile.html?provider_id=${encodeURIComponent(pid)}` : '#';
        const certText = p.certifications || 'Certifications on file';
        return `
          <div class="hero-card" style="min-width: 260px; max-width: 280px; flex: 0 0 auto; border:1px solid #e5e7eb; border-radius:12px; padding:14px; text-align:left; display:grid; gap:8px; background:#fff; box-shadow:0 10px 30px rgba(0,0,0,0.05); cursor:pointer;" data-profile="${profileLink}">
            <div style="display:flex; gap:12px; align-items:center;">
              <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#67B3C2 0%, #06464E 100%); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px;">${initials}</div>
              <div>
                <div style="font-weight:700; color:#06464E; font-size:15px;">${displayName}</div>
                <div style="font-size:12px; color:#6b7280;">${city || 'Location on file'}</div>
              </div>
            </div>
            ${availabilityTag}
            <div style="font-size:12px; color:#475569;"><strong>Availability:</strong> ${availabilityText}</div>
            <div style="font-size:12px; color:#475569;"><strong>Certifications:</strong> ${certText}</div>
            ${renderVerifyIcons(p)}
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
              <a class="btn" style="padding:8px 12px; font-size:12px; background: linear-gradient(135deg, #67B3C2 0%, #06464E 100%); color:white; border:none; border-radius:8px; text-decoration:none; display:inline-block;" href="${bookLink}">Book ${displayName.split(' ')[0]}</a>
              <a class="btn secondary" href="${profileLink}" style="padding:8px 12px; font-size:12px; border:1px solid #06464E; color:#06464E; background:#fff; border-radius:8px; text-decoration:none; display:inline-block;">View profile</a>
              <button class="btn secondary hero-message-btn" data-other="${pid}" data-name="${displayName}" style="padding:8px 12px; font-size:12px; border:1px solid #06464E; color:#06464E; background:#fff; border-radius:8px; text-decoration:none; display:inline-block;">Message ${displayName.split(' ')[0]}</button>
            </div>
          </div>
        `;
      }).join('');
      container.innerHTML = `
        <div style="text-align:left;">
          <p style="color:#333; margin:0 0 8px 0;"><strong>${providers.length} caregiver(s) available in ${location}</strong></p>
          <div class="hero-carousel" style="position:relative; padding:0 12px;">
            <button type="button" class="hero-carousel-prev" style="position:absolute; left:-6px; top:40%; transform:translateY(-50%); background:#fff; border:1px solid #e5e7eb; border-radius:50%; width:32px; height:32px; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,0.08);">‹</button>
            <div class="hero-cards" style="display:flex; gap:12px; overflow-x:auto; padding:6px 6px 6px 0; scroll-behavior:smooth;">
              ${caregiversHTML}
            </div>
            <button type="button" class="hero-carousel-next" style="position:absolute; right:-6px; top:40%; transform:translateY(-50%); background:#fff; border:1px solid #e5e7eb; border-radius:50%; width:32px; height:32px; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,0.08);">›</button>
          </div>
          <button id="heroCloseResultsBtn" type="button" style="margin-top: 8px; background: none; border: none; color: #999; cursor: pointer; font-size: 14px; text-decoration: underline;">Close</button>
        </div>`;
      const closeBtn = container.querySelector('#heroCloseResultsBtn');
      closeBtn && closeBtn.addEventListener('click', ()=>{
        container.remove();
        heroFindForm.reset();
      });
      const track = container.querySelector('.hero-cards');
      const prevBtn = container.querySelector('.hero-carousel-prev');
      const nextBtn = container.querySelector('.hero-carousel-next');
      if(track && prevBtn && nextBtn){
        const scrollBy = 320;
        prevBtn.addEventListener('click', ()=> track.scrollBy({ left: -scrollBy, behavior: 'smooth' }));
        nextBtn.addEventListener('click', ()=> track.scrollBy({ left: scrollBy, behavior: 'smooth' }));
      }
      container.querySelectorAll('.hero-card').forEach(card=>{
        const profile = card.dataset.profile;
        if(profile && profile !== '#'){
          card.addEventListener('click', (e)=>{
            if(e.target.closest('button') || e.target.closest('a')) return;
            window.location.href = profile;
          });
        }
      });
      container.querySelectorAll('.hero-message-btn').forEach(btn=>{
        btn.addEventListener('click', (ev)=>{
          ev.preventDefault();
          const other = btn.dataset.other;
          const otherName = btn.dataset.name || 'Caregiver';
          if(!isSignedIn){
            const loginModal = document.getElementById('loginModal');
            if(loginModal) loginModal.classList.remove('hidden');
            return;
          }
          if(window.showChatWidget && other) window.showChatWidget(other, otherName);
        });
      });
    }catch(err){
      console.error('Provider fetch failed', err);
      container.innerHTML = `
        <div style="text-align:left;">
          <p style="color:#333; margin:0 0 6px 0;"><strong>Unable to load caregivers right now.</strong></p>
          <p style="color:#6b7280; margin:0;">Please try again shortly.</p>
        </div>
      `;
    }
  }
  window.renderHeroProviders = renderHeroProviders;

  // Caregiver dashboard: allow updating child logs from appointments
  const cgAppointmentsList = document.getElementById('appointmentsList');
  if(cgAppointmentsList){
    const API_BASE = window.API_BASE || 'https://assured-hearts-backend.onrender.com';
    // Attach a delegated handler after appointments render (handlers attached when list updates)
    const attachLogButtons = ()=>{
      cgAppointmentsList.querySelectorAll('.update-log-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const childId = btn.getAttribute('data-child');
          if(childId){
            window.location.href = `child-profile.html?child_id=${encodeURIComponent(childId)}`;
          }
        });
      });
    };
    // simple observer: re-attach after mutations (appointments render elsewhere in script)
    const obs = new MutationObserver(()=> attachLogButtons());
    obs.observe(cgAppointmentsList, { childList:true, subtree:true });
  }

  // Caregiver dashboard: My Families list with update log links
  const familyList = document.getElementById('familyList');
  if(familyList){
    const userId = localStorage.getItem('user_id');
    (async ()=>{
      try{
        const resp = await fetch(`${API_BASE}/forms/provider/${userId}`);
        if(!resp.ok) throw new Error('Families not found');
        const data = await resp.json();
        const families = Array.isArray(data.families) ? data.families : [];
        if(families.length === 0){
          familyList.innerHTML = `
            <div style="border:1px solid #e5e7eb; border-radius:10px; padding:12px; display:grid; gap:6px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:34px; height:34px; background:linear-gradient(135deg,#67B3C2 0%, #06464E 100%); border-radius:8px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">F</div>
                <div>
                  <div style="font-weight:700; color:#06464E; font-size:14px;">Your families will appear here</div>
                  <div style="color:#6b7280; font-size:12px;">Children in confirmed bookings show with an Update log button.</div>
                </div>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; background:#f9fbfc; font-size:12px; color:#06464E;">
                  <span style="font-weight:700;">Sample Child</span>
                  <button class="btn secondary btn-sm" style="padding:6px 8px; font-size:11px; border:1px solid #e5e7eb; color:#06464E; background:#fff; border-radius:6px; cursor:not-allowed;" disabled>Update log</button>
                </div>
              </div>
            </div>
          `;
          return;
        }
        familyList.innerHTML = families.map(fam=>{
          const name = fam.family_name || fam.parent_name || 'Family';
          const children = Array.isArray(fam.children) ? fam.children : [];
          const childChips = children.map(c=>{
            const label = `${c.last_name || ''} ${c.first_name || ''}`.trim() || 'Child';
            const childId = c.child_id || c.id || '';
            return `
              <div style="display:flex; gap:8px; align-items:center; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; background:#f9fbfc; font-size:12px; color:#06464E;">
                <span style="font-weight:700;">${label}</span>
                ${childId ? `<button class="btn secondary btn-sm update-log-btn" data-child="${childId}" style="padding:6px 8px; font-size:11px; border:1px solid #e5e7eb; color:#06464E; background:#fff; border-radius:6px;">Update log</button>` : ''}
              </div>
            `;
          }).join('');
          return `
            <div style="border:1px solid #e5e7eb; border-radius:10px; padding:12px; display:grid; gap:6px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:34px; height:34px; background:linear-gradient(135deg,#67B3C2 0%, #06464E 100%); border-radius:8px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${(name.charAt(0) || 'F').toUpperCase()}</div>
                <div>
                  <div style="font-weight:700; color:#06464E; font-size:14px;">${name}</div>
                  <div style="color:#6b7280; font-size:12px;">${children.length} child${children.length === 1 ? '' : 'ren'}</div>
                </div>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">${childChips || '<span style="color:#9ca3af; font-size:12px;">No children linked yet.</span>'}</div>
            </div>
          `;
        }).join('');
        // Attach update log links
        familyList.querySelectorAll('.update-log-btn').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const childId = btn.getAttribute('data-child');
            if(childId) window.location.href = `child-profile.html?child_id=${encodeURIComponent(childId)}`;
          });
        });
      }catch(err){
        familyList.innerHTML = '<p style="margin:0; padding:8px; color:#b91c1c; font-size:13px;">Unable to load families.</p>';
      }
    })();
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
        resultsHTML = `
          <div id="heroSearchResults" style="text-align: center; margin-top: 16px; padding: 0;">
            <p style="color: #333; margin: 0 0 12px 0;"><strong>${numCaregivers} caregivers available near ${location}</strong></p>
            <div id="heroPreview" style="margin-top: 12px;">Loading caregivers...</div>
            ${!isSignedIn ? `
              <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top:12px;">
                <button type="button" id="heroLoginBtn" class="btn" style="background: linear-gradient(135deg, #67B3C2 0%, #06464E 100%); color: white; display: flex; align-items: center; gap: 8px; justify-content: center;"><img src="Assets/signinwhite.png" alt="Sign in" style="width: 16px; height: 16px;">Sign in to apply</button>
                <button type="button" id="heroCreateAccountBtn" class="btn" style="background: white; color: #06464E; border: 2px solid #06464E; font-weight: 600;">Create Account</button>
              </div>` : ''}
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
      const orText = formContainer ? formContainer.querySelector('[style*="color: #999"]') : null;
      if(orText && !newResultsDiv.contains(orText) && orText.parentElement) {
        orText.parentElement.insertBefore(newResultsDiv, orText);
      }

      if(hasAvailable){
        // Fetch actual providers and show cards
        renderHeroProviders(location, isSignedIn, newResultsDiv);
        setTimeout(()=>{
          const preview = newResultsDiv.querySelector('#heroPreview');
          if(preview && preview.textContent && preview.textContent.toLowerCase().includes('loading')){
            renderHeroProviders(location, isSignedIn, newResultsDiv);
          }
        }, 350);
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
      window.location.href = 'signup.html';
    } else if(target.id === 'heroLoginBtn'){
      localStorage.setItem('care_available', 'true');
      localStorage.setItem('post_login_target', 'parent-dashboard');
      const loginModal = document.getElementById('loginModal');
      if(loginModal) loginModal.classList.remove('hidden');
    } else if(target.id === 'heroApplyBtn'){
      localStorage.setItem('care_available', 'true');
      window.location.href = 'parent-dashboard.html';
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
        window.location.href = 'signup.html';
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
      window.location.href = 'signup.html';
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

  let pendingTwoFactorUserId = null;
  let pendingTwoFactorForm = null;
  let twoFactorModal = null;
  let twoFactorForm = null;
  let twoFactorHint = null;
  let twoFactorCodeInput = null;
  let twoFactorResendBtn = null;
  let twoFactorSubmitBtn = null;

  function ensureTwoFactorModal(){
    if(twoFactorModal) return twoFactorModal;
    twoFactorModal = document.getElementById('twoFactorModal');
    if(!twoFactorModal){
      twoFactorModal = document.createElement('div');
      twoFactorModal.id = 'twoFactorModal';
      twoFactorModal.className = 'modal hidden';
      twoFactorModal.innerHTML = `
        <div class="modal-content">
          <button class="modal-close" type="button" id="twoFactorClose">&times;</button>
          <h2>Verify it&apos;s you</h2>
          <p id="twoFactorHint" style="margin:0 0 16px;color:var(--muted);font-size:14px;">Enter the 6-digit code we sent to your phone.</p>
          <form id="twoFactorForm">
            <label>
              Verification code
              <input id="twoFactorCode" name="twoFactorCode" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" required>
            </label>
            <button type="submit" class="btn" style="width:100%;margin-top:12px;">Verify</button>
          </form>
          <button type="button" id="twoFactorResend" class="btn secondary" style="width:100%;margin-top:10px;">Resend code</button>
        </div>
      `;
      document.body.appendChild(twoFactorModal);
    }
    twoFactorForm = twoFactorModal.querySelector('#twoFactorForm');
    twoFactorHint = twoFactorModal.querySelector('#twoFactorHint');
    twoFactorCodeInput = twoFactorModal.querySelector('#twoFactorCode');
    twoFactorResendBtn = twoFactorModal.querySelector('#twoFactorResend');
    twoFactorSubmitBtn = twoFactorModal.querySelector('button[type="submit"]');
    const closeBtn = twoFactorModal.querySelector('#twoFactorClose');
    closeBtn && closeBtn.addEventListener('click', ()=> twoFactorModal.classList.add('hidden'));
    twoFactorModal.addEventListener('click', e=> { if(e.target === twoFactorModal) twoFactorModal.classList.add('hidden'); });
    twoFactorForm && twoFactorForm.addEventListener('submit', handleTwoFactorSubmit);
    twoFactorResendBtn && twoFactorResendBtn.addEventListener('click', handleTwoFactorResend);
    return twoFactorModal;
  }

  function openTwoFactorModal(phoneMasked){
    const modal = ensureTwoFactorModal();
    if(twoFactorHint){
      twoFactorHint.textContent = phoneMasked
        ? `Enter the 6-digit code sent to ${phoneMasked}.`
        : 'Enter the 6-digit code we sent to your phone.';
    }
    if(loginModal) loginModal.classList.add('hidden');
    modal.classList.remove('hidden');
    if(twoFactorCodeInput){
      twoFactorCodeInput.value = '';
      twoFactorCodeInput.focus();
    }
  }

  function completeLogin(resp, form){
    const userType = resp.type || 'parent';
    localStorage.setItem('user_id', String(resp.userId));
    localStorage.setItem('user_type', userType);
    if(userType === 'parent'){
      const familyId = localStorage.getItem('family_id') || `family_${resp.userId}`;
      localStorage.setItem('family_id', familyId);
    }
    if(userType === 'provider' && !localStorage.getItem('provider_status')){
      localStorage.setItem('provider_status', 'under_review');
    }
    if(resp.name) localStorage.setItem('user_name', resp.name);
    localStorage.setItem('flash_message', 'Login successful!');
    localStorage.removeItem('post_login_target');
    const target = localStorage.getItem('post_login_target');
    if(loginModal) loginModal.classList.add('hidden');
    if(twoFactorModal) twoFactorModal.classList.add('hidden');
    const welcomeModalEl = document.getElementById('welcomeModal');
    if(welcomeModalEl) welcomeModalEl.classList.add('hidden');
    if(form) form.reset();
    pendingTwoFactorUserId = null;
    pendingTwoFactorForm = null;
    renderAuthNav();
    if(userType === 'provider'){
      window.location.href = 'caregiver-dashboard.html';
    } else if(target === 'parent-dashboard'){
      window.location.href = 'parent-dashboard.html';
    } else {
      window.location.href = 'parent-dashboard.html';
    }
  }

  async function handleTwoFactorSubmit(e){
    e.preventDefault();
    if(!pendingTwoFactorUserId){
      showBanner('Please sign in again to verify.', 'info');
      return;
    }
    const code = twoFactorCodeInput ? twoFactorCodeInput.value.trim() : '';
    if(!code){
      showBanner('Enter the verification code.', 'info');
      return;
    }
    if(twoFactorSubmitBtn) twoFactorSubmitBtn.disabled = true;
    if(twoFactorResendBtn) twoFactorResendBtn.disabled = true;
    try{
      const resp = await postJSON('/forms/2fa/verify', { userId: pendingTwoFactorUserId, code });
      pendingTwoFactorUserId = null;
      completeLogin(resp, pendingTwoFactorForm);
      pendingTwoFactorForm = null;
      twoFactorForm && twoFactorForm.reset();
    }catch(err){
      showBanner(err.message || 'Verification failed. Please try again.', 'error');
      console.error(err);
    }finally{
      if(twoFactorSubmitBtn) twoFactorSubmitBtn.disabled = false;
      if(twoFactorResendBtn) twoFactorResendBtn.disabled = false;
    }
  }

  async function handleTwoFactorResend(){
    if(!pendingTwoFactorUserId){
      showBanner('Please sign in again to verify.', 'info');
      return;
    }
    if(twoFactorResendBtn) twoFactorResendBtn.disabled = true;
    try{
      const resp = await postJSON('/forms/2fa/start', { userId: pendingTwoFactorUserId });
      const hint = resp.phone_masked ? `New code sent to ${resp.phone_masked}.` : 'New code sent.';
      showBanner(hint, 'info');
    }catch(err){
      showBanner(err.message || 'Could not resend the code.', 'error');
      console.error(err);
    }finally{
      if(twoFactorResendBtn) twoFactorResendBtn.disabled = false;
    }
  }

  async function handleLoginSubmit(e, form){
    e.preventDefault();
    const fd = new FormData(form);
    const email = fd.get('email') || fd.get('username');
    const password = fd.get('password');
    if(!email || !password){
      showBanner('Please enter your email and password', 'info');
      return;
    }
    try{
      const resp = await postJSON('/forms/login', { email, password });
      if(resp.requires_2fa){
        pendingTwoFactorUserId = resp.userId;
        pendingTwoFactorForm = form;
        openTwoFactorModal(resp.phone_masked);
        return;
      }
      completeLogin(resp, form);
    }catch(err){
      const message = err.message === 'Invalid credentials'
        ? 'Invalid email or password. Please try again.'
        : (err.message || 'Login failed. Please try again.');
      showBanner(message, 'error');
      console.error(err);
    }
  }

  const loginForm = document.getElementById('loginForm');
  if(loginForm) loginForm.addEventListener('submit', (e)=> handleLoginSubmit(e, loginForm));

  const welcomeLoginForm = document.getElementById('welcomeLoginForm');
  if(welcomeLoginForm) welcomeLoginForm.addEventListener('submit', (e)=> handleLoginSubmit(e, welcomeLoginForm));

  const signupForm = document.getElementById('signupForm');
  if(signupForm) signupForm.addEventListener('submit', e=> { 
    e.preventDefault();
    signupModal && signupModal.classList.add('hidden');
    window.location.href = 'signup.html';
  });

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

  // Provider profile page handling
  const providerProfileForm = document.getElementById('providerProfileForm');
  if(providerProfileForm){
    const API_BASE = window.API_BASE || 'https://assured-hearts-backend.onrender.com';
    const provStatusEl = document.getElementById('provStatus');
    const userIdRaw = localStorage.getItem('user_id');
    const userId = userIdRaw ? parseInt(userIdRaw, 10) : null;
    let profileApproved = false;
    const languageInput = document.getElementById('provLanguageInput');
    const languageAddBtn = document.getElementById('provLanguageAdd');
    const languageChips = document.getElementById('provLanguagesChips');
    const languagesField = document.getElementById('provLanguages');
    const languageOptions = Array.from(document.querySelectorAll('#languageOptions option'))
      .map(opt => String(opt.value || '').trim())
      .filter(Boolean);
    let selectedLanguages = [];

    const normalizeLanguage = (value) => String(value || '').trim().replace(/\s+/g, ' ');
    const resolveLanguage = (value) => {
      const normalized = normalizeLanguage(value);
      if(!normalized) return null;
      const match = languageOptions.find(opt => opt.toLowerCase() === normalized.toLowerCase());
      return match || null;
    };
    const parseLanguageList = (value) => {
      if(Array.isArray(value)) return value;
      if(typeof value !== 'string') return [];
      const trimmed = value.trim();
      if(!trimmed) return [];
      if(trimmed.startsWith('[')){
        try{
          const parsed = JSON.parse(trimmed);
          if(Array.isArray(parsed)) return parsed;
        }catch(_err){
          return trimmed.split(',');
        }
      }
      return trimmed.split(',');
    };
    const renderLanguageChips = () => {
      if(!languageChips || !languagesField) return;
      languageChips.innerHTML = '';
      const cleaned = selectedLanguages
        .map(lang => normalizeLanguage(lang))
        .filter(Boolean);
      selectedLanguages = cleaned;
      languagesField.value = cleaned.join(', ');
      if(cleaned.length === 0){
        languageChips.innerHTML = '<span class="language-empty">No languages selected</span>';
        return;
      }
      cleaned.forEach(lang => {
        const chip = document.createElement('span');
        chip.className = 'language-chip';
        chip.innerHTML = `<span>${lang}</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', `Remove ${lang}`);
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => {
          selectedLanguages = selectedLanguages.filter(item => item.toLowerCase() !== lang.toLowerCase());
          renderLanguageChips();
        });
        chip.appendChild(removeBtn);
        languageChips.appendChild(chip);
      });
    };
    const warnLanguage = (message) => {
      if(typeof showBanner === 'function') showBanner(message, 'info');
      if(languageInput){
        languageInput.setCustomValidity(message);
        languageInput.reportValidity();
        setTimeout(() => languageInput.setCustomValidity(''), 800);
      }
    };
    const addLanguage = (value) => {
      if(!languageInput) return false;
      const resolved = resolveLanguage(value);
      if(!resolved){
        warnLanguage('Please select a language from the list.');
        return false;
      }
      if(selectedLanguages.some(lang => lang.toLowerCase() === resolved.toLowerCase())){
        languageInput.value = '';
        return true;
      }
      selectedLanguages.push(resolved);
      languageInput.value = '';
      renderLanguageChips();
      return true;
    };

    if(languageAddBtn && languageInput){
      languageAddBtn.addEventListener('click', () => {
        addLanguage(languageInput.value);
      });
      languageInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter'){
          e.preventDefault();
          addLanguage(languageInput.value);
        }
      });
    }
    renderLanguageChips();
    if(!userId || localStorage.getItem('user_type') !== 'provider'){
      if(provStatusEl){
        provStatusEl.style.color = '#b91c1c';
        provStatusEl.textContent = 'Please log in as a caregiver to edit your profile.';
      }
    } else {
      (async ()=>{
        try{
          const res = await fetch(`${API_BASE}/forms/provider/${userId}`);
          if(res.ok){
            const data = await res.json();
            const p = data.profile || {};
            profileApproved = !!p.approved;
            if(!profileApproved && provStatusEl){
              provStatusEl.style.color = '#b91c1c';
              provStatusEl.textContent = 'Profile editing will be available after approval.';
            }
            const splitName = (p.name || '').split(' ');
            document.getElementById('provFirstName').value = p.first_name || splitName[0] || '';
            document.getElementById('provLastName').value = p.last_name || splitName.slice(1).join(' ') || '';
            document.getElementById('provEmail').value = p.email || '';
            document.getElementById('provPhone').value = p.phone || '';
            document.getElementById('provCity').value = p.city || '';
            document.getElementById('provProvince').value = p.province || '';
            document.getElementById('provAddr1').value = p.address_line1 || '';
            document.getElementById('provPostal').value = p.postal_code || '';
            document.getElementById('provPayoutMethod').value = p.payout_method || '';
            selectedLanguages = parseLanguageList(p.languages)
              .map(lang => normalizeLanguage(lang))
              .filter(Boolean);
            renderLanguageChips();
            const photoField = document.getElementById('provPhotoUrl');
            if(photoField) photoField.value = p.photo_url || '';
            const aboutField = document.getElementById('provAbout');
            if(aboutField) aboutField.value = p.about || '';
            const verifyRow = document.getElementById('provVerifyRow');
            if(verifyRow){
              const mkBadge = (active, label, emoji) => `
                <span class="verify-chip${active ? ' is-active' : ''}" title="${label}">
                  ${emoji}
                </span>`;
              verifyRow.innerHTML = [
                mkBadge(p.cpr_certified, 'CPR / First Aid verified', '❤'),
                mkBadge(p.consent_background_check, 'Background check verified', '🛡'),
                mkBadge(p.caregiver_insurance, 'Caregiver insurance verified', '✓')
              ].join('');
            }
            const availability = typeof p.availability === 'string' ? JSON.parse(p.availability || '{}') : (p.availability || {});
            const availabilityNotesEl = document.getElementById('provAvailabilityNotes');
            if(availabilityNotesEl){
              availabilityNotesEl.value = availability.notes || '';
            }
            const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
            days.forEach(day=>{
              const checkbox = document.querySelector(`input[data-day="${day}"]`);
              const fromInput = document.querySelector(`input[data-day-from="${day}"]`);
              const toInput = document.querySelector(`input[data-day-to="${day}"]`);
              if(!checkbox || !fromInput || !toInput) return;
              const dayVal = availability[day];
              if(dayVal){
                checkbox.checked = true;
                fromInput.value = dayVal.from || dayVal.start || '';
                toInput.value = dayVal.to || dayVal.end || '';
              } else {
                checkbox.checked = false;
                fromInput.value = '';
                toInput.value = '';
              }
            });
          }
        }catch(_err){}
      })();
    }

    providerProfileForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if(!userId){
        showBanner('Please log in to update your profile.', 'info');
        return;
      }
      if(!userId || Number.isNaN(userId)){
        showBanner('Please log in to update your profile.', 'info');
        return;
      }
      if(languageInput && languageInput.value.trim()){
        const added = addLanguage(languageInput.value);
        if(!added) return;
      }
      const fd = new FormData(providerProfileForm);
      const payload = Object.fromEntries(fd.entries());
      const first = payload.first_name || '';
      const last = payload.last_name || '';
      payload.name = [first, last].filter(Boolean).join(' ') || payload.name || null;
      // Remove unused address_line2 from payload if present
      delete payload.address_line2;
      const availabilityNotesEl = document.getElementById('provAvailabilityNotes');
      const hasAvailabilityInputs = availabilityNotesEl || document.querySelector('input[data-day="monday"]');
      if(hasAvailabilityInputs){
        const availability = { notes: availabilityNotesEl ? availabilityNotesEl.value || null : null };
        const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        days.forEach(day=>{
          const checked = document.querySelector(`input[data-day="${day}"]`)?.checked;
          if(checked){
            const fromVal = document.querySelector(`input[data-day-from="${day}"]`)?.value || '';
            const toVal = document.querySelector(`input[data-day-to="${day}"]`)?.value || '';
            availability[day] = { from: fromVal, to: toVal };
          }
        });
        payload.availability = availability;
      }
      // Verification fields managed by admin/backoffice only
      delete payload.cpr_certified;
      delete payload.caregiver_insurance;
      delete payload.consent_background_check;
      // Clean empty strings to null so COALESCE works and avoid updating immutable fields
      ['first_name','last_name','phone','city','province','address_line1','postal_code','payout_method','languages','about','photo_url'].forEach(k=>{
        if(payload[k] !== undefined && payload[k] !== null && payload[k].trim() === ''){
          payload[k] = null;
        }
      });
      // Do not attempt to update login email from this form
      delete payload.email;
      try{
        const targetId = profileApproved ? userId : null;
        if(!targetId){
          showBanner('Profile editing is available after approval.', 'info');
          if(provStatusEl){
            provStatusEl.style.color = '#b91c1c';
            provStatusEl.textContent = 'Approval pending. Cannot save yet.';
          }
          return;
        }
        const res = await fetch(`${API_BASE}/forms/provider/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('Save failed');
        showBanner('Profile saved', 'success');
        if(provStatusEl){
          provStatusEl.style.color = '#2d6b42';
          provStatusEl.textContent = 'Saved';
        }
      }catch(err){
        showBanner('Could not save profile', 'error');
        if(provStatusEl){
          provStatusEl.style.color = '#b91c1c';
          provStatusEl.textContent = 'Save failed. Try again.';
        }
      }
    });

    const delBtn = document.getElementById('provDelete');
    delBtn?.addEventListener('click', ()=>{
      alert('Account deletion coming soon. Contact support to delete now.');
    });
  }

  // Public caregiver profile page (read-only resume-style)
  const cgProfileShell = document.getElementById('cgProfileShell');
  if(cgProfileShell){
    const params = new URLSearchParams(window.location.search);
    const providerId = params.get('provider_id');
    const cgNameEl = document.getElementById('cgName');
    const cgMetaEl = document.getElementById('cgMeta');
    const cgBioEl = document.getElementById('cgBio');
    const cgPhoto = document.getElementById('cgPhoto');
    const cgInitials = document.getElementById('cgInitials');
    const cgCertsEl = document.getElementById('cgCerts');
    const cgAvailText = document.getElementById('cgAvailText');
    const cgAvailNotes = document.getElementById('cgAvailNotes');
    const cgAvailList = document.getElementById('cgAvailList');
    const cgAvailabilityTag = document.getElementById('cgAvailabilityTag');
    const cgAvatar = document.getElementById('cgAvatar');
    const cgBookBtn = document.getElementById('cgBookBtn');
    const cgMessageBtn = document.getElementById('cgMessageBtn');
    const cgContact = document.getElementById('cgContact');
    const cgLanguages = document.getElementById('cgLanguages');

    const isSignedIn = !!localStorage.getItem('user_id');
    const userId = localStorage.getItem('user_id');

    async function loadCaregiverProfile(){
      if(!providerId){
        cgBioEl.textContent = 'No caregiver selected.';
        return;
      }
      try{
        const res = await fetch(`${API_BASE}/forms/provider/${providerId}`);
        if(!res.ok) throw new Error('Profile not found');
        const data = await res.json();
        const p = data.profile || {};
        cgNameEl.textContent = p.name || 'Caregiver';
        const city = p.city || '';
        const province = p.province || '';
        const locationLabel = [city, province].filter(Boolean).join(', ');
        cgMetaEl.textContent = locationLabel || 'Trusted caregiver';
        cgBioEl.textContent = p.about || 'About information not provided yet.';
        const initials = (p.name || 'CG').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
        if(cgInitials) cgInitials.textContent = initials;
        const photoUrl = p.photo_url || p.photoUrl || '';
        if(photoUrl && cgPhoto){
          cgPhoto.src = photoUrl;
          cgPhoto.addEventListener('error', () => cgAvatar.classList.remove('has-photo'), { once: true });
          cgAvatar.classList.add('has-photo');
        } else {
          cgAvatar.classList.remove('has-photo');
        }
        const availability = typeof p.availability === 'string' ? JSON.parse(p.availability || '{}') : (p.availability || {});
        const statusMap = {
          immediate: 'Available immediately',
          next24: 'Available in the next 24 hours',
          week: 'Available this week',
          custom: 'Limited availability'
        };
        const statusLabel = availability.status ? (statusMap[availability.status] || 'Availability updated') : '';
        if(cgAvailabilityTag){
          cgAvailabilityTag.innerHTML = statusLabel
            ? `<span style="background:#eef7f2; color:#2d6b42; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700;">${statusLabel}</span>`
            : '';
        }
        const dayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const dayLabels = {
          monday: 'Mon',
          tuesday: 'Tue',
          wednesday: 'Wed',
          thursday: 'Thu',
          friday: 'Fri',
          saturday: 'Sat',
          sunday: 'Sun'
        };
        function formatTime(value){
          if(!value) return '';
          const [hStr, mStr] = String(value).split(':');
          const h = parseInt(hStr, 10);
          if(!Number.isFinite(h)) return value;
          const minutes = mStr || '00';
          const hour12 = h % 12 === 0 ? 12 : h % 12;
          const ampm = h < 12 ? 'AM' : 'PM';
          return `${hour12}:${minutes} ${ampm}`;
        }
        const scheduleSource = availability.schedule && typeof availability.schedule === 'object'
          ? availability.schedule
          : availability;
        const scheduleRows = dayOrder.map((day)=>{
          const slotData = scheduleSource?.[day];
          if(!slotData) return null;
          const slots = Array.isArray(slotData)
            ? slotData
            : (Array.isArray(slotData.slots) ? slotData.slots : [slotData]);
          const timeLabel = slots.map((slot)=>{
            const fromLabel = formatTime(slot.from || slot.start);
            const toLabel = formatTime(slot.to || slot.end);
            return fromLabel && toLabel
              ? `${fromLabel} - ${toLabel}`
              : (fromLabel || toLabel || '');
          }).filter(Boolean).join(', ');
          if(!timeLabel) return null;
          return { day: dayLabels[day] || day, time: timeLabel };
        }).filter(Boolean);
        if(scheduleRows.length){
          if(cgAvailText) cgAvailText.textContent = 'Weekly schedule';
          if(cgAvailList){
            cgAvailList.innerHTML = scheduleRows.map(row=> `
              <div style="display:flex; justify-content:space-between; gap:10px; padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px; background:#f8fafc; font-size:13px; color:#475569;">
                <span style="font-weight:700; color:#0f172a;">${row.day}</span>
                <span>${row.time}</span>
              </div>
            `).join('');
          }
          if(cgAvailNotes) cgAvailNotes.textContent = availability.notes || 'Times shown in local time.';
        } else {
          if(cgAvailText) cgAvailText.textContent = statusLabel || 'Availability not provided';
          if(cgAvailList) cgAvailList.innerHTML = '';
          if(cgAvailNotes) cgAvailNotes.textContent = availability.notes || '';
        }
        const certs = [
          `CPR: ${p.cpr_certified ? 'Yes' : 'No'}`,
          `Caregiver insurance: ${p.caregiver_insurance ? 'Yes' : 'No'}`,
          `Background check: ${p.consent_background_check ? 'Yes' : 'No'}`
        ];
        cgCertsEl.innerHTML = certs.map(c=> `<li>${c}</li>`).join('');
        cgContact.innerHTML = `
          <div>${p.email || 'Email on file'}</div>
          <div>${p.phone || ''}</div>
        `;
        if(cgLanguages){
          let languageList = [];
          if(Array.isArray(p.languages)){
            languageList = p.languages;
          } else if(typeof p.languages === 'string'){
            const trimmed = p.languages.trim();
            if(trimmed.startsWith('[')){
              try{
                const parsed = JSON.parse(trimmed);
                if(Array.isArray(parsed)) languageList = parsed;
              }catch(_err){
                languageList = trimmed.split(',');
              }
            } else {
              languageList = trimmed.split(',');
            }
          }
          languageList = languageList.map(l=> String(l || '').trim()).filter(Boolean);
          if(languageList.length === 0){
            cgLanguages.textContent = 'Languages not provided';
          } else {
            cgLanguages.innerHTML = languageList.map(lang=> `<span style="display:inline-block; margin:0 6px 6px 0; padding:4px 10px; border-radius:999px; background:#eef2ff; color:#4338ca; font-size:12px; font-weight:700;">${lang}</span>`).join('');
          }
        }
        const bookHref = `parent-dashboard.html?provider_id=${encodeURIComponent(providerId)}&provider_name=${encodeURIComponent(p.name || '')}`;
        cgBookBtn.href = bookHref;
        cgMessageBtn.addEventListener('click', (ev)=>{
          ev.preventDefault();
          if(!isSignedIn){
            const loginModal = document.getElementById('loginModal');
            if(loginModal) loginModal.classList.remove('hidden');
            return;
          }
          if(window.showChatWidget){
            window.showChatWidget(providerId, p.name || 'Caregiver');
          }
        });
      }catch(err){
        cgBioEl.textContent = 'Unable to load caregiver profile.';
        console.error(err);
      }
    }
    loadCaregiverProfile();
  }

  // Child profile page
  const childProfileShell = document.getElementById('childProfileShell');
  if(childProfileShell){
    const params = new URLSearchParams(window.location.search);
    const childId = params.get('child_id');
    const childNameEl = document.getElementById('childName');
    const childMetaEl = document.getElementById('childMeta');
    const childAvatar = document.getElementById('childAvatar');
    const childNotes = document.getElementById('childNotes');
    const childNeeds = document.getElementById('childNeeds');
    const logs = {
      prayer: document.getElementById('childPrayerLog'),
      reading: document.getElementById('childReadingLog'),
      quran: document.getElementById('childQuranLog'),
      goals: document.getElementById('childGoals'),
      activities: document.getElementById('childActivities')
    };
    const calcAgeFromBirthdate = (value) => {
      if(!value) return null;
      const birth = new Date(value);
      if(Number.isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if(monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())){
        age -= 1;
      }
      return age;
    };

    async function loadChildProfile(){
      if(!childId){
        childNameEl.textContent = 'Child not found';
        return;
      }
      try{
        const res = await fetch(`${API_BASE}/forms/child/${childId}`);
        if(!res.ok) throw new Error('Child not found');
        const data = await res.json();
        const c = data.child || data || {};
        const name = c.first_name || c.name || 'Child';
        childNameEl.textContent = name;
        const initial = name.charAt(0).toUpperCase();
        childAvatar.textContent = initial;
        const derivedAge = calcAgeFromBirthdate(c.birthdate);
        const age = derivedAge !== null ? derivedAge : (c.age || (Array.isArray(c.ages) && c.ages.length ? c.ages[0] : ''));
        const city = c.city || '';
        childMetaEl.textContent = [age ? `${age} yrs` : '', city].filter(Boolean).join(' • ') || 'Child profile';
        childNotes.textContent = c.notes || 'No notes yet.';
        childNeeds.textContent = c.special_needs || 'No special needs recorded.';

        function renderList(target, items){
          if(!target) return;
          if(!items || items.length === 0){
            target.innerHTML = '<li style="color:#9ca3af;">No entries yet.</li>';
            return;
          }
          target.innerHTML = items.map(i=> `<li>${i}</li>`).join('');
        }
        renderList(logs.prayer, c.prayer_log || []);
        renderList(logs.reading, c.reading_log || []);
        renderList(logs.quran, c.quran_log || []);
        renderList(logs.goals, c.goals || []);
        renderList(logs.activities, c.activities || []);
      }catch(err){
        childNameEl.textContent = 'Unable to load child profile';
        childNotes.textContent = '';
        Object.values(logs).forEach(el=> { if(el) el.innerHTML = '<li style="color:#9ca3af;">Unable to load.</li>'; });
        console.error(err);
      }
    }

    loadChildProfile();
  }

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

  const isDashboard = document.body.classList.contains('provider-dashboard');
  const mobileMenuBadge = mobileMenuBtn ? mobileMenuBtn.querySelector('.mobile-menu-badge') : null;
  const inboxTab = isDashboard ? document.querySelector('.provider-nav-item[data-panel="inbox"]') : null;
  const inboxBadge = inboxTab ? inboxTab.querySelector('.provider-nav-badge') : null;
  const updateMessageBadges = (count)=>{
    const unread = Number(count) || 0;
    if(inboxBadge && inboxTab){
      inboxBadge.textContent = '';
      inboxBadge.style.display = unread > 0 ? 'inline-flex' : 'none';
      inboxTab.setAttribute('aria-label', unread > 0 ? `Messages (${unread} unread)` : 'Messages');
    }
    if(mobileMenuBadge && mobileMenuBtn){
      mobileMenuBadge.textContent = '';
      mobileMenuBadge.style.display = unread > 0 ? 'inline-flex' : 'none';
      mobileMenuBtn.setAttribute('aria-label', unread > 0 ? `Open messages (${unread} unread)` : 'Open messages');
    }
  };
  if(isDashboard){
    if(typeof window.latestUnread === 'number') updateMessageBadges(window.latestUnread);
    window.addEventListener('chat-updated', (event) => {
      updateMessageBadges(event?.detail?.unread);
    });
  }
  if(mobileMenuBtn){
    if(isDashboard){
      mobileMenuBtn.addEventListener('click', () => {
        if(typeof window.showChatWidget === 'function'){
          window.showChatWidget();
          return;
        }
        const fallbackInbox = document.querySelector('[data-panel="inbox"]');
        if(fallbackInbox) fallbackInbox.click();
      });
    } else {
      mobileMenuBtn.addEventListener('click', openMobileMenu);
    }
  }
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

  // Care+ Plan chooser (front-end only)
  const planChooserEl = document.getElementById('care-plan-chooser');
  if(planChooserEl){
    const plans = {
      basic: {
        id: 'basic',
        name: 'Care+ Basic',
        price: '$39.99/month',
        savings: 'Break even or save',
        blurb: 'Occasional childcare with 50% off the 6% platform fee.',
        anchor: '#care-basic'
      },
      plus: {
        id: 'plus',
        name: 'Care+ Plus',
        price: '$59.99/month',
        savings: 'Save $60–$120+/month',
        blurb: 'Weekly childcare with 70% off the platform fee.',
        anchor: '#care-plus'
      },
      premium: {
        id: 'premium',
        name: 'Care+ Premium',
        price: '$89.99/month',
        savings: 'Save $120–$180+/month',
        blurb: 'Multiple sessions weekly with the platform fee waived.',
        anchor: '#care-premium'
      }
    };

    const getRecommendation = (sessions)=>{
      const n = Number(sessions);
      if(Number.isNaN(n) || n <= 1) return 'basic';
      if(n === 2) return 'plus';
      return 'premium';
    };

    const sessionsInput = document.getElementById('planSessions');
    const sessionsValueEl = document.getElementById('planSessionsValue');
    const pillButtons = Array.from(document.querySelectorAll('[data-session-value]'));
    const recommendedCard = document.getElementById('planRecommendedCard');
    const recommendedName = document.getElementById('planRecommendedName');
    const recommendedPrice = document.getElementById('planRecommendedPrice');
    const recommendedSavings = document.getElementById('planRecommendedSavings');
    const recommendedCopy = document.getElementById('planRecommendedCopy');
    const recommendedCta = document.getElementById('planRecommendedCta');
    const altCards = [document.getElementById('planAltOne'), document.getElementById('planAltTwo')];

    function renderRecommendation(sessionValue){
      const safeValue = Math.max(0, Math.min(5, Number(sessionValue) || 0));
      if(sessionsInput) sessionsInput.value = String(safeValue);
      if(sessionsValueEl) sessionsValueEl.textContent = safeValue === 5 ? '5+' : String(safeValue);

      pillButtons.forEach(btn=>{
        const btnVal = Number(btn.dataset.sessionValue);
        btn.classList.toggle('active', btnVal === safeValue);
      });

      const recId = getRecommendation(safeValue);
      const recPlan = plans[recId];
      if(!recPlan || !recommendedCard) return;

      recommendedCard.dataset.plan = recId;
      if(recommendedName) recommendedName.textContent = recPlan.name;
      if(recommendedPrice) recommendedPrice.textContent = recPlan.price;
      if(recommendedSavings) recommendedSavings.textContent = recPlan.savings;
      if(recommendedCopy) recommendedCopy.textContent = recPlan.blurb;
      if(recommendedCta){
        recommendedCta.textContent = `Choose ${recPlan.name}`;
        recommendedCta.setAttribute('href', recPlan.anchor);
      }

      const otherIds = Object.keys(plans).filter(id=> id !== recId);
      otherIds.forEach((id, idx)=>{
        const card = altCards[idx];
        const plan = plans[id];
        if(card && plan){
          card.dataset.plan = plan.id;
          const nameEl = card.querySelector('.plan-card__name');
          const priceEl = card.querySelector('.plan-card__price');
          const savingsEl = card.querySelector('.plan-card__savings');
          const linkEl = card.querySelector('.plan-card__link');
          if(nameEl) nameEl.textContent = plan.name;
          if(priceEl) priceEl.textContent = plan.price;
          if(savingsEl) savingsEl.textContent = plan.savings;
          if(linkEl){
            linkEl.textContent = `View ${plan.name}`;
            linkEl.setAttribute('href', plan.anchor);
          }
        }
      });
    }

    sessionsInput && sessionsInput.addEventListener('input', e=>{
      renderRecommendation(e.target.value);
    });
    pillButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const val = Number(btn.dataset.sessionValue) || 0;
        renderRecommendation(val);
      });
    });

    renderRecommendation(sessionsInput ? sessionsInput.value : 0);
  }

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

  const citiesByProvince = {
    AB: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge'],
    BC: ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Kelowna'],
    MB: ['Winnipeg'],
    NB: ['Saint John'],
    NL: ["St. John's"],
    NS: ['Halifax'],
    NT: ['Yellowknife'],
    NU: ['Iqaluit'],
    ON: ['Toronto', 'Ottawa', 'Hamilton', 'London'],
    PE: ['Charlottetown'],
    QC: ['Quebec City', 'Montreal'],
    SK: ['Regina', 'Saskatoon', 'Prince Albert', 'Moose Jaw', 'Yorkton', 'Swift Current'],
    YT: ['Whitehorse']
  };

  // Parent signup -> send basic intake to backend
  const parentSignupForm = document.getElementById('parentSignupForm');
  if(parentSignupForm){
    const parentProvinceSelect = parentSignupForm.querySelector('#parentProvinceSelect');
    const parentCitySelect = parentSignupForm.querySelector('#parentCitySelect');

    function populateParentCities(province){
      if(!parentCitySelect) return;
      const cities = citiesByProvince[province] || [];
      parentCitySelect.innerHTML = '<option value="">Select city</option>' +
        cities.map((city)=> `<option value="${city}">${city}</option>`).join('');
    }

    if(parentProvinceSelect && parentCitySelect){
      populateParentCities(parentProvinceSelect.value);
      parentProvinceSelect.addEventListener('change', () => {
        populateParentCities(parentProvinceSelect.value);
      });
    }

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
        localStorage.setItem('user_type', 'parent');
        const familyId = `family_${response.userId}`;
        localStorage.setItem('family_id', familyId);
        if(name) localStorage.setItem('user_name', name);
        const banner = document.getElementById('parentSuccessBanner');
        if(banner){
          parentSignupForm.style.display = 'none';
          banner.classList.remove('hidden');
          setTimeout(()=>{ window.location.href = 'parent-dashboard.html'; }, 2500);
        } else {
          showBanner('Thanks! Your account has been created.', 'success');
          parentSignupForm.reset();
          window.location.href = 'parent-dashboard.html';
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
    const provinceSelect = applicationForm.querySelector('#providerProvinceSelect');
    const citySelect = applicationForm.querySelector('#providerCitySelect');

    function populateProviderCities(province){
      if(!citySelect) return;
      const cities = citiesByProvince[province] || [];
      citySelect.innerHTML = '<option value="">Select city</option>' +
        cities.map((city)=> `<option value="${city}">${city}</option>`).join('');
    }

    if(provinceSelect && citySelect){
      populateProviderCities(provinceSelect.value);
      provinceSelect.addEventListener('change', () => {
        populateProviderCities(provinceSelect.value);
      });
    }

    applicationForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(applicationForm);
      const name = `${fd.get('firstName') || ''} ${fd.get('lastName') || ''}`.trim();
      const email = fd.get('email');
      const phone = fd.get('phone');
      const password = fd.get('password');
      const confirmPassword = fd.get('confirmPassword');
      const has_cpr = !!fd.get('cpr');
      const city = fd.get('city');
      const province = fd.get('province');
      const references = fd.get('references') || '';
      const payout_method = fd.get('payoutMethod') || '';
      const languages = (fd.get('languages') || '').trim();
      
      // Collect age groups (checkboxes with name="ageGroup")
      const ageGroupCheckboxes = applicationForm.querySelectorAll('input[name="ageGroup"]:checked');
      const age_groups = Array.from(ageGroupCheckboxes).map(cb => cb.value);
      
      // Collect availability (day + times)
      const availability = {};
      const dayCheckboxes = applicationForm.querySelectorAll('input[type="checkbox"][name="days"]');
      dayCheckboxes.forEach(dayCheckbox => {
        const dayName = dayCheckbox.value;
        const isSelected = dayCheckbox.checked;
        if(isSelected) {
          const fromInput = applicationForm.querySelector(`input[name="${dayName}_start"]`);
          const toInput = applicationForm.querySelector(`input[name="${dayName}_end"]`);
          availability[dayName] = {
            from: fromInput?.value || '',
            to: toInput?.value || ''
          };
        }
      });
      
      // Validate passwords match
      if (password !== confirmPassword) {
        showBanner('Passwords do not match', 'error');
        return;
      }
      
      // Validate required fields
      if(age_groups.length === 0) {
        showBanner('Please select at least one age group', 'error');
        return;
      }
      
      try{
        const consent_background_check = !!applicationForm.querySelector('input[name="backgroundCheck"]')?.checked;
        const consent_terms = !!applicationForm.querySelector('input[name="acceptPolicies"]')?.checked;
        const consent_provider_agreement = !!applicationForm.querySelector('input[name="providerAgreement"]')?.checked;
        const certifications = has_cpr ? 'Yes' : 'No';
        const payload = { 
          name, 
          email, 
          phone, 
          password, 
          has_cpr,
          age_groups,
          certifications,
          meta: { 
            city, 
            province,
            availability,
            references,
            payout_method,
            languages,
            address_line1: applicationForm.querySelector('input[name="address_line1"]')?.value || '',
            postal_code: applicationForm.querySelector('input[name="postal_code"]')?.value || '',
            consent_background_check,
            consent_terms,
            consent_provider_agreement
          }
        };
        console.log('Submitting provider application:', payload);
        const resp = await postJSON('/forms/provider', payload);
        if(resp?.userId){
          localStorage.setItem('user_id', resp.userId);
        }
        localStorage.setItem('user_type', 'provider');
        if(name) localStorage.setItem('user_name', name);
        localStorage.setItem('provider_status', 'under_review');
        const successMsg = document.getElementById('successMessage');
        if(successMsg){
          applicationForm.style.display = 'none';
          successMsg.classList.remove('hidden');
          setTimeout(()=>{ window.location.href = 'caregiver-dashboard.html'; }, 2500);
        } else {
          showBanner('Application received! We\'ll be in touch soon.', 'success');
          applicationForm.reset();
          window.location.href = 'caregiver-dashboard.html';
        }
      }catch(err){
        showBanner('Submission failed. Please try again.', 'error');
        console.error('Provider application error:', err);
      }
    });
  }

  // Password visibility toggles
  const toggleButtons = document.querySelectorAll('.togglePassword');
  toggleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const input = button.previousElementSibling;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.textContent = isPassword ? 'Hide' : 'Show';
      button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      button.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
    });
  });

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

// Messaging widget (parents & caregivers)
document.addEventListener('DOMContentLoaded', ()=>{
  const userId = parseInt(localStorage.getItem('user_id'), 10);
  if(!userId) return;
  const API_BASE = window.API_BASE || 'https://assured-hearts-backend.onrender.com';
  let threads = {};
  let activeThread = null;
  const contactCache = {};

  const launcher = document.createElement('button');
  launcher.id = 'chatLauncher';
  launcher.innerHTML = 'Messages <span id="chatBadge" style="display:none; margin-left:6px; background:#f87171; color:#fff; padding:2px 6px; border-radius:999px; font-size:11px;"></span>';
  Object.assign(launcher.style, {
    position:'fixed', bottom:'20px', right:'20px', background:'linear-gradient(135deg, #67B3C2 0%, #06464E 100%)',
    color:'#fff', border:'none', borderRadius:'999px', padding:'10px 16px', fontWeight:'700',
    boxShadow:'0 8px 20px rgba(0,0,0,0.15)', cursor:'pointer', zIndex:'9999'
  });
  document.body.appendChild(launcher);

  const modal = document.createElement('div');
  modal.id = 'chatModal';
  modal.className = 'chat-modal';
  Object.assign(modal.style, {
    position:'fixed', bottom:'70px', right:'20px', width:'360px', maxHeight:'70vh', background:'#fff',
    border:'1px solid #e5e7eb', borderRadius:'12px', boxShadow:'0 12px 30px rgba(0,0,0,0.18)',
    display:'none', zIndex:'9999', overflow:'hidden'
  });
  modal.innerHTML = `
    <div class="chat-shell">
      <div class="chat-list-view">
        <div class="chat-list-header">
          <div class="chat-list-title">Messages</div>
          <button id="chatCloseBtn" class="chat-icon-btn chat-close-btn" type="button" aria-label="Close messages">&times;</button>
        </div>
        <div id="chatThreads" class="chat-threads"></div>
      </div>
      <div class="chat-convo-view">
        <div class="chat-convo-header">
          <button id="chatBackBtn" class="chat-icon-btn chat-back-btn" type="button" aria-label="Back to messages">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="chat-user">
            <div id="chatActiveAvatar" class="chat-avatar">AH</div>
            <div class="chat-user-meta">
              <div id="chatActiveName" class="chat-user-name">Messages</div>
              <div id="chatActiveSub" class="chat-user-sub">Select a chat</div>
            </div>
          </div>
          <a id="chatCallBtn" class="chat-icon-btn chat-call-btn is-disabled" href="#" aria-label="Call" aria-disabled="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.6 2.5h3.1l1 4-2 1a12 12 0 006 6l1-2 4 1v3.1a1 1 0 0 1-1 1C9.6 16.6 3.4 10.4 2.5 3.5a1 1 0 0 1 1-1z" fill="currentColor"/>
            </svg>
          </a>
        </div>
        <div id="chatHistory" class="chat-history"></div>
        <div class="chat-composer">
          <button id="chatPhotoBtn" class="chat-icon-btn chat-photo-btn" type="button" aria-label="Send photo">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 6l1.5-2h7L17 6h3a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2h3z" fill="none" stroke="currentColor" stroke-width="1.6"/>
              <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
            </svg>
          </button>
          <input id="chatPhotoInput" class="chat-photo-input" type="file" accept="image/*" capture="environment">
          <textarea id="chatInput" class="chat-input" rows="1" placeholder="Message..."></textarea>
          <button id="chatSendBtn" class="chat-send-btn" type="button">Send</button>
        </div>
        <div class="chat-status-row">
          <span id="chatStatus" class="chat-status"></span>
          <button id="chatBookBtn" class="chat-book-btn" type="button">Book</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const badgeEl = launcher.querySelector('#chatBadge');
  const threadsEl = modal.querySelector('#chatThreads');
  const historyEl = modal.querySelector('#chatHistory');
  const inputEl = modal.querySelector('#chatInput');
  const sendBtn = modal.querySelector('#chatSendBtn');
  const statusEl = modal.querySelector('#chatStatus');
  const bookBtn = modal.querySelector('#chatBookBtn');
  const closeBtn = modal.querySelector('#chatCloseBtn');
  const backBtn = modal.querySelector('#chatBackBtn');
  const callBtn = modal.querySelector('#chatCallBtn');
  const photoBtn = modal.querySelector('#chatPhotoBtn');
  const photoInput = modal.querySelector('#chatPhotoInput');
  const activeAvatar = modal.querySelector('#chatActiveAvatar');
  const activeName = modal.querySelector('#chatActiveName');
  const activeSub = modal.querySelector('#chatActiveSub');
  const userType = localStorage.getItem('user_type') || '';

  const getInitials = (value)=>{
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    const letters = parts.map(part=> part[0]).join('').slice(0,2).toUpperCase();
    return letters || 'AH';
  };

  const sanitizePhone = (value)=>{
    return String(value || '').replace(/[^\d+]/g, '');
  };

  const formatThreadTime = (value)=>{
    if(!value) return '';
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if(mins < 1) return 'now';
    if(mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if(hours < 24) return `${hours}h`;
    return date.toLocaleDateString('en-CA', { month:'short', day:'numeric' });
  };

  const formatThreadStatus = (value)=>{
    if(!value) return '';
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if(mins < 5) return 'Active now';
    if(mins < 60) return `Active ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if(hours < 24) return `Active ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Active ${days}d ago`;
  };

  const extractPhone = (msg)=>{
    if(!msg) return '';
    return msg.other_phone || msg.other_phone_number || msg.other_contact_phone || msg.phone || '';
  };

  const extractPhoto = (msg)=>{
    if(!msg) return '';
    return msg.other_photo || msg.other_photo_url || msg.photo_url || msg.avatar_url || msg.other_avatar || '';
  };

  const extractPhoneFromProfile = (data = {})=>{
    const profile = data.profile || data.provider || data.parent || data.user || data || {};
    return (
      profile.phone ||
      profile.phone_number ||
      profile.phoneNumber ||
      profile.contact_phone ||
      profile.contactPhone ||
      ''
    );
  };

  const ensureContactPhone = async (otherId)=>{
    if(!otherId) return;
    const thread = threads[otherId];
    if(thread && thread.other_phone) return;
    if(contactCache[otherId]){
      if(thread) thread.other_phone = contactCache[otherId];
      updateActiveHeader();
      return;
    }
    try{
      const endpoint = userType === 'provider' ? 'parent' : 'provider';
      const res = await fetch(`${API_BASE}/forms/${endpoint}/${encodeURIComponent(otherId)}`);
      if(!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const phone = extractPhoneFromProfile(data);
      if(phone){
        contactCache[otherId] = phone;
        if(thread) thread.other_phone = phone;
        updateActiveHeader();
      }
    }catch(err){
      console.error('Failed to fetch contact phone', err);
    }
  };

  const setChatView = (view)=>{
    modal.classList.toggle('chat-modal--thread', view === 'thread');
  };

  const setKeyboardState = (open)=>{
    if(!document.body.classList.contains('provider-dashboard')) return;
    if(!window.matchMedia('(max-width: 719px)').matches) return;
    document.body.classList.toggle('chat-keyboard-open', open);
  };

  const setModalOpen = (open)=>{
    modal.style.display = open ? 'block' : 'none';
    if(open){
      setChatView(activeThread ? 'thread' : 'list');
      updateActiveHeader();
    } else {
      setKeyboardState(false);
      inputEl && inputEl.blur();
    }
  };

  window.hideChatWidget = ()=>{
    setModalOpen(false);
  };

  launcher.addEventListener('click', ()=>{
    const isOpen = modal.style.display === 'block';
    setModalOpen(!isOpen);
    if(!isOpen && activeThread){
      markRead(activeThread);
    }
  });
  closeBtn && closeBtn.addEventListener('click', ()=> setModalOpen(false));
  backBtn && backBtn.addEventListener('click', ()=> setChatView('list'));
  callBtn && callBtn.addEventListener('click', (event)=>{
    if(callBtn.classList.contains('is-disabled')){
      event.preventDefault();
    }
  });
  if(photoBtn && photoInput){
    photoBtn.addEventListener('click', ()=>{
      if(!activeThread) return;
      photoInput.click();
    });
    photoInput.addEventListener('change', ()=>{
      if(!photoInput.files || photoInput.files.length === 0) return;
      statusEl.textContent = 'Photo selected';
      setTimeout(()=>{ statusEl.textContent = ''; }, 1200);
      photoInput.value = '';
    });
  }

  const updateActiveHeader = ()=>{
    const thread = activeThread ? threads[activeThread] : null;
    const name = thread?.other_name || 'Messages';
    const last = thread?.messages ? thread.messages[thread.messages.length - 1] : null;
    const lastTime = last?.created_at || last?.createdAt || null;
    if(activeName) activeName.textContent = name;
    if(activeSub) {
      activeSub.textContent = activeThread ? (formatThreadStatus(lastTime) || 'Active recently') : 'Select a chat';
    }
    if(activeAvatar){
      const avatarUrl = thread?.other_photo || thread?.photo_url || thread?.avatar_url || thread?.other_avatar || '';
      if(avatarUrl){
        activeAvatar.innerHTML = `<img src="${avatarUrl}" alt="">`;
      } else {
        activeAvatar.textContent = getInitials(name);
      }
    }
    if(callBtn){
      const phone = sanitizePhone(thread?.other_phone);
      if(phone){
        callBtn.href = `tel:${phone}`;
        callBtn.classList.remove('is-disabled');
        callBtn.setAttribute('aria-disabled','false');
      } else {
        callBtn.href = '#';
        callBtn.classList.add('is-disabled');
        callBtn.setAttribute('aria-disabled','true');
      }
    }
  };

  const openThread = (otherId, otherName)=>{
    if(!otherId) return;
    activeThread = parseInt(otherId,10);
    setModalOpen(true);
    if(!threads[activeThread]){
      threads[activeThread] = { other_id: activeThread, other_name: otherName || 'User', messages: [] };
    }
    if(otherName && threads[activeThread]) threads[activeThread].other_name = otherName;
    renderThreads();
    renderHistory(activeThread);
    updateActiveHeader();
    setChatView('thread');
    markRead(activeThread);
    updateBookButton();
    ensureContactPhone(activeThread);
  };

  // Expose opener so other buttons can launch a thread
  window.openChatThread = (otherId, otherName)=>{
    openThread(otherId, otherName);
  };

  // Allow dashboards to open the chat widget
  window.showChatWidget = (otherId, otherName)=>{
    setModalOpen(true);
    if(otherId){
      openThread(otherId, otherName);
      return;
    }
    updateActiveHeader();
    renderThreads();
    if(activeThread) renderHistory(activeThread);
  };

  async function fetchMessages(){
    const API_BASE_MSG = window.API_BASE || 'https://assured-hearts-backend.onrender.com';
    const uid = userId ? parseInt(userId, 10) : null;
    if(!uid || Number.isNaN(uid)) return;
    try{
      const res = await fetch(`${API_BASE_MSG}/forms/messages/${uid}`);
      if(!res.ok){
        const errText = await res.text();
        console.error('Failed to load messages', res.status, errText);
        // Reset to empty state instead of throwing
        threads = {};
        updateBadge();
        window.dispatchEvent(new CustomEvent('chat-updated', { detail:{threads:{}, unread:0} }));
        return;
      }
      const data = await res.json();
      threads = {};
      const msgs = data.messages || [];
      msgs.forEach(m=>{
        const key = m.other_id;
        if(!threads[key]) {
          threads[key] = {
            other_id: key,
            other_name: m.other_name || 'User',
            other_phone: extractPhone(m) || '',
            other_photo: extractPhoto(m) || '',
            messages: []
          };
        } else {
          if(m.other_name && threads[key].other_name === 'User') threads[key].other_name = m.other_name;
          if(!threads[key].other_phone && extractPhone(m)) threads[key].other_phone = extractPhone(m);
          if(!threads[key].other_photo && extractPhoto(m)) threads[key].other_photo = extractPhoto(m);
        }
        threads[key].messages.push(m);
      });
      if(activeThread && !threads[activeThread]){
        activeThread = null;
        setChatView('list');
      }
      renderThreads();
      updateBadge();
      if(activeThread) renderHistory(activeThread);
      updateActiveHeader();
      const evt = new CustomEvent('chat-updated', { detail: { threads, unread: (function(){
        return Object.values(threads).reduce((sum, t)=> sum + t.messages.filter(m => m.receiver_id === uid && !m.read_at).length, 0);
      })() } });
      window.latestThreads = threads;
      window.latestUnread = evt.detail.unread;
      window.dispatchEvent(evt);
      updateBookButton();
    }catch(err){
      console.error(err);
    }
  }

  function updateBadge(){
    const unread = Object.values(threads).reduce((sum, t)=>{
      return sum + t.messages.filter(m => m.receiver_id === userId && !m.read_at).length;
    },0);
    if(badgeEl){
      badgeEl.style.display = unread > 0 ? 'inline-block' : 'none';
      badgeEl.textContent = unread;
    }
    const pagePill = document.getElementById('pendingMessagesPill');
    if(pagePill) pagePill.textContent = `${unread} unread`;
  }

  function renderThreads(){
    if(!threadsEl) return;
    const entries = Object.values(threads).map((thread)=>{
      const last = thread.messages[thread.messages.length - 1];
      const timeValue = last?.created_at || last?.createdAt || null;
      const timeSort = timeValue ? new Date(timeValue).getTime() : 0;
      const unreadCount = thread.messages.filter(m => m.receiver_id === userId && !m.read_at).length;
      return { thread, last, timeValue, timeSort, unreadCount };
    }).sort((a, b)=> b.timeSort - a.timeSort);
    if(entries.length === 0){
      threadsEl.innerHTML = '<div class="chat-empty">No messages yet.</div>';
      historyEl.innerHTML = '<div class="chat-empty">Select a conversation to start chatting.</div>';
      return;
    }
    threadsEl.innerHTML = entries.map(({ thread, last, timeValue, unreadCount })=>{
      const name = thread.other_name || 'User';
      const preview = last?.body || 'Start a conversation.';
      const avatarUrl = thread.other_photo || '';
      const timeLabel = formatThreadTime(timeValue);
      const isActive = activeThread == thread.other_id;
      return `
        <div class="chat-thread${isActive ? ' is-active' : ''}${unreadCount ? ' is-unread' : ''}" data-id="${thread.other_id}">
          <div class="chat-thread-avatar">${avatarUrl ? `<img src="${avatarUrl}" alt="">` : getInitials(name)}</div>
          <div class="chat-thread-body">
            <div class="chat-thread-top">
              <span class="chat-thread-name">${name}</span>
              <span class="chat-thread-time">${timeLabel}</span>
            </div>
            <div class="chat-thread-preview">${preview}</div>
          </div>
          ${unreadCount ? '<span class="chat-thread-unread" aria-hidden="true"></span>' : ''}
        </div>
      `;
    }).join('');
    threadsEl.querySelectorAll('.chat-thread').forEach(el=>{
      el.addEventListener('click', ()=>{
        activeThread = parseInt(el.dataset.id,10);
        renderThreads();
        renderHistory(activeThread);
        updateActiveHeader();
        setChatView('thread');
        markRead(activeThread);
        updateBookButton();
      });
    });
  }

  function renderHistory(otherId){
    if(!historyEl) return;
    const thread = threads[otherId];
    if(!thread){
      historyEl.innerHTML = '<div class="chat-empty">No messages yet.</div>';
      return;
    }
    if(thread.messages.length === 0){
      historyEl.innerHTML = '<div class="chat-empty">No messages yet.</div>';
      return;
    }
    ensureContactPhone(otherId);
    const name = thread.other_name || 'User';
    const avatarUrl = thread.other_photo || '';
    const avatarInner = avatarUrl ? `<img src="${avatarUrl}" alt="">` : getInitials(name);
    historyEl.innerHTML = thread.messages.map(m=>{
      const mine = m.sender_id === userId;
      const imageUrl = m.image_url || m.photo_url || m.image || '';
      const body = m.body || '';
      const bodyHtml = body ? `<div class="chat-message-text">${body}</div>` : '';
      const imageHtml = imageUrl ? `<img src="${imageUrl}" class="chat-message-image" alt="Photo">` : '';
      const avatarHtml = !mine ? `<div class="chat-message-avatar">${avatarInner}</div>` : '';
      return `
        <div class="chat-message ${mine ? 'is-mine' : 'is-theirs'}">
          ${avatarHtml}
          <div class="chat-bubble">${imageHtml}${bodyHtml}</div>
        </div>
      `;
    }).join('');
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  async function sendMessage(){
    const text = (inputEl.value || '').trim();
    if(!text) return;
    if(!activeThread) return;
    sendBtn.disabled = true;
    statusEl.textContent = 'Sending...';
    try{
      const res = await fetch(`${API_BASE}/forms/messages`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ sender_id:userId, receiver_id: activeThread, body: text })
      });
      if(!res.ok){
        const errTxt = await res.text();
        throw new Error(errTxt || 'Failed to send');
      }
      inputEl.value = '';
      await fetchMessages();
      statusEl.textContent = 'Sent';
      markRead(activeThread);
    }catch(err){
      console.error(err);
      statusEl.textContent = 'Failed to send';
    }finally{
      sendBtn.disabled = false;
      setTimeout(()=> statusEl.textContent = '', 1200);
    }
  }

  async function markRead(otherId){
    if(!otherId) return;
    try{
      await fetch(`${API_BASE}/forms/messages/read`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ user_id: userId, other_id: otherId })
      });
      await fetchMessages();
    }catch(err){
      console.error(err);
    }
  }

  let sendLock = false;
  const triggerSend = ()=>{
    if(sendLock) return;
    const text = (inputEl?.value || '').trim();
    if(!text || !activeThread) return;
    sendLock = true;
    Promise.resolve(sendMessage()).finally(()=>{
      sendLock = false;
      if(inputEl && window.matchMedia('(max-width: 719px)').matches){
        inputEl.focus();
      }
    });
  };
  sendBtn.addEventListener('pointerdown', (e)=>{
    if(window.matchMedia('(max-width: 719px)').matches){
      e.preventDefault();
      triggerSend();
    }
  });
  sendBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    triggerSend();
  });
  inputEl.addEventListener('keydown', (e)=> {
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      triggerSend();
    }
  });
  inputEl.addEventListener('focus', ()=> setKeyboardState(true));
  inputEl.addEventListener('blur', ()=> setKeyboardState(false));

  function updateBookButton(){
    if(!bookBtn) return;
    // Hide for caregivers (they can't book)
    if(userType === 'provider'){
      bookBtn.style.display = 'none';
      return;
    }
    if(!activeThread){
      bookBtn.style.display = 'none';
      return;
    }
    const t = threads[activeThread] || {};
    const name = t.other_name || 'Caregiver';
    bookBtn.style.display = 'inline-block';
    bookBtn.textContent = `Book with ${name.split(' ')[0] || name}`;
    bookBtn.onclick = ()=>{
      if(document.body.classList.contains('parent-dashboard') && typeof window.startDashboardBooking === 'function'){
        window.startDashboardBooking(activeThread, name, bookBtn);
      } else {
        const link = `parent-dashboard.html?provider_id=${encodeURIComponent(activeThread)}&provider_name=${encodeURIComponent(name)}`;
        window.location.href = link;
      }
    };
  }

  fetchMessages();
  setInterval(fetchMessages, 15000);
});
