# WhatsApp Sacco Application Guidelines

## Commands
- Start server: `node server.js`
- Install dependencies: `npm install` 
- Install WhatsApp Web.js: `npm install whatsapp-web-js qrcode-terminal`
- Install SQLite: `npm install sqlite3`
- Run in development: `nodemon server.js` (requires: `npm install -g nodemon`)
- Test: Currently no tests specified

## Code Style
- **Imports:** Use CommonJS (`require()`) not ES Modules
- **Variables:** camelCase for variables, UPPERCASE for constants
- **Error Handling:** Use try/catch blocks with appropriate error responses
- **Routes:** Group by feature, document with comments
- **Formatting:** Use 2-space indentation
- **Functions:** Use arrow functions for callbacks
- **API Responses:** Consistent JSON structure with status codes
- **WhatsApp Events:** Use consistent naming for event handlers
- **Documentation:** Comment complex logic, document API endpoints

## Project Structure
- Backend Express API is in server.js
- Frontend built with Vue.js (expected in frontend/dist)
- Frontend styling with Tailwind CSS via CDN (https://cdn.tailwindcss.com)
- WhatsApp Web.js integration for browser-based interaction instead of terminal
- QR code authentication handled through browser interface
- SQLite database (sacco.db) for persistent storage

## CSS & Frontend
- Using Tailwind CSS via CDN instead of custom CSS
- Primary color for buttons: bg-green-500 hover:bg-green-600
- Card design: bg-white p-6 rounded-lg shadow-md
- Custom WhatsApp brand color: 'sacco-green': '#25D366'

## Database Schema

### Members Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `phone`: TEXT UNIQUE NOT NULL - Member's phone number 
- `name`: TEXT NOT NULL - Member's name
- `joined_date`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Transactions Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `member_id`: INTEGER NOT NULL - Foreign key to members.id
- `amount`: REAL NOT NULL - Transaction amount
- `type`: TEXT NOT NULL - Transaction type (deposit, withdrawal, loan, repayment)
- `description`: TEXT - Optional description
- `timestamp`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Loans Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `member_id`: INTEGER NOT NULL - Foreign key to members.id
- `amount`: REAL NOT NULL - Loan principal amount
- `interest_rate`: REAL NOT NULL - Annual interest rate percentage
- `loan_type`: TEXT NOT NULL - Either 'reducing' or 'fixed'
- `term_months`: INTEGER NOT NULL - Loan repayment period in months
- `status`: TEXT DEFAULT 'active' - Loan status (active, paid, defaulted, restructured)
- `start_date`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP - When the loan was issued
- `end_date`: TIMESTAMP - Expected completion date
- `description`: TEXT - Optional description

### Loan Payments Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `loan_id`: INTEGER NOT NULL - Foreign key to loans.id
- `amount`: REAL NOT NULL - Payment amount
- `payment_date`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP - When payment was made

### Contributions Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `member_id`: INTEGER NOT NULL - Foreign key to members.id
- `amount`: REAL NOT NULL - Contribution amount
- `reason`: TEXT - Optional reason for contribution
- `timestamp`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP - When contribution was made

### Messages Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `member_id`: INTEGER NOT NULL - Foreign key to members.id
- `message`: TEXT NOT NULL - Message content
- `timestamp`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP - When message was created

## API Endpoints

### Members
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get a single member
- `POST /api/members` - Create a new member
- `PUT /api/members/:id` - Update a member
- `DELETE /api/members/:id` - Delete a member
- `GET /api/members/:id/transactions` - Get a member's transactions
- `GET /api/members/:id/loans` - Get a member's loans
- `POST /api/members/:id/send` - Send WhatsApp message to a member
- `POST /api/members/bulk-send` - Send bulk WhatsApp messages to members

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get a single transaction
- `POST /api/transactions` - Create a new transaction

### Loans
- `GET /api/loans` - Get all loans
- `GET /api/loans/:id` - Get a single loan with payment history
- `POST /api/loans` - Create a new loan
- `PUT /api/loans/:id` - Update loan status or description
- `GET /api/loans/:id/schedule` - Get loan repayment schedule
- `POST /api/loans/:id/payments` - Make a payment on a loan
- `POST /api/loans/send-reminders` - Send payment reminders to all active loans

### Contributions
- `GET /api/contributions` - Get all contributions
- `GET /api/contributions/:id` - Get a single contribution
- `POST /api/contributions` - Create a new contribution
- `GET /api/contributions/member/:member_id` - Get a member's contributions

### Messages
- `GET /api/messages` - Get all messages
- `GET /api/messages/:id` - Get a single message
- `POST /api/messages` - Create a new message
- `GET /api/messages/member/:member_id` - Get a member's messages

### WhatsApp
- `GET /api/whatsapp/qr` - Get QR code for WhatsApp authentication
- `POST /api/whatsapp/send` - Send a WhatsApp message