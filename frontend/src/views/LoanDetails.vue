<template>
  <div class="loan-details">
    <div v-if="loading" class="text-center py-4">
      <p>Loading loan details...</p>
    </div>
    
    <div v-else-if="error" class="text-center py-4 text-red-500">
      <p>{{ error }}</p>
    </div>
    
    <div v-else class="space-y-6">
      <!-- Loan Information -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">Loan Details</h1>
          <div class="flex space-x-2">
            <button v-if="loan.status === 'active'" @click="showMakePaymentModal = true" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              Make Payment
            </button>
            <button v-if="loan.status === 'active'" @click="updateLoanStatus('paid')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Mark as Paid
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-gray-600">Member</p>
            <p class="font-semibold">{{ loan.Member ? loan.Member.name : 'Unknown' }}</p>
          </div>
          <div>
            <p class="text-gray-600">Amount</p>
            <p class="font-semibold">${{ loan.amount.toFixed(2) }}</p>
          </div>
          <div>
            <p class="text-gray-600">Interest Rate</p>
            <p class="font-semibold">{{ loan.interest_rate }}%</p>
          </div>
          <div>
            <p class="text-gray-600">Loan Type</p>
            <p class="font-semibold">{{ loan.loan_type === 'reducing' ? 'Reducing Balance' : 'Fixed Rate' }}</p>
          </div>
          <div>
            <p class="text-gray-600">Term</p>
            <p class="font-semibold">{{ loan.term_months }} months</p>
          </div>
          <div>
            <p class="text-gray-600">Status</p>
            <p class="font-semibold">
              <span :class="getStatusClass(loan.status)">{{ loan.status }}</span>
            </p>
          </div>
          <div>
            <p class="text-gray-600">Start Date</p>
            <p class="font-semibold">{{ new Date(loan.start_date).toLocaleDateString() }}</p>
          </div>
          <div>
            <p class="text-gray-600">End Date</p>
            <p class="font-semibold">{{ loan.end_date ? new Date(loan.end_date).toLocaleDateString() : 'N/A' }}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-gray-600">Description</p>
            <p>{{ loan.description || 'N/A' }}</p>
          </div>
        </div>
      </div>
      
      <!-- Loan Payment History -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-bold mb-4">Payment History</h2>
        <div v-if="payments.length === 0" class="text-center py-4">
          <p>No payments recorded for this loan.</p>
        </div>
        <div v-else>
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="payment in payments" :key="payment.id">
                <td class="px-6 py-4 whitespace-nowrap">{{ new Date(payment.payment_date).toLocaleString() }}</td>
                <td class="px-6 py-4 whitespace-nowrap">${{ payment.amount.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Loan Repayment Schedule -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-bold mb-4">Repayment Schedule</h2>
        <div v-if="loadingSchedule" class="text-center py-4">
          <p>Loading repayment schedule...</p>
        </div>
        <div v-else-if="scheduleError" class="text-center py-4 text-red-500">
          <p>{{ scheduleError }}</p>
        </div>
        <div v-else-if="!schedule || schedule.length === 0" class="text-center py-4">
          <p>No repayment schedule available.</p>
        </div>
        <div v-else>
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment #</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(payment, index) in schedule" :key="index">
                <td class="px-6 py-4 whitespace-nowrap">{{ index + 1 }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ new Date(payment.dueDate).toLocaleDateString() }}</td>
                <td class="px-6 py-4 whitespace-nowrap">${{ payment.payment.toFixed(2) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">${{ payment.principal.toFixed(2) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">${{ payment.interest.toFixed(2) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">${{ payment.balance.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Make Payment Modal -->
    <div v-if="showMakePaymentModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Make Loan Payment</h2>
        <form @submit.prevent="makePayment">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="amount">Payment Amount</label>
            <input type="number" id="amount" v-model="newPayment.amount" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showMakePaymentModal = false" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2">Cancel</button>
            <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Submit Payment</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
module.exports = {
  name: 'LoanDetails',
  data() {
    return {
      loan: {},
      payments: [],
      schedule: [],
      loading: true,
      error: null,
      loadingSchedule: false,
      scheduleError: null,
      showMakePaymentModal: false,
      newPayment: {
        amount: 0
      }
    }
  },
  created() {
    this.fetchLoanDetails()
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
    async fetchLoanDetails() {
      this.loading = true
      const loanId = this.$route.params.id
      
      try {
        // Fetch loan details with payments
        const loanResponse = await fetch(`/api/loans/${loanId}`)
        if (!loanResponse.ok) {
          throw new Error('Failed to fetch loan details')
        }
        const loanData = await loanResponse.json()
        this.loan = loanData.loan || loanData
        this.payments = loanData.payments || []
        
        // Fetch loan repayment schedule
        this.fetchRepaymentSchedule(loanId)
        
        this.error = null
      } catch (err) {
        console.error('Error fetching loan details:', err)
        this.error = 'Failed to load loan details. Please try again.'
      } finally {
        this.loading = false
      }
    },
    async fetchRepaymentSchedule(loanId) {
      this.loadingSchedule = true
      try {
        const scheduleResponse = await fetch(`/api/loans/${loanId}/schedule`)
        if (!scheduleResponse.ok) {
          throw new Error('Failed to fetch repayment schedule')
        }
        const scheduleData = await scheduleResponse.json()
        this.schedule = scheduleData
        this.scheduleError = null
      } catch (err) {
        console.error('Error fetching repayment schedule:', err)
        this.scheduleError = 'Failed to load repayment schedule.'
      } finally {
        this.loadingSchedule = false
      }
    },
    async makePayment() {
      try {
        const response = await fetch(`/api/loans/${this.loan.id}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newPayment)
        })
        
        if (!response.ok) {
          throw new Error('Failed to make payment')
        }
        
        // Reset form and close modal
        this.newPayment = { amount: 0 }
        this.showMakePaymentModal = false
        
        // Refresh loan details
        this.fetchLoanDetails()
      } catch (err) {
        console.error('Error making payment:', err)
        this.error = 'Failed to make payment. Please try again.'
      }
    },
    async updateLoanStatus(status) {
      if (!confirm(`Are you sure you want to mark this loan as ${status}?`)) {
        return
      }
      
      try {
        const response = await fetch(`/api/loans/${this.loan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to update loan status to ${status}`)
        }
        
        // Refresh loan details
        this.fetchLoanDetails()
      } catch (err) {
        console.error('Error updating loan status:', err)
        this.error = 'Failed to update loan status. Please try again.'
      }
    }
  }
}
</script>