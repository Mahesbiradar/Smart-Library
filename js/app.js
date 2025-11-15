/**
 * Smart Library - Core Application Logic
 * Data models, utilities, and localStorage management
 */

// ==================== DATA MODELS ====================

const App = {
    // Data storage keys
    KEYS: {
        USERS: 'sl_users',
        BOOKS: 'sl_books',
        TRANSACTIONS: 'sl_transactions',
        CURRENT_USER: 'sl_current_user',
        SESSION: 'sl_session'
    },

    // Default admin credentials
    ADMIN_CREDENTIALS: {
        email: 'admin@drait.edu.in',
        password: 'admin@1234'
    },

    // Initialize application data
    init() {
        this.initUsers();
        this.initBooks();
        this.initTransactions();
    },

    // User Management
    initUsers() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            const defaultUsers = [
                {
                    userId: 'admin-001',
                    name: 'Library Administrator',
                    email: this.ADMIN_CREDENTIALS.email,
                    usn: 'ADMIN001',
                    phone: '0000000000',
                    password: this.ADMIN_CREDENTIALS.password,
                    role: 'admin',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(defaultUsers));
        }
    },

    // Book Management
    initBooks() {
        if (!localStorage.getItem(this.KEYS.BOOKS)) {
            const defaultBooks = [
                {
                    id: 'BK001',
                    title: 'The Great Gatsby',
                    author: 'F. Scott Fitzgerald',
                    isbn: '978-0-7432-7356-5',
                    category: 'Classic Literature',
                    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
                    quantity: 3,
                    available: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'BK002',
                    title: 'Introduction to Algorithms',
                    author: 'Thomas H. Cormen',
                    isbn: '978-0-262-03384-8',
                    category: 'Computer Science',
                    coverUrl: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=400',
                    quantity: 5,
                    available: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'BK003',
                    title: 'Fundamentals of Electrical Circuits',
                    author: 'Alexander & Sadiku',
                    isbn: '978-0-07-338057-5',
                    category: 'Electrical Engineering',
                    coverUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400',
                    quantity: 4,
                    available: true,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem(this.KEYS.BOOKS, JSON.stringify(defaultBooks));
        }
    },

    // Transaction Management
    initTransactions() {
        if (!localStorage.getItem(this.KEYS.TRANSACTIONS)) {
            localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify([]));
        }
    },

    // ==================== CRUD OPERATIONS ====================

    // Users
    getUsers() {
        return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
    },

    saveUsers(users) {
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    },

    findUserByEmail(email) {
        return this.getUsers().find(user => user.email === email);
    },

    findUserByUSN(usn) {
        return this.getUsers().find(user => user.usn.toLowerCase() === usn.toLowerCase());
    },

    // Books
    getBooks() {
        return JSON.parse(localStorage.getItem(this.KEYS.BOOKS)) || [];
    },

    saveBooks(books) {
        localStorage.setItem(this.KEYS.BOOKS, JSON.stringify(books));
    },

    findBookById(id) {
        return this.getBooks().find(book => book.id === id);
    },

    findBookByISBN(isbn) {
        return this.getBooks().find(book => book.isbn === isbn);
    },

    searchBooks(query, category = '', availability = '') {
        const books = this.getBooks();
        const filtered = books.filter(book => {
            const matchesQuery = !query || 
                book.title.toLowerCase().includes(query.toLowerCase()) ||
                book.author.toLowerCase().includes(query.toLowerCase()) ||
                book.isbn.toLowerCase().includes(query.toLowerCase());
            
            const matchesCategory = !category || book.category === category;
            
            const matchesAvailability = !availability || 
                (availability === 'available' && book.quantity > 0);
            
            return matchesQuery && matchesCategory && matchesAvailability;
        });
        return filtered;
    },

    // Transactions
    getTransactions() {
        return JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS)) || [];
    },

    saveTransactions(transactions) {
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },

    generateTransactionId() {
        const transactions = this.getTransactions();
        const maxId = transactions.reduce((max, t) => {
            const num = parseInt(t.id.replace('TXN', ''));
            return Math.max(max, num);
        }, 0);
        return `TXN${String(maxId + 1).padStart(4, '0')}`;
    },

    generateBookId() {
        const books = this.getBooks();
        const maxId = books.reduce((max, book) => {
            const num = parseInt(book.id.replace('BK', ''));
            return Math.max(max, num);
        }, 0);
        return `BK${String(maxId + 1).padStart(3, '0')}`;
    },

    // ==================== TRANSACTION LOGIC ====================

    issueBook(bookId, userId) {
        const books = this.getBooks();
        const book = books.find(b => b.id === bookId);
        
        if (!book || book.quantity <= 0) {
            throw new Error('Book is not available');
        }

        const user = this.getUsers().find(u => u.userId === userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if user already has this book issued
        const existingTransaction = this.getTransactions().find(t => 
            t.bookId === bookId && 
            t.userId === userId && 
            t.status === 'issued'
        );
        
        if (existingTransaction) {
            throw new Error('User already has this book issued');
        }

        // Create transaction
        const transaction = {
            id: this.generateTransactionId(),
            bookId: book.id,
            bookTitle: book.title,
            userId: user.userId,
            userName: user.name,
            userUSN: user.usn,
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            returnDate: null,
            status: 'issued'
        };

        // Update book quantity
        book.quantity -= 1;
        book.available = book.quantity > 0;

        // Save changes
        this.saveBooks(books);
        const transactions = this.getTransactions();
        transactions.push(transaction);
        this.saveTransactions(transactions);

        return transaction;
    },

    returnBook(transactionId) {
        const transactions = this.getTransactions();
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.status !== 'issued') {
            throw new Error('Book is not currently issued');
        }

        // Update transaction
        transaction.returnDate = new Date().toISOString();
        transaction.status = 'returned';

        // Update book quantity
        const books = this.getBooks();
        const book = books.find(b => b.id === transaction.bookId);
        if (book) {
            book.quantity += 1;
            book.available = true;
        }

        // Save changes
        this.saveBooks(books);
        this.saveTransactions(transactions);

        return transaction;
    },

    calculateFine(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue <= 0) return 0;
        return daysOverdue * 5; // ₹5 per day
    },

    // ==================== UTILITIES ====================

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} toast`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            padding: 1rem 2rem;
            border-radius: 8px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    exportToCSV(data, filename) {
        if (!data.length) {
            this.showToast('No data to export', 'error');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header] ?? '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    importFromCSV(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
                data.push(obj);
            }
            callback(data);
        };
        reader.readAsText(file);
    }
};

// ==================== ANIMATIONS ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize app
App.init();