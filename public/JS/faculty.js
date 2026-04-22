// ── DATA INJECTION ──
const data = window.serverData || { profile: {}, courses: [], myStudents: [], attendanceStats: [], resources: [] };
const courses = data.courses || [];
const myStudentsRaw = data.myStudents || [];
const attendanceStats = data.attendanceStats || [];
const resources = data.resources || [];

// Group students by course
const studentsByCourse = {};
courses.forEach(c => studentsByCourse[c.course_code] = []);
myStudentsRaw.forEach(s => {
    if (!studentsByCourse[s.course_code]) studentsByCourse[s.course_code] = [];
    studentsByCourse[s.course_code].push(s);
});

const attState = {};
const marksState = {};

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
    populateCourseSelectors();
    renderCourseCards();

    // Set Dashboard Counts
    document.getElementById('dashCourseCount').textContent = courses.length;
    document.getElementById('dashStudentCount').textContent = myStudentsRaw.length;
    document.querySelector('.att-date').valueAsDate = new Date(); // Set today as default date

    if(courses.length > 0) {
        // Trigger the dynamic fetch instead of the static init
        handleAttChange(); 
        initMarksEntry();
        selectMarksCourse(courses[0].course_code, courses[0].course_name, document.querySelector('.marks-course-btn'));
    }

    renderMyStudents(myStudentsRaw);
    renderResources();
});

function populateCourseSelectors() {
    const attSelect = document.querySelector('#page-attendance select');
    const uploadCourseSelect = document.getElementById('resCourseSelect');

    let options = courses.map(c => `<option value="${c.course_code}">${c.course_code} - ${c.course_name}</option>`).join('');

    if (attSelect) attSelect.innerHTML = options;
    if (uploadCourseSelect) uploadCourseSelect.innerHTML = options;
}

// ── COURSE CARDS ──
function renderCourseCards() {
    const cgEl = document.getElementById('courseGrid');
    if (!cgEl) return;

    cgEl.innerHTML = courses.map(c => {
        const studentCount = (studentsByCourse[c.course_code] || []).length;
        return `
        <div class="course-card">
            <div class="course-top">
                <div>
                    <div class="course-code">${c.course_code}</div>
                    <div class="course-name">${c.course_name}</div>
                </div>
            </div>
            <div style="font-size:12px;color:var(--text-muted)">Credits: ${c.credits}</div>
            <div class="course-meta">
                <div class="course-meta-item"><div class="course-meta-val" style="color:var(--primary)">${studentCount}</div><div class="course-meta-lbl">Students</div></div>
            </div>
        </div>`;
    }).join('');
}

// ── ATTENDANCE ──

// 1. Fetch data from DB when Date or Course changes
async function handleAttChange() {
    const course = document.getElementById('attCourseSelect').value;
    const date = document.getElementById('attDate').value;
    if(!course || !date) return;

    try {
        const res = await fetch(`/api/faculty/attendance?course_code=${course}&date=${date}`);
        const existingData = await res.json();

        // Map existing data to state, or default to 'present'
        (studentsByCourse[course] || []).forEach(s => {
            const key = course + '_' + s.student_id;
            const dbRecord = existingData.find(r => r.student_id === s.student_id);
            
            if (dbRecord) {
                attState[key] = dbRecord.status.toLowerCase();
            } else {
                attState[key] = 'present'; 
            }
        });
        
        renderAttTable(); // Redraw table
    } catch (e) {
        console.error("Error fetching attendance", e);
        showToast("❌ Could not load attendance for selected date");
    }
}

// 2. Render table with Search and Percentages
function renderAttTable() {
    const course = document.getElementById('attCourseSelect').value;
    const query = (document.getElementById('attSearch')?.value || '').toLowerCase();
    const list = studentsByCourse[course] || [];
    const tbody = document.getElementById('attTbody');
    if(!tbody) return;

    // Apply Search Filter
    const filteredList = list.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.student_id.toString().includes(query)
    );

    tbody.innerHTML = filteredList.map(s => {
        const key = course + '_' + s.student_id;
        const cur = attState[key] || 'present';

        // Calculate Overall % for this specific course
        const stats = attendanceStats.find(a => a.student_id === s.student_id && a.course_code === course);
        let percent = 100;
        let fraction = "0/0";
        if (stats && parseFloat(stats.total_classes) > 0) {
            percent = Math.round((parseFloat(stats.present_classes) / parseFloat(stats.total_classes)) * 100);
            fraction = `${stats.present_classes}/${stats.total_classes}`;
        }

        return `
        <tr>
            <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">SRMS${s.student_id.toString().padStart(4,'0')}</td>
            <td><strong>${s.name}</strong></td>
            <td>
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:12px;font-weight:600;color:${percent>=75?'var(--green)':'var(--red)'}">${percent}%</span>
                    <span style="font-size:10px;color:var(--text-muted)">(${fraction})</span>
                </div>
            </td>
            <td>
                <div style="display:flex;gap:6px">
                    <button onclick="setAtt('${key}','present',this)" class="att-pill p ${cur==='present'?'':'opacity-low'}" style="cursor:pointer;border:none;opacity:${cur==='present'?1:0.4}">P</button>
                    <button onclick="setAtt('${key}','absent',this)"  class="att-pill a ${cur==='absent'?'':'opacity-low'}"  style="cursor:pointer;border:none;opacity:${cur==='absent'?1:0.4}">A</button>
                    <button onclick="setAtt('${key}','leave',this)"   class="att-pill l ${cur==='leave'?'':'opacity-low'}"   style="cursor:pointer;border:none;opacity:${cur==='leave'?1:0.4}">L</button>
                </div>
            </td>
        </tr>`;
    }).join('');
    
    updateAttCounts(course);
}

// 3. Handle individual button clicks
function setAtt(key, val, btn) {
    attState[key] = val;
    const row = btn.closest('tr');
    row.querySelectorAll('.att-pill').forEach(b => b.style.opacity = '0.4');
    btn.style.opacity = '1';
    const courseCode = document.getElementById('attCourseSelect').value;
    updateAttCounts(courseCode);
}

// 4. Update the summary numbers at the top
function updateAttCounts(course_code) {
    let p=0, a=0, l=0;
    const query = (document.getElementById('attSearch')?.value || '').toLowerCase();
    
    // We only count the currently visible/filtered students for the summary
    (studentsByCourse[course_code] || []).forEach(s => {
        if (s.name.toLowerCase().includes(query) || s.student_id.toString().includes(query)) {
            const val = attState[course_code + '_' + s.student_id] || 'present';
            if(val==='present') p++;
            if(val==='absent') a++;
            if(val==='leave') l++;
        }
    });
    
    document.getElementById('pCount').textContent = 'P: ' + p;
    document.getElementById('aCount').textContent = 'A: ' + a;
    document.getElementById('lCount').textContent = 'L: ' + l;
}

// 5. Handle "All Present" / "All Absent" toggles
function selectAllAtt(val, el) {
    document.querySelectorAll('.att-toggle-btn').forEach(b => b.classList.remove('sel'));
    el.classList.add('sel');
    const course = document.getElementById('attCourseSelect').value;
    
    // Apply toggle only to currently filtered students
    const query = (document.getElementById('attSearch')?.value || '').toLowerCase();
    (studentsByCourse[course] || []).forEach(s => { 
        if (s.name.toLowerCase().includes(query) || s.student_id.toString().includes(query)) {
            attState[course+'_'+s.student_id] = val; 
        }
    });
    renderAttTable();
}

