const roleMeta = {
  admin:   'Username / Employee ID',
  faculty: 'Faculty ID / Email',
  student: 'Roll Number',
};

function switchRole(btn) {
  document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = roleMeta[btn.dataset.role];
  document.getElementById('usernameLabel').textContent = label;
  document.getElementById('username').placeholder = 'Enter your ' + label.toLowerCase();
  clearErrors();
}

function togglePw() {
  const pw = document.getElementById('password');
  const btn = document.getElementById('toggleBtn');
  if (pw.type === 'password') { pw.type = 'text'; btn.textContent = 'Hide'; }
  else { pw.type = 'password'; btn.textContent = 'Show'; }
}

function clearErrors() {
  ['username', 'password'].forEach(id => document.getElementById(id).classList.remove('error'));
  ['usernameErr', 'passwordErr'].forEach(id => document.getElementById(id).classList.remove('visible'));
}

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearErrors();
  const u = document.getElementById('username');
  const p = document.getElementById('password');
  let ok = true;

  if (u.value.trim().length < 3) {
    u.classList.add('error');
    document.getElementById('usernameErr').classList.add('visible');
    ok = false;
  }
  if (p.value.length < 6) {
    p.classList.add('error');
    document.getElementById('passwordErr').classList.add('visible');
    ok = false;
  }
  if (!ok) return;

  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Logging in...';
  await new Promise(r => setTimeout(r, 1500));
  btn.disabled = false; btn.textContent = 'Login';
  document.getElementById('successMsg').classList.add('visible');
  // window.location.href = '/dashboard';
});

function openForgot(e) {
  e.preventDefault();
  document.getElementById('forgotFormWrap').style.display = '';
  document.getElementById('sentWrap').style.display = 'none';
  document.getElementById('resetEmail').value = '';
  document.getElementById('resetErr').classList.remove('visible');
  document.getElementById('resetEmail').classList.remove('error');
  document.getElementById('forgotOverlay').classList.add('open');
}

function closeForgot() {
  document.getElementById('forgotOverlay').classList.remove('open');
}

function sendReset() {
  const email = document.getElementById('resetEmail');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    email.classList.add('error');
    document.getElementById('resetErr').classList.add('visible');
    return;
  }
  document.getElementById('sentEmail').textContent = email.value.trim();
  document.getElementById('forgotFormWrap').style.display = 'none';
  document.getElementById('sentWrap').style.display = 'block';
}

document.getElementById('forgotOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeForgot();
});
