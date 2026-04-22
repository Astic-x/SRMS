const fs = require('fs');

let adminEjs = fs.readFileSync('c:/Users/HP/OneDrive/Desktop/Projects/SRMS/views/admin.ejs', 'utf8');

// Fix 1: Semester dropdowns in Marks and everywhere else that matches it
adminEjs = adminEjs.replace(/<select class="filter-dropdown">\s*<option>All Semesters<\/option>\s*<option>2nd<\/option>\s*<option>4th<\/option>\s*<option>6th<\/option>\s*<\/select>/g, `<select class="filter-dropdown">
              <option>All Semesters</option>
              <option>1st</option>
              <option>2nd</option>
              <option>3rd</option>
              <option>4th</option>
              <option>5th</option>
              <option>6th</option>
              <option>7th</option>
              <option>8th</option>
            </select>`);

adminEjs = adminEjs.replace(/<select class="select-sm">\s*<option>All Semesters<\/option>\s*<option>2nd<\/option>\s*<option>4th<\/option>\s*<option>6th<\/option>\s*<\/select>/g, `<select class="select-sm">
              <option>All Semesters</option>
              <option>1st</option>
              <option>2nd</option>
              <option>3rd</option>
              <option>4th</option>
              <option>5th</option>
              <option>6th</option>
              <option>7th</option>
              <option>8th</option>
            </select>`);

// Fix 2: Repair the ruined Settings UI
// First we locate the entire settings block by string slicing from `<div id="page-settings" class="page">` to `<!-- /content -->`
const startIdx = adminEjs.indexOf('<div id="page-settings" class="page">');
const endIdx = adminEjs.indexOf('</div><!-- /content -->', startIdx);

if(startIdx !== -1 && endIdx !== -1) {
    const perfectSettings = `
      <div id="page-settings" class="page">
        <div class="section-header">
          <h3>Settings</h3>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="chart-card">
            <div class="chart-title" style="margin-bottom:18px;">Profile Settings</div>
            <form id="profile-form" onsubmit="event.preventDefault(); handleSaveProfile()">
              <div class="form-group"><label>Username (Login ID)</label><input type="text" id="set_username" required value="<%= typeof admin_user !== 'undefined' ? admin_user.login_id : 'admin' %>"></div>
              <div class="form-group"><label>Role</label><input type="text" value="Super Administrator" disabled style="background:#f1f5f9;color:#64748b"></div>
              <p style="font-size:12px; color:#64748b; margin-top:10px;">Note: Profile properties are strictly synced with the Users database table.</p>
              <button class="btn-primary" style="margin-top:10px;" type="submit">Save Changes</button>
            </form>
          </div>
          
          <div class="chart-card">
            <div class="chart-title" style="margin-bottom:18px;">Change Password</div>
            <form id="password-form" onsubmit="event.preventDefault(); handleSavePassword()">
              <div class="form-group"><label>Current Password</label><input type="password" id="set_pw_current" placeholder="••••••••" required></div>
              <div class="form-group"><label>New Password</label><input type="password" id="set_pw_new" placeholder="••••••••" required></div>
              <div class="form-group"><label>Confirm New Password</label><input type="password" id="set_pw_confirm" placeholder="••••••••" required></div>
              <button class="btn-primary" style="margin-top:4px;" type="submit">Update Password</button>
            </form>
          </div>

          <div class="chart-card" style="grid-column:span 2">
            <div class="chart-title" style="margin-bottom:18px;">System Preferences</div>
            <form id="preferences-form" onsubmit="event.preventDefault(); handleSavePreferences()">
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
                <div class="form-group"><label>Academic Year</label>
                  <select id="pref_year" class="select-sm" style="width:100%">
                    <option>2024–25</option>
                    <option>2023–24</option>
                  </select>
                </div>
                <div class="form-group"><label>Default Semester</label>
                  <select id="pref_sem" class="select-sm" style="width:100%">
                    <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option><option>5th</option><option>6th</option><option>7th</option><option>8th</option>
                  </select>
                </div>
                <div class="form-group"><label>Timezone</label>
                  <select id="pref_tz" class="select-sm" style="width:100%">
                    <option>IST (UTC+5:30)</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>
              <button class="btn-primary" style="margin-top:4px;" type="submit">Save Preferences</button>
            </form>
          </div>
        </div>
      </div>
    `;
    adminEjs = adminEjs.substring(0, startIdx) + perfectSettings + adminEjs.substring(endIdx);
}

fs.writeFileSync('c:/Users/HP/OneDrive/Desktop/Projects/SRMS/views/admin.ejs', adminEjs);
console.log('Successfully repaired UI layout');
