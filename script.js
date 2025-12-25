document.addEventListener('DOMContentLoaded', () => {
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
      applyResult.innerHTML = `<div class="card">Thanks, <strong>${name}</strong>! We received your application and will be in touch.</div>`;
      becomeForm.reset();
    });
  }
});