// 6. Save to Database
async function saveAttendance() {
    const course = document.getElementById('attCourseSelect').value;
    const date = document.getElementById('attDate').value;
    if(!course || !date) return showToast('⚠️ Select course and date');
    
    const attendanceRecords = (studentsByCourse[course] || []).map(s => {
        let status = attState[course+'_'+s.student_id] || 'present';
        if (status === 'present') status = 'Present';
        if (status === 'absent') status = 'Absent';
        if (status === 'leave') status = 'Leave';
        return { student_id: s.student_id, status };
    });

    try {
        const res = await fetch('/api/faculty/attendance', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ course_code: course, date: date, attendance: attendanceRecords })
        });
        if(res.ok) {
            showToast('✅ Attendance saved successfully!');
            // Reload page after a second so the new percentages map to the UI
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast('❌ Error saving attendance.');
        }
    } catch(e) { showToast('❌ Network error.'); }
}
// ── MARKS ENTRY ──
function initMarksEntry() {
    const mcSel = document.getElementById('marksCourseSelector');
    if (!mcSel) return;
    mcSel.innerHTML = courses.map((c, i) =>
        `<button class="marks-course-btn ${i === 0 ? 'active' : ''}" onclick="selectMarksCourse('${c.course_code}','${c.course_name}',this)">${c.course_code} – ${c.course_name}</button>`
    ).join('');
}

function selectMarksCourse(code, name, el) {
    document.querySelectorAll('.marks-course-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');

    document.getElementById('marksCardTitle').textContent = `${name} (${code}) — Marks Entry`;
    document.getElementById('marksCardTitle').dataset.course = code;
    renderMarksTable(code);
}

// Updated Table Rendering to pass the input element itself
function renderMarksTable(course) {
    const list = studentsByCourse[course] || [];
    const tbody = document.getElementById('marksTbody');
    if(!tbody) return;
    
    tbody.innerHTML = list.map(s => {
        const k = course + '_' + s.student_id;
        if(!marksState[k]) {
            marksState[k] = { 
                int: parseFloat(s.internal_marks) || 0, 
                ext: parseFloat(s.external_marks) || 0 
            };
        }
        const m = marksState[k];
        
        return `
        <tr>
            <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">
                SRMS${s.student_id.toString().padStart(4,'0')}
            </td>
            <td><strong>${s.name}</strong></td>
            <td>
                <input type="number" min="0" max="40" value="${m.int}" 
                    onchange="updateMark('${k}','int',this.value, this)">
            </td>
            <td>
                <input type="number" min="0" max="60" value="${m.ext}" 
                    onchange="updateMark('${k}','ext',this.value, this)">
            </td>
            <td id="tot_${k}"><strong>${m.int + m.ext}</strong></td>
        </tr>`;
    }).join('');
}

// Updated Logic to handle negatives, clamp max values, and update UI
function updateMark(key, field, val, inputEl) {
    if (!marksState[key]) marksState[key] = {int:0, ext:0};
    
    let parsed = parseFloat(val) || 0;
    const max = (field === 'int') ? 40 : 60;

    // 1. Prevent negative marks
    if (parsed < 0) parsed = 0;

    // 2. Clamp to maximum allowed
    if (parsed > max) parsed = max;

    // 3. Force the input field to show the corrected value
    if (inputEl) inputEl.value = parsed;
    
    marksState[key][field] = parsed;
    
    // 4. Update the total marks column
    const t = marksState[key];
    const totEl = document.getElementById('tot_'+key);
    if(totEl) totEl.innerHTML = '<strong>' + (t.int + t.ext) + '</strong>';
}

async function saveMarks() {
    const course = document.getElementById('marksCardTitle').dataset.course;
    if (!course) return;

    const marksRecords = (studentsByCourse[course] || []).map(s => {
        const k = course + '_' + s.student_id;
        const m = marksState[k] || { int: 0, ext: 0 };
        return { student_id: s.student_id, internal_marks: m.int, external_marks: m.ext };
    });

    try {
        const res = await fetch('/api/faculty/marks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: course, marks: marksRecords })
        });
        if (res.ok) showToast('✅ Marks submitted successfully!');
        else showToast('❌ Error saving marks.');
    } catch (e) { showToast('❌ Network error.'); }
}

