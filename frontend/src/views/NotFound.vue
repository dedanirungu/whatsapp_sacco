<template>
  <div class="not-found">
    <div class="bg-white p-6 rounded-lg shadow-md text-center">
      <h1 class="text-2xl font-bold mb-4">404 - Page Not Found</h1>
      <p class="mb-6">The page you are looking for does not exist.</p>
      <router-link to="/" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
        Return to Home
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>