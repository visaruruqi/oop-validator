import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { VueValidationPlugin } from './vue'
import './assets/style.css'

const app = createApp(App)
app.use(router)
app.use(VueValidationPlugin)
app.mount('#app')
