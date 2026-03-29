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
app.get('/faculty', (req, res) => res.send('<h2>Welcome Faculty</h2>'));
app.get('/student', (req, res) => res.send('<h2>Welcome Student</h2>'));



















// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
    console.log(`✅ SRMS Server is running on http://localhost:${PORT}`);
});
