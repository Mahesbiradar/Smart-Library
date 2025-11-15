/**
 * Smart Library - UI Components and Navigation
 */

const UI = {
    navConfig: {
        guest: [
            { label: 'Home', href: 'index.html' },
            { label: 'Books', href: 'books.html' },
            { label: 'About', href: 'about.html' },
            { label: 'Login', href: 'login.html' }
        ],
        student: [
            { label: 'Home', href: 'index.html' },
            { label: 'Books', href: 'books.html' },
            { label: 'About', href: 'about.html' },
            { label: 'Dashboard', href: 'user/dashboard.html' },
            { label: 'Profile', href: 'user/profile.html' },
            { label: 'Logout', href: '#', action: 'logout' }
        ],
        admin: [
            { label: 'Home', href: 'index.html' },
            { label: 'Books', href: 'books.html' },
            { label: 'About', href: 'about.html' },
            { label: 'Admin Dashboard', href: 'admin/dashboard.html' },
            { label: 'Books Manager', href: 'admin/books.html' },
            { label: 'Transactions', href: 'admin/transactions.html' },
            { label: 'Issue/Return', href: 'admin/issue-return.html' },
            { label: 'Logout', href: '#', action: 'logout' }
        ]
    },

    renderNav() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const user = Auth.getCurrentUser();
        const role = user ? user.role : 'guest';
        const links = this.navConfig[role];

        let logoHref = 'index.html';
        if (role === 'admin') logoHref = 'admin/dashboard.html';
        if (role === 'student') logoHref = 'user/dashboard.html';

        nav.innerHTML = `
            <div class="nav-brand">
                <a href="${logoHref}">
                    <img src="assets/cbit-logo.jpg" alt="Smart Library">
                    <span>Smart Library</span>
                </a>
            </div>
            <ul class="nav-links">
                ${links.map(link => {
                    const isActive = currentPage === link.href.split('/').pop();
                    const linkClass = isActive ? 'active' : '';
                    const onClick = link.action ? `onclick="UI.handleNavClick('${link.action}')"` : '';
                    return `
                        <li>
                            <a href="${link.href}" class="${linkClass}" ${onClick}>
                                ${link.label}
                            </a>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
    },

    handleNavClick(action) {
        if (action === 'logout') {
            Auth.logout();
        }
    },

    renderFooter() {
        const footer = document.querySelector('.glass-footer');
        if (!footer) return;

        const year = new Date().getFullYear();
        footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-col">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="about.html">About Us</a></li>
                        <li><a href="books.html">Browse Books</a></li>
                        <li><a href="https://drait.edu.in/">College Website</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact</h4>
                    <p>C. Byre Gowda Institute of Technology</p>
                    <p>Srinivasapura-Kolar Rd, Thoradevandahalli, Karnataka 563101</p>
                    <p>Email: library@cbitkolar.edu.in</p>
                    <p>Phone: +91-80-2345 6789</p>
                </div>
                <div class="footer-col">
                    <h4>Follow Us</h4>
                    <div class="social-links">
                        <a href="#"><img src="assets/icon-facebook.png" alt="Facebook"></a>
                        <a href="#"><img src="assets/icon-twitter.png" alt="Twitter"></a>
                        <a href="#"><img src="assets/icon-instagram.png" alt="Instagram"></a>
                        <a href="#"><img src="assets/icon-linkedin.png" alt="LinkedIn"></a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${year} C. Byre Gowda Institute of Technology. All rights reserved.</p>
            </div>
        `;
    },

    renderBookCard(book) {
        const available = book.quantity > 0;
        const user = Auth.getCurrentUser();
        
        return `
            <div class="book-card glass-card">
                <img src="${book.coverUrl || 'assets/bg-library.jpg'}" alt="${book.title}" class="book-cover" loading="lazy">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <p class="book-isbn">ISBN: ${book.isbn || 'N/A'}</p>
                <span class="book-status ${available ? 'available' : 'unavailable'}">
                    ${available ? `Available (${book.quantity})` : 'Out of Stock'}
                </span>
                <div class="book-actions">
                    ${available && user ? 
                        `<button onclick="UI.requestIssue('${book.id}')" class="btn-primary btn-block">
                            Request Issue
                        </button>` : 
                        `<button disabled class="btn-secondary btn-block">
                            ${available ? 'Login to Issue' : 'Unavailable'}
                        </button>`
                    }
                </div>
            </div>
        `;
    },

    requestIssue(bookId) {
        const user = Auth.getCurrentUser();
        if (!user) {
            App.showToast('Please login to issue books', 'error');
            window.location.href = 'login.html';
            return;
        }

        const book = App.findBookById(bookId);
        if (!book || book.quantity <= 0) {
            App.showToast('Book is not available', 'error');
            return;
        }

        try {
            App.issueBook(bookId, user.userId);
            App.showToast('Book requested successfully!');
            // Refresh the page to update availability
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    renderTransactionRow(transaction, tableId = 'transactionsTableBody') {
        const tbody = document.getElementById(tableId);
        if (!tbody) return;

        let fine = 0;
        if (transaction.status === 'issued') {
            const now = new Date();
            const dueDate = new Date(transaction.dueDate);
            if (now > dueDate) {
                const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
                fine = daysOverdue * 5; // ₹5 per day
            }
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.bookTitle}</td>
            <td>${transaction.userName}</td>
            <td>${transaction.userUSN}</td>
            <td>${App.formatDate(transaction.issueDate)}</td>
            <td>${App.formatDate(transaction.dueDate)}</td>
            <td>${transaction.returnDate ? App.formatDate(transaction.returnDate) : 'N/A'}</td>
            <td>
                <span class="status-badge status-${transaction.status}">
                    ${transaction.status.toUpperCase()}
                </span>
            </td>
            <td>${fine} ₹</td>
        `;
        
        tbody.appendChild(row);
    },

    showLoading(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="loading">${message}</div>`;
        }
    },

    showError(elementId, message = 'An error occurred') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="error-message">${message}</div>`;
        }
    },

    showEmpty(elementId, message = 'No data found') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="no-data">${message}</div>`;
        }
    }
};

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', () => {
    UI.renderNav();
});