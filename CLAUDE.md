# WhatsApp Sacco Application Guidelines

## Commands
- Start server: `node server.js`
- Install dependencies: `npm install` 
- Install WhatsApp Web.js: `npm install whatsapp-web-js qrcode-terminal`
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
- WhatsApp Web.js integration for browser-based interaction instead of terminal
- QR code authentication handled through browser interface