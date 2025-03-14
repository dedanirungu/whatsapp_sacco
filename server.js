const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Import database configuration
const sequelize = require('./config/database');
const { Member, Transaction, Loan, LoanPayment } = require('./models');
const routes = require('./routes');
const whatsappController = require('./controllers/whatsappController');

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize WhatsApp client
const client = new Client();

// WhatsApp client event handlers
client.on('qr', (qr) => {
  // Store QR code data for API access
  whatsappController.setQRCode(qr);
  console.log('QR Code received. Scan with WhatsApp to login.');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp client is ready');
});

client.on('message', (message) => {
  console.log(`Message received: ${message.body}`);
});

// Initialize WhatsApp client
client.initialize().catch(err => {
  console.error('Error initializing WhatsApp client:', err);
});

// Mount API routes
app.use('/api', routes(client));

// Serve static Vue files from dist directory
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Handle history API for Vue Router
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express API' });
});

// For all other routes, serve the Vue app (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Sync database models and start server
const PORT = process.env.PORT || 3000;

// Create tables if they don't exist
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database & tables synced');
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server shut down');
        process.exit(0);
      });
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });