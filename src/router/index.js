import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', component: () => import('../views/map/map.vue') }]
})

export default router
