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
            const books = JSON.parse(localStorage.getItem('books')) || [];
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
            // Load user dashboard data
            const userTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
            const transactionTableBody = document.getElementById('transactionsBody');
            transactionTableBody.innerHTML = ''; // Clear existing content

            userTransactions.forEach(transaction => {
                if (transaction.userName === Auth.getCurrentUser().name) {
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
                            <td>
                                <button onclick="Pages.userDashboard.returnBook('${transaction.id}')">Return</button>
                            </td>
                        </tr>
                    `;
                    transactionTableBody.innerHTML += rowHTML;
                }
            });

            if (transactionTableBody.innerHTML === '') {
                transactionTableBody.innerHTML = '<tr><td colspan="6">No transactions yet.</td></tr>';
            }
        },
        returnBook: function(transactionId) {
            const transaction = JSON.parse(localStorage.getItem('transactions'))).find(t => t.id === transactionId);
            if (transaction && transaction.status === 'issued') {
                transaction.status = 'returned';
                transaction.returnDate = new Date().toISOString();
                localStorage.setItem('transactions', JSON.stringify(transactions));
                alert('Book returned successfully.');
                window.location.href = 'user/dashboard.html'; // Redirect to dashboard
            } else {
                alert('This book is not currently issued to you.');
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
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            const recentTransactions = document.getElementById('recentTransactions');
            recentTransactions.innerHTML = ''; // Clear existing content

            transactions.forEach(transaction => {
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
                    </tr>
                `;
                recentTransactions.innerHTML += rowHTML;
            });

            if (recentTransactions.innerHTML === '') {
                recentTransactions.innerHTML = '<tr><td colspan="6">No recent transactions.</td></tr>';
            }
        }
    },
    adminBooks: {
        init: function() {
            console.log("Admin Books initialized.");
            // Load books from storage and display them
            const books = JSON.parse(localStorage.getItem('books')) || [];
            const booksContainer = document.getElementById('booksTableBody');
            booksContainer.innerHTML = ''; // Clear existing content

            books.forEach(book => {
                const rowHTML = `
                    <tr>
                        <td>${book.id}</td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.isbn}</td>
                        <td>${book.category}</td>
                        <td>${book.available ? 'Yes' : 'No'}</td>
                        <td>${book.quantity}</td>
                        <td><button onclick="Admin.editBook('${book.id}')">Edit</button>
                        <td>
                    </tr>
                `;
                booksContainer.innerHTML += rowHTML;
            });

            if (books.length === 0) {
                booksContainer.innerHTML = '<tr><td colspan="8">No books available.</td></tr>';
            }
        }
    },
    adminTransactions: {
        init: function() {
            console.log("Admin Transactions initialized.");
            // Load transactions from storage and display them
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            const transactionsTableBody = document.getElementById('transactionsTableBody');
            transactionsTableBody.innerHTML = ''; // Clear existing content

            transactions.forEach(transaction => {
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
                        <td>${transaction.fine} ₹</td>
                    </tr>
                `;
                transactionsTableBody.innerHTML += rowHTML;
            });

            if (transactionsTableBody.innerHTML === '') {
                transactionsTableBody.innerHTML = '<tr><td colspan="7">No transactions yet.</td></tr>';
            }
        }
    },
    adminIssueReturn: {
        init: function() {
            console.log("Admin Issue/Return initialized.");
            // Load books and transactions for issue/return
            const books = JSON.parse(localStorage.getItem('books')) || [];
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            const scannerResult = document.getElementById('scannerResult');
            const issueBtn = document.getElementById('issueBtn');
            const returnBtn = document.getElementById('returnBtn');

            scannerResult.textContent = ''; // Clear previous scan result
            issueBtn.disabled = true;
            returnBtn.disabled = true;

            document.getElementById('scanner').addEventListener('scan', (result) => {
                const bookId = result.content;
                const book = books.find(b => b.id === bookId);
                if (book) {
                    scannerResult.textContent = `Scanned: ${book.title}`;
                    issueBtn.disabled = false;
                    issueBtn.onclick = () => Admin.issueBook(book.id, Auth.getCurrentUser().id);
                } else {
                    scannerResult.textContent = 'Book not found.';
                }
            });
        }
    }
};

// Initialize pages on page load
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const pageInitFunction = Pages[page] && Pages[page].init || () => { console.log(`No init function found for ${page}`); };
    pageInitFunction();
});