// ── MY STUDENTS ──
function renderMyStudents(dataset) {
    const tbody = document.getElementById('myStudentsTbody');
    if (!tbody) return;

    tbody.innerHTML = dataset.map(s => {
        const attStats = attendanceStats.find(a => a.student_id === s.student_id && a.course_code === s.course_code);
        let attPercent = 100;
        if (attStats && parseFloat(attStats.total_classes) > 0) {
            attPercent = Math.round((parseFloat(attStats.present_classes) / parseFloat(attStats.total_classes)) * 100);
        }

        return `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">SRMS${s.student_id.toString().padStart(4, '0')}</td>
            <td>Semester ${s.current_semester}</td>
            <td><span class="badge" style="font-family:'DM Mono',monospace;font-size:12px">${s.course_code}</span></td>
            <td>
                <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;min-width:60px">
                        <div style="width:${attPercent}%;height:100%;background:${attPercent >= 75 ? 'var(--green)' : 'var(--red)'};border-radius:3px"></div>
                    </div>
                    <span style="font-size:12px;font-weight:600;color:${attPercent >= 75 ? 'var(--green)' : 'var(--red)'}">${attPercent}%</span>
                </div>
            </td>
            <td>${s.internal_marks}/40</td>
        </tr>`
    }).join('');
}

function filterMyStudents(q) {
    renderMyStudents(myStudentsRaw.filter(s =>
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.student_id.toString().includes(q.toLowerCase()) ||
        s.course_code.toLowerCase().includes(q.toLowerCase())
    ));
}

// ── RESOURCES ──
function renderResources() {
    const grid = document.getElementById('resourceGrid');
    if(!grid) return;
    
    grid.innerHTML = resources.map(r => {
        const dt = new Date(r.upload_date).toLocaleDateString('en-US', {month:'short', day:'numeric'});
        return `
        <div class="resource-card">
            <div style="display:flex;align-items:center;gap:10px">
                <div class="resource-icon" style="background:#EFF6FF;font-size:18px">📄</div>
                <div>
                    <div style="font-size:10px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:0.06em">${r.type}</div>
                    <div style="font-size:13px;font-weight:600;margin-top:1px">${r.title}</div>
                </div>
            </div>
            <div class="resource-meta">${r.course_code} · Uploaded ${dt}</div>
            <div class="resource-footer">
                <span class="badge done">${r.course_name}</span>
                <div style="display:flex; gap:8px;">
                    <button onclick="openEditModal(${r.resource_id})" class="btn-outline" style="padding:4px 12px;font-size:12px;border:none;background:#f8fafc">Edit</button>
                    <button onclick="deleteResource(${r.resource_id})" class="btn-outline" style="padding:4px 12px;font-size:12px;border:none;background:#FEF2F2;color:var(--red)">Delete</button>
                    <a href="${r.file_path}" target="_blank" class="btn-outline" style="padding:4px 12px;font-size:12px;text-decoration:none">View</a>
                </div>
            </div>
        </div>`
    }).join('');
}

// Open modal for a NEW upload
function openUploadModal() {
    document.getElementById('resModalTitle').textContent = 'Upload Resource';
    document.getElementById('resSubmitBtn').textContent = 'Upload';
    document.getElementById('resourceForm').reset();
    document.getElementById('resIdInput').value = ''; // Clear hidden ID
    document.getElementById('uploadModal').classList.add('open');
}

