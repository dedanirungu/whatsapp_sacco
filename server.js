const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const exphbs = require('express-handlebars');

// Import database configuration
const sequelize = require('./config/database');
const routes = require('./routes');
const webRoutes = require('./routes/web_routes');
const whatsappController = require('./controllers/whatsappController');

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Set up Handlebars view engine
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: {
    formatDate: function(date) {
      return new Date(date).toLocaleDateString();
    },
    formatCurrency: function(amount) {
      return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      });
    },
    eq: function(a, b) {
      return a === b;
    }
  }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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

// API routes - JSON endpoints
app.use('/api', routes(client));

// Web routes - HTML views with Handlebars
app.use('/', webRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    message: 'Something went wrong!'
  });
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