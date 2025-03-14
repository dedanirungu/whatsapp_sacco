<template>
  <div class="home">
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-4">Welcome to WhatsApp SACCO</h1>
      <p class="mb-4">A WhatsApp-powered savings and credit cooperative platform.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <router-link to="/members" class="bg-sacco-green hover:bg-green-600 text-white p-4 rounded-lg text-center">
          <h2 class="text-xl font-bold">Members</h2>
          <p>Manage SACCO members</p>
        </router-link>
        
        <router-link to="/contributions" class="bg-sacco-green hover:bg-green-600 text-white p-4 rounded-lg text-center">
          <h2 class="text-xl font-bold">Contributions</h2>
          <p>Track member contributions</p>
        </router-link>
        
        <router-link to="/loans" class="bg-sacco-green hover:bg-green-600 text-white p-4 rounded-lg text-center">
          <h2 class="text-xl font-bold">Loans</h2>
          <p>Manage loan applications</p>
        </router-link>
        
        <router-link to="/messages" class="bg-sacco-green hover:bg-green-600 text-white p-4 rounded-lg text-center">
          <h2 class="text-xl font-bold">Messages</h2>
          <p>Send WhatsApp notifications</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>