import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import routes from './router/routes'

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create and mount the Vue application
const app = createApp(App)
app.use(router)
app.mount('#app')