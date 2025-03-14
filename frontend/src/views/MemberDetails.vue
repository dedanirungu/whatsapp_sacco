<template>
  <div class="member-details">
    <div v-if="loading" class="text-center py-4">
      <p>Loading member details...</p>
    </div>
    
    <div v-else-if="error" class="text-center py-4 text-red-500">
      <p>{{ error }}</p>
    </div>
    
    <div v-else class="space-y-6">
      <!-- Member Information -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">Member Details</h1>
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" @click="showEditModal = true">
            Edit
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-gray-600">Name</p>
            <p class="font-semibold">{{ member.name }}</p>
          </div>
          <div>
            <p class="text-gray-600">Phone</p>
            <p class="font-semibold">{{ member.phone }}</p>
          </div>
          <div>
            <p class="text-gray-600">Joined Date</p>
            <p class="font-semibold">{{ new Date(member.joined_date).toLocaleDateString() }}</p>
          </div>
        </div>
        
        <div class="mt-6 flex space-x-4">
          <button @click="showSendMessageModal = true" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Send Message
          </button>
          <button @click="deleteMember" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
            Delete Member
          </button>
        </div>
      </div>
      
      <!-- Member Transactions -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-bold mb-4">Transactions</h2>
        <div v-if="transactions.length === 0" class="text-center py-4">
          <p>No transactions found for this member.</p>
        </div>
        <div v-else>
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="transaction in transactions" :key="transaction.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getTransactionTypeClass(transaction.type)">{{ transaction.type }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${{ transaction.amount.toFixed(2) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ transaction.description || 'N/A' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ new Date(transaction.timestamp).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Member Loans -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-bold mb-4">Loans</h2>
        <div v-if="loans.length === 0" class="text-center py-4">
          <p>No loans found for this member.</p>
        </div>
        <div v-else>
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="loan in loans" :key="loan.id">
                <td class="px-6 py-4 whitespace-nowrap">${{ loan.amount.toFixed(2) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ loan.interest_rate }}%</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ loan.term_months }} months</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getLoanStatusClass(loan.status)">{{ loan.status }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <router-link :to="'/loans/' + loan.id" class="text-blue-600 hover:text-blue-900">View</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Member Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Edit Member</h2>
        <form @submit.prevent="updateMember">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
            <input type="text" id="name" v-model="editedMember.name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="phone">Phone</label>
            <input type="text" id="phone" v-model="editedMember.phone" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showEditModal = false" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2">Cancel</button>
            <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Send Message Modal -->
    <div v-if="showSendMessageModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Send WhatsApp Message</h2>
        <form @submit.prevent="sendMessage">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="message">Message</label>
            <textarea id="message" v-model="newMessage" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32" required></textarea>
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
  name: 'MemberDetails',
  data() {
    return {
      member: {},
      transactions: [],
      loans: [],
      loading: true,
      error: null,
      showEditModal: false,
      showSendMessageModal: false,
      editedMember: {
        name: '',
        phone: ''
      },
      newMessage: ''
    }
  },
  created() {
    this.fetchMemberDetails()
  },
  methods: {
    async fetchMemberDetails() {
      this.loading = true
      const memberId = this.$route.params.id
      
      try {
        // Fetch member details
        const memberResponse = await fetch(`/api/members/${memberId}`)
        if (!memberResponse.ok) {
          throw new Error('Failed to fetch member details')
        }
        this.member = await memberResponse.json()
        this.editedMember = { ...this.member }
        
        // Fetch member transactions
        const transactionsResponse = await fetch(`/api/members/${memberId}/transactions`)
        if (!transactionsResponse.ok) {
          throw new Error('Failed to fetch member transactions')
        }
        this.transactions = await transactionsResponse.json()
        
        // Fetch member loans
        const loansResponse = await fetch(`/api/members/${memberId}/loans`)
        if (!loansResponse.ok) {
          throw new Error('Failed to fetch member loans')
        }
        this.loans = await loansResponse.json()
        
        this.error = null
      } catch (err) {
        console.error('Error fetching member details:', err)
        this.error = 'Failed to load member details. Please try again.'
      } finally {
        this.loading = false
      }
    },
    getTransactionTypeClass(type) {
      const typeClasses = {
        'deposit': 'bg-green-100 text-green-800 px-2 py-1 rounded',
        'withdrawal': 'bg-red-100 text-red-800 px-2 py-1 rounded',
        'loan': 'bg-blue-100 text-blue-800 px-2 py-1 rounded',
        'repayment': 'bg-purple-100 text-purple-800 px-2 py-1 rounded'
      }
      return typeClasses[type] || 'px-2 py-1 rounded'
    },
    getLoanStatusClass(status) {
      const statusClasses = {
        'active': 'bg-blue-100 text-blue-800 px-2 py-1 rounded',
        'paid': 'bg-green-100 text-green-800 px-2 py-1 rounded',
        'defaulted': 'bg-red-100 text-red-800 px-2 py-1 rounded',
        'restructured': 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded'
      }
      return statusClasses[status] || 'px-2 py-1 rounded'
    },
    async updateMember() {
      try {
        const response = await fetch(`/api/members/${this.member.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.editedMember)
        })
        
        if (!response.ok) {
          throw new Error('Failed to update member')
        }
        
        // Update local member data and close modal
        this.member = { ...this.editedMember }
        this.showEditModal = false
      } catch (err) {
        console.error('Error updating member:', err)
        this.error = 'Failed to update member. Please try again.'
      }
    },
    async sendMessage() {
      try {
        const response = await fetch('/api/members/' + this.member.id + '/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: this.newMessage })
        })
        
        if (!response.ok) {
          throw new Error('Failed to send message')
        }
        
        // Reset form and close modal
        this.newMessage = ''
        this.showSendMessageModal = false
        
        // Show success message
        alert('Message sent successfully!')
      } catch (err) {
        console.error('Error sending message:', err)
        this.error = 'Failed to send message. Please try again.'
      }
    },
    async deleteMember() {
      if (!confirm(`Are you sure you want to delete ${this.member.name}? This action cannot be undone.`)) {
        return
      }
      
      try {
        const response = await fetch(`/api/members/${this.member.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete member')
        }
        
        // Redirect to members list
        this.$router.push('/members')
      } catch (err) {
        console.error('Error deleting member:', err)
        this.error = 'Failed to delete member. Please try again.'
      }
    }
  }
}
</script>