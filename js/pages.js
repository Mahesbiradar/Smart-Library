// pages.js
// Handles page-specific logic and UI updates

const Pages = {
    home: {
        init: function() {
            console.log("Home page initialized.");
            // Load and display home page specific content
            document.getElementById('welcomeMessage').textContent = "Welcome to Smart Library!";
        }
    },
    about: {
        init: function() {
            console.log("About page initialized.");
            // Load and display about page specific content
            document.getElementById('aboutContent').textContent = "This is the about us page of Smart Library.";
        }
    },
    books: {
        init: function() {
            console.log("Books page initialized.");
            // Load books from storage and display them
            const books = App.getBooks();
            const booksContainer = document.getElementById('booksGrid');
            booksContainer.innerHTML = ''; // Clear existing content

            books.forEach(book => {
                const bookCard = UI.renderBookCard(book);
                booksContainer.innerHTML += bookCard;
            });

            if (books.length === 0) {
                booksContainer.innerHTML = '<p>No books available.</p>';
            }
        }
    },
    userDashboard: {
        init: function() {
            console.log("User Dashboard initialized.");
            this.loadStats();
            this.loadTransactions();
        },
        loadStats: function() {
            const user = Auth.getCurrentUser();
            const transactions = App.getTransactions();
            const userTransactions = transactions.filter(t => t.userId === user.userId);
            const issuedCount = userTransactions.filter(t => t.status === 'issued').length;
            const overdueCount = userTransactions.filter(t => t.status === 'issued' && new Date(t.dueDate) < new Date()).length;

            document.getElementById('issuedCount').textContent = issuedCount;
            document.getElementById('overdueCount').textContent = overdueCount;
        },
        loadTransactions: function() {
            const user = Auth.getCurrentUser();
            const transactions = App.getTransactions().filter(t => t.userId === user.userId);
            const transactionTableBody = document.getElementById('transactionsBody');
            transactionTableBody.innerHTML = ''; // Clear existing content

            if (transactions.length === 0) {
                transactionTableBody.innerHTML = '<tr><td colspan="6" class="no-data">No transactions yet.</td></tr>';
                return;
            }

            transactions.forEach(transaction => {
                const rowHTML = `
                    <tr>
                        <td>${transaction.id}</td>
                        <td>${transaction.bookTitle}</td>
                        <td>${App.formatDate(transaction.issueDate)}</td>
                        <td>${App.formatDate(transaction.dueDate)}</td>
                        <td>${transaction.status}</td>
                        <td>
                            ${transaction.status === 'issued' ? `<button onclick="Pages.userDashboard.returnBook('${transaction.id}')" class="btn btn-warning">Return</button>` : 'N/A'}
                        </td>
                    </tr>
                `;
                transactionTableBody.innerHTML += rowHTML;
            });
        },
        returnBook: function(transactionId) {
            if (!confirm('Are you sure you want to return this book?')) return;
            try {
                const transaction = App.returnBook(transactionId);
                App.showToast('Book returned successfully!');
                this.loadTransactions();
            } catch (error) {
                App.showToast(error.message, 'error');
            }
        }
    },
    userProfile: {
        init: function() {
            console.log("User Profile initialized.");
            // Load user profile data
            const user = Auth.getCurrentUser();
            document.getElementById('userFullName').textContent = user.name;
            document.getElementById('userUSN').textContent = `USN: ${user.usn}`;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userPhone').value = user.phone;
        },
        updateProfile: function() {
            const name = document.getElementById('profileName').value;
            const phone = document.getElementById('profilePhone').value;
            const user = Auth.getCurrentUser();
            user.name = name;
            user.phone = phone;
            Auth.updateCurrentUser(user);
            alert('Profile updated successfully.');
            window.location.href = 'user/dashboard.html'; // Redirect to dashboard
        }
    },
    adminDashboard: {
        init: function() {
            console.log("Admin Dashboard initialized.");
            // Load admin dashboard data
            const transactions = App.getTransactions().sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate)).slice(0, 10);
            const recentTransactions = document.getElementById('recentTransactionsBody');
            recentTransactions.innerHTML = ''; // Clear existing content

            if (transactions.length === 0) {
                recentTransactions.innerHTML = '<tr><td colspan="6" class="no-data">No recent transactions.</td></tr>';
                return;
            }

            transactions.forEach(transaction => {
                const rowHTML = `
                    <tr>
                        <td>${transaction.id}</td>
                        <td>${transaction.bookTitle}</td>
                        <td>${transaction.userName}</td>
                        <td>${transaction.userUSN}</td>
                        <td><span class="status-${transaction.status}">${transaction.status}</span></td>
                        <td>${App.formatDate(transaction.dueDate)}</td>
                    </tr>
                `;
                recentTransactions.innerHTML += rowHTML;
            });
        }
    },
    adminBooks: {
        init: function() {
            console.log("Admin Books initialized.");
            // Load books from storage and display them
            const books = App.getBooks();
            const booksContainer = document.getElementById('booksTableBody');
            booksContainer.innerHTML = ''; // Clear existing content

            if (books.length === 0) {
                booksContainer.innerHTML = '<tr><td colspan="9" class="no-data">No books available.</td></tr>';
                return;
            }

            books.forEach(book => {
                const rowHTML = `
                    <tr>
                        <td><img src="${book.coverUrl || "assets/book-placeholder.jpg"}" alt="${book.title}" class="book-thumb"></td>
                        <td>${book.id}</td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.isbn || "N/A"}</td>
                        <td>${book.category}</td>
                        <td>${book.quantity > 0 ? "Yes" : "No"}</td>
                        <td>${book.quantity}</td>
                        <td>
                            <button onclick="Admin.books.editBook('${book.id}')" class="btn btn-warning">Edit</button>
                            <button onclick="Admin.books.deleteBook('${book.id}')" class="btn btn-danger">Delete</button>
                        </td>
                    </tr>
                `;
                booksContainer.innerHTML += rowHTML;
            });
        }
    },
    adminTransactions: {
        init: function() {
            console.log("Admin Transactions initialized.");
            // Load transactions from storage and display them
            const transactions = App.getTransactions().sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
            const transactionsTableBody = document.getElementById('transactionsTableBody');
            transactionsTableBody.innerHTML = ''; // Clear existing content

            if (transactions.length === 0) {
                transactionsTableBody.innerHTML = '<tr><td colspan="10" class="no-data">No transactions yet.</td></tr>';
                return;
            }

            transactions.forEach(transaction => {
                const fine = transaction.status === "returned" ? App.calculateFine(transaction.dueDate) : 0;
                const rowHTML = `
                    <tr>
                        <td>${transaction.id}</td>
                        <td>${transaction.bookTitle}</td>
                        <td>${transaction.userName}</td>
                        <td>${transaction.userUSN}</td>
                        <td>${App.formatDate(transaction.issueDate)}</td>
                        <td>${App.formatDate(transaction.dueDate)}</td>
                        <td>${transaction.returnDate ? App.formatDate(transaction.returnDate) : "N/A"}</td>
                        <td><span class="status-${transaction.status}">${transaction.status}</span></td>
                        <td>${fine > 0 ? `₹${fine}` : "N/A"}</td>
                        <td>
                            ${transaction.status === "issued" ? `<button onclick="Admin.transactions.returnBook('${transaction.id}')" class="btn btn-warning">Return</button>` : "N/A"}
                        </td>
                    </tr>
                `;
                transactionsTableBody.innerHTML += rowHTML;
            });
        }
    },
    adminIssueReturn: {
        init: function() {
            console.log("Admin Issue/Return initialized.");
            // Scanner removed, manual search only
        }
    }
};

// Initialize pages on page load
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const pageInitFunction = (Pages[page] && Pages[page].init) || (() => { console.log(`No init function found for ${page}`); });
    pageInitFunction();
});