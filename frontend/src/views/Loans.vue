<template>
  <div class="loans">
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Loans</h1>
        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" @click="showAddLoanModal = true">
          New Loan
        </button>
      </div>

      <div v-if="loading" class="text-center py-4">
        <p>Loading loans...</p>
      </div>
      
      <div v-else-if="error" class="text-center py-4 text-red-500">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="loans.length === 0" class="text-center py-4">
        <p>No loans found. Add a new loan to get started.</p>
      </div>
      
      <div v-else>
        <table class="min-w-full">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="loan in loans" :key="loan.id">
              <td class="px-6 py-4 whitespace-nowrap">{{ loan.Member ? loan.Member.name : 'Unknown' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">${{ loan.amount.toFixed(2) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ loan.interest_rate }}%</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ loan.term_months }} months</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(loan.status)">{{ loan.status }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <router-link :to="'/loans/' + loan.id" class="text-blue-600 hover:text-blue-900">View</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Loan Modal (simplified version) -->
    <div v-if="showAddLoanModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Add New Loan</h2>
        <form @submit.prevent="addLoan">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="member">Member</label>
            <select id="member" v-model="newLoan.member_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
              <option value="">Select a member</option>
              <option v-for="member in members" :key="member.id" :value="member.id">{{ member.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="amount">Amount</label>
            <input type="number" id="amount" v-model="newLoan.amount" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="interest_rate">Interest Rate (%)</label>
            <input type="number" id="interest_rate" v-model="newLoan.interest_rate" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="term_months">Term (months)</label>
            <input type="number" id="term_months" v-model="newLoan.term_months" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="loan_type">Loan Type</label>
            <select id="loan_type" v-model="newLoan.loan_type" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
              <option value="reducing">Reducing Balance</option>
              <option value="fixed">Fixed Rate</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="description">Description</label>
            <textarea id="description" v-model="newLoan.description" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showAddLoanModal = false" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2">Cancel</button>
            <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
module.exports = {
  name: 'Loans',
  data() {
    return {
      loans: [],
      members: [],
      loading: true,
      error: null,
      showAddLoanModal: false,
      newLoan: {
        member_id: '',
        amount: 0,
        interest_rate: 12,
        term_months: 12,
        loan_type: 'reducing',
        description: ''
      }
    }
  },
  created() {
    this.fetchLoans()
    this.fetchMembers()
  },
  methods: {
    getStatusClass(status) {
      const statusClasses = {
        'active': 'bg-blue-100 text-blue-800 px-2 py-1 rounded',
        'paid': 'bg-green-100 text-green-800 px-2 py-1 rounded',
        'defaulted': 'bg-red-100 text-red-800 px-2 py-1 rounded',
        'restructured': 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded'
      }
      return statusClasses[status] || 'px-2 py-1 rounded'
    },
    async fetchLoans() {
      this.loading = true
      try {
        const response = await fetch('/api/loans')
        if (!response.ok) {
          throw new Error('Failed to fetch loans')
        }
        const data = await response.json()
        this.loans = data
        this.error = null
      } catch (err) {
        console.error('Error fetching loans:', err)
        this.error = 'Failed to load loans. Please try again.'
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
    async addLoan() {
      try {
        const response = await fetch('/api/loans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newLoan)
        })
        
        if (!response.ok) {
          throw new Error('Failed to add loan')
        }
        
        // Reset form and close modal
        this.newLoan = { 
          member_id: '',
          amount: 0,
          interest_rate: 12,
          term_months: 12,
          loan_type: 'reducing',
          description: ''
        }
        this.showAddLoanModal = false
        
        // Refresh loans list
        this.fetchLoans()
      } catch (err) {
        console.error('Error adding loan:', err)
        this.error = 'Failed to add loan. Please try again.'
      }
    }
  }
}
</script>