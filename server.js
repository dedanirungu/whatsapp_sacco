const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const exphbs = require('express-handlebars');

// Import database configuration
const sequelize = require('./config/database');
const { Member, Transaction, Loan, LoanPayment, Contribution, Message } = require('./models');
const routes = require('./routes');
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

// API routes
app.use('/api', routes(client));

// Web routes (Handlebars)
app.get('/', (req, res) => {
  res.render('home', {
    title: 'WhatsApp SACCO',
    activeHome: true
  });
});

app.get('/members', async (req, res) => {
  try {
    const members = await Member.findAll();
    res.render('members', {
      title: 'Members',
      members: members.map(member => member.toJSON()),
      activeMembers: true
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.render('members', {
      title: 'Members',
      error: 'Error fetching members',
      activeMembers: true
    });
  }
});

app.get('/members/:id', async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id, {
      include: [
        { model: Transaction },
        { model: Loan }
      ]
    });
    
    if (!member) {
      return res.render('error', {
        title: 'Error',
        message: 'Member not found'
      });
    }
    
    res.render('member-details', {
      title: `Member - ${member.name}`,
      member: member.toJSON(),
      activeMembers: true
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching member details'
    });
  }
});

app.get('/contributions', async (req, res) => {
  try {
    const contributions = await Contribution.findAll({
      include: [{ model: Member }]
    });
    res.render('contributions', {
      title: 'Contributions',
      contributions: contributions.map(contribution => contribution.toJSON()),
      activeContributions: true
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.render('contributions', {
      title: 'Contributions',
      error: 'Error fetching contributions',
      activeContributions: true
    });
  }
});

app.get('/loans', async (req, res) => {
  try {
    const loans = await Loan.findAll({
      include: [{ model: Member }]
    });
    res.render('loans', {
      title: 'Loans',
      loans: loans.map(loan => loan.toJSON()),
      activeLoans: true
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.render('loans', {
      title: 'Loans',
      error: 'Error fetching loans',
      activeLoans: true
    });
  }
});

app.get('/loans/:id', async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Member },
        { model: LoanPayment }
      ]
    });
    
    if (!loan) {
      return res.render('error', {
        title: 'Error',
        message: 'Loan not found'
      });
    }
    
    res.render('loan-details', {
      title: `Loan Details`,
      loan: loan.toJSON(),
      activeLoans: true
    });
  } catch (error) {
    console.error('Error fetching loan details:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching loan details'
    });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [{ model: Member }]
    });
    res.render('messages', {
      title: 'Messages',
      messages: messages.map(message => message.toJSON()),
      activeMessages: true
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.render('messages', {
      title: 'Messages',
      error: 'Error fetching messages',
      activeMessages: true
    });
  }
});

app.get('/whatsapp', (req, res) => {
  res.render('whatsapp', {
    title: 'WhatsApp Integration',
    activeWhatsapp: true
  });
});

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