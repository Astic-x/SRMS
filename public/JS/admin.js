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
}

// ── Filter ───────────────────────────────────────────────────
function filterTable(tbodyId, q) {
  const rows = document.getElementById(tbodyId).querySelectorAll('tr');
  q = q.toLowerCase();
  rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none');
}

// ── Modal State ──────────────────────────────────────────────
let editMode = false;
window.editingStudentId = null;
window.deletingStudentId = null;

// ── OPEN EDIT MODAL (FIXED 🔥) ───────────────────────────────
function openEditModal(studentId) {

  window.editingStudentId = studentId;

  const rows = document.querySelectorAll('#students-tbody tr');
  let selectedRow;

  rows.forEach(row => {
    const id = row.children[0].textContent;
    if (id == studentId) {
      selectedRow = row;
    }
  });

  if (!selectedRow) return;

  const fullName = selectedRow.children[1].textContent.trim();
  const nameParts = fullName.split(" ");
  const dept = selectedRow.children[2].textContent.trim();
  const semester = selectedRow.children[3].textContent.trim();

  document.getElementById('modal-title').textContent = 'Edit Student';

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>First Name</label>
      <input type="text" id="first_name" value="${nameParts[0]}">
    </div>

    <div class="form-group">
      <label>Last Name</label>
      <input type="text" id="last_name" value="${nameParts[1] || ''}">
    </div>

    <div class="form-group">
      <label>Email</label>
      <input type="email" id="email" value="">
    </div>

    <div class="form-group">
      <label>Phone Number</label>
      <input type="tel" id="phone" value="">
    </div>

    <div class="form-group">
      <label>Date of Birth</label>
      <input type="date" id="dob" value="">
    </div>

    <div class="form-group">
      <label>Department</label>
      <input type="text" id="dept" value="${dept}">
    </div>

    <div class="form-group">
      <label>Semester</label>
      <input type="number" id="semester" value="${semester}">
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

// ── OPEN ADD MODAL ──────────────────────────────────────────
function openAddModal() {
  // Clear editing state for new record
  window.editingStudentId = null;

  document.getElementById('modal-title').textContent = 'Add Student';

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>First Name</label>
      <input type="text" id="first_name" value="">
    </div>

    <div class="form-group">
      <label>Last Name</label>
      <input type="text" id="last_name" value="">
    </div>

    <div class="form-group">
      <label>Email</label>
      <input type="email" id="email" value="">
    </div>

    <div class="form-group">
      <label>Phone Number</label>
      <input type="tel" id="phone" value="">
    </div>

    <div class="form-group">
      <label>Date of Birth</label>
      <input type="date" id="dob" value="">
    </div>

    <div class="form-group">
      <label>Department</label>
      <input type="text" id="dept" value="">
    </div>

    <div class="form-group">
      <label>Semester</label>
      <input type="number" id="semester" value="">
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

// ── DELETE MODAL (FIXED) ─────────────────────────────────────
function openDeleteModal(studentId) {
  window.deletingStudentId = studentId;

  document.getElementById('delete-msg').innerHTML =
    "Are you sure you want to delete this student?";

  document.getElementById('delete-overlay').classList.add('open');
}

// ── CLOSE MODALS ─────────────────────────────────────────────
function closeModal(e) {
  if(e.target.classList.contains('overlay')) closeAllModals();
}
function closeAllModals() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
}

// ── SAVE (UPDATE + CREATE) ───────────────────────────────────
async function handleSave() {
  // Check if this is a marks, course, faculty, department, or student modal
  const isMarksForm = document.getElementById('internal_marks') !== null;
  const isCourseForm = document.getElementById('course_code') !== null && !isMarksForm;
  const isFacultyForm = document.getElementById('faculty_name') !== null;
  const isDeptForm = document.getElementById('dept_name') !== null && !isCourseForm && !isFacultyForm;
  
  if (isMarksForm) {
    return handleSaveMarks();
  }

  if (isCourseForm) {
    return handleSaveCourse();
  }

  if (isFacultyForm) {
    return handleSaveFaculty();
  }

  if (isDeptForm) {
    return handleSaveDept();
  }
  
  if (isFacultyForm) {
    return handleSaveFaculty();
  }

  const first_name = document.getElementById('first_name').value;
  const last_name = document.getElementById('last_name').value;
  const semester = document.getElementById('semester').value;
  const dept = document.getElementById('dept').value;
  
  // Get email, phone, and dob from form if they exist (for add), otherwise use defaults (for edit)
  const email = document.getElementById('email')?.value || "test@test.com";
  const phone = document.getElementById('phone')?.value || "9999999999";
  const dob = document.getElementById('dob')?.value || "2005-01-01";

  // Validate required fields
  if (!first_name || !last_name || !dept || !semester) {
    showToast("❌ Please fill in all required fields");
    return;
  }

  let dept_id = 1;
  if (dept === 'IT') dept_id = 2;
  if (dept === 'ECE') dept_id = 3;
  if (dept === 'ME') dept_id = 4;
  if (dept === 'Civil') dept_id = 5;
  if (dept === 'BT') dept_id = 6;

  const data = {
    first_name,
    last_name,
    email,
    dob,
    phone,
    current_semester: semester,
    dept_id
  };

  try {
    let response;

    if (window.editingStudentId) {
      // UPDATE
      response = await fetch(`/api/students/${window.editingStudentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      // CREATE
      response = await fetch(`/api/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }

    const result = await response.json();

    if (!response.ok) {
      showToast("❌ " + result.error);
      return;
    }

    showToast("✅ Saved successfully");
    closeAllModals();
    loadStudents();

  } catch (err) {
    console.error(err);
    showToast("❌ Error saving");
  }
}

// ── DELETE ───────────────────────────────────────────────────
async function handleDelete() {
  // Check if this is a marks, course, faculty, department, or student delete
  const isMarksDelete = window.deletingMarkId !== null && window.deletingMarkId !== undefined;
  const isCourseDelete = window.deletingCourseCode !== null && window.deletingCourseCode !== undefined;
  const isFacultyDelete = window.deletingFacultyId !== null && window.deletingFacultyId !== undefined;
  const isDeptDelete = window.deletingDeptId !== null && window.deletingDeptId !== undefined;
  
  if (isMarksDelete) {
    return handleDeleteMarks();
  }

  if (isCourseDelete) {
    return handleDeleteCourse();
  }
  
  if (isFacultyDelete) {
    return handleDeleteFaculty();
  }

  if (isDeptDelete) {
    return handleDeleteDept();
  }

  try {
    const response = await fetch(`/api/students/${window.deletingStudentId}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      showToast("❌ " + result.error);
      return;
    }

    showToast("✅ Deleted successfully");
    closeAllModals();
    loadStudents();

  } catch (err) {
    console.error(err);
    showToast("❌ Error deleting");
  }
}

// ── LOAD STUDENTS (FIXED UI 🔥) ──────────────────────────────
async function loadStudents() {
  const res = await fetch('/api/students');
  const data = await res.json();

  const tbody = document.getElementById('students-tbody');
  tbody.innerHTML = '';

  data.forEach(student => {
    const row = `
<tr>
  <td>${student.student_id}</td>
  <td><b>${student.name}</b></td>
  <td>${student.dept_name}</td>
  <td>${student.current_semester}</td>
  <td>${student.attendance_percent ?? 0}%</td>
  <td><span class="tag active">Active</span></td>
  <td>
    <div class="action-btns">
      <button class="btn-edit" onclick="openEditModal(${student.student_id})">Edit</button>
      <button class="btn-del" onclick="openDeleteModal(${student.student_id})">Delete</button>
    </div>
  </td>
</tr>
`;
    tbody.innerHTML += row;
  });
}

// ──────────────────────────────────────────────────────────────
// FACULTY FUNCTIONS
// ──────────────────────────────────────────────────────────────

// ── OPEN ADD FACULTY MODAL ───────────────────────────────────
function openAddFacultyModal() {
  window.editingFacultyId = null;

  document.getElementById('modal-title').textContent = 'Add Faculty';

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="faculty_name" value="">
    </div>

    <div class="form-group">
      <label>Email</label>
      <input type="email" id="faculty_email" value="">
    </div>

    <div class="form-group">
      <label>Phone Number</label>
      <input type="tel" id="faculty_phone" value="">
    </div>

    <div class="form-group">
      <label>Designation</label>
      <input type="text" id="faculty_designation" value="">
    </div>

    <div class="form-group">
      <label>Department</label>
      <input type="text" id="faculty_dept" value="">
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

// ── OPEN EDIT FACULTY MODAL ──────────────────────────────────
function openEditFacultyModal(facultyId) {
  window.editingFacultyId = facultyId;

  const rows = document.querySelectorAll('#faculty-tbody tr');
  let selectedRow;

  rows.forEach(row => {
    const id = row.children[0].textContent.trim();
    if (id == facultyId) {
      selectedRow = row;
    }
  });

  if (!selectedRow) return;

  const name = selectedRow.children[1].textContent.trim();
  const dept = selectedRow.children[2].textContent.trim();
  const designation = selectedRow.children[3].textContent.trim();

  document.getElementById('modal-title').textContent = 'Edit Faculty';

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="faculty_name" value="${name}">
    </div>

    <div class="form-group">
      <label>Email</label>
      <input type="email" id="faculty_email" value="">
    </div>

    <div class="form-group">
      <label>Phone Number</label>
      <input type="tel" id="faculty_phone" value="">
    </div>

    <div class="form-group">
      <label>Designation</label>
      <input type="text" id="faculty_designation" value="${designation}">
    </div>

    <div class="form-group">
      <label>Department</label>
      <input type="text" id="faculty_dept" value="${dept}">
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

// ── OPEN DELETE FACULTY MODAL ────────────────────────────────
function openDeleteFacultyModal(facultyId) {
  window.deletingFacultyId = facultyId;

  document.getElementById('delete-msg').innerHTML =
    "Are you sure you want to delete this faculty member?";

  document.getElementById('delete-overlay').classList.add('open');
}

// ── SAVE FACULTY (UPDATE + CREATE) ───────────────────────────
async function handleSaveFaculty() {
  const name = document.getElementById('faculty_name').value;
  const email = document.getElementById('faculty_email').value;
  const phone = document.getElementById('faculty_phone').value;
  const designation = document.getElementById('faculty_designation').value;
  const dept = document.getElementById('faculty_dept').value;

  // Validate required fields
  if (!name || !email || !designation || !dept) {
    showToast("❌ Please fill in all required fields");
    return;
  }

  let dept_id = 1;
  if (dept === 'IT') dept_id = 2;
  if (dept === 'ECE') dept_id = 3;
  if (dept === 'ME') dept_id = 4;
  if (dept === 'Civil') dept_id = 5;
  if (dept === 'BT') dept_id = 6;

  const data = {
    name,
    email,
    phone,
    designation,
    dept_id
  };

  try {
    let response;

    if (window.editingFacultyId) {
      // UPDATE
      response = await fetch(`/api/faculty/${window.editingFacultyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      // CREATE
      response = await fetch(`/api/faculty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }

    const result = await response.json();

    if (!response.ok) {
      showToast("❌ " + result.error);
      return;
    }

    showToast("✅ Saved successfully");
    closeAllModals();
    loadFaculty();

  } catch (err) {
    console.error(err);
    showToast("❌ Error saving");
  }
}

// ── DELETE FACULTY ──────────────────────────────────────────
async function handleDeleteFaculty() {
  try {
    const response = await fetch(`/api/faculty/${window.deletingFacultyId}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      showToast("❌ " + result.error);
      return;
    }

    showToast("✅ Deleted successfully");
    closeAllModals();
    loadFaculty();

  } catch (err) {
    console.error(err);
    showToast("❌ Error deleting");
  }
}

// ── LOAD FACULTY (FIXED UI 🔥) ──────────────────────────────
async function loadFaculty() {
  const res = await fetch('/api/faculty');
  const data = await res.json();

  allFacultyData = data; // Store for course faculty filtering

  const tbody = document.getElementById('faculty-tbody');
  if (!tbody) return; // Exit if faculty table doesn't exist

  tbody.innerHTML = '';

  data.forEach(faculty => {
    const row = `
<tr>
  <td>${faculty.faculty_id}</td>
  <td><b>${faculty.name}</b></td>
  <td>${faculty.dept_name}</td>
  <td>${faculty.designation}</td>
  <td><span class="tag active">Active</span></td>
  <td>
    <div class="action-btns">
      <button class="btn-edit" onclick="openEditFacultyModal(${faculty.faculty_id})">Edit</button>
      <button class="btn-del" onclick="openDeleteFacultyModal(${faculty.faculty_id})">Delete</button>
    </div>
  </td>
</tr>
`;
    tbody.innerHTML += row;
  });
}

// ──────────────────────────────────────────────────────────────
// COURSE FUNCTIONS
// ──────────────────────────────────────────────────────────────

let allFacultyData = []; // Store all faculty for filtering
let currentEditingFacultyId = ''; // Store faculty ID when editing

// ── OPEN ADD COURSE MODAL ────────────────────────────────────
function openAddCourseModal() {
  window.editingCourseCode = null;
  currentEditingFacultyId = '';

  document.getElementById('modal-title').textContent = 'Add Course';

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>Course Code</label>
      <input type="text" id="course_code" value="">
    </div>

    <div class="form-group">
      <label>Course Name</label>
      <input type="text" id="course_name" value="">
    </div>

    <div class="form-group">
      <label>Credits</label>
      <input type="number" id="course_credits" value="">
    </div>

    <div class="form-group">
      <label>Department</label>
      <select id="course_dept" onchange="updateFacultyDropdown(currentEditingFacultyId)">
        <option value="CSE">CSE</option>
        <option value="IT">IT</option>
        <option value="ECE">ECE</option>
        <option value="ME">ME</option>
        <option value="Civil">Civil</option>
        <option value="BT">BT</option>
      </select>
    </div>

    <div class="form-group">
      <label>Faculty (Optional - Same Department Only)</label>
      <select id="course_faculty_id">
        <option value="">-- Select Faculty --</option>
      </select>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
  
  // Ensure faculty data is fresh when opening add modal
  if (!allFacultyData || allFacultyData.length === 0) {
    loadFaculty().then(() => updateFacultyDropdown(''));
  } else {
    updateFacultyDropdown('');
  }
}

// ── UPDATE FACULTY DROPDOWN WITH DEPARTMENT FILTER ──────────
function updateFacultyDropdown(selectedFacultyId = '') {
  const deptSelect = document.getElementById('course_dept');
  const facultySelect = document.getElementById('course_faculty_id');
  
  if (!deptSelect || !facultySelect) return;
  
  const selectedDept = deptSelect.value;

  // Map department names to dept_id
  const deptMap = { 'CSE': 1, 'IT': 2, 'ECE': 3, 'ME': 4, 'Civil': 5, 'BT': 6 };
  const deptId = deptMap[selectedDept];

  // Ensure faculty data is loaded
  if (!allFacultyData || allFacultyData.length === 0) {
    console.warn('Faculty data not loaded yet. Fetching...');
    facultySelect.innerHTML = '<option value="">Loading faculty...</option>';
    return;
  }

  // Filter faculty by department
  const filteredFaculty = allFacultyData.filter(f => f.dept_id === deptId);

  // Build options
  facultySelect.innerHTML = '<option value="">-- Select Faculty --</option>';
  
  if (filteredFaculty.length === 0) {
    facultySelect.innerHTML += '<option disabled>No faculty in this department</option>';
  } else {
    filteredFaculty.forEach(faculty => {
      const selected = (selectedFacultyId && faculty.faculty_id === parseInt(selectedFacultyId)) ? 'selected' : '';
      facultySelect.innerHTML += `<option value="${faculty.faculty_id}" ${selected}>${faculty.name}</option>`;
    });
  }
}

// ── OPEN EDIT COURSE MODAL ───────────────────────────────────
async function openEditCourseModal(courseCode) {
  window.editingCourseCode = courseCode;

  try {
    // Fetch actual course data from API
    const res = await fetch('/api/courses');
    const courses = await res.json();
    const course = courses.find(c => c.course_code === courseCode);

    if (!course) {
      showToast('❌ Course not found');
      return;
    }

    const deptMap = { 1: 'CSE', 2: 'IT', 3: 'ECE', 4: 'ME', 5: 'Civil', 6: 'BT' };
    const deptName = deptMap[course.dept_id];

    document.getElementById('modal-title').textContent = 'Edit Course';

    document.getElementById('modal-body').innerHTML = `
      <div class="form-group">
        <label>Course Code</label>
        <input type="text" id="course_code" value="${courseCode}" disabled>
      </div>

      <div class="form-group">
        <label>Course Name</label>
        <input type="text" id="course_name" value="${course.course_name}">
      </div>

      <div class="form-group">
        <label>Credits</label>
        <input type="number" id="course_credits" value="${course.credits}">
      </div>

      <div class="form-group">
        <label>Department</label>
        <select id="course_dept" onchange="updateFacultyDropdown(currentEditingFacultyId)">
          <option value="CSE" ${deptName === 'CSE' ? 'selected' : ''}>CSE</option>
          <option value="IT" ${deptName === 'IT' ? 'selected' : ''}>IT</option>
          <option value="ECE" ${deptName === 'ECE' ? 'selected' : ''}>ECE</option>
          <option value="ME" ${deptName === 'ME' ? 'selected' : ''}>ME</option>
          <option value="Civil" ${deptName === 'Civil' ? 'selected' : ''}>Civil</option>
          <option value="BT" ${deptName === 'BT' ? 'selected' : ''}>BT</option>
        </select>
      </div>

      <div class="form-group">
        <label>Faculty (Optional - Same Department Only)</label>
        <select id="course_faculty_id">
          <option value="">-- Select Faculty --</option>
        </select>
      </div>
    `;

    document.getElementById('modal-overlay').classList.add('open');
    currentEditingFacultyId = course.faculty_id || '';
    
    // Ensure faculty data is fresh
    if (!allFacultyData || allFacultyData.length === 0) {
      await loadFaculty();
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      updateFacultyDropdown(course.faculty_id || '');
    }, 50);

  } catch (err) {
    console.error('Error:', err);
    showToast('❌ Error loading course');
  }
}

// ── OPEN DELETE COURSE MODAL ─────────────────────────────────
function openDeleteCourseModal(courseCode) {
  window.deletingCourseCode = courseCode;

  document.getElementById('delete-msg').innerHTML =
    `Are you sure you want to delete course <b>${courseCode}</b>?`;

  document.getElementById('delete-overlay').classList.add('open');
}

// ── SAVE COURSE (UPDATE + CREATE) ────────────────────────────
async function handleSaveCourse() {
  const code = document.getElementById('course_code')?.value;
  const name = document.getElementById('course_name').value;
  const credits = document.getElementById('course_credits').value;
  const dept = document.getElementById('course_dept').value;
  const facultyId = document.getElementById('course_faculty_id')?.value || null;

  // Validate required fields
  if (!code || !name || !credits || !dept) {
    showToast("❌ Please fill in all required fields");
    return;
  }

  let dept_id = 1;
  if (dept === 'IT') dept_id = 2;
  if (dept === 'ECE') dept_id = 3;
  if (dept === 'ME') dept_id = 4;
  if (dept === 'Civil') dept_id = 5;
  if (dept === 'BT') dept_id = 6;

  const data = {
    course_name: name,
    credits: parseInt(credits),
    dept_id,
    faculty_id: facultyId ? parseInt(facultyId) : null
  };

  try {
    let response;

    if (window.editingCourseCode) {
      // UPDATE
      response = await fetch(`/api/courses/${window.editingCourseCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      // CREATE
      data.course_code = code;
      response = await fetch(`/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }

    const result = await response.json();

    if (!response.ok) {
      showToast("❌ " + result.error);
      return;
    }

    showToast("✅ Saved successfully");
    closeAllModals();
    loadCourses();

  } catch (err) {
    console.error(err);
    showToast("❌ Error saving");
  }
}

// ── DELETE COURSE ────────────────────────────────────────────
async function handleDeleteCourse() {
  try {
    const response = await fetch(`/api/courses/${window.deletingCourseCode}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      showToast("❌ " + result.error);
      return;
    }

    showToast("✅ Deleted successfully");
    closeAllModals();
    loadCourses();

  } catch (err) {
    console.error(err);
    showToast("❌ Error deleting");
  }
}

// ── LOAD COURSES (FIXED UI 🔥) ───────────────────────────────
async function loadCourses() {
  try {
    const res = await fetch('/api/courses');
    const data = await res.json();

    const tbody = document.getElementById('courses-tbody');
    if (!tbody) return; // Exit if courses table doesn't exist

    tbody.innerHTML = '';

    data.forEach(course => {
      const row = `
<tr>
  <td><b>${course.course_code}</b></td>
  <td>${course.course_name}</td>
  <td>${course.dept_name}</td>
  <td>${course.credits}</td>
  <td>${course.faculty_name || 'Unassigned'}</td>
  <td><span class="tag active">Active</span></td>
  <td>
    <div class="action-btns">
      <button class="btn-edit" onclick="openEditCourseModal('${course.course_code}')">Edit</button>
      <button class="btn-del" onclick="openDeleteCourseModal('${course.course_code}')">Delete</button>
    </div>
  </td>
</tr>
`;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error('Error loading courses:', err);
  }
}

// ── MARKS MODAL FUNCTIONS ────────────────────────────────────

function openAddMarksModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  title.textContent = 'Add Marks';
  body.innerHTML = `
    <div class="form-group">
      <label>Student ID</label>
      <input type="number" id="student_id" placeholder="Enter Student ID" required>
    </div>

    <div class="form-group">
      <label>Course Code</label>
      <input type="text" id="course_code" placeholder="e.g., CS301" required>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Internal Marks (0-40)</label>
        <input type="number" id="internal_marks" step="0.01" min="0" max="40" placeholder="Out of 40" required>
      </div>

      <div class="form-group">
        <label>External Marks (0-60)</label>
        <input type="number" id="external_marks" step="0.01" min="0" max="60" placeholder="Out of 60" required>
      </div>
    </div>

    <div class="form-group">
      <label>Grade (Optional)</label>
      <input type="text" id="grade" placeholder="Auto-calculated if left blank">
    </div>
  `;
  
  document.getElementById('modal-overlay').classList.add('open');
  window.editingMarkId = null;
}

function openEditMarksModal(enrollmentId) {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  title.textContent = 'Edit Marks';
  body.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label>Internal Marks (0-40)</label>
        <input type="number" id="internal_marks" step="0.01" min="0" max="40" placeholder="Out of 40" required>
      </div>

      <div class="form-group">
        <label>External Marks (0-60)</label>
        <input type="number" id="external_marks" step="0.01" min="0" max="60" placeholder="Out of 60" required>
      </div>
    </div>

    <div class="form-group">
      <label>Grade (Optional)</label>
      <input type="text" id="grade" placeholder="Auto-calculated if left blank">
    </div>
  `;
  
  window.editingMarkId = enrollmentId;
  document.getElementById('modal-overlay').classList.add('open');
}

function openDeleteMarksModal(enrollmentId) {
  document.getElementById('delete-overlay').classList.add('open');
  window.deletingMarkId = enrollmentId;
}

async function handleSaveMarks() {
  const studentId = document.getElementById('student_id');
  const courseCode = document.getElementById('course_code');
  const internalMarks = parseFloat(document.getElementById('internal_marks').value);
  const externalMarks = parseFloat(document.getElementById('external_marks').value);
  const grade = document.getElementById('grade').value || null;

  if (!internalMarks || !externalMarks) {
    showToast('❌ Please fill in all required fields');
    return;
  }

  if (internalMarks > 40 || internalMarks < 0) {
    showToast('❌ Internal marks must be between 0-40');
    return;
  }

  if (externalMarks > 60 || externalMarks < 0) {
    showToast('❌ External marks must be between 0-60');
    return;
  }

  try {
    let url = '/api/marks';
    let method = 'POST';
    let payload = { internal_marks: internalMarks, external_marks: externalMarks, grade };

    if (window.editingMarkId) {
      url = `/api/marks/${window.editingMarkId}`;
      method = 'PUT';
    } else {
      if (!studentId.value || !courseCode.value) {
        showToast('❌ Student ID and Course Code required');
        return;
      }
      payload.student_id = parseInt(studentId.value);
      payload.course_code = courseCode.value;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      showToast('❌ ' + (err.error || 'Error saving marks'));
      return;
    }

    showToast(window.editingMarkId ? '✅ Marks updated' : '✅ Marks added');
    closeAllModals();
    loadMarks();
  } catch (err) {
    showToast('❌ Error: ' + err.message);
  }
}

async function handleDeleteMarks() {
  if (!window.deletingMarkId) return;

  try {
    const res = await fetch(`/api/marks/${window.deletingMarkId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    
    showToast('✅ Marks deleted');
    closeAllModals();
    loadMarks();
  } catch (err) {
    showToast('❌ Error: ' + err.message);
  }
}

async function loadMarks() {
  try {
    const res = await fetch('/api/marks');
    const data = await res.json();

    const tbody = document.getElementById('marks-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    data.forEach(mark => {
      const total = (parseFloat(mark.internal_marks) + parseFloat(mark.external_marks)).toFixed(0);
      const gradeClass = mark.grade === 'A+' || mark.grade === 'A' ? 'active' : 
                        mark.grade === 'B+' || mark.grade === 'B' ? 'blue' :
                        mark.grade === 'C' ? 'orange' : 'red';
      
      const row = `
<tr>
  <td>${mark.student_id}</td>
  <td><b>${mark.student_name}</b></td>
  <td>${mark.course_code}</td>
  <td>${mark.internal_marks}/${40}</td>
  <td>${mark.external_marks}/${60}</td>
  <td>${total}/${100}</td>
  <td><span class="tag ${gradeClass}">${mark.grade}</span></td>
  <td>
    <div class="action-btns">
      <button class="btn-edit" onclick="openEditMarksModal(${mark.enrollment_id})">Edit</button>
      <button class="btn-del" onclick="openDeleteMarksModal(${mark.enrollment_id})">Delete</button>
    </div>
  </td>
</tr>
`;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error('Error loading marks:', err);
  }
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ──────────────────────────────────────────────────────────────
// DEPARTMENT FUNCTIONS
// ──────────────────────────────────────────────────────────────

// Load all departments and display in table
async function loadDepartments() {
  try {
    const res = await fetch('/api/departments');
    const data = await res.json();

    const tbody = document.getElementById('dept-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    data.forEach(dept => {
      const row = `
<tr>
  <td>${dept.dept_id}</td>
  <td><b>${dept.dept_name}</b></td>
  <td>${dept.building_location || 'N/A'}</td>
  <td>${dept.student_count}</td>
  <td>${dept.course_count}</td>
  <td><span class="tag active">Active</span></td>
  <td>
    <div class="action-btns">
      <button class="btn-edit" onclick="openEditDeptModal(${dept.dept_id})">Edit</button>
      <button class="btn-del" onclick="openDeleteDeptModal(${dept.dept_id})">Delete</button>
    </div>
  </td>
</tr>
`;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error('Error loading departments:', err);
    showToast('❌ Error loading departments');
  }
}

// Open modal to add new department
function openAddDeptModal() {
  window.editingDeptId = null;
  
  document.getElementById('modal-title').textContent = 'Add Department';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>Department Name</label>
      <input type="text" id="dept_name" placeholder="e.g., Computer Science & Engineering" required>
    </div>

    <div class="form-group">
      <label>Building Location</label>
      <input type="text" id="dept_location" placeholder="e.g., Block A, 3rd Floor">
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

// Open modal to edit department
function openEditDeptModal(deptId) {
  window.editingDeptId = deptId;

  const rows = document.querySelectorAll('#dept-tbody tr');
  let selectedRow;

  rows.forEach(row => {
    const id = row.children[0].textContent.trim();
    if (id == deptId) {
      selectedRow = row;
    }
  });

  if (!selectedRow) return;

  const deptName = selectedRow.children[1].textContent.trim();
  const location = selectedRow.children[2].textContent.trim();

  document.getElementById('modal-title').textContent = 'Edit Department';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>Department Name</label>
      <input type="text" id="dept_name" value="${deptName}" required>
    </div>

    <div class="form-group">
      <label>Building Location</label>
      <input type="text" id="dept_location" value="${location === 'N/A' ? '' : location}">
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

// Open delete confirmation modal
function openDeleteDeptModal(deptId) {
  window.deletingDeptId = deptId;
  
  document.getElementById('delete-msg').innerHTML =
    "Are you sure you want to delete this department? This action cannot be undone.";

  document.getElementById('delete-overlay').classList.add('open');
}

// Save department (create or update)
async function handleSaveDept() {
  const deptName = document.getElementById('dept_name').value;
  const deptLocation = document.getElementById('dept_location').value;

  if (!deptName) {
    showToast("❌ Please enter department name");
    return;
  }

  const data = {
    dept_name: deptName,
    building_location: deptLocation || null
  };

  try {
    let response;

    if (window.editingDeptId) {
      // UPDATE
      response = await fetch(`/api/departments/${window.editingDeptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      // CREATE
      response = await fetch(`/api/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }

    const result = await response.json();

    if (!response.ok) {
      showToast("❌ " + result.error);
      return;
    }

    showToast(window.editingDeptId ? "✅ Department updated" : "✅ Department added");
    closeAllModals();
    loadDepartments();

  } catch (err) {
    console.error(err);
    showToast("❌ Error saving department");
  }
}

// Delete department
async function handleDeleteDept() {
  if (!window.deletingDeptId) return;

  try {
    const response = await fetch(`/api/departments/${window.deletingDeptId}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      showToast("❌ " + result.error);
      return;
    }

    showToast("✅ Department deleted");
    closeAllModals();
    loadDepartments();

  } catch (err) {
    console.error(err);
    showToast("❌ Error deleting department");
  }
}

// ── ENROLLMENT CHART ────────────────────────────────────────
function drawEnrollmentChart() {
  const canvas = document.getElementById('enrollChart');
  if (!canvas) return;

  // Enrollment data by department
  const chartData = {
    labels: ['CSE', 'ECE', 'ME', 'Civil', 'IT', 'BT'],
    datasets: [
      {
        label: 'Active',
        data: [350, 200, 180, 160, 145, 110],
        backgroundColor: '#2563eb',
        borderRadius: 6,
        barThickness: 16,
      },
      {
        label: 'Inactive',
        data: [30, 18, 15, 15, 15, 10],
        backgroundColor: '#cbd5e1',
        borderRadius: 6,
        barThickness: 16,
      }
    ]
  };

  new Chart(canvas, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          stacked: false,
          grid: { display: false },
          ticks: { font: { size: 12, weight: 500 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 12 } }
        }
      }
    }
  });
}

// ── INIT ─────────────────────────────────────────────────────
window.onload = function () {
  loadStudents();
  loadFaculty();
  loadCourses();
  loadMarks();
  loadDepartments();
  drawEnrollmentChart();
};