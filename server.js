const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const sqlite3 = require("sqlite3").verbose();

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./sacco.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating members table', err.message);
      } else {
        console.log('Members table initialized');
      }
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members (id)
    )`, (err) => {
      if (err) {
        console.error('Error creating transactions table', err.message);
      } else {
        console.log('Transactions table initialized');
      }
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      loan_type TEXT NOT NULL,
      term_months INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP,
      description TEXT,
      FOREIGN KEY (member_id) REFERENCES members (id)
    )`, (err) => {
      if (err) {
        console.error('Error creating loans table', err.message);
      } else {
        console.log('Loans table initialized');
      }
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS loan_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans (id)
    )`, (err) => {
      if (err) {
        console.error('Error creating loan_payments table', err.message);
      } else {
        console.log('Loan payments table initialized');
      }
    });
  }
});

// Initialize WhatsApp client
const client = new Client();
let qrCodeData = null;

// WhatsApp client event handlers
client.on("qr", (qr) => {
  qrCodeData = qr;
  console.log("QR Code received. Scan with WhatsApp to login.");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp client is ready");
});

client.on("message", (message) => {
  console.log(`Message received: ${message.body}`);
});

// Initialize WhatsApp client
client.initialize().catch(err => {
  console.error("Error initializing WhatsApp client:", err);
});

// API routes
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express API" });
});

// Members API routes
app.get("/api/members", (req, res) => {
  db.all("SELECT * FROM members ORDER BY name", [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch members" });
    }
    res.json(rows);
  });
});

app.get("/api/members/:id", (req, res) => {
  db.get("SELECT * FROM members WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch member" });
    }
    if (!row) {
      return res.status(404).json({ error: "Member not found" });
    }
    res.json(row);
  });
});

app.post("/api/members", (req, res) => {
  const { phone, name } = req.body;
  
  if (!phone || !name) {
    return res.status(400).json({ error: "Phone and name are required" });
  }
  
  db.run("INSERT INTO members (phone, name) VALUES (?, ?)", [phone, name], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to create member" });
    }
    
    res.status(201).json({ id: this.lastID, phone, name });
  });
});

app.put("/api/members/:id", (req, res) => {
  const { phone, name } = req.body;
  
  if (!phone || !name) {
    return res.status(400).json({ error: "Phone and name are required" });
  }
  
  db.run("UPDATE members SET phone = ?, name = ? WHERE id = ?", [phone, name, req.params.id], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to update member" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Member not found" });
    }
    
    res.json({ id: parseInt(req.params.id), phone, name });
  });
});

app.delete("/api/members/:id", (req, res) => {
  db.run("DELETE FROM members WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to delete member" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Member not found" });
    }
    
    res.status(204).send();
  });
});

// Transactions API routes
app.get("/api/transactions", (req, res) => {
  db.all(`
    SELECT t.*, m.name as member_name, m.phone as member_phone 
    FROM transactions t
    JOIN members m ON t.member_id = m.id
    ORDER BY t.timestamp DESC
  `, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
    res.json(rows);
  });
});

// Loans API routes
app.get("/api/loans", (req, res) => {
  db.all(`
    SELECT l.*, m.name as member_name, m.phone as member_phone 
    FROM loans l
    JOIN members m ON l.member_id = m.id
    ORDER BY l.start_date DESC
  `, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch loans" });
    }
    res.json(rows);
  });
});

app.get("/api/loans/:id", (req, res) => {
  db.get(`
    SELECT l.*, m.name as member_name, m.phone as member_phone 
    FROM loans l
    JOIN members m ON l.member_id = m.id
    WHERE l.id = ?
  `, [req.params.id], (err, loan) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch loan" });
    }
    
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    
    // Get loan payments
    db.all("SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY payment_date DESC", 
      [req.params.id], 
      (err, payments) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: "Failed to fetch loan payments" });
        }
        
        // Calculate total paid
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        res.json({
          ...loan,
          payments,
          totalPaid,
          remainingBalance: loan.amount - totalPaid
        });
      }
    );
  });
});

app.post("/api/loans", (req, res) => {
  const { member_id, amount, interest_rate, loan_type, term_months, description } = req.body;
  
  if (!member_id || !amount || !interest_rate || !loan_type || !term_months) {
    return res.status(400).json({ 
      error: "Member ID, amount, interest rate, loan type, and term are required" 
    });
  }
  
  // Validate loan type
  if (!['reducing', 'fixed'].includes(loan_type)) {
    return res.status(400).json({ error: "Loan type must be 'reducing' or 'fixed'" });
  }
  
  // Calculate end date (start date + term months)
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + term_months);
  
  db.run(`
    INSERT INTO loans (
      member_id, amount, interest_rate, loan_type, 
      term_months, description, start_date, end_date
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, 
  [
    member_id, 
    amount, 
    interest_rate, 
    loan_type, 
    term_months, 
    description || "", 
    startDate.toISOString(), 
    endDate.toISOString()
  ], 
  function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to create loan" });
    }
    
    const loanId = this.lastID;
    
    // Create a transaction record for the loan disbursement
    db.run(
      "INSERT INTO transactions (member_id, amount, type, description) VALUES (?, ?, ?, ?)",
      [member_id, amount, "loan", `Loan disbursement (ID: ${loanId})`],
      function(err) {
        if (err) {
          console.error(err.message);
          // Continue even if transaction record fails
        }
        
        res.status(201).json({
          id: loanId,
          member_id,
          amount,
          interest_rate,
          loan_type,
          term_months,
          description: description || "",
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });
      }
    );
  });
});

