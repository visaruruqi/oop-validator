import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { VValidationPlugin } from './index'
import './assets/style.css'

const app = createApp(App)
app.use(router)
app.use(VValidationPlugin)
app.mount('#app')
