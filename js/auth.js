/**
 * Smart Library - Authentication & Session Management
 */

const Auth = {
    currentUser: null,

    // Initialize authentication
    init() {
        this.loadSession();
    },

    // Load current session
    loadSession() {
        try {
            const sessionData = localStorage.getItem(App.KEYS.SESSION);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                // Check if session is still valid (24 hours)
                if (new Date() - new Date(session.timestamp) < 24 * 60 * 60 * 1000) {
                    this.currentUser = session.user;
                } else {
                    this.clearSession();
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
        }
    },

    // Save session
    saveSession(user) {
        const session = {
            user: user,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(App.KEYS.SESSION, JSON.stringify(session));
        this.currentUser = user;
    },

    // Clear session
    clearSession() {
        localStorage.removeItem(App.KEYS.SESSION);
        localStorage.removeItem(App.KEYS.CURRENT_USER);
        this.currentUser = null;
    },

    // Login functionality
    initLogin() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            App.showToast('Please fill all fields', 'error');
            return;
        }

        const users = App.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            App.showToast('Invalid email or password', 'error');
            return;
        }

        // Save session
        this.saveSession(user);
        localStorage.setItem(App.KEYS.CURRENT_USER, JSON.stringify(user));

        App.showToast(`Welcome back, ${user.name}!`);

        // Redirect based on role
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'user/dashboard.html';
            }
        }, 1000);
    },

    // Registration functionality
    initRegister() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
    },

    handleRegistration() {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const usn = document.getElementById('regUSN').value.trim().toUpperCase();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Validation
        if (!name || !email || !usn || !phone || !password) {
            App.showToast('Please fill all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            App.showToast('Passwords do not match', 'error');
            return;
        }

        if (phone.length !== 10 || !/^\d+$/.test(phone)) {
            App.showToast('Please enter a valid 10-digit phone number', 'error');
            return;
        }

        // Check USN format
        if (!/^1DA\d{2}[A-Z]{2}\d{3}$/.test(usn)) {
            App.showToast('Invalid USN format. Use format: 1DA23ET400', 'error');
            return;
        }

        const users = App.getUsers();

        // Check if email exists
        if (users.find(u => u.email === email)) {
            App.showToast('Email already registered', 'error');
            return;
        }

        // Check if USN exists
        if (users.find(u => u.usn === usn)) {
            App.showToast('USN already registered', 'error');
            return;
        }

        // Create new user
        const newUser = {
            userId: 'USER' + Date.now(),
            name,
            email,
            usn,
            phone,
            password, // In production, this should be hashed
            role: 'student',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        App.saveUsers(users);

        App.showToast('Registration successful! Redirecting to login...');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    },

    // Password reset functionality
    initReset() {
        const form = document.getElementById('resetForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReset();
        });
    },

    handleReset() {
        const email = document.getElementById('resetEmail').value.trim();
        const usn = document.getElementById('resetUSN').value.trim().toUpperCase();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (!email || !usn || !newPassword || !confirmPassword) {
            App.showToast('Please fill all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            App.showToast('Passwords do not match', 'error');
            return;
        }

        const users = App.getUsers();
        const userIndex = users.findIndex(u => u.email === email && u.usn === usn);

        if (userIndex === -1) {
            App.showToast('No account found with this email and USN', 'error');
            return;
        }

        // Update password
        users[userIndex].password = newPassword;
        App.saveUsers(users);

        App.showToast('Password reset successful! Please login.');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    },

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.clearSession();
            App.showToast('Logged out successfully');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    },

    // Check authentication status
    checkAuth(requiredRole = null) {
        this.loadSession();
        
        if (!this.currentUser) {
            return false;
        }

        if (requiredRole && this.currentUser.role !== requiredRole) {
            App.showToast('Access denied. Insufficient permissions.', 'error');
            return false;
        }

        return true;
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },

    // Update current user (after profile changes)
    updateCurrentUser(userData) {
        this.currentUser = { ...this.currentUser, ...userData };
        this.saveSession(this.currentUser);
        localStorage.setItem(App.KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    }
};

// Initialize auth
Auth.init();