<template>
  <div id="app">
    <header class="bg-white shadow">
      <nav class="container mx-auto px-4 py-2 flex items-center justify-between">
        <router-link to="/" class="text-xl font-bold text-sacco-green">WhatsApp SACCO</router-link>
        <div class="space-x-4">
          <router-link to="/" class="text-gray-600 hover:text-sacco-green">Home</router-link>
          <router-link to="/members" class="text-gray-600 hover:text-sacco-green">Members</router-link>
          <router-link to="/contributions" class="text-gray-600 hover:text-sacco-green">Contributions</router-link>
          <router-link to="/loans" class="text-gray-600 hover:text-sacco-green">Loans</router-link>
          <router-link to="/messages" class="text-gray-600 hover:text-sacco-green">Messages</router-link>
        </div>
      </nav>
    </header>
    
    <main class="container mx-auto px-4 py-6">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* Global styles can be added here */
:root {
  --sacco-green: #25D366;
}
</style>