app.put("/api/loans/:id", (req, res) => {
  const { status, description } = req.body;
  
  // Only allow updating status and description
  if (!status && !description) {
    return res.status(400).json({ error: "No valid fields to update" });
  }
  
  // Validate status if provided
  if (status && !['active', 'paid', 'defaulted', 'restructured'].includes(status)) {
    return res.status(400).json({ 
      error: "Status must be 'active', 'paid', 'defaulted', or 'restructured'" 
    });
  }
  
  let query = "UPDATE loans SET ";
  const params = [];
  
  if (status) {
    query += "status = ?";
    params.push(status);
  }
  
  if (description) {
    if (status) query += ", ";
    query += "description = ?";
    params.push(description);
  }
  
  query += " WHERE id = ?";
  params.push(req.params.id);
  
  db.run(query, params, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to update loan" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }
    
    res.json({ 
      id: parseInt(req.params.id), 
      status: status || undefined,
      description: description || undefined,
      updated: true 
    });
  });
});

app.post("/api/loans/:id/payments", (req, res) => {
  const { amount } = req.body;
  const loanId = req.params.id;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "A positive payment amount is required" });
  }
  
  // First verify the loan exists
  db.get("SELECT * FROM loans WHERE id = ?", [loanId], (err, loan) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch loan" });
    }
    
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    
    // Process the payment
    db.run(
      "INSERT INTO loan_payments (loan_id, amount) VALUES (?, ?)",
      [loanId, amount],
      function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: "Failed to record loan payment" });
        }
        
        const paymentId = this.lastID;
        
        // Create a transaction record for the loan payment
        db.run(
          "INSERT INTO transactions (member_id, amount, type, description) VALUES (?, ?, ?, ?)",
          [loan.member_id, amount, "repayment", `Loan payment (Loan ID: ${loanId})`],
          function(err) {
            if (err) {
              console.error(err.message);
              // Continue even if transaction record fails
            }
            
            // Get all payments to calculate if loan is fully paid
            db.all(
              "SELECT * FROM loan_payments WHERE loan_id = ?",
              [loanId],
              (err, payments) => {
                if (err) {
                  console.error(err.message);
                  // Return success even if we can't check payment status
                  return res.status(201).json({
                    id: paymentId,
                    loan_id: parseInt(loanId),
                    amount,
                    payment_date: new Date().toISOString()
                  });
                }
                
                // Calculate total paid
                const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
                
                // If fully paid, update loan status
                if (totalPaid >= loan.amount) {
                  db.run(
                    "UPDATE loans SET status = 'paid' WHERE id = ?",
                    [loanId],
                    (err) => {
                      if (err) {
                        console.error(err.message);
                      }
                    }
                  );
                }
                
                res.status(201).json({
                  id: paymentId,
                  loan_id: parseInt(loanId),
                  amount,
                  payment_date: new Date().toISOString(),
                  totalPaid,
                  remainingBalance: Math.max(0, loan.amount - totalPaid),
                  isFullyPaid: totalPaid >= loan.amount
                });
              }
            );
          }
        );
      }
    );
  });
});

app.get("/api/members/:id/loans", (req, res) => {
  const memberId = req.params.id;
  
  db.all(
    "SELECT * FROM loans WHERE member_id = ? ORDER BY start_date DESC",
    [memberId],
    (err, loans) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to fetch member loans" });
      }
      
      res.json(loans);
    }
  );
});

// Loan repayment schedule helper function
function calculateLoanSchedule(loan) {
  const { amount, interest_rate, term_months, loan_type } = loan;
  const monthlyInterestRate = interest_rate / 100 / 12;
  const schedule = [];
  
  if (loan_type === 'fixed') {
    // Simple interest calculation
    const monthlyPrincipal = amount / term_months;
    const monthlyInterest = amount * monthlyInterestRate;
    const monthlyPayment = monthlyPrincipal + monthlyInterest;
    
    let remainingBalance = amount;
    
    for (let month = 1; month <= term_months; month++) {
      const principalPaid = monthlyPrincipal;
      const interestPaid = monthlyInterest;
      
      remainingBalance -= principalPaid;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principalPaid,
        interestPaid,
        totalPaid: month * monthlyPayment,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }
  } else if (loan_type === 'reducing') {
    // Calculate payment using the formula for reducing balance
    // Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    // Where P = principal, r = interest rate per period, n = number of periods
    const monthlyPayment = amount * monthlyInterestRate * 
      Math.pow(1 + monthlyInterestRate, term_months) / 
      (Math.pow(1 + monthlyInterestRate, term_months) - 1);
    
    let remainingBalance = amount;
    
    for (let month = 1; month <= term_months; month++) {
      const interestPaid = remainingBalance * monthlyInterestRate;
      const principalPaid = monthlyPayment - interestPaid;
      
      remainingBalance -= principalPaid;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principalPaid,
        interestPaid,
        totalPaid: month * monthlyPayment,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }
  }
  
  return {
    schedule,
    totalPayment: schedule.reduce((sum, period) => sum + period.payment, 0),
    totalInterest: schedule.reduce((sum, period) => sum + period.interestPaid, 0),
    monthlyPayment: schedule[0].payment
  };
}

// Get loan repayment schedule
app.get("/api/loans/:id/schedule", (req, res) => {
  db.get("SELECT * FROM loans WHERE id = ?", [req.params.id], (err, loan) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch loan" });
    }
    
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    
    // Calculate loan schedule
    const schedule = calculateLoanSchedule(loan);
    
    // Get actual payments made
    db.all(
      "SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY payment_date ASC",
      [req.params.id],
      (err, payments) => {
        if (err) {
          console.error(err.message);
          // Return schedule even without payment history
          return res.json({
            loan,
            ...schedule
          });
        }
        
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        res.json({
          loan,
          ...schedule,
          actualPayments: payments,
          totalPaid,
          remainingBalance: Math.max(0, loan.amount - totalPaid)
        });
      }
    );
  });
});

app.get("/api/transactions/:id", (req, res) => {
  db.get(`
    SELECT t.*, m.name as member_name, m.phone as member_phone 
    FROM transactions t
    JOIN members m ON t.member_id = m.id
    WHERE t.id = ?
  `, [req.params.id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch transaction" });
    }
    if (!row) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(row);
  });
});

app.post("/api/transactions", (req, res) => {
  const { member_id, amount, type, description } = req.body;
  
  if (!member_id || !amount || !type) {
    return res.status(400).json({ error: "Member ID, amount, and type are required" });
  }
  
  // Validate transaction type
  const validTypes = ['deposit', 'withdrawal', 'loan', 'repayment'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid transaction type" });
  }
  
  db.run(
    "INSERT INTO transactions (member_id, amount, type, description) VALUES (?, ?, ?, ?)", 
    [member_id, amount, type, description || ""],
    function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to create transaction" });
      }
      
      res.status(201).json({ 
        id: this.lastID, 
        member_id, 
        amount, 
        type, 
        description: description || "",
        timestamp: new Date().toISOString()
      });
    }
  );
});

// Get member transactions
app.get("/api/members/:id/transactions", (req, res) => {
  db.all(
    "SELECT * FROM transactions WHERE member_id = ? ORDER BY timestamp DESC", 
    [req.params.id], 
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to fetch member transactions" });
      }
      res.json(rows);
    }
  );
});

// WhatsApp API routes
app.get("/api/whatsapp/qr", (req, res) => {
  if (qrCodeData) {
    res.json({ qrCode: qrCodeData });
  } else {
    res.status(404).json({ error: "QR code not available yet" });
  }
});

