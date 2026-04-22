// ── Navigation ──────────────────────────────────────────────
let currentPage = localStorage.getItem('currentPage') || 'dashboard';
const pageTitles = { dashboard:'Dashboard', students:'Students', faculty:'Faculty', courses:'Courses', marks:'Marks / Grades', departments:'Departments', settings:'Settings' };

window.onload = () => {
    // Restore page
    const activeNav = document.querySelector('.nav-item[onclick*="'+currentPage+'"]');
    if (activeNav) {
        navigate(currentPage, activeNav);
    } else {
        navigate('dashboard', document.querySelector('.nav-item'));
    }
};

function navigate(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if(el) el.classList.add('active');
  
  currentPage = page;
  localStorage.setItem('currentPage', page);
  
  const titleEl = document.getElementById('page-title');
  if(titleEl) titleEl.textContent = pageTitles[page];
}

// ── Filter ───────────────────────────────────────────────────

function filterTable(tbodyId, q, colIndex = 'all') {
  const rows = document.getElementById(tbodyId).querySelectorAll('tr');
  q = q.toLowerCase();
  
  rows.forEach(r => {
    // If table is empty msg, ignore it
    if(r.children.length === 1) return;

    if (colIndex === 'all') {
      // Create a string of all text EXCEPT the actions button column (last child)
      let text = '';
      for (let i = 0; i < r.children.length - 1; i++) text += r.children[i].textContent.toLowerCase() + ' ';
      r.style.display = text.includes(q) ? '' : 'none';
    } else {
      // Check only specific column text content
      const cellText = r.children[parseInt(colIndex)]?.textContent.toLowerCase() || '';
      r.style.display = cellText.includes(q) ? '' : 'none';
    }
  });
}
function filterMarksBySemester(sem) {
  const rows = document.getElementById('marks-tbody').querySelectorAll('tr');
  rows.forEach(r => {
    if(r.children.length === 1) return;
    
    if (sem === 'all') {
      r.style.display = '';
    } else {
      // the semester is in the hidden td with class "mark-sem" which is index 7
      const cellText = r.children[7]?.textContent.trim() || '';
      r.style.display = cellText === sem ? '' : 'none';
    }
  });
}

// ── Settings Module ──
window.addEventListener('DOMContentLoaded', () => {
    // Load stored preferences
    const year = localStorage.getItem('pref_year');
    const sem = localStorage.getItem('pref_sem');
    const tz = localStorage.getItem('pref_tz');
    
    if(year) document.getElementById('pref_year').value = year;
    if(sem) document.getElementById('pref_sem').value = sem;
    if(tz) document.getElementById('pref_tz').value = tz;
});

function handleSavePreferences() {
    localStorage.setItem('pref_year', document.getElementById('pref_year').value);
    localStorage.setItem('pref_sem', document.getElementById('pref_sem').value);
    localStorage.setItem('pref_tz', document.getElementById('pref_tz').value);
    showToast('✅ Preferences saved persistently!');
}

async function handleSavePassword() {
    const cp = document.getElementById('set_pw_current').value;
    const np = document.getElementById('set_pw_new').value;
    const cnp = document.getElementById('set_pw_confirm').value;

    if (np !== cnp) {
        showToast('❌ New Password and Confirm Password do not match!');
        return;
    }
    
    if (np.length < 6) {
        showToast('❌ New Password must be at least 6 characters long!');
        return;
    }

    try {
        const res = await fetch('/api/settings/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: cp, newPassword: np })
        });
        const result = await res.json();
        
        if (handleApiError(res, result)) return;

        showToast('✅ Password changed successfully!');
        document.getElementById('password-form').reset();
    } catch (err) {
        console.error(err);
        showToast('❌ Failed to update password');
    }
}


// ── CLOSE MODALS ─────────────────────────────────────────────
function closeModal(e) {
  if(e.target.classList.contains('overlay')) closeAllModals();
}
function closeAllModals() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

const handleApiError = (res, result) => {
    if (!res.ok) {
        showToast("❌ " + (result.error || "Unknown Error"));
        return true; 
    }
    return false;
};

// ──────────────────────────────────────────────────────────────
// STUDENT FUNCTIONS
// ──────────────────────────────────────────────────────────────

function openAddModal() {
  document.getElementById('student-form').reset();
  document.getElementById('student_id_field').value = '';
  document.getElementById('student-modal-title').textContent = 'Add Student';
  document.getElementById('student-modal').classList.add('open');
}

function openEditModal(student) {
  document.getElementById('student-form').reset();
  document.getElementById('student-modal-title').textContent = 'Edit Student';
  
  document.getElementById('student_id_field').value = student.student_id;
  document.getElementById('stu_first_name').value = student.first_name;
  document.getElementById('stu_last_name').value = student.last_name || '';
  document.getElementById('stu_email').value = student.email || '';
  // Format Date to YYYY-MM-DD
  const dob = student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '';
  document.getElementById('stu_dob').value = dob;
  document.getElementById('stu_phone').value = student.phone_number || '';
  document.getElementById('stu_dept').value = student.dept_id;
  document.getElementById('stu_semester').value = student.current_semester;
  
  document.getElementById('student-modal').classList.add('open');
}

async function handleSaveStudent() {
  const id = document.getElementById('student_id_field').value;
  const first_name = document.getElementById('stu_first_name').value;
  const last_name = document.getElementById('stu_last_name').value;
  const email = document.getElementById('stu_email').value;
  const phone = document.getElementById('stu_phone').value;
  const dob = document.getElementById('stu_dob').value;
  const dept_id = parseInt(document.getElementById('stu_dept').value);
  const current_semester = parseInt(document.getElementById('stu_semester').value);

  const data = { first_name, last_name, email, phone, dob, dept_id, current_semester };

  try {
    const res = await fetch(id ? `/api/students/${id}` : '/api/students', {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (handleApiError(res, result)) return;

    showToast("✅ Saved successfully");
    closeAllModals();
    setTimeout(()=>window.location.reload(), 500);
  } catch (err) { console.error(err); showToast("❌ Error saving"); }
}

function openDeleteModal(studentId) {
  window.deletingId = studentId;
  window.deletingType = 'students';
  document.getElementById('delete-msg').innerHTML = "Are you sure you want to delete this student?";
  document.getElementById('delete-overlay').classList.add('open');
}

// ──────────────────────────────────────────────────────────────
// FACULTY FUNCTIONS
// ──────────────────────────────────────────────────────────────

function openAddFacultyModal() {
  document.getElementById('faculty-form').reset();
  document.getElementById('faculty_id_field').value = '';
  document.getElementById('faculty-modal-title').textContent = 'Add Faculty';
  document.getElementById('faculty-modal').classList.add('open');
}

function openEditFacultyModal(fac) {
  document.getElementById('faculty-form').reset();
  document.getElementById('faculty-modal-title').textContent = 'Edit Faculty';
  
  document.getElementById('faculty_id_field').value = fac.faculty_id;
  document.getElementById('fac_name').value = fac.name;
  document.getElementById('fac_email').value = fac.email || '';
  document.getElementById('fac_phone').value = fac.phone || '';
  document.getElementById('fac_designation').value = fac.designation;
  document.getElementById('fac_dept').value = fac.dept_id;
  
  document.getElementById('faculty-modal').classList.add('open');
}

async function handleSaveFaculty() {
  const id = document.getElementById('faculty_id_field').value;
  const data = {
    name: document.getElementById('fac_name').value,
    email: document.getElementById('fac_email').value,
    phone: document.getElementById('fac_phone').value,
    designation: document.getElementById('fac_designation').value,
    dept_id: parseInt(document.getElementById('fac_dept').value)
  };

  try {
    const res = await fetch(id ? `/api/faculty/${id}` : '/api/faculty', {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (handleApiError(res, result)) return;

    showToast("✅ Saved successfully");
    closeAllModals();
    setTimeout(()=>window.location.reload(), 500);
  } catch (err) { showToast("❌ Error saving"); }
}

function openDeleteFacultyModal(id) {
  window.deletingId = id;
  window.deletingType = 'faculty';
  document.getElementById('delete-msg').innerHTML = "Are you sure you want to delete this faculty member?";
  document.getElementById('delete-overlay').classList.add('open');
}

// ──────────────────────────────────────────────────────────────
// COURSE FUNCTIONS
// ──────────────────────────────────────────────────────────────

function filterFacultyDropdown(selectedFacId = '') {
   const deptId = document.getElementById('crs_dept').value;
   const facSelect = document.getElementById('crs_faculty');
   
   if(!deptId) {
       Array.from(facSelect.options).forEach(opt => {
           if(opt.value !== "") opt.style.display = 'none';
       });
       facSelect.value = '';
       return;
   }
   
   let hasAny = false;
   Array.from(facSelect.options).forEach(opt => {
       if(opt.value === "") return;
       if(opt.getAttribute('data-dept') === deptId) {
           opt.style.display = '';
           hasAny = true;
       } else {
           opt.style.display = 'none';
       }
   });
   
   facSelect.value = selectedFacId;
}

function openAddCourseModal() {
  document.getElementById('course-form').reset();
  document.getElementById('course_is_edit').value = 'false';
  document.getElementById('crs_code').disabled = false;
  document.getElementById('course-modal-title').textContent = 'Add Course';
  filterFacultyDropdown('');
  document.getElementById('course-modal').classList.add('open');
}

function openEditCourseModal(course) {
  document.getElementById('course-form').reset();
  document.getElementById('course-modal-title').textContent = 'Edit Course';
  
  document.getElementById('course_is_edit').value = course.course_code;
  document.getElementById('crs_code').value = course.course_code;
  document.getElementById('crs_code').disabled = true; // Can't edit PK
  document.getElementById('crs_name').value = course.course_name;
  document.getElementById('crs_credits').value = course.credits;
  document.getElementById('crs_dept').value = course.dept_id;
  
  filterFacultyDropdown(course.faculty_id || '');
  
  document.getElementById('course-modal').classList.add('open');
}

async function handleSaveCourse() {
  const isEditCode = document.getElementById('course_is_edit').value;
  const isEdit = isEditCode !== 'false';
  
  const course_code = document.getElementById('crs_code').value;
  const course_name = document.getElementById('crs_name').value;
  const credits = parseInt(document.getElementById('crs_credits').value);
  const dept_id = parseInt(document.getElementById('crs_dept').value);
  const faculty_id = document.getElementById('crs_faculty').value ? parseInt(document.getElementById('crs_faculty').value) : null;

  const data = { course_code, course_name, credits, dept_id, faculty_id };

  try {
    const res = await fetch(isEdit ? `/api/courses/${isEditCode}` : '/api/courses', {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (handleApiError(res, result)) return;

    showToast("✅ Saved successfully");
    closeAllModals();
    setTimeout(()=>window.location.reload(), 500);
  } catch (err) { showToast("❌ Error saving"); }
}

function openDeleteCourseModal(code) {
  window.deletingId = code;
  window.deletingType = 'courses';
  document.getElementById('delete-msg').innerHTML = `Are you sure you want to delete course ${code}?`;
  document.getElementById('delete-overlay').classList.add('open');
}

// ──────────────────────────────────────────────────────────────
// MARKS FUNCTIONS
// ──────────────────────────────────────────────────────────────

function openAddMarksModal() {
  document.getElementById('marks-form').reset();
  document.getElementById('mrk_id_field').value = '';
  document.getElementById('marks-modal-title').textContent = 'Add Marks';
  
  document.getElementById('mrk_student_id').disabled = false;
  document.getElementById('mrk_course_code').disabled = false;
  
  document.getElementById('marks-modal').classList.add('open');
}

function openEditMarksModal(mark) {
  document.getElementById('marks-form').reset();
  document.getElementById('marks-modal-title').textContent = 'Edit Marks';
  
  document.getElementById('mrk_id_field').value = mark.enrollment_id;
  document.getElementById('mrk_student_id').value = mark.student_id;
  document.getElementById('mrk_student_id').disabled = true;
  document.getElementById('mrk_course_code').value = mark.course_code;
  document.getElementById('mrk_course_code').disabled = true;
  
  document.getElementById('mrk_internal').value = mark.internal_marks;
  document.getElementById('mrk_external').value = mark.external_marks;
  document.getElementById('mrk_grade').value = mark.grade;
  
  document.getElementById('marks-modal').classList.add('open');
}

async function handleSaveMarks() {
  const id = document.getElementById('mrk_id_field').value;
  const data = {
    student_id: document.getElementById('mrk_student_id').value,
    course_code: document.getElementById('mrk_course_code').value,
    internal_marks: parseFloat(document.getElementById('mrk_internal').value),
    external_marks: parseFloat(document.getElementById('mrk_external').value)
  };

  try {
    const res = await fetch(id ? `/api/marks/${id}` : '/api/marks', {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (handleApiError(res, result)) return;

    showToast("✅ Marks Saved successfully");
    closeAllModals();
    setTimeout(()=>window.location.reload(), 500);
  } catch (err) { showToast("❌ Error saving"); }
}

function openDeleteMarksModal(id) {
  window.deletingId = id;
  window.deletingType = 'marks';
  document.getElementById('delete-msg').innerHTML = "Are you sure you want to delete this mark record?";
  document.getElementById('delete-overlay').classList.add('open');
}

// ──────────────────────────────────────────────────────────────
// DEPARTMENT FUNCTIONS
// ──────────────────────────────────────────────────────────────

function openAddDeptModal() {
  document.getElementById('dept-form').reset();
  document.getElementById('dpt_id_field').value = '';
  document.getElementById('dept-modal-title').textContent = 'Add Department';
  document.getElementById('dept-modal').classList.add('open');
}

function openEditDeptModal(dept) {
  document.getElementById('dept-form').reset();
  document.getElementById('dept-modal-title').textContent = 'Edit Department';
  
  document.getElementById('dpt_id_field').value = dept.dept_id;
  document.getElementById('dpt_name').value = dept.dept_name;
  document.getElementById('dpt_loc').value = dept.building_location || '';
  
  document.getElementById('dept-modal').classList.add('open');
}

async function handleSaveDept() {
  const id = document.getElementById('dpt_id_field').value;
  const data = {
    dept_name: document.getElementById('dpt_name').value,
    building_location: document.getElementById('dpt_loc').value
  };

  try {
    const res = await fetch(id ? `/api/departments/${id}` : '/api/departments', {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (handleApiError(res, result)) return;

    showToast("✅ Department Saved successfully");
    closeAllModals();
    setTimeout(()=>window.location.reload(), 500);
  } catch (err) { showToast("❌ Error saving"); }
}

function openDeleteDeptModal(id) {
  window.deletingId = id;
  window.deletingType = 'departments';
  document.getElementById('delete-msg').innerHTML = "Are you sure you want to delete this department?";
  document.getElementById('delete-overlay').classList.add('open');
}

// ── GENERIC DELETE FUNC ──────────────────────────────────────
async function handleDelete() {
  const type = window.deletingType;
  const id = window.deletingId;
  if(!type || !id) return;
  
  try {
    const response = await fetch(`/api/${type}/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (handleApiError(response, result)) return;

    showToast("✅ Deleted successfully");
    closeAllModals();
    setTimeout(()=>window.location.reload(), 500);
  } catch (err) {
    showToast("❌ Error deleting");
  }
}


// Profile Settings
async function handleSaveProfile() {
    const un = document.getElementById('set_username').value;
    try {
        const res = await fetch('/api/settings/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: un })
        });
        const result = await res.json();
        if (handleApiError(res, result)) return;
        showToast('✅ Profile updated properly!');
    } catch (err) {
        showToast('❌ Profile update failed');
    }
}

function updateCalculatedGrade() {
    const intM = parseFloat(document.getElementById('mrk_internal').value) || 0;
    const extM = parseFloat(document.getElementById('mrk_external').value) || 0;
    const total = intM + extM;
    let rank = 'F';
    if(total>=90) rank='A+';
    else if(total>=80) rank='A';
    else if(total>=70) rank='B+';
    else if(total>=60) rank='B';
    else if(total>=50) rank='C';
    else if(total>=40) rank='D';
    
    document.getElementById('mrk_grade').value = rank;
}
