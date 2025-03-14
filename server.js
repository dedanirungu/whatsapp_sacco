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
