/**
 * Smart Library - Admin Panel Functionality
 * Books management, transactions, issue/return operations
 */

const Admin = {
    // ==================== DASHBOARD ====================
    dashboard: {
        init() {
            this.updateStats();
            this.loadRecentTransactions();
        },

        updateStats() {
            const books = App.getBooks();
            const transactions = App.getTransactions();
            const users = App.getUsers();

            // Total books
            const totalBooksEl = document.getElementById('totalBooks');
            if (totalBooksEl) totalBooksEl.textContent = books.length;

            // Currently issued books
            const issuedCount = transactions.filter(t => t.status === 'issued').length;
            const issuedBooksEl = document.getElementById('issuedBooks');
            if (issuedBooksEl) issuedBooksEl.textContent = issuedCount;

            // Registered users (excluding admin)
            const registeredUsers = users.filter(u => u.role === 'student').length;
            const registeredUsersEl = document.getElementById('registeredUsers');
            if (registeredUsersEl) registeredUsersEl.textContent = registeredUsers;

            // Overdue books
            const overdueCount = this.calculateOverdueBooks();
            const overdueBooksEl = document.getElementById('overdueBooks');
            if (overdueBooksEl) overdueBooksEl.textContent = overdueCount;

            // Available Copies = sum of all book quantities - sum of all issued books
            const totalQuantity = books.reduce((sum, book) => sum + book.quantity, 0);
            const availableCopies = totalQuantity - issuedCount;
            const availableCopiesEl = document.getElementById('availableCopies');
            if (availableCopiesEl) availableCopiesEl.textContent = availableCopies;

            // Total Categories
            const categories = [...new Set(books.map(book => book.category))];
            const totalCategoriesEl = document.getElementById('totalCategories');
            if (totalCategoriesEl) totalCategoriesEl.textContent = categories.length;
        },

        calculateOverdueBooks() {
            const transactions = App.getTransactions();
            const now = new Date();
            
            return transactions.filter(t => {
                if (t.status !== 'issued') return false;
                const dueDate = new Date(t.dueDate);
                return now > dueDate;
            }).length;
        },

        loadRecentTransactions() {
            const transactions = App.getTransactions()
                .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
                .slice(0, 10);

            const tbody = document.getElementById('recentTransactionsBody');
            tbody.innerHTML = '';

            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">No recent transactions.</td></tr>';
                return;
            }

            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                const fine = App.calculateFine(transaction.dueDate);
                
                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td>${transaction.bookTitle}</td>
                    <td>${transaction.userName}</td>
                    <td>${transaction.userUSN}</td>
                    <td>
                        <span class="status-badge status-${transaction.status}">
                            ${transaction.status.toUpperCase()}
                        </span>
                    </td>
                    <td>${App.formatDate(transaction.dueDate)}</td>
                `;
                
                tbody.appendChild(row);
            });
        }
    },

    // ==================== BOOKS MANAGEMENT ====================
    books: {
        init() {
            this.loadBooks();
            this.setupFilters();
            this.setupForm();
        },

        loadBooks() {
            const books = App.getBooks();
            const tbody = document.getElementById('booksTableBody');
            tbody.innerHTML = '';

            if (books.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="no-data">No books available.</td></tr>';
                return;
            }

            books.forEach(book => {
                const row = this.createBookRow(book);
                tbody.appendChild(row);
            });
        },

        createBookRow(book) {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <img src="${book.coverUrl || 'assets/book-placeholder.jpg'}" 
                         alt="${book.title}" class="book-thumbnail" loading="lazy">
                </td>
                <td>${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn || 'N/A'}</td>
                <td>${book.category}</td>
                <td>
                    <span class="availability-badge ${book.quantity > 0 ? 'available' : 'unavailable'}">
                        ${book.quantity > 0 ? `Yes (${book.quantity})` : 'No'}
                    </span>
                </td>
                <td>${book.quantity}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="Admin.books.editBook('${book.id}')" 
                                class="btn-sm btn-primary" title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button onclick="Admin.books.deleteBook('${book.id}')" 
                                class="btn-sm btn-danger" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            
            return row;
        },

        setupFilters() {
            const searchInput = document.getElementById('bookSearch');
            const categoryFilter = document.getElementById('categoryFilter');

            if (searchInput) {
                searchInput.addEventListener('input', () => this.filterBooks());
            }

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

                categoryFilter.addEventListener('change', () => this.filterBooks());
            }
        },

        filterBooks() {
            const searchTerm = document.getElementById('bookSearch')?.value.toLowerCase() || '';
            const category = document.getElementId('categoryFilter')?.value || '';
            
            const books = App.getBooks().filter(book => {
                const matchesSearch = !searchTerm || 
                    book.title.toLowerCase().includes(searchTerm) ||
                    book.author.toLowerCase().includes(searchTerm) ||
                    book.id.toLowerCase().includes(searchTerm);
                
                const matchesCategory = !category || book.category === category;
                
                return matchesSearch && matchesCategory;
            });

            const tbody = document.getElementById('booksTableBody');
            tbody.innerHTML = '';

            if (books.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="no-data">No books found matching your criteria.</td></tr>';
                return;
            }

            books.forEach(book => {
                const row = this.createBookRow(book);
                tbody.appendChild(row);
            });
        },

        setupForm() {
            const form = document.getElementById('bookForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveBook();
                });
            }
        },

        showAddBookModal() {
            document.getElementById('modalTitle').textContent = 'Add New Book';
            document.getElementById('bookId').value = '';
            document.getElementById('bookForm').reset();
            document.getElementById('bookModal').style.display = 'flex';
        },

        editBook(bookId) {
            const book = App.findBookById(bookId);
            if (!book) {
                App.showToast('Book not found', 'error');
                return;
            }

            document.getElementById('modalTitle').textContent = 'Edit Book';
            document.getElementById('bookId').value = book.id;
            document.getElementById('bookTitle').value = book.title;
            document.getElementById('bookAuthor').value = book.author;
            document.getElementById('bookISBN').value = book.isbn || '';
            document.getElementById('bookCategory').value = book.category;
            document.getElementById('bookQuantity').value = book.quantity;
            document.getElementById('bookCover').value = book.coverUrl || '';
            document.getElementById('bookModal').style.display = 'flex';
        },

        deleteBook(bookId) {
            if (!confirm('Are you sure you want to delete this book?')) {
                return;
            }

            const books = App.getBooks();
            const updatedBooks = books.filter(book => book.id !== bookId);
            
            App.saveBooks(updatedBooks);
            App.showToast('Book deleted successfully');
            this.loadBooks();
        },

        saveBook() {
            const bookId = document.getElementById('bookId').value;
            const title = document.getElementById('bookTitle').value.trim();
            const author = document.getElementById('bookAuthor').value.trim();
            const isbn = document.getElementById('bookISBN').value.trim();
            const category = document.getElementById('bookCategory').value.trim();
            const quantity = parseInt(document.getElementById('bookQuantity').value);
            const coverUrl = document.getElementById('bookCover').value.trim();

            if (!title || !author || !category || !quantity || quantity < 1) {
                App.showToast('Please fill all required fields', 'error');
                return;
            }

            const books = App.getBooks();
            
            if (bookId) {
                // Update existing book
                const bookIndex = books.findIndex(book => book.id === bookId);
                if (bookIndex !== -1) {
                    books[bookIndex] = {
                        ...books[bookIndex],
                        title,
                        author,
                        isbn,
                        category,
                        quantity,
                        coverUrl,
                        available: quantity > 0
                    };
                }
                App.showToast('Book updated successfully');
            } else {
                // Add new book
                const newBook = {
                    id: App.generateBookId(),
                    title,
                    author,
                    isbn,
                    category,
                    quantity,
                    coverUrl,
                    available: quantity > 0,
                    createdAt: new Date().toISOString()
                };
                books.push(newBook);
                App.showToast('Book added successfully');
            }

            App.saveBooks(books);
            this.closeModal();
            this.loadBooks();
        },

        closeModal() {
            document.getElementById('bookModal').style.display = 'none';
        },

        importCSV() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    App.importFromCSV(file, (data) => {
                        this.processCSVData(data);
                    });
                }
            };
            input.click();
        },

        processCSVData(data) {
            if (!data.length) {
                App.showToast('No data to import', 'error');
                return;
            }
            
            const books = App.getBooks();
            let added = 0;
            let errors = [];

            data.forEach((row, index) => {
                try {
                    if (!row.title || !row.author || !row.category) {
                        errors.push(`Row ${index + 1}: Missing required fields`);
                        return;
                    }

                    const newBook = {
                        id: App.generateBookId(),
                        title: row.title.trim(),
                        author: row.author.trim(),
                        isbn: row.isbn ? row.isbn.trim() : '',
                        category: row.category.trim(),
                        quantity: parseInt(row.quantity) || 1,
                        coverUrl: row.coverUrl ? row.coverUrl.trim() : '',
                        available: (parseInt(row.quantity) || 1) > 0,
                        createdAt: new Date().toISOString()
                    };

                    books.push(newBook);
                    added++;
                } catch (error) {
                    errors.push(`Row ${index + 1}: ${error.message}`);
                }
            });

            App.saveBooks(books);
            
            if (added > 0) {
                App.showToast(`${added} books imported successfully`);
                this.loadBooks();
            }
            
            if (errors.length > 0) {
                App.showToast(`${errors.length} rows had errors: ${errors.join(', ')}`, 'error');
            }
        },

        exportCSV() {
            const books = App.getBooks();
            if (books.length === 0) {
                App.showToast('No books to export', 'error');
                return;
            }

            const csvData = books.map(book => ({
                id: book.id,
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                category: book.category,
                quantity: book.quantity,
                available: book.available,
                coverUrl: book.coverUrl
            }));

            App.exportToCSV(csvData, 'books');
        }
    },

    // ==================== TRANSACTIONS ====================
    transactions: {
        init() {
            this.loadTransactions();
            this.setupFilters();
        },

        loadTransactions() {
            const transactions = App.getTransactions()
                .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

            const tbody = document.getElementById('transactionsTableBody');
            tbody.innerHTML = '';

            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="no-data">No transactions found.</td></tr>';
                return;
            }

            transactions.forEach(transaction => {
                const row = this.createTransactionRow(transaction);
                tbody.appendChild(row);
            });
        },

        createTransactionRow(transaction) {
            const row = document.createElement('tr');
            const fine = App.calculateFine(transaction.dueDate);
            const isOverdue = transaction.status === 'issued' && new Date() > new Date(transaction.dueDate);

            row.innerHTML = `
                <td>${transaction.id}</td>
                <td>${transaction.bookTitle}</td>
                <td>${transaction.userName}</td>
                <td>${transaction.userUSN}</td>
                <td>${App.formatDate(transaction.issueDate)}</td>
                <td>${App.formatDate(transaction.dueDate)}</td>
                <td>${transaction.returnDate ? App.formatDate(transaction.returnDate) : 'N/A'}</td>
                <td>
                    <span class="status-badge status-${transaction.status} ${isOverdue ? 'overdue' : ''}">
                        ${transaction.status.toUpperCase()}
                        ${isOverdue ? ' (OVERDUE)' : ''}
                    </span>
                </td>
                <td>${fine} ₹</td>
                <td>
                    <div class="action-buttons">
                        ${transaction.status === 'issued' ?
                            `<button onclick="Admin.transactions.forceReturn('${transaction.id}')"
                                    class="btn-sm btn-warning" title="Force Return">Force Return</button>` :
                            '<span class="text-muted">-</span>'
                        }
                        <button onclick="Admin.transactions.deleteTransaction('${transaction.id}')"
                                class="btn-sm btn-danger" title="Delete Transaction">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            `;

            return row;
        },

        setupFilters() {
            const searchInput = document.getElementById('transactionSearch');
            const statusFilter = document.getElementById('statusFilter');

            if (searchInput) {
                searchInput.addEventListener('input', () => this.filterTransactions());
            }

            if (statusFilter) {
                statusFilter.addEventListener('change', () => this.filterTransactions());
            }
        },

        filterTransactions() {
            const searchTerm = document.getElementById('transactionSearch')?.value.toLowerCase() || '';
            const status = document.getElementById('statusFilter')?.value || '';
            
            const transactions = App.getTransactions().filter(transaction => {
                const matchesSearch = !searchTerm || 
                    transaction.bookTitle.toLowerCase().includes(searchTerm) ||
                    transaction.userName.toLowerCase().includes(searchTerm) ||
                    transaction.userUSN.toLowerCase().includes(searchTerm) ||
                    transaction.id.toLowerCase().includes(searchTerm);
                
                const matchesStatus = !status || transaction.status === status;
                
                return matchesSearch && matchesStatus;
            });

            const tbody = document.getElementById('transactionsTableBody');
            tbody.innerHTML = '';

            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="no-data">No transactions found matching your criteria.</td></tr>';
                return;
            }

            transactions.forEach(transaction => {
                const row = this.createTransactionRow(transaction);
                tbody.appendChild(row);
            });
        },

        forceReturn(transactionId) {
            if (!confirm('Force return this book?')) {
                return;
            }

            try {
                App.returnBook(transactionId);
                App.showToast('Book returned successfully');
                if (document.getElementById('totalBooks')) {
                    Admin.dashboard.updateStats();
                }
                this.loadTransactions();
            } catch (error) {
                App.showToast(error.message, 'error');
            }
        },

        deleteTransaction(transactionId) {
            if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
                return;
            }

            try {
                const transactions = App.getTransactions();
                const updated = transactions.filter(t => t.id !== transactionId);
                App.saveTransactions(updated);
                App.showToast('Transaction deleted successfully');
                if (document.getElementById('totalBooks')) {
                    Admin.dashboard.updateStats();
                }
                this.loadTransactions();

            } catch (error) {
                App.showToast('Failed to delete transaction: ' + error.message, 'error');
            }
        },

        exportTransactionCSV() {
            const transactions = App.getTransactions();
            if (transactions.length === 0) {
                App.showToast('No transactions to export', 'error');
                return;
            }

            const csvData = transactions.map(transaction => ({
                transactionId: transaction.id,
                bookTitle: transaction.bookTitle,
                bookId: transaction.bookId,
                userName: transaction.userName,
                userUSN: transaction.userUSN,
                issueDate: transaction.issueDate,
                dueDate: transaction.dueDate,
                returnDate: transaction.returnDate || '',
                status: transaction.status,
                fine: App.calculateFine(transaction.dueDate)
            }));

            App.exportToCSV(csvData, 'transactions');
        }
    },

    // ==================== ISSUE/RETURN SYSTEM ====================
    issueReturn: {
        init() {
            this.scanner = null;
            this.selectedBook = null;
            this.selectedStudent = null;
            this.setupScanner();
            this.setupEventListeners();
        },

        setupEventListeners() {
            const bookSearch = document.getElementById('bookSearch');
            const studentSearch = document.getElementById('studentSearch');

            if (bookSearch) {
                bookSearch.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.searchBook();
                    }
                });
            }

            if (studentSearch) {
                studentSearch.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.searchStudent();
                    }
                });
            }
        },

        setupScanner() {
            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                document.getElementById('scannerError').style.display = 'block';
                return;
            }

            // Initialize scanner (this is a placeholder - you would need to integrate with a real barcode scanner library)
            this.scanner = {
                start: () => {
                    // Placeholder for scanner implementation
                    console.log('Scanner started');
                },
                stop: () => {
                    // Placeholder for scanner implementation
                    console.log('Scanner stopped');
                }
            };
        },

        searchBook() {
            const searchTerm = document.getElementById('bookSearch').value.trim();
            if (!searchTerm) {
                App.showToast('Please enter a search term', 'error');
                return;
            }

            const book = App.findBookById(searchTerm) || 
                        App.getBooks().find(b => 
                            b.title.toLowerCase().includes(searchTerm.toLowerCase())
                        );

            if (!book) {
                App.showToast('Book not found', 'error');
                return;
            }

            this.selectedBook = book;
            this.displayBookInfo(book);
        },

        displayBookInfo(book) {
            const bookInfo = `
                <div class="book-info">
                    <img src="${book.coverUrl || 'assets/book-placeholder.jpg'}" 
                         alt="${book.title}" class="book-cover">
                    <div class="book-details">
                        <h4>${book.title}</h4>
                        <p><strong>Author:</strong> ${book.author}</p>
                        <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
                        <p><strong>Available:</strong> ${book.quantity} copies</p>
                        <p><strong>Status:</strong> 
                            <span class="availability-badge ${book.quantity > 0 ? 'available' : 'unavailable'}">
                                ${book.quantity > 0 ? 'Available' : 'Out of Stock'}
                            </span>
                        </p>
                    </div>
                </div>
            `;

            document.getElementById('selectedBookInfo').innerHTML = bookInfo;
            document.getElementById('bookResults').style.display = 'block';
            
            // Enable/disable issue button based on availability
            document.getElementById('issueBtn').disabled = book.quantity <= 0;
            document.getElementById('returnBtn').disabled = true;
        },

        searchStudent() {
            const searchTerm = document.getElementById('studentSearch').value.trim();
            if (!searchTerm) {
                App.showToast('Please enter a search term', 'error');
                return;
            }

            const users = App.getUsers().filter(u => u.role === 'student');
            const student = users.find(u => 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.usn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (!student) {
                App.showToast('Student not found', 'error');
                document.getElementById('studentResults').innerHTML = '';
                return;
            }

            this.selectedStudent = student;
            this.displayStudentInfo(student);
        },

        displayStudentInfo(student) {
            const studentInfo = `
                <div class="student-card glass-card">
                    <h4>${student.name}</h4>
                    <p><strong>USN:</strong> ${student.usn}</p>
                    <p><strong>Email:</strong> ${student.email}</p>
                    <p><strong>Phone:</strong> ${student.phone}</p>
                </div>
            `;

            document.getElementById('studentResults').innerHTML = studentInfo;
            
            // Enable action buttons if both book and student are selected
            const issueBtn = document.getElementById('issueBtn');
            const returnBtn = document.getElementById('returnBtn');
            
            if (this.selectedBook && this.selectedBook.quantity > 0) {
                issueBtn.disabled = false;
            }
            returnBtn.disabled = false;
        },

        issueBook() {
            if (!this.selectedBook || !this.selectedStudent) {
                App.showToast('Please select both book and student', 'error');
                return;
            }

            if (this.selectedBook.quantity <= 0) {
                App.showToast('Book is not available', 'error');
                return;
            }

            try {
                App.issueBook(this.selectedBook.id, this.selectedStudent.userId);
                App.showToast('Book issued successfully');
                if (document.getElementById('totalBooks')) {
                    Admin.dashboard.updateStats();
                }
                this.resetForm();
                this.loadTransactions();
            } catch (error) {
                App.showToast(error.message, 'error');
            }
        },

        returnBook() {
            if (!this.selectedBook || !this.selectedStudent) {
                App.showToast('Please select both book and student', 'error');
                return;
            }

            // Find active transaction
            const transactions = App.getTransactions();
            const transaction = transactions.find(t => 
                t.bookId === this.selectedBook.id && 
                t.userId === this.selectedStudent.userId &&
                t.status === 'issued'
            );

            if (!transaction) {
                App.showToast('No active issue found for this book and student', 'error');
                return;
            }

            try {
                App.returnBook(transaction.id);
                App.showToast('Book returned successfully');
                if (document.getElementById('totalBooks')) {
                    Admin.dashboard.updateStats();
                }
                this.resetForm();
                this.loadTransactions();
            } catch (error) {
                App.showToast(error.message, 'error');
            }
        },

        resetForm() {
            this.selectedBook = null;
            this.selectedStudent = null;
            document.getElementById('bookSearch').value = '';
            document.getElementById('studentSearch').value = '';
            document.getElementById('selectedBookInfo').innerHTML = '';
            document.getElementById('studentResults').innerHTML = '';
            document.getElementById('bookResults').style.display = 'none';
        },

        loadTransactions() {
            // Refresh the transactions count on dashboard if on that page
            if (typeof Admin.dashboard !== 'undefined' && document.getElementById('totalBooks')) {
                Admin.dashboard.updateStats();
            }
        }
    }
};

// Initialize admin functionality
document.addEventListener('DOMContentLoaded', () => {
    // Admin functionality is initialized by individual page scripts
});