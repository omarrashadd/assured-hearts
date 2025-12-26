document.addEventListener('DOMContentLoaded', () => {
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
      const name = data.get('name') || 'Parent';
      const location = data.get('location') || 'your area';
      results.innerHTML = '';
      // mock results
      for(let i=1;i<=3;i++){
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<strong>Babysitter ${i}</strong> — Experienced caregiver near ${location}. <div style="margin-top:8px"><button class="btn" onclick="alert('Contact request sent to Babysitter ${i}')">Request</button></div>`;
        results.appendChild(div);
      }
    });
  }

  // Fake apply handler
  const becomeForm = document.getElementById('becomeForm');
  const applyResult = document.getElementById('applyResult');
  if(becomeForm){
    becomeForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = new FormData(becomeForm);
      const name = data.get('fullname') || 'Applicant';
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
      const name = data.get('fullname') || 'Friend';
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
