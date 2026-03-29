USE srms_db;

-- ==========================================
-- 1. Populate Departments
-- ==========================================
INSERT INTO Department (dept_name, building_location) VALUES 
('Computer Science and Engineering', 'Block A - Tech Hub'),
('Information Technology', 'Block B - Annex'),
('Electronics and Communication', 'Block C - Main Campus');

-- ==========================================
-- 2. Populate Admins (Using dummy bcrypt hashes)
-- ==========================================
INSERT INTO Admin (username, password_hash, email) VALUES 
('admin_main', '$2b$10$dummyhash12345678901234', 'admin@university.edu'),
('admin_support', '$2b$10$dummyhash09876543214321', 'support@university.edu');

-- ==========================================
-- 3. Populate Faculty
-- ==========================================
INSERT INTO Faculty (name, email, designation, phone, dept_id) VALUES 
('Dr. Alan Turing', 'alan.turing@university.edu', 'Professor', '9876543210', 1),
('Prof. Grace Hopper', 'grace.hopper@university.edu', 'Associate Professor', '9876543211', 1),
('Dr. Dennis Ritchie', 'dennis.ritchie@university.edu', 'Assistant Professor', '9876543212', 2);

-- ==========================================
-- 4. Populate Students (Mix of semesters)
-- ==========================================
INSERT INTO Student (first_name, last_name, email, date_of_birth, phone_number, current_semester, dept_id) VALUES 
('Aarav', 'Sharma', 'aarav.s@student.edu', '2004-03-12', '9123456780', 6, 1),
('Priya', 'Patel', 'priya.p@student.edu', '2005-07-22', '9123456781', 6, 1),
('Rohan', 'Verma', 'rohan.v@student.edu', '2004-11-05', '9123456782', 5, 2),
('Neha', 'Gupta', 'neha.g@student.edu', '2005-01-18', '9123456783', 4, 3),
('Kabir', 'Singh', 'kabir.s@student.edu', '2004-09-30', '9123456784', 6, 1);

-- ==========================================
-- 5. Populate Courses
-- ==========================================
INSERT INTO Course (course_code, course_name, credits, dept_id, faculty_id) VALUES 
('CS301', 'Compiler Design', 4, 1, 1),
('CS201', 'Database Management Systems', 4, 1, 2),
('CS401', 'DevOps on Cloud', 3, 1, 1),
('IT202', 'Computer Networks', 4, 2, 3),
('CS305', 'Machine Learning', 3, 1, 2);

-- ==========================================
-- 6. Populate Enrollments (M:N relationship)
-- ==========================================
-- Aarav (Student 1) taking Compiler Design, DBMS, and DevOps
INSERT INTO Enrollment (student_id, course_code, internal_marks, external_marks, grade) VALUES 
(1, 'CS301', 28.5, 65.0, 'A'),
(1, 'CS201', 25.0, 58.0, 'B'),
(1, 'CS401', 29.0, 68.0, 'A');

-- Priya (Student 2) taking Compiler Design and ML
INSERT INTO Enrollment (student_id, course_code, internal_marks, external_marks, grade) VALUES 
(2, 'CS301', 26.0, 60.0, 'B'),
(2, 'CS305', 27.5, 62.0, 'A');

-- Rohan (Student 3) taking Computer Networks
INSERT INTO Enrollment (student_id, course_code, internal_marks, external_marks, grade) VALUES 
(3, 'IT202', 22.0, 50.0, 'C');

-- ==========================================
-- 7. Populate Attendance
-- ==========================================
-- Tracking attendance for CS301 (Compiler Design) over three days
INSERT INTO Attendance (student_id, course_code, date, status) VALUES 
-- Day 1
(1, 'CS301', '2026-03-25', 'Present'),
(2, 'CS301', '2026-03-25', 'Present'),
-- Day 2
(1, 'CS301', '2026-03-26', 'Present'),
(2, 'CS301', '2026-03-26', 'Absent'),
-- Day 3
(1, 'CS301', '2026-03-27', 'Leave'),
(2, 'CS301', '2026-03-27', 'Present');