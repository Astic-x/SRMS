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
  const rememberMe = document.getElementById('rememberMe').checked;
  let ok = true;

  // Your UI Validation
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
  btn.disabled = true; 
  btn.textContent = 'Authenticating...';

  try {
    // 1. Figure out which role is currently active
    const activeTab = document.querySelector('.role-tab.active');
    const role = activeTab ? activeTab.dataset.role : 'admin';

    // 2. Send the data to our Node.js Backend
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            role: role,
            username: u.value.trim(),
            password: p.value,
            remember: rememberMe
        })
    });

    const data = await response.json();

    // 3. Handle the Server's Response
    if (response.ok) {
        // Success!
        document.getElementById('successMsg').textContent = 'Login successful! Redirecting...';
        document.getElementById('successMsg').classList.add('visible');
        window.location.href = data.redirectUrl; // Server tells us where to go
    } else {
        // Fail (Wrong password or username)
        btn.disabled = false; 
        btn.textContent = 'Login';
        alert(data.message || 'Invalid credentials. Please try again.');
        u.classList.add('error');
        p.classList.add('error');
    }
  } catch (error) {
    console.error("Login Error:", error);
    btn.disabled = false; 
    btn.textContent = 'Login';
    alert('Server error. Make sure your Node backend is running!');
  }
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

async function sendReset() {
    const emailInput = document.getElementById('resetEmail');
    const emailValue = emailInput.value.trim();
    const err = document.getElementById('resetErr');
    const btn = document.querySelector('.btn-send');

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        emailInput.classList.add('error');
        err.classList.add('visible');
        return;
    }
    
    // Change button state
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
        // Send the email to our Node server
        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailValue })
        });

        const data = await response.json();

        if (response.ok) {
            // Success! Switch to the "Sent" UI
            document.getElementById('sentEmail').textContent = emailValue;
            document.getElementById('forgotFormWrap').style.display = 'none';
            document.getElementById('sentWrap').style.display = 'block';
        } else {
            // Email not found in database
            err.textContent = data.message;
            err.classList.add('visible');
            btn.textContent = 'Send Link';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Reset Error:', error);
        err.textContent = 'Server error. Try again later.';
        err.classList.add('visible');
        btn.textContent = 'Send Link';
        btn.disabled = false;
    }
}

document.getElementById('forgotOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeForgot();
});
