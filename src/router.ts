import { createRouter, createWebHashHistory } from 'vue-router'
import ValidationForm from './components/ValidationForm.vue'
import ContactForm from './vue/examples/01-ContactForm.vue'
import RegistrationForm from './vue/examples/02-RegistrationForm.vue'
import DynamicItemsForm from './vue/examples/03-DynamicItemsForm.vue'
import NumericValidation from './vue/examples/04-NumericValidation.vue'
import MessagesShowcase from './vue/examples/05-MessagesShowcase.vue'
import FormStateDebugger from './vue/examples/06-FormStateDebugger.vue'
import CustomValidation from './vue/examples/07-CustomValidation.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/examples/contact' },
    { path: '/legacy', component: ValidationForm },
    { path: '/examples/contact', component: ContactForm },
    { path: '/examples/registration', component: RegistrationForm },
    { path: '/examples/dynamic', component: DynamicItemsForm },
    { path: '/examples/numeric', component: NumericValidation },
    { path: '/examples/messages', component: MessagesShowcase },
    { path: '/examples/debugger', component: FormStateDebugger },
    { path: '/examples/custom', component: CustomValidation },
  ]
})

export default router
