import Vue from 'vue'
import Vuetify from 'vuetify'
import App from './App'
import './index.scss'

Vue.use(Vuetify)

new Vue({
  el: '#app',
  render: h => h(App)
})