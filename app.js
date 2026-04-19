require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./db'); // Imports and tests the database connection
const { comparePassword } = require('./hash');
const crypto = require('crypto');




// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;











// ==========================================
// Middleware Configuration
// ==========================================

// 1. Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Points to your /views folder

// 2. Serve static files (CSS, Images, Client-side JS)
app.use(express.static(path.join(__dirname, 'public'))); // Points to your /public folder

// 3. Parse incoming form data (URL-encoded & JSON)
app.use(express.urlencoded({ extended: true })); // For HTML form submissions
app.use(express.json());

// 4. Set up Session management (Crucial for Admin/Student/Faculty logins)
app.use(session({
    secret: 'srms_super_secret_key_2026', // In production, use an environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));














// ==========================================
// Routes
// ==========================================

// Default Route -> Redirects to Login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// GET: Render the Login Page
app.get('/login', (req, res) => {
    // Looks for views/login.ejs
    res.render('login', { error: null });
});

// POST: Handle Login Form Submission (Placeholder for now)
app.post('/login', async (req, res) => {
    const { role, username, password, remember } = req.body;

    try {
        // ONE query checks the user, regardless of whether they are admin, faculty, or student!
        const [rows] = await db.execute(
            'SELECT * FROM Users WHERE login_id = ? AND role = ?',
            [username, role]
        );
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'User not found or incorrect role.' });
        }

        const isMatch = await comparePassword(password, user.password_hash);

        if (isMatch) {
            req.session.userId = user.user_id;
            req.session.role = user.role;

            // IF Remember Me is checked, keep them logged in for 30 days
            if (remember) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
            } else {
                // Otherwise, session expires when the browser window closes
                req.session.cookie.expires = false;
            }

            return res.status(200).json({ redirectUrl: `/${user.role}` });
        } else {
            return res.status(401).json({ message: 'Incorrect password.' });
        }
    } catch (error) {
        console.error('Login Route Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Check if this email exists in either the Faculty or Student tables
        // (Since Admin uses a username, they usually have a different reset process)
        const [rows] = await db.execute(`
            SELECT u.user_id, u.role 
            FROM Users u
            LEFT JOIN Student s ON u.user_id = s.user_id
            LEFT JOIN Faculty f ON u.user_id = f.user_id
            WHERE s.email = ? OR f.email = ?
        `, [email, email]);

        const user = rows[0];

        if (!user) {
            // For security, some apps return "Success" anyway to prevent email scraping,
            // but for a school project, it's fine to tell them the email isn't registered.
            return res.status(404).json({ message: 'Email not found in our system.' });
        }

        // 2. Generate a secure, random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 3600000; // 1 hour from now

        // TODO: Save this token and expiry time to the user's row in the database
        // e.g., UPDATE Users SET reset_token = ?, reset_expires = ? WHERE user_id = ?

        // 3. Simulate sending an email
        console.log(`\n=== EMAIL SYSTEM SIMULATION ===`);
        console.log(`To: ${email}`);
        console.log(`Subject: Password Reset Request`);
        console.log(`Body: Click here to reset your password: http://localhost:3000/reset/${resetToken}`);
        console.log(`===============================\n`);

        res.status(200).json({ message: 'Reset link sent!' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});







// Dashboard Placeholders
app.get('/admin', (req, res) => res.render('admin'));
// GET all students
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                s.student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS name,
                s.current_semester,
                d.dept_name,

                ROUND(
                (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / 
                NULLIF(COUNT(a.attendance_id), 0)) * 100
                ) AS attendance_percent

            FROM Student s
            LEFT JOIN Department d ON s.dept_id = d.dept_id
            LEFT JOIN Attendance a ON s.student_id = a.student_id

            GROUP BY s.student_id
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/faculty', async (req, res) => {
    const [rows] = await db.execute(`
        SELECT 
            f.faculty_id,
            f.name,
            f.designation,
            f.dept_id,
            d.dept_name
        FROM Faculty f
        LEFT JOIN Department d ON f.dept_id = d.dept_id
    `);

    res.json(rows);
});

app.post('/api/students', async (req, res) => {
    const { first_name, last_name, email, dob, phone, current_semester, dept_id } = req.body;

    try {
        await db.execute(`
            INSERT INTO Student 
            (first_name, last_name, email, date_of_birth, phone_number, current_semester, dept_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [first_name, last_name, email, dob, phone,current_semester, dept_id]);

        res.json({ message: 'Student added successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Update student by ID
app.put('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, dob, phone, current_semester, dept_id } = req.body;

    try {
        const result = await db.execute(`
            UPDATE Student 
            SET first_name = ?, last_name = ?, email = ?, date_of_birth = ?, 
                phone_number = ?, current_semester = ?, dept_id = ?
            WHERE student_id = ?
        `, [first_name, last_name, email, dob, phone, current_semester, dept_id, id]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Student updated successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Delete student by ID
app.delete('/api/students/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.execute(`
            DELETE FROM Student WHERE student_id = ?
        `, [id]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// Faculty Endpoints
// ==========================================

// POST: Create a new faculty
app.post('/api/faculty', async (req, res) => {
    const { name, email, phone, designation, dept_id } = req.body;

    try {
        await db.execute(`
            INSERT INTO Faculty 
            (name, email, phone, designation, dept_id)
            VALUES (?, ?, ?, ?, ?)
        `, [name, email, phone, designation, dept_id]);

        res.json({ message: 'Faculty added successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Update faculty by ID
app.put('/api/faculty/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, designation, dept_id } = req.body;

    try {
        const result = await db.execute(`
            UPDATE Faculty 
            SET name = ?, email = ?, phone = ?, designation = ?, dept_id = ?
            WHERE faculty_id = ?
        `, [name, email, phone, designation, dept_id, id]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        res.json({ message: 'Faculty updated successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Delete faculty by ID
app.delete('/api/faculty/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // First, set any courses assigned to this faculty to NULL
        await db.execute(`
            UPDATE Course SET faculty_id = NULL WHERE faculty_id = ?
        `, [id]);

        // Then delete the faculty
        const result = await db.execute(`
            DELETE FROM Faculty WHERE faculty_id = ?
        `, [id]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        res.json({ message: 'Faculty deleted successfully' });

    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// Course Endpoints
// ==========================================

// GET all courses
app.get('/api/courses', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                c.course_code,
                c.course_name,
                c.credits,
                d.dept_name,
                f.name as faculty_name
            FROM Course c
            LEFT JOIN Department d ON c.dept_id = d.dept_id
            LEFT JOIN Faculty f ON c.faculty_id = f.faculty_id
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Create a new course
app.post('/api/courses', async (req, res) => {
    const { course_code, course_name, credits, dept_id, faculty_id } = req.body;

    try {
        await db.execute(`
            INSERT INTO Course 
            (course_code, course_name, credits, dept_id, faculty_id)
            VALUES (?, ?, ?, ?, ?)
        `, [course_code, course_name, credits, dept_id, faculty_id]);

        res.json({ message: 'Course added successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Update course by code
app.put('/api/courses/:code', async (req, res) => {
    const { code } = req.params;
    const { course_name, credits, dept_id, faculty_id } = req.body;

    try {
        const result = await db.execute(`
            UPDATE Course 
            SET course_name = ?, credits = ?, dept_id = ?, faculty_id = ?
            WHERE course_code = ?
        `, [course_name, credits, dept_id, faculty_id, code]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: 'Course updated successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Delete course by code
app.delete('/api/courses/:code', async (req, res) => {
    const { code } = req.params;

    try {
        const result = await db.execute(`
            DELETE FROM Course WHERE course_code = ?
        `, [code]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// Department Endpoints
// ==========================================

// GET all departments
app.get('/api/departments', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                d.dept_id,
                d.dept_name,
                d.building_location,
                COUNT(DISTINCT f.faculty_id) as faculty_count,
                COUNT(DISTINCT s.student_id) as student_count,
                COUNT(DISTINCT c.course_code) as course_count
            FROM Department d
            LEFT JOIN Faculty f ON d.dept_id = f.dept_id
            LEFT JOIN Student s ON d.dept_id = s.dept_id
            LEFT JOIN Course c ON d.dept_id = c.dept_id
            GROUP BY d.dept_id, d.dept_name, d.building_location
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Create a new department
app.post('/api/departments', async (req, res) => {
    const { dept_name, building_location } = req.body;

    try {
        await db.execute(`
            INSERT INTO Department 
            (dept_name, building_location)
            VALUES (?, ?)
        `, [dept_name, building_location]);

        res.json({ message: 'Department added successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Update department by ID
app.put('/api/departments/:id', async (req, res) => {
    const { id } = req.params;
    const { dept_name, building_location } = req.body;

    try {
        const result = await db.execute(`
            UPDATE Department 
            SET dept_name = ?, building_location = ?
            WHERE dept_id = ?
        `, [dept_name, building_location, id]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json({ message: 'Department updated successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Delete department by ID
app.delete('/api/departments/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.execute(`
            DELETE FROM Department WHERE dept_id = ?
        `, [id]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json({ message: 'Department deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═════════════════════════════════════════════════════════════
// ══════════════════ MARKS API ENDPOINTS ══════════════════════
// ═════════════════════════════════════════════════════════════

// GET all marks (with student and course details)
app.get('/api/marks', async (req, res) => {
    try {
        const [marks] = await db.query(`
            SELECT 
                e.enrollment_id,
                e.student_id,
                e.course_code,
                e.internal_marks,
                e.external_marks,
                (e.internal_marks + e.external_marks) as total_marks,
                e.grade,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                c.course_name,
                d.dept_name
            FROM Enrollment e
            JOIN Student s ON e.student_id = s.student_id
            JOIN Course c ON e.course_code = c.course_code
            JOIN Department d ON c.dept_id = d.dept_id
            ORDER BY s.first_name, c.course_code
        `);
        res.json(marks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new marks (create enrollment with marks)
app.post('/api/marks', async (req, res) => {
    const { student_id, course_code, internal_marks, external_marks, grade } = req.body;

    if (!student_id || !course_code) {
        return res.status(400).json({ error: 'Student ID and Course Code are required' });
    }

    try {
        const internal = internal_marks || 0;
        const external = external_marks || 0;
        const gradeValue = grade || calculateGrade(internal + external);

        const [result] = await db.query(
            `INSERT INTO Enrollment (student_id, course_code, internal_marks, external_marks, grade)
             VALUES (?, ?, ?, ?, ?)`,
            [student_id, course_code, internal, external, gradeValue]
        );

        res.json({ 
            message: 'Marks added successfully',
            enrollment_id: result.insertId
        });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Student already enrolled in this course' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT update marks
app.put('/api/marks/:id', async (req, res) => {
    const { id } = req.params;
    const { internal_marks, external_marks, grade } = req.body;

    try {
        const internal = internal_marks || 0;
        const external = external_marks || 0;
        const gradeValue = grade || calculateGrade(internal + external);

        const [result] = await db.query(
            `UPDATE Enrollment 
             SET internal_marks = ?, external_marks = ?, grade = ?
             WHERE enrollment_id = ?`,
            [internal, external, gradeValue, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Enrollment record not found' });
        }

        res.json({ message: 'Marks updated successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE marks
app.delete('/api/marks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM Enrollment WHERE enrollment_id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Enrollment record not found' });
        }

        res.json({ message: 'Marks deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper function to calculate grade
function calculateGrade(total) {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 40) return 'D';
    return 'F';
}




















































app.get('/faculty', (req, res) => res.render('faculty'));
app.get('/student', (req, res) => res.send('<h2>Welcome Student</h2>'));




















// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
    console.log(`✅ SRMS Server is running on http://localhost:${PORT}`);
});
