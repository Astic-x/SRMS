const bcrypt = require('bcrypt');

// The 'salt rounds' determine how much time is needed to calculate a single bcrypt hash.
// 10 is the industry standard: secure enough to prevent brute force, but fast enough not to lag your server.
const saltRounds = 10;

/**
 * Hashes a plain text password.
 * Use this when CREATING a new user or UPDATING a password.
 * * @param {string} plainTextPassword - The password entered by the user.
 * @returns {Promise<string>} - The hashed password to store in the database.
 */
async function hashPassword(plainTextPassword) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(plainTextPassword, salt);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw error;
    }
}

/**
 * Compares a plain text password with a hashed password from the database.
 * Use this during the LOGIN process to verify credentials.
 * * @param {string} plainTextPassword - The password entered in the login form.
 * @param {string} hashedPassword - The hash retrieved from your MySQL database.
 * @returns {Promise<boolean>} - Returns true if they match, false otherwise.
 */
async function comparePassword(plainTextPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainTextPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        throw error;
    }
}

// Export the functions so they can be used in app.js or your dedicated route files
module.exports = {
    hashPassword,
    comparePassword
};