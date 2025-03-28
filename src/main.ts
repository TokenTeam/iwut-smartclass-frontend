import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import TDesign from 'tdesign-mobile-vue';
import ElementPlus from 'element-plus'

import App from './App.vue'
import router from './router'

import 'tdesign-mobile-vue/es/style/index.css';
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(TDesign);
app.use(ElementPlus)

app.mount('#app')
