<template>
  <div class="members">
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Members</h1>
        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" @click="showAddMemberModal = true">
          Add Member
        </button>
      </div>

      <div v-if="loading" class="text-center py-4">
        <p>Loading members...</p>
      </div>
      
      <div v-else-if="error" class="text-center py-4 text-red-500">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="members.length === 0" class="text-center py-4">
        <p>No members found. Add your first member to get started.</p>
      </div>
      
      <div v-else>
        <table class="min-w-full">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="member in members" :key="member.id">
              <td class="px-6 py-4 whitespace-nowrap">{{ member.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ member.phone }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ new Date(member.joined_date).toLocaleDateString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <router-link :to="'/members/' + member.id" class="text-blue-600 hover:text-blue-900 mr-4">View</router-link>
                <button @click="deleteMember(member.id)" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Member Modal (simple version) -->
    <div v-if="showAddMemberModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Add New Member</h2>
        <form @submit.prevent="addMember">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
            <input type="text" id="name" v-model="newMember.name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="phone">Phone</label>
            <input type="text" id="phone" v-model="newMember.phone" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showAddMemberModal = false" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2">Cancel</button>
            <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Members',
  data() {
    return {
      members: [],
      loading: true,
      error: null,
      showAddMemberModal: false,
      newMember: {
        name: '',
        phone: ''
      }
    }
  },
  created() {
    this.fetchMembers()
  },
  methods: {
    async fetchMembers() {
      this.loading = true
      try {
        const response = await fetch('/api/members')
        if (!response.ok) {
          throw new Error('Failed to fetch members')
        }
        const data = await response.json()
        this.members = data
        this.error = null
      } catch (err) {
        console.error('Error fetching members:', err)
        this.error = 'Failed to load members. Please try again.'
      } finally {
        this.loading = false
      }
    },
    async addMember() {
      try {
        const response = await fetch('/api/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newMember)
        })
        
        if (!response.ok) {
          throw new Error('Failed to add member')
        }
        
        // Reset form and close modal
        this.newMember = { name: '', phone: '' }
        this.showAddMemberModal = false
        
        // Refresh members list
        this.fetchMembers()
      } catch (err) {
        console.error('Error adding member:', err)
        this.error = 'Failed to add member. Please try again.'
      }
    },
    async deleteMember(id) {
      if (!confirm('Are you sure you want to delete this member?')) {
        return
      }
      
      try {
        const response = await fetch(`/api/members/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete member')
        }
        
        // Refresh members list
        this.fetchMembers()
      } catch (err) {
        console.error('Error deleting member:', err)
        this.error = 'Failed to delete member. Please try again.'
      }
    }
  }
}
</script>