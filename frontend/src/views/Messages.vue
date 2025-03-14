<template>
  <div class="messages">
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">WhatsApp Messages</h1>
        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" @click="showSendMessageModal = true">
          Send Message
        </button>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-bold mb-4">WhatsApp Status</h2>
        <div v-if="whatsappStatus === 'connected'" class="text-green-600 flex items-center">
          <span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          Connected
        </div>
        <div v-else-if="whatsappStatus === 'connecting'" class="text-yellow-600 flex items-center">
          <span class="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
          Connecting...
        </div>
        <div v-else class="space-y-4">
          <div class="text-red-600 flex items-center">
            <span class="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Not Connected
          </div>
          <button @click="getQrCode" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Connect WhatsApp
          </button>
          <div v-if="qrCode" class="mt-4">
            <p class="mb-2">Scan this QR code with your WhatsApp to connect:</p>
            <div class="p-4 bg-gray-100 inline-block">
              <pre>{{ qrCode }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-bold mb-4">Message History</h2>
        <div v-if="loading" class="text-center py-4">
          <p>Loading messages...</p>
        </div>
        
        <div v-else-if="error" class="text-center py-4 text-red-500">
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="messages.length === 0" class="text-center py-4">
          <p>No messages sent yet.</p>
        </div>
        
        <div v-else class="space-y-4">
          <div v-for="message in messages" :key="message.id" class="border p-4 rounded-lg">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-bold">{{ message.Member ? message.Member.name : 'Unknown' }}</p>
                <p class="text-gray-600">{{ message.Member ? message.Member.phone : 'Unknown' }}</p>
              </div>
              <p class="text-sm text-gray-500">{{ new Date(message.timestamp).toLocaleString() }}</p>
            </div>
            <p class="mt-2">{{ message.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Send Message Modal -->
    <div v-if="showSendMessageModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Send WhatsApp Message</h2>
        <form @submit.prevent="sendMessage">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Send To</label>
            <div class="flex items-center space-x-4">
              <label class="inline-flex items-center">
                <input type="radio" v-model="messageType" value="single" class="form-radio">
                <span class="ml-2">Single Member</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="messageType" value="bulk" class="form-radio">
                <span class="ml-2">All Members</span>
              </label>
            </div>
          </div>

          <div v-if="messageType === 'single'" class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="member">Member</label>
            <select id="member" v-model="newMessage.member_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
              <option value="">Select a member</option>
              <option v-for="member in members" :key="member.id" :value="member.id">{{ member.name }} ({{ member.phone }})</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="message">Message</label>
            <textarea id="message" v-model="newMessage.message" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32" required></textarea>
          </div>
          
          <div class="flex justify-end">
            <button type="button" @click="showSendMessageModal = false" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2">Cancel</button>
            <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Send</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
module.exports = {
  name: 'Messages',
  data() {
    return {
      messages: [],
      members: [],
      loading: true,
      error: null,
      whatsappStatus: 'disconnected',
      qrCode: null,
      showSendMessageModal: false,
      messageType: 'single',
      newMessage: {
        member_id: '',
        message: ''
      }
    }
  },
  created() {
    this.fetchMessages()
    this.fetchMembers()
    this.checkWhatsappStatus()
  },
  methods: {
    async fetchMessages() {
      this.loading = true
      try {
        const response = await fetch('/api/messages')
        if (!response.ok) {
          throw new Error('Failed to fetch messages')
        }
        const data = await response.json()
        this.messages = data
        this.error = null
      } catch (err) {
        console.error('Error fetching messages:', err)
        this.error = 'Failed to load messages. Please try again.'
      } finally {
        this.loading = false
      }
    },
    async fetchMembers() {
      try {
        const response = await fetch('/api/members')
        if (!response.ok) {
          throw new Error('Failed to fetch members')
        }
        const data = await response.json()
        this.members = data
      } catch (err) {
        console.error('Error fetching members:', err)
      }
    },
    async checkWhatsappStatus() {
      try {
        // This is a placeholder. You may need to create an endpoint
        // to check WhatsApp connection status
        const response = await fetch('/api/whatsapp/status')
        if (response.ok) {
          const data = await response.json()
          this.whatsappStatus = data.status
        }
      } catch (err) {
        console.error('Error checking WhatsApp status:', err)
      }
    },
    async getQrCode() {
      try {
        const response = await fetch('/api/whatsapp/qr')
        if (!response.ok) {
          throw new Error('Failed to get QR code')
        }
        const data = await response.json()
        this.qrCode = data.qr
      } catch (err) {
        console.error('Error getting QR code:', err)
        this.error = 'Failed to get QR code. Please try again.'
      }
    },
    async sendMessage() {
      try {
        let url = '/api/messages'
        let payload = { ...this.newMessage }
        
        if (this.messageType === 'bulk') {
          url = '/api/members/bulk-send'
          payload = { message: this.newMessage.message }
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
          throw new Error('Failed to send message')
        }
        
        // Reset form and close modal
        this.newMessage = { 
          member_id: '',
          message: ''
        }
        this.showSendMessageModal = false
        
        // Refresh messages list
        this.fetchMessages()
      } catch (err) {
        console.error('Error sending message:', err)
        this.error = 'Failed to send message. Please try again.'
      }
    }
  }
}
</script>