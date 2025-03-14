const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

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

// Serve static Vue files
app.use(express.static(path.join(__dirname, "frontend", "dist")));

// For all other routes, serve the Vue app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
