require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./db'); // Imports and tests the database connection




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
app.post('/login', (req, res) => {
    const { username, password, role } = req.body;

    // TODO: Hook this up to the database to verify credentials
    console.log(`Login attempt: ${username} as ${role}`);

    // Temporary simulated routing based on role
    if (role === 'admin') res.redirect('/admin');
    else if (role === 'faculty') res.redirect('/faculty');
    else if (role === 'student') res.redirect('/student');
    else res.render('login', { error: 'Invalid Role Selected' });
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
