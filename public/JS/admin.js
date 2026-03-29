// ── Navigation ──────────────────────────────────────────────
let currentPage = 'dashboard';
const pageTitles = { dashboard:'Dashboard', students:'Students', faculty:'Faculty', courses:'Courses', marks:'Marks / Grades', departments:'Departments', settings:'Settings' };
const addBtnLabels = { students:'Add Student', faculty:'Add Faculty', courses:'Add Course', departments:'Add Department', dashboard:'Add Student', marks:'Export', settings:'' };

function navigate(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  el.classList.add('active');
  currentPage = page;
  document.getElementById('page-title').textContent = pageTitles[page];
  const btn = document.getElementById('main-add-btn');
  const label = addBtnLabels[page] || '';
  btn.style.display = label ? '' : 'none';
  if(label) btn.querySelector('svg').nextSibling.textContent = '';
  btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>${label}`;
}

// ── Filter ───────────────────────────────────────────────────
function filterTable(tbodyId, q) {
  const rows = document.getElementById(tbodyId).querySelectorAll('tr');
  q = q.toLowerCase();
  rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none');
}

// ── Modal Forms ───────────────────────────────────────────────
const forms = {
  student: (edit) => `
    <div class="form-row"><div class="form-group"><label>First Name</label><input type="text" placeholder="First name" value="${edit?'Aarav':''}"></div><div class="form-group"><label>Last Name</label><input type="text" placeholder="Last name" value="${edit?'Sharma':''}"></div></div>
    <div class="form-row"><div class="form-group"><label>Roll Number</label><input type="text" placeholder="e.g. CSE2024001" value="${edit?'CSE2021001':''}"></div><div class="form-group"><label>Department</label><select><option>CSE</option><option>ECE</option><option>ME</option><option>Civil</option><option>IT</option><option>BT</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Semester</label><select><option>2nd</option><option>4th</option><option>6th</option><option>8th</option></select></div><div class="form-group"><label>Status</label><select><option>Active</option><option>Inactive</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Email</label><input type="email" placeholder="student@email.com" value="${edit?'aarav@example.com':''}"></div><div class="form-group"><label>Phone</label><input type="text" placeholder="+91 00000 00000" value="${edit?'+91 98765 11111':''}"></div></div>`,
  faculty: (edit) => `
    <div class="form-row"><div class="form-group"><label>First Name</label><input type="text" placeholder="First name" value="${edit?'Anand':''}"></div><div class="form-group"><label>Last Name</label><input type="text" placeholder="Last name" value="${edit?'Mehta':''}"></div></div>
    <div class="form-row"><div class="form-group"><label>Faculty ID</label><input type="text" placeholder="e.g. FAC001" value="${edit?'FAC001':''}"></div><div class="form-group"><label>Department</label><select><option>CSE</option><option>ECE</option><option>ME</option><option>Civil</option><option>IT</option><option>BT</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Designation</label><select><option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option><option>Lecturer</option></select></div><div class="form-group"><label>Status</label><select><option>Active</option><option>Inactive</option></select></div></div>
    <div class="form-group"><label>Email</label><input type="email" placeholder="faculty@university.edu" value="${edit?'anand@srms.edu.in':''}"></div>`,
  course: (edit) => `
    <div class="form-row"><div class="form-group"><label>Course Code</label><input type="text" placeholder="e.g. CS301" value="${edit?'CS301':''}"></div><div class="form-group"><label>Credits</label><input type="number" min="1" max="6" placeholder="3" value="${edit?'4':''}"></div></div>
    <div class="form-group"><label>Course Name</label><input type="text" placeholder="Course title" value="${edit?'Data Structures & Algorithms':''}"></div>
    <div class="form-row"><div class="form-group"><label>Department</label><select><option>CSE</option><option>ECE</option><option>ME</option><option>Civil</option><option>IT</option><option>BT</option></select></div><div class="form-group"><label>Type</label><select><option>Core</option><option>Elective</option></select></div></div>
    <div class="form-group"><label>Assigned Faculty</label><select><option>Dr. Anand Mehta</option><option>Prof. Sunita Rao</option><option>Dr. Rajesh Pant</option><option>Dr. Manoj Kumar</option><option>Ms. Pooja Arora</option><option>Dr. Neha Singh</option></select></div>`,
  department: (edit) => `
    <div class="form-row"><div class="form-group"><label>Department Code</label><input type="text" placeholder="e.g. CSE" value="${edit?'CSE':''}"></div><div class="form-group"><label>Status</label><select><option>Active</option><option>Inactive</option></select></div></div>
    <div class="form-group"><label>Department Name</label><input type="text" placeholder="Full department name" value="${edit?'Computer Science & Engineering':''}"></div>
    <div class="form-group"><label>Head of Department (HOD)</label><select><option>Dr. Anand Mehta</option><option>Prof. Sunita Rao</option><option>Dr. Rajesh Pant</option><option>Dr. Manoj Kumar</option><option>Ms. Pooja Arora</option><option>Dr. Neha Singh</option></select></div>
    <div class="form-row"><div class="form-group"><label>Established Year</label><input type="number" placeholder="2005" value="${edit?'2005':''}"></div><div class="form-group"><label>Intake Capacity</label><input type="number" placeholder="60" value="${edit?'60':''}"></div></div>`,
  marks: (edit) => `
    <div class="form-row"><div class="form-group"><label>Student Roll No.</label><input type="text" value="${edit?'CSE2021001':''}"></div><div class="form-group"><label>Course Code</label><select><option>CS301</option><option>CS410</option><option>EC201</option><option>ME101</option><option>IT301</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Internal Marks (max 40)</label><input type="number" min="0" max="40" value="${edit?'38':''}"></div><div class="form-group"><label>External Marks (max 60)</label><input type="number" min="0" max="60" value="${edit?'56':''}"></div></div>
    <div class="form-group"><label>Semester</label><select><option>2nd</option><option>4th</option><option>6th</option><option>8th</option></select></div>`,
};

let deleteTarget = '';
let editMode = false;
let editEntity = '';

function openAddModal() {
  const page = currentPage;
  const key = page === 'dashboard' ? 'student' : (page === 'marks' ? 'marks' : page.replace(/s$/, ''));
  const label = { student:'Student', faculty:'Faculty', course:'Course', department:'Department', marks:'Marks Record' }[key] || key;
  document.getElementById('modal-title').textContent = 'Add ' + label;
  document.getElementById('modal-body').innerHTML = (forms[key] || forms.student)(false);
  editMode = false; editEntity = key;
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditModal(type, name) {
  const label = { student:'Student', faculty:'Faculty', course:'Course', department:'Department', marks:'Marks Record' }[type] || type;
  document.getElementById('modal-title').textContent = 'Edit ' + label + ' — ' + name;
  document.getElementById('modal-body').innerHTML = (forms[type] || forms.student)(true);
  editMode = true; editEntity = type;
  document.getElementById('modal-overlay').classList.add('open');
}

function openDeleteModal(name) {
  deleteTarget = name;
  document.getElementById('delete-msg').innerHTML = `Are you sure you want to delete <b>${name}</b>? This action cannot be undone.`;
  document.getElementById('delete-overlay').classList.add('open');
}

function closeModal(e) {
  if(e.target.classList.contains('overlay')) closeAllModals();
}
function closeAllModals() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
}

function handleSave() {
  closeAllModals();
  showToast(editMode ? '✓ Record updated successfully!' : '✓ Record added successfully!');
}
function handleDelete() {
  closeAllModals();
  showToast('🗑 ' + deleteTarget + ' deleted.');
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Chart ────────────────────────────────────────────────────
const ctx = document.getElementById('enrollChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['CSE','ECE','ME','Civil','IT','BT'],
    datasets: [
      { label: 'Active', data: [340,190,160,150,140,100], backgroundColor: '#2563eb', borderRadius: 6, borderSkipped: false },
      { label: 'Inactive', data: [40,28,35,25,20,20], backgroundColor: '#cbd5e1', borderRadius: 6, borderSkipped: false }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { font: { family: 'DM Sans', size: 12 }, color: '#64748b' } },
      y: { stacked: true, border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'DM Sans', size: 12 }, color: '#94a3b8' } }
    }
  }
});