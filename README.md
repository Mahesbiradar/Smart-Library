# Smart Library Management System

A modern, full-stack web application for managing library operations with user authentication, book management, and transaction tracking.

## Features

### User Management

- **Student Registration**: USN-based registration with validation
- **Admin Login**: Pre-configured admin account (admin@drait.edu.in / admin@1234)
- **Session Management**: Persistent login sessions with localStorage
- **Password Reset**: Secure password reset using email and USN

### Book Management

- **Browse Books**: Search and filter by title, author, category, availability
- **Department-wise Organization**: Books organized by engineering departments
- **Real-time Availability**: Live stock tracking
- **Book Details**: ISBN, author, category, quantity information

### Admin Panel

- **Dashboard**: Overview of total books, issued books, users, overdue books
- **Books Manager**: Add, edit, delete books with CSV import/export
- **Transaction History**: Complete transaction logs with fine calculations
- **Issue/Return System**: Manual book issuing and returning with student search

### User Dashboard

- **Personal Transactions**: View issued books, due dates, return status
- **Profile Management**: Update personal information and change password
- **Book Statistics**: Issued count, overdue count

## Technical Stack

- **Frontend**: HTML5, CSS3 (Glassmorphism Design), Vanilla JavaScript
- **Backend**: JavaScript (localStorage-based data persistence)
- **Architecture**: Modular JS with separation of concerns
- **UI/UX**: Responsive design, modern glassmorphism aesthetic

## Project Structure

```
smart-library/
├── index.html              # Home page
├── login.html              # User login
├── register.html           # User registration
├── reset.html              # Password reset
├── books.html              # Book browsing
├── about.html              # About page
├── admin/                  # Admin panel
│   ├── dashboard.html
│   ├── books.html
│   ├── transactions.html
│   └── issue-return.html
├── user/                   # User pages
│   ├── dashboard.html
│   └── profile.html
├── js/                     # JavaScript modules
│   ├── app.js             # Core data models and utilities
│   ├── auth.js            # Authentication logic
│   ├── ui.js              # UI components and navigation
│   ├── admin.js           # Admin functionality
│   └── pages.js           # Page-specific logic
├── css/
│   └── styles.css         # Main stylesheet
├── assets/                # Images and media
└── README.md
```

## Key Components

### Data Models (app.js)

- User management with role-based access
- Book inventory with availability tracking
- Transaction history with fine calculations
- CSV import/export functionality

### Authentication (auth.js)

- Login/logout with session persistence
- Registration with USN validation
- Password reset functionality
- Route protection for admin/user pages

### UI Components (ui.js)

- Dynamic navigation based on user role
- Glassmorphism design system
- Responsive layout components
- Toast notifications

### Admin Module (admin.js)

- CRUD operations for books
- Transaction management
- CSV data handling
- Issue/return workflow

### Page Logic (pages.js)

- Home page initialization
- Books page with search/filter
- User dashboard and profile management

## Usage

1. **Start**: Open `index.html` in a web browser
2. **Register**: Create a student account with valid USN
3. **Login**: Access user dashboard or admin panel
4. **Admin Access**: Use admin@drait.edu.in / admin@1234

## Features Implemented

✅ User authentication and session management
✅ Book browsing with search and filters
✅ Admin dashboard with statistics
✅ Complete CRUD operations for books
✅ Transaction tracking and history
✅ Issue/return book functionality
✅ User profile management
✅ Responsive design for all devices
✅ Modern glassmorphism UI
✅ Data persistence with localStorage
✅ CSV import/export for books and transactions
✅ Role-based navigation and access control

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development Notes

- All data is stored in browser localStorage
- No server-side dependencies required
- Fully client-side application
- Modular JavaScript architecture
- CSS custom properties for theming

## Future Enhancements

- Barcode scanner integration (requires QuaggaJS library)
- Email notifications for due dates
- Advanced search with multiple filters
- Book reservation system
- Fine payment integration
- Multi-language support

---

**Developed for C. Byre Gowda Institute of Technology**
**Academic Project - Smart Library Management System**
