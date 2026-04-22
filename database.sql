CREATE DATABASE srms_db;
USE srms_db;

-- 1. Users TABLE (Independent)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(100) UNIQUE NOT NULL, -- This holds Admin username, Faculty email, or Student Roll No.
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'student') NOT NULL
);

-- 2. DEPARTMENT TABLE (Independent)
CREATE TABLE Department (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE,
    building_location VARCHAR(100)
);

-- 3. FACULTY TABLE (Depends on Department)
CREATE TABLE Faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE, -- Foreign Key to Users table
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    designation VARCHAR(50),
    phone VARCHAR(15),
    dept_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE SET NULL
);

-- 4. STUDENT TABLE (Depends on Department)
CREATE TABLE Student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE, -- Foreign Key to Users table
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(15),
    current_semester INT NOT NULL DEFAULT 1,
    dept_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE SET NULL
);

-- 5. COURSE TABLE (Depends on Department and Faculty)
CREATE TABLE Course (
    course_code VARCHAR(10) PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    dept_id INT,
    faculty_id INT, -- The faculty member teaching the course
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id) ON DELETE SET NULL
);

-- 6. ENROLLMENT TABLE (The Junction Table: Depends on Student and Course)
CREATE TABLE Enrollment (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_code VARCHAR(10),
    internal_marks DECIMAL(5,2) DEFAULT 0.00,
    external_marks DECIMAL(5,2) DEFAULT 0.00,
    grade CHAR(2),
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES Course(course_code) ON DELETE CASCADE,
    
    -- This ensures a student cannot enroll in the exact same course twice
    UNIQUE(student_id, course_code) 
);

-- 7. ATTENDANCE TABLE (Weak Entity: Depends on Student and Course)
CREATE TABLE Attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_code VARCHAR(10),
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Leave') DEFAULT 'Absent',
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES Course(course_code) ON DELETE CASCADE,
    
    -- This ensures a student only has one attendance record per course, per day
    UNIQUE(student_id, course_code, date) 
);