app.post("/api/whatsapp/send", async (req, res) => {
  try {
    const { number, message } = req.body;
    
    if (!number || !message) {
      return res.status(400).json({ error: "Number and message are required" });
    }
    
    // Format number to include WhatsApp format (add @ at the end)
    const formattedNumber = number.includes("@c.us") ? number : `${number}@c.us`;
    
    // Send the message
    const result = await client.sendMessage(formattedNumber, message);
    res.json({ success: true, messageId: result.id._serialized });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Send message to a member by ID
app.post("/api/members/:id/send", async (req, res) => {
  try {
    const { message } = req.body;
    const memberId = req.params.id;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Get member phone number
    db.get("SELECT phone FROM members WHERE id = ?", [memberId], async (err, row) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to fetch member" });
      }
      
      if (!row) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      try {
        // Format number and send message
        const formattedNumber = row.phone.includes("@c.us") ? row.phone : `${row.phone}@c.us`;
        const result = await client.sendMessage(formattedNumber, message);
        
        res.json({ success: true, messageId: result.id._serialized });
      } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send WhatsApp message" });
      }
    });
  } catch (error) {
    console.error("Error in member message route:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Send bulk message to all members or filtered by criteria
app.post("/api/members/bulk-send", async (req, res) => {
  try {
    const { message, filter } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Build query based on filter
    let query = "SELECT id, phone FROM members";
    const params = [];
    
    if (filter && Object.keys(filter).length > 0) {
      query += " WHERE ";
      const conditions = [];
      
      if (filter.name) {
        conditions.push("name LIKE ?");
        params.push(`%${filter.name}%`);
      }
      
      // Add more filter conditions as needed
      
      query += conditions.join(" AND ");
    }
    
    db.all(query, params, async (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to fetch members" });
      }
      
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "No members found matching criteria" });
      }
      
      const results = [];
      const errors = [];
      
      // Send messages in sequence to avoid rate limiting
      for (const member of rows) {
        try {
          const formattedNumber = member.phone.includes("@c.us") ? member.phone : `${member.phone}@c.us`;
          const result = await client.sendMessage(formattedNumber, message);
          results.push({
            memberId: member.id,
            messageId: result.id._serialized,
            success: true
          });
        } catch (error) {
          console.error(`Error sending message to ${member.phone}:`, error);
          errors.push({
            memberId: member.id,
            error: error.message
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      res.json({
        success: true,
        totalSent: results.length,
        totalFailed: errors.length,
        successDetails: results,
        failures: errors
      });
    });
  } catch (error) {
    console.error("Error in bulk message route:", error);
    res.status(500).json({ error: "Failed to process bulk message request" });
  }
});

// Send loan payment reminders to members with active loans
app.post("/api/loans/send-reminders", async (req, res) => {
  try {
    const { customMessage } = req.body;
    
    // Get all active loans with member information
    db.all(`
      SELECT l.*, m.name as member_name, m.phone as member_phone 
      FROM loans l
      JOIN members m ON l.member_id = m.id
      WHERE l.status = 'active'
      ORDER BY l.id
    `, [], async (err, loans) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to fetch active loans" });
      }
      
      if (!loans || loans.length === 0) {
        return res.status(404).json({ error: "No active loans found" });
      }
      
      const results = [];
      const errors = [];
      
      // Process each loan
      for (const loan of loans) {
        try {
          // Get all payments for this loan
          const payments = await new Promise((resolve, reject) => {
            db.all(
              "SELECT * FROM loan_payments WHERE loan_id = ?",
              [loan.id],
              (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
              }
            );
          });
          
          // Calculate total paid and remaining balance
          const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
          const remainingBalance = Math.max(0, loan.amount - totalPaid);
          
          // Calculate next payment amount based on loan type
          const loanSchedule = calculateLoanSchedule(loan);
          const nextPaymentAmount = loanSchedule.monthlyPayment;
          
          // Create reminder message
          let message = customMessage || 
            `Dear ${loan.member_name}, this is a reminder for your loan payment.\n\n` +
            `Loan ID: ${loan.id}\n` +
            `Loan Amount: ${loan.amount}\n` +
            `Total Paid: ${totalPaid.toFixed(2)}\n` +
            `Remaining Balance: ${remainingBalance.toFixed(2)}\n` +
            `Suggested Payment: ${nextPaymentAmount.toFixed(2)}\n\n` +
            `Please make your payment on time to maintain a good credit record.`;
          
          // Send the message
          const formattedNumber = loan.member_phone.includes("@c.us") ? 
            loan.member_phone : `${loan.member_phone}@c.us`;
          
          const result = await client.sendMessage(formattedNumber, message);
          
          results.push({
            loanId: loan.id,
            memberId: loan.member_id,
            memberName: loan.member_name,
            messageId: result.id._serialized,
            success: true
          });
        } catch (error) {
          console.error(`Error sending reminder for loan ${loan.id}:`, error);
          errors.push({
            loanId: loan.id,
            memberId: loan.member_id,
            memberName: loan.member_name,
            error: error.message
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      res.json({
        success: true,
        totalSent: results.length,
        totalFailed: errors.length,
        successDetails: results,
        failures: errors
      });
    });
  } catch (error) {
    console.error("Error in loan reminders route:", error);
    res.status(500).json({ error: "Failed to process loan reminders" });
  }
});

// Serve static Vue files
app.use(express.static(path.join(__dirname, "frontend", "dist")));

// For all other routes, serve the Vue app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Close database connection on server shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing SQLite database', err.message);
    } else {
      console.log('SQLite database connection closed');
    }
    server.close(() => {
      console.log('Server shut down');
      process.exit(0);
    });
  });
});
