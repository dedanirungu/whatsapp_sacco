<template>
  <div class="contributions">
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Contributions</h1>
        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" @click="showAddContributionModal = true">
          Add Contribution
        </button>
      </div>

      <div v-if="loading" class="text-center py-4">
        <p>Loading contributions...</p>
      </div>
      
      <div v-else-if="error" class="text-center py-4 text-red-500">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="contributions.length === 0" class="text-center py-4">
        <p>No contributions found. Add a new contribution to get started.</p>
      </div>
      
      <div v-else>
        <table class="min-w-full">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="contribution in contributions" :key="contribution.id">
              <td class="px-6 py-4 whitespace-nowrap">{{ contribution.Member ? contribution.Member.name : 'Unknown' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">${{ contribution.amount.toFixed(2) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ contribution.reason || 'N/A' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ new Date(contribution.timestamp).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Contribution Modal -->
    <div v-if="showAddContributionModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Add New Contribution</h2>
        <form @submit.prevent="addContribution">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="member">Member</label>
            <select id="member" v-model="newContribution.member_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
              <option value="">Select a member</option>
              <option v-for="member in members" :key="member.id" :value="member.id">{{ member.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="amount">Amount</label>
            <input type="number" id="amount" v-model="newContribution.amount" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="reason">Reason (Optional)</label>
            <input type="text" id="reason" v-model="newContribution.reason" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showAddContributionModal = false" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2">Cancel</button>
            <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
module.exports = {
  name: 'Contributions',
  data() {
    return {
      contributions: [],
      members: [],
      loading: true,
      error: null,
      showAddContributionModal: false,
      newContribution: {
        member_id: '',
        amount: 0,
        reason: ''
      }
    }
  },
  created() {
    this.fetchContributions()
    this.fetchMembers()
  },
  methods: {
    async fetchContributions() {
      this.loading = true
      try {
        const response = await fetch('/api/contributions')
        if (!response.ok) {
          throw new Error('Failed to fetch contributions')
        }
        const data = await response.json()
        this.contributions = data
        this.error = null
      } catch (err) {
        console.error('Error fetching contributions:', err)
        this.error = 'Failed to load contributions. Please try again.'
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
    async addContribution() {
      try {
        const response = await fetch('/api/contributions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newContribution)
        })
        
        if (!response.ok) {
          throw new Error('Failed to add contribution')
        }
        
        // Reset form and close modal
        this.newContribution = { 
          member_id: '',
          amount: 0,
          reason: ''
        }
        this.showAddContributionModal = false
        
        // Refresh contributions list
        this.fetchContributions()
      } catch (err) {
        console.error('Error adding contribution:', err)
        this.error = 'Failed to add contribution. Please try again.'
      }
    }
  }
}
</script>