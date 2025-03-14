const { createApp } = Vue;

createApp({
  data() {
    return {
      title: 'WhatsApp Sacco Application',
      message: 'Welcome to the WhatsApp Sacco Application',
      apiResponse: '',
      whatsappConnected: false,
      qrCodeData: null,
      phoneNumber: '',
      messageText: '',
      sendStatus: null,
      checkConnectionInterval: null
    }
  },
  mounted() {
    // Check WhatsApp connection status every 10 seconds
    this.checkConnectionInterval = setInterval(this.checkWhatsAppStatus, 10000);
    this.checkWhatsAppStatus();
  },
  beforeUnmount() {
    if (this.checkConnectionInterval) {
      clearInterval(this.checkConnectionInterval);
    }
  },
  methods: {
    // API call to test Express endpoint
    async callApi() {
      try {
        const response = await fetch('/api/hello');
        const data = await response.json();
        this.message = data.message;
      } catch (error) {
        console.error('Error calling API:', error);
        this.message = 'Error connecting to the API';
      }
    },
    
    // Check WhatsApp connection status
    async checkWhatsAppStatus() {
      try {
        const response = await fetch('/api/hello');
        if (response.ok) {
          // If the API is up, assume WhatsApp is working
          // In a real app, you would have a dedicated endpoint to check WhatsApp status
          this.whatsappConnected = true;
        } else {
          this.whatsappConnected = false;
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        this.whatsappConnected = false;
      }
    },
    
    // Fetch QR code from the server
    async fetchQrCode() {
      try {
        const response = await fetch('/api/whatsapp/qr');
        if (response.ok) {
          const data = await response.json();
          this.qrCodeData = data.qrCode;
          
          // Generate QR code using qrcode.js
          if (this.qrCodeData) {
            const qrCodeElement = document.getElementById('qrcode');
            qrCodeElement.innerHTML = '';
            
            QRCode.toCanvas(qrCodeElement, this.qrCodeData, {
              width: 200,
              margin: 1,
              color: {
                dark: '#128C7E',
                light: '#FFFFFF'
              }
            }, (error) => {
              if (error) console.error('Error generating QR code:', error);
            });
          }
        } else {
          console.error('QR code not available');
          alert('QR code not available yet. Please try again in a few moments.');
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
        alert('Error connecting to the server. Please try again later.');
      }
    },
    
    // Send WhatsApp message
    async sendWhatsAppMessage() {
      if (!this.phoneNumber || !this.messageText) {
        this.sendStatus = { 
          success: false, 
          message: 'Please enter both phone number and message'
        };
        return;
      }
      
      try {
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: this.phoneNumber,
            message: this.messageText
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          this.sendStatus = { 
            success: true, 
            message: 'Message sent successfully!'
          };
          // Clear message input after successful send
          this.messageText = '';
        } else {
          this.sendStatus = { 
            success: false, 
            message: data.error || 'Failed to send message'
          };
        }
      } catch (error) {
        console.error('Error sending message:', error);
        this.sendStatus = { 
          success: false, 
          message: 'Error connecting to the server'
        };
      }
    }
  }
}).mount('#app');