const Admin = {
  dashboard: {
    init() {
      this.loadStats();
      this.loadRecentTransactions();
    },
    loadStats() {
      const books = App.getBooks();
      const transactions = App.getTransactions();
      const users = App.getUsers();
      const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);
      const issuedBooks = transactions.filter(
        (t) => t.status === "issued",
      ).length;
      const registeredUsers = users.filter((u) => u.role === "student").length;
      const overdueBooks = transactions.filter((t) => {
        return t.status === "issued" && new Date(t.dueDate) < new Date();
      }).length;
      document.getElementById("totalBooks").textContent = totalBooks;
      document.getElementById("issuedBooks").textContent = issuedBooks;
      document.getElementById("registeredUsers").textContent = registeredUsers;
      document.getElementById("overdueBooks").textContent = overdueBooks;
    },
    loadRecentTransactions() {
      const transactions = App.getTransactions()
        .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
        .slice(0, 10);
      const tbody = document.getElementById("recentTransactionsBody");
      tbody.innerHTML = "";
      if (transactions.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="no-data">No recent transactions.</td></tr>';
        return;
      }
      transactions.forEach((transaction) => {
        const row = `
                    <tr>
                        <td>${transaction.id}</td>
                        <td>${transaction.bookTitle}</td>
                        <td>${transaction.userName}</td>
                        <td>${transaction.userUSN}</td>
                        <td><span class="status-${transaction.status}">${transaction.status}</span></td>
                        <td>${App.formatDate(transaction.dueDate)}</td>
                    </tr>
                `;
        tbody.innerHTML += row;
      });
    },
  },
  books: {
    currentSort: { column: "title", direction: "asc" },
    init() {
      this.loadBooks();
      this.setupFilters();
      this.loadCategories();
      this.setupSorting();
    },
    loadBooks(searchQuery = "", category = "") {
      const books = App.getBooks();
      let filtered = books;
      if (searchQuery) {
        filtered = filtered.filter(
          (book) =>
            (book.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (book.author || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (book.isbn || "").toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }
      if (category) {
        filtered = filtered.filter((book) => book.category === category);
      }
      filtered.sort((a, b) => {
        let aVal = a[this.currentSort.column];
        let bVal = b[this.currentSort.column];
        if (this.currentSort.column === "quantity") {
          aVal = parseInt(aVal) || 0;
          bVal = parseInt(bVal) || 0;
        } else {
          aVal = (aVal || "").toString().toLowerCase();
          bVal = (bVal || "").toString().toLowerCase();
        }
        if (aVal < bVal) return this.currentSort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return this.currentSort.direction === "asc" ? 1 : -1;
        return 0;
      });
      const tbody = document.getElementById("booksTableBody");
      tbody.innerHTML = "";
      if (filtered.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="9" class="no-data">No books found.</td></tr>';
        return;
      }
      filtered.forEach((book) => {
        const row = `
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
        tbody.innerHTML += row;
      });
    },
    setupSorting() {
      const headers = document.querySelectorAll("#booksTable th[data-sort]");
      headers.forEach((header) => {
        header.style.cursor = "pointer";
        header.addEventListener("click", () => {
          const column = header.dataset.sort;
          if (this.currentSort.column === column) {
            this.currentSort.direction =
              this.currentSort.direction === "asc" ? "desc" : "asc";
          } else {
            this.currentSort.column = column;
            this.currentSort.direction = "asc";
          }
          this.updateSortIndicators();
          this.loadBooks();
        });
      });
      this.updateSortIndicators();
    },
    updateSortIndicators() {
      const headers = document.querySelectorAll("#booksTable th[data-sort]");
      headers.forEach((header) => {
        const column = header.dataset.sort;
        header.classList.remove("sort-asc", "sort-desc");
        if (column === this.currentSort.column) {
          header.classList.add(`sort-${this.currentSort.direction}`);
        }
      });
    },
    setupFilters() {
      const searchInput = document.getElementById("bookSearch");
      const categoryFilter = document.getElementById("categoryFilter");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          this.loadBooks(searchInput.value, categoryFilter?.value);
        });
      }
      if (categoryFilter) {
        categoryFilter.addEventListener("change", () => {
          this.loadBooks(searchInput?.value, categoryFilter.value);
        });
      }
    },
    loadCategories() {
      const books = App.getBooks();
      const categories = [...new Set(books.map((book) => book.category))];
      const categoryFilter = document.getElementById("categoryFilter");
      if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach((category) => {
          categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
        });
      }
    },
    showAddBookModal() {
      document.getElementById("bookId").value = "";
      document.getElementById("bookTitle").value = "";
      document.getElementById("bookAuthor").value = "";
      document.getElementById("bookISBN").value = "";
      document.getElementById("bookCategory").value = "";
      document.getElementById("bookQuantity").value = "";
      document.getElementById("bookCover").value = "";
      document.getElementById("modalTitle").textContent = "Add New Book";
      document.getElementById("bookModal").style.display = "flex";
    },
    editBook(bookId) {
      const book = App.findBookById(bookId);
      if (!book) return;
      document.getElementById("bookId").value = book.id;
      document.getElementById("bookTitle").value = book.title;
      document.getElementById("bookAuthor").value = book.author;
      document.getElementById("bookISBN").value = book.isbn || "";
      document.getElementById("bookCategory").value = book.category;
      document.getElementById("bookQuantity").value = book.quantity;
      document.getElementById("bookCover").value = book.coverUrl || "";
      document.getElementById("modalTitle").textContent = "Edit Book";
      document.getElementById("bookModal").style.display = "flex";
    },
    saveBook() {
      const form = document.getElementById("bookForm");
      const formData = new FormData(form);
      const bookData = {
        title: formData.get("bookTitle").trim(),
        author: formData.get("bookAuthor").trim(),
        isbn: formData.get("bookISBN").trim(),
        category: formData.get("bookCategory").trim(),
        quantity: parseInt(formData.get("bookQuantity")),
        coverUrl: formData.get("bookCover").trim(),
      };
      if (
        !bookData.title ||
        !bookData.author ||
        !bookData.category ||
        !bookData.quantity
      ) {
        App.showToast("Please fill all required fields", "error");
        return;
      }
      const bookId = document.getElementById("bookId").value;
      if (bookId) {
        const books = App.getBooks();
        const index = books.findIndex((b) => b.id === bookId);
        if (index !== -1) {
          books[index] = { ...books[index], ...bookData };
          App.saveBooks(books);
          App.showToast("Book updated successfully!");
        }
      } else {
        bookData.id = App.generateBookId();
        bookData.available = true;
        bookData.createdAt = new Date().toISOString();
        const books = App.getBooks();
        books.push(bookData);
        App.saveBooks(books);
        App.showToast("Book added successfully!");
      }
      this.closeModal();
      this.loadBooks();
    },
    deleteBook(bookId) {
      if (!confirm("Are you sure you want to delete this book?")) return;
      const books = App.getBooks();
      const filtered = books.filter((b) => b.id !== bookId);
      App.saveBooks(filtered);
      App.showToast("Book deleted successfully!");
      this.loadBooks();
    },
    closeModal() {
      document.getElementById("bookModal").style.display = "none";
    },
  },
  transactions: {
    init() {
      this.loadTransactions();
      this.setupFilters();
    },
    loadTransactions(searchQuery = "", status = "") {
      const transactions = App.getTransactions();
      let filtered = transactions;
      if (searchQuery) {
        filtered = filtered.filter(
          (t) =>
            (t.bookTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.userUSN || "").toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }
      if (status) {
        filtered = filtered.filter((t) => t.status === status);
      }
      filtered.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
      const tbody = document.getElementById("transactionsTableBody");
      tbody.innerHTML = "";
      if (filtered.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="10" class="no-data">No transactions found.</td></tr>';
        return;
      }
      filtered.forEach((transaction) => {
        const fine =
          transaction.status === "returned"
            ? App.calculateFine(transaction.dueDate)
            : 0;
        const row = `
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
        tbody.innerHTML += row;
      });
    },
    setupFilters() {
      const searchInput = document.getElementById("transactionSearch");
      const statusFilter = document.getElementById("statusFilter");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          this.loadTransactions(searchInput.value, statusFilter?.value);
        });
      }
      if (statusFilter) {
        statusFilter.addEventListener("change", () => {
          this.loadTransactions(searchInput?.value, statusFilter.value);
        });
      }
    },
    returnBook(transactionId) {
      if (!confirm("Confirm book return?")) return;
      try {
        const transaction = App.returnBook(transactionId);
        App.showToast("Book returned successfully!");
        this.loadTransactions();
      } catch (error) {
        App.showToast(error.message, "error");
      }
    },
  },
  issueReturn: {
    init() {
      // Scanner removed
    },
    searchBook() {
      const query = document.getElementById("bookSearch").value.trim();
      if (!query) return;
      const books = App.getBooks();
      const book = books.find(
        (b) =>
          (b.title || "").toLowerCase().includes(query.toLowerCase()) ||
          (b.id || "").toLowerCase().includes(query.toLowerCase()),
      );
      if (!book) {
        App.showToast("Book not found", "error");
        return;
      }
      this.selectBook(book);
    },
    selectBook(book) {
      const infoDiv = document.getElementById("selectedBookInfo");
      infoDiv.innerHTML = `
                <h4>${book.title}</h4>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>ID:</strong> ${book.id}</p>
                <p><strong>Available:</strong> ${book.quantity > 0 ? "Yes" : "No"}</p>
            `;
      document.getElementById("bookResults").style.display = "block";
      document.getElementById("issueBtn").disabled = book.quantity <= 0;
      document.getElementById("returnBtn").disabled = false;
      this.selectedBook = book;
    },
    searchStudent() {
      const query = document.getElementById("studentSearch").value.trim();
      if (!query) return;
      const users = App.getUsers();
      const student = users.find(
        (u) =>
          (u.name || "").toLowerCase().includes(query.toLowerCase()) ||
          (u.usn || "").toLowerCase().includes(query.toLowerCase()) ||
          (u.email || "").toLowerCase().includes(query.toLowerCase()),
      );
      if (!student) {
        document.getElementById("studentResults").innerHTML =
          "<p>No student found.</p>";
        return;
      }
      document.getElementById("studentResults").innerHTML = `
                <div class="student-card glass-card">
                    <h4>${student.name}</h4>
                    <p><strong>USN:</strong> ${student.usn}</p>
                    <p><strong>Email:</strong> ${student.email}</p>
                    <button onclick="Admin.issueReturn.selectStudent('${student.userId}')" class="btn btn-primary">Select</button>
                </div>
            `;
    },
    selectStudent(userId) {
      this.selectedStudent = App.getUsers().find((u) => u.userId === userId);
      document.getElementById("issueBtn").disabled =
        !this.selectedBook || this.selectedBook.quantity <= 0;
      document.getElementById("returnBtn").disabled = !this.selectedBook;
    },
    issueBook() {
      if (!this.selectedBook || !this.selectedStudent) {
        App.showToast("Please select both book and student", "error");
        return;
      }
      try {
        const transaction = App.issueBook(
          this.selectedBook.id,
          this.selectedStudent.userId,
        );
        App.showToast(
          `Book issued successfully! Due date: ${App.formatDate(transaction.dueDate)}`,
        );
        this.resetSelection();
      } catch (error) {
        App.showToast(error.message, "error");
      }
    },
    returnBook() {
      if (!this.selectedBook || !this.selectedStudent) {
        App.showToast("Please select both book and student", "error");
        return;
      }
      const transactions = App.getTransactions();
      const transaction = transactions.find(
        (t) =>
          t.bookId === this.selectedBook.id &&
          t.userId === this.selectedStudent.userId &&
          t.status === "issued",
      );
      if (!transaction) {
        App.showToast(
          "No issued transaction found for this book and student",
          "error",
        );
        return;
      }
      try {
        App.returnBook(transaction.id);
        App.showToast("Book returned successfully!");
        this.resetSelection();
      } catch (error) {
        App.showToast(error.message, "error");
      }
    },
    resetSelection() {
      this.selectedBook = null;
      this.selectedStudent = null;
      document.getElementById("bookResults").style.display = "none";
      document.getElementById("studentResults").innerHTML = "";
    },
  },
  importCSV() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        App.importFromCSV(file, (data) => {
          const books = App.getBooks();
          data.forEach((item) => {
            const book = {
              id: App.generateBookId(),
              title: item.title || "",
              author: item.author || "",
              isbn: item.isbn || "",
              category: item.category || "",
              quantity: parseInt(item.quantity) || 1,
              coverUrl: item.coverUrl || "",
              available: true,
              createdAt: new Date().toISOString(),
            };
            books.push(book);
          });
          App.saveBooks(books);
          App.showToast(`${data.length} books imported successfully!`);
          if (Admin.books && Admin.books.loadBooks) {
            Admin.books.loadBooks();
          }
        });
      }
    };
    input.click();
  },
  exportCSV() {
    const books = App.getBooks();
    App.exportToCSV(books, "books");
  },
  exportTransactionCSV() {
    const transactions = App.getTransactions();
    App.exportToCSV(transactions, "transactions");
  },
};
window.Admin = Admin;