// Open modal to EDIT an existing resource
function openEditModal(id) {
    const r = resources.find(x => x.resource_id === id);
    if(!r) return;
    
    // Switch modal UI to Edit Mode
    document.getElementById('resModalTitle').textContent = 'Edit Resource';
    document.getElementById('resSubmitBtn').textContent = 'Save Changes';
    
    // Populate the form with existing data
    document.getElementById('resIdInput').value = r.resource_id;
    document.getElementById('resCourseSelect').value = r.course_code;
    document.querySelector('select[name="type"]').value = r.type;
    document.getElementById('resTitleInput').value = r.title;
    document.getElementById('resPathInput').value = r.file_path;
    
    document.getElementById('uploadModal').classList.add('open');
}

// Handle Form Submission (Both New and Edit)
async function handleResourceUpload(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    // Determine if this is a new upload (POST) or an edit (PUT)
    const id = payload.resource_id;
    const url = id ? `/api/faculty/resource/${id}` : '/api/faculty/resource';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        if(res.ok) {
            showToast(id ? '✅ Resource updated successfully!' : '✅ Resource uploaded successfully!');
            document.getElementById('uploadModal').classList.remove('open');
            setTimeout(() => location.reload(), 1500); 
        } else {
            showToast('❌ Failed to save resource.');
        }
    } catch(err) { showToast('❌ Network error saving file.'); }
}
// Handle Resource Deletion
async function deleteResource(id) {
    // 1. Ask for confirmation so they don't accidentally click it
    if (!confirm("Are you sure you want to permanently delete this resource?")) {
        return; 
    }

    try {
        // 2. Send the DELETE request to the backend
        const res = await fetch(`/api/faculty/resource/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            showToast('✅ Resource deleted successfully!');
            // Reload the page to remove the card from the screen
            setTimeout(() => location.reload(), 1500); 
        } else {
            showToast('❌ Failed to delete resource.');
        }
    } catch (err) { 
        showToast('❌ Network error deleting file.'); 
    }
}


// ── PROFILE SETTINGS ──

async function handleUpdatePhone(e) {
    e.preventDefault();
    const phone = e.target.phone.value;
    const btn = e.target.querySelector('button');
    btn.textContent = 'Saving...'; btn.disabled = true;

    try {
        const res = await fetch('/api/faculty/profile', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phone })
        });
        if(res.ok) {
            showToast('✅ Phone number updated!');
            document.getElementById('displayPhone').innerHTML = `<b>Phone:</b> ${phone}`; // Update UI instantly
        } else {
            showToast('❌ Failed to update phone.');
        }
    } catch(err) { showToast('❌ Network error.'); }
    
    btn.textContent = 'Save Phone'; btn.disabled = false;
}

async function handleUpdateUsername(e) {
    e.preventDefault();
    const username = e.target.username.value;
    const btn = e.target.querySelector('button');
    btn.textContent = 'Saving...'; btn.disabled = true;

    try {
        const res = await fetch('/api/settings/profile', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        
        if(res.ok) {
            showToast('✅ Username updated successfully!');
            e.target.reset(); // Clear the field
        } else {
            showToast('❌ ' + (data.error || 'Failed to update username.'));
        }
    } catch(err) { showToast('❌ Network error.'); }
    
    btn.textContent = 'Update Username'; btn.disabled = false;
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const btn = e.target.querySelector('button');
    btn.textContent = 'Saving...'; btn.disabled = true;

    try {
        const res = await fetch('/api/settings/password', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        
        if(res.ok) {
            showToast('✅ Password changed securely!');
            e.target.reset(); // Clear passwords from screen
        } else {
            showToast('❌ ' + (data.error || 'Failed to change password.'));
        }
    } catch(err) { showToast('❌ Network error.'); }
    
    btn.textContent = 'Change Password'; btn.disabled = false;
}

// ── NAVIGATION & UI ──
const titles = { dashboard: 'Dashboard', courses: 'My Courses', attendance: 'Attendance', marks: 'Marks Entry', students: 'My Students', resources: 'Resources', profile: 'My Profile' };

function navigate(page, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById('page-' + page).classList.add('active');
    if (el) el.classList.add('active');
    document.getElementById('page-title').textContent = titles[page] || 'Dashboard';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}