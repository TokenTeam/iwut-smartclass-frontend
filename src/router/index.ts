import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/course-review',
      name: 'course-review',
      // route level code-splitting
      // this generates a separate chunk ([PageName].[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/CourseReviewView.vue'),
    },
  ],
})

export default router
