// Navigation Logic
        function navigate(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            
            // Show target section
            document.getElementById(sectionId).classList.add('active');
            // Highlight clicked nav item (finds the one that triggered this function)
            event.currentTarget.classList.add('active');
        }

        // Modal Logic
        let pendingCourse = '';
        
        function confirmEnrollment(courseName) {
            pendingCourse = courseName;
            document.getElementById('modalCourseName').innerText = courseName;
            document.getElementById('enrollModal').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('enrollModal').style.display = 'none';
            pendingCourse = '';
        }

        function executeEnrollment() {
            closeModal();
            showToast(`Successfully enrolled in ${pendingCourse}!`);
            // In a real app, you would make an API call to Node.js here
        }

        // Toast Notification Logic
        function showToast(message) {
            const toast = document.getElementById('toastBox');
            toast.innerText = message;
            toast.classList.add('show');
            
            // Hide after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }