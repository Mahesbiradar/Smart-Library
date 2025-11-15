const UI = {
    navConfig: {
        guest: [
            { label: 'Home', href: 'index.html' },
            { label: 'Books', href: 'books.html' },
            { label: 'About', href: 'about.html' },
            { label: 'Login', href: 'login.html' }
        ],
        student: [
            { label: 'Home', href: '../index.html' },
            { label: 'Books', href: '../books.html' },
            { label: 'About', href: '../about.html' },
            { label: 'Dashboard', href: 'dashboard.html' },
            { label: 'Profile', href: 'profile.html' },
            { label: 'Logout', href: '#', action: () => Auth.logout() }
        ],
        admin: [
            { label: 'Home', href: '../index.html' },
            { label: 'Books', href: '../books.html' },
            { label: 'About', href: '../about.html' },
            { label: 'Admin Dashboard', href: 'dashboard.html' },
            { label: 'Books Manager', href: 'books.html' },
            { label: 'Transactions', href: 'transactions.html' },
            { label: 'Issue/Return', href: 'issue-return.html' },
            { label: 'Logout', href: '#', action: () => Auth.logout() }
        ]
    },

    renderNav() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const user = Auth.getCurrentUser();
        const role = user ? user.role : 'guest';
        const links = this.navConfig[role];

        nav.innerHTML = `
            <div class="nav-brand">
                <a href="${role === 'admin' ? 'dashboard.html' : role === 'student' ? 'dashboard.html' : 'index.html'}">
                    <img src="assets/logo-icon.png" alt="Smart Library">
                    <span>Smart Library</span>
                </a>
            </div>
            <ul class="nav-links">
                ${links.map(link => `
                    <li>
                        <a href="${link.href}" class="${currentPage === link.href ? 'active' : ''}" ${link.action ? `onclick="event.preventDefault(); ${link.action.name}()"` : ''}>
                            ${link.label}
                        </a>
                    </li>
                `).join('')}
            </ul>
        `;
    },

    renderFooter() {
        const footer = document.querySelector('.glass-footer');
        if (!footer) return;

        const year = new Date().getFullYear();
        footer.innerHTML = 
            <div class="container">
                <div class="footer-content">
                    <div class="footer-col">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="index.html">Home</a></li>
                            <li><a href="about.html">About Us</a></li>
                            <li><a href="books.html">Browse Books</a></li>
                            <li><a href="https://drait.edu.in/ ">College Website</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h4>Contact</h4>
                        <p>Dr. Ambedkar Institute of Technology</p>
                        <p>Outer Ring Road, Bengaluru-560056</p>
                        <p>Email: library@drait.edu.in</p>
                        <p>Phone: +91-80-2345 6789</p>
                    </div>
                    <div class="footer-col">
                        <h4>Follow Us</h4>
                        <div class="social-links">
                            <a href="#"><img src="/assets/icon-facebook.png" alt="Facebook"></a>
                            <a href="#"><img src="/assets/icon-twitter.png" alt="Twitter"></a>
                            <a href="#"><img src="/assets/icon-instagram.png" alt="Instagram"></a>
                            <a href="#"><img src="/assets/icon-linkedin.png" alt="LinkedIn"></a>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${year} Dr. Ambedkar Institute of Technology. All rights reserved.</p>
                </div>
            </div>
        `;
    },

    renderBookCard(book) {
        const available = book.quantity > 0;
        return 
            <div class="book-card glass-card">
                <img src="${book.coverUrl || 'assets/book-placeholder.jpg'}" alt="${book.title}" class="book-cover" loading="lazy">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <p class="book-isbn">ISBN: ${book.isbn || 'N/A'}</p>
                <span class="book-status ${available ? 'available' : 'unavailable'}">
                    ${available ? `Available (${book.quantity})` : 'Out of Stock'}
                </span>
                <div class="book-actions">
                    ${available && Auth.getCurrentUser() ? 
                        `<button onclick="Pages.books.requestIssue('${book.id}')" class="btn-primary btn-block">
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

    renderTransactionRow(transaction) {
        let fine = 0;
        if (transaction.status === 'returned' && transaction.returnDate < transaction.dueDate) {
            const daysLate = Math.floor((new Date(transaction.returnDate) - new Date(transaction.dueDate)) / (1000 * 60 * 60 * 24));
            fine = daysLate * 5; // Assuming fine is ₹5 per day
        }

        const rowHTML = `
            <tr>
                <td>${transaction.id}</td>
                <td>${transaction.bookTitle}</td>
                <td>${transaction.userName}</td>
                <td>${transaction.userUSN}</td>
                <td>${transaction.issueDate}</td>
                <td>${transaction.dueDate}</td>
                <td>${transaction.returnDate || 'N/A'}</td>
                <td>${transaction.status}</td>
                <td>${fine} ₹</td>
            </tr>
        `;
        document.getElementById('transactionsTableBody').innerHTML += rowHTML;
    }
};