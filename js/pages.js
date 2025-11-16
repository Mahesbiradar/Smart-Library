/**
 * Smart Library - Page-Specific Logic
 * Handles individual page initialization and functionality
 */

const Pages = {
    // Home page
    home: {
        init: function() {
            console.log("Home page initialized.");
            this.setupSearch();
            this.loadBooks();
        },

        setupSearch: function() {
            const searchBtn = document.getElementById('searchBtn');
            const searchBar = document.getElementById('searchBar');

            if (searchBtn && searchBar) {
                searchBtn.addEventListener('click', () => {
                    this.performSearch(searchBar.value);
                });

                searchBar.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performSearch(searchBar.value);
                    }
                });
            }
        },

        performSearch: function(query) {
            if (query.trim()) {
                window.location.href = `books.html?search=${encodeURIComponent(query.trim())}`;
            } else {
                window.location.href = 'books.html';
            }
        },

        loadBooks: function() {
            // Load featured books or recent additions
            const books = App.getBooks().slice(0, 6); // Show first 6 books
            // This could be enhanced to show featured books
        }
    },

    // Books page
    books: {
        init: function() {
            console.log("Books page initialized.");
            this.setupFilters();
            this.loadBooks();
            this.setupSearch();
        },

        setupSearch: function() {
            const searchBtn = document.getElementById('searchBtn');
            const searchBar = document.getElementById('searchBooks');

            if (searchBtn && searchBar) {
                searchBtn.addEventListener('click', () => {
                    this.filterBooks();
                });

                searchBar.addEventListener('input', () => {
                    this.filterBooks();
                });
            }
        },

        setupFilters: function() {
            const categoryFilter = document.getElementById('categoryFilter');
            const availabilityFilter = document.getElementById('availabilityFilter');

            if (categoryFilter) {
                // Populate categories
                const books = App.getBooks();
                const categories = [...new Set(books.map(book => book.category))];
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilter.appendChild(option);
                });
            }

            if (categoryFilter) {
                categoryFilter.addEventListener('change', () => this.filterBooks());
            }

            if (availabilityFilter) {
                availabilityFilter.addEventListener('change', () => this.filterBooks());
            }
        },

        loadBooks: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search');
            const deptFilter = urlParams.get('dept');

            if (searchQuery) {
                const searchBar = document.getElementById('searchBooks');
                if (searchBar) {
                    searchBar.value = searchQuery;
                }
            }

            this.filterBooks();
        },

        filterBooks: function() {
            const searchBar = document.getElementById('searchBooks');
            const categoryFilter = document.getElementById('categoryFilter');
            const availabilityFilter = document.getElementById('availabilityFilter');

            const query = searchBar ? searchBar.value : '';
            const category = categoryFilter ? categoryFilter.value : '';
            const availability = availabilityFilter ? availabilityFilter.value : '';

            const books = App.searchBooks(query, category, availability);
            this.displayBooks(books);
        },

        displayBooks: function(books) {
            const booksGrid = document.getElementById('booksGrid');
            const noBooks = document.getElementById('noBooks');

            if (!booksGrid) return;

            booksGrid.innerHTML = '';

            if (books.length === 0) {
                if (noBooks) noBooks.style.display = 'block';
                return;
            }

            if (noBooks) noBooks.style.display = 'none';

            books.forEach(book => {
                const bookCard = UI.renderBookCard(book);
                booksGrid.innerHTML += bookCard;
            });
        }
    },

    // User Dashboard
    userDashboard: {
        init: function() {
            console.log("User Dashboard initialized.");
            this.loadUserInfo();
            this.loadUserStats();
            this.loadUserTransactions();
        },

        loadUserInfo: function() {
            const user = Auth.getCurrentUser();
            if (user) {
                const fullNameEl = document.getElementById('userFullName');
                const usnEl = document.getElementById('userUSN');
                
                if (fullNameEl) fullNameEl.textContent = user.name;
                if (usnEl) usnEl.textContent = `USN: ${user.usn}`;
            }
        },

        loadUserStats: function() {
            const user = Auth.getCurrentUser();
            if (!user) return;

            const transactions = App.getTransactions();
            const userTransactions = transactions.filter(t => t.userId === user.userId);

            const issuedBooks = userTransactions.filter(t => t.status === 'issued').length;
            const overdueBooks = userTransactions.filter(t => {
                if (t.status !== 'issued') return false;
                return new Date() > new Date(t.dueDate);
            }).length;

            const issuedCountEl = document.getElementById('issuedCount');
            const overdueCountEl = document.getElementById('overdueCount');

            if (issuedCountEl) issuedCountEl.textContent = issuedBooks;
            if (overdueCountEl) overdueCountEl.textContent = overdueBooks;
        },

        loadUserTransactions: function() {
            const user = Auth.getCurrentUser();
            if (!user) return;

            const transactions = App.getTransactions()
                .filter(t => t.userId === user.userId)
                .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

            const tbody = document.getElementById('transactionsBody');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">No transactions yet.</td></tr>';
                return;
            }

            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                const fine = App.calculateFine(transaction.dueDate);
                const isOverdue = transaction.status === 'issued' && new Date() > new Date(transaction.dueDate);

                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td>${transaction.bookTitle}</td>
                    <td>${App.formatDate(transaction.issueDate)}</td>
                    <td>${App.formatDate(transaction.dueDate)}</td>
                    <td>
                        <span class="status-badge status-${transaction.status} ${isOverdue ? 'overdue' : ''}">
                            ${transaction.status.toUpperCase()}
                            ${isOverdue ? ' (OVERDUE)' : ''}
                        </span>
                    </td>
                    <td>
                        ${transaction.status === 'issued' ? 
                            `<button onclick="Pages.userDashboard.returnBook('${transaction.id}')" 
                                    class="btn-sm btn-warning">Return</button>` : 
                            '<span class="text-muted">-</span>'
                        }
                    </td>
                `;

                tbody.appendChild(row);
            });
        },

        returnBook: function(transactionId) {
            if (!confirm('Are you sure you want to return this book?')) {
                return;
            }

            try {
                App.returnBook(transactionId);
                App.showToast('Book returned successfully');
                this.loadUserStats();
                this.loadUserTransactions();
            } catch (error) {
                App.showToast(error.message, 'error');
            }
        }
    },

    // User Profile
    userProfile: {
        init: function() {
            console.log("User Profile initialized.");
            this.loadProfile();
            this.setupForm();
            this.setupEditButtons();
        },

        loadProfile: function() {
            const user = Auth.getCurrentUser();
            if (!user) return;

            // Load profile form
            const nameEl = document.getElementById('profileName');
            const emailEl = document.getElementById('profileEmail');
            const usnEl = document.getElementById('profileUSN');
            const phoneEl = document.getElementById('profilePhone');
            const profilePicEl = document.getElementById('profilePic');

            if (nameEl) nameEl.value = user.name;
            if (emailEl) emailEl.value = user.email;
            if (usnEl) usnEl.value = user.usn;
            if (phoneEl) phoneEl.value = user.phone;
            if (profilePicEl) profilePicEl.src = '../assets/profile-icon.jpg';
        },

        setupForm: function() {
            const profileForm = document.getElementById('profileForm');
            const passwordForm = document.getElementById('passwordForm');

            if (profileForm) {
                profileForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.updateProfile();
                });
            }

            if (passwordForm) {
                passwordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.changePassword();
                });
            }
        },

        setupEditButtons: function() {
            const editProfileBtn = document.getElementById('editProfileBtn');
            const editPasswordBtn = document.getElementById('editPasswordBtn');
            const profileForm = document.getElementById('profileForm');
            const passwordForm = document.getElementById('passwordForm');

            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', () => {
                    this.toggleProfileEdit();
                });
            }

            if (editPasswordBtn) {
                editPasswordBtn.addEventListener('click', () => {
                    this.togglePasswordEdit();
                });
            }
        },

        toggleProfileEdit: function() {
            const profileForm = document.getElementById('profileForm');
            const editBtn = document.getElementById('editProfileBtn');
            const inputs = profileForm.querySelectorAll('input:not([readonly])');
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            
            const isEditing = editBtn.textContent === 'Cancel Edit';
            
            if (isEditing) {
                // Cancel editing - disable inputs
                inputs.forEach(input => input.disabled = true);
                submitBtn.disabled = true;
                editBtn.textContent = 'Edit Profile';
            } else {
                // Start editing - enable inputs
                inputs.forEach(input => input.disabled = false);
                submitBtn.disabled = false;
                editBtn.textContent = 'Cancel Edit';
            }
        },

        togglePasswordEdit: function() {
            const passwordForm = document.getElementById('passwordForm');
            const editBtn = document.getElementById('editPasswordBtn');
            const inputs = passwordForm.querySelectorAll('input');
            const submitBtn = passwordForm.querySelector('button[type="submit"]');
            
            const isEditing = editBtn.textContent === 'Cancel Edit';
            
            if (isEditing) {
                // Cancel editing - disable inputs and reset form
                inputs.forEach(input => input.disabled = true);
                submitBtn.disabled = true;
                editBtn.textContent = 'Edit Password';
                passwordForm.reset();
            } else {
                // Start editing - enable inputs
                inputs.forEach(input => input.disabled = false);
                submitBtn.disabled = false;
                editBtn.textContent = 'Cancel Edit';
            }
        },

        updateProfile: function() {
            const name = document.getElementById('profileName').value.trim();
            const usn = document.getElementById('profileUSN').value.trim().toUpperCase();
            const phone = document.getElementById('profilePhone').value.trim();

            if (!name || !usn || !phone) {
                App.showToast('Please fill all required fields', 'error');
                return;
            }

            if (!/^1DA\d{2}[A-Z]{2}\d{3}$/.test(usn)) {
                App.showToast('Invalid USN format. Use format: 1DA23ET400', 'error');
                return;
            }

            if (phone.length !== 10 || !/^\d+$/.test(phone)) {
                App.showToast('Please enter a valid 10-digit phone number', 'error');
                return;
            }

            try {
                Auth.updateCurrentUser({
                    name,
                    usn,
                    phone
                });

                App.showToast('Profile updated successfully');
            } catch (error) {
                App.showToast('Error updating profile: ' + error.message, 'error');
            }
        },

        changePassword: function() {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;

            try {
                Auth.changePassword(currentPassword, newPassword, confirmPassword);
                document.getElementById('passwordForm').reset();
                App.showToast('Password changed successfully');
            } catch (error) {
                App.showToast(error.message, 'error');
            }
        }
    },

    // About page
    about: {
        init: function() {
            console.log("About page initialized.");
            // About page specific functionality
        }
    }
};

// Auto-initialize page on load
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop().split('.')[0] || 'index';
    
    // Map page names to their respective handlers with routing logic
    const routes = {
        "index": () => Pages.home.init(),
        "about": () => Pages.about.init(),
        "books": () => Pages.books.init(),

        "dashboard": window.location.pathname.includes('/user/')
            ? (() => { if (Auth.checkAuth()) Pages.userDashboard.init(); })
            : (() => { if (Auth.checkAuth('admin')) Admin.dashboard.init(); }),

        "profile": () => {
            if (Auth.checkAuth()) Pages.userProfile.init();
        },

        "transactions": () => {
            if (Auth.checkAuth('admin')) Admin.transactions.init();
        },

        "issue-return": () => {
            if (Auth.checkAuth('admin')) Admin.issueReturn.init();
        }
    };

    const handler = routes[page];
    if (handler) {
        handler();
    } else {
        console.log(`No init function found for page: ${page}`);
    }
});