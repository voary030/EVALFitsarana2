import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useClientAuthStore } from '@/stores/clientAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // =========================================================================
    // FRONT OFFICE ROUTES
    // =========================================================================
    {
      path: '/boutique',
      name: 'accueil',
      meta: { layout: 'frontoffice' },
      component: () => import('../views/frontoffice/home/HomeView.vue'),
    },
    {
      path: '/boutique/produit',
      name: 'product-list',
      meta: { layout: 'frontoffice', requiresClientAuth: true },
      component: () => import('../views/frontoffice/product/ProductList.vue'),
    },
    {
      path: '/boutique/produit/:id',
      name: 'front-product-detail',
      meta: { layout: 'frontoffice', requiresClientAuth: true },
      component: () => import('../views/frontoffice/product/ProductDetail.vue'),
    },
    {
      path: '/boutique/commandes',
      name: 'front-orders',
      meta: { layout: 'frontoffice', requiresClientAuth: true },
      component: () => import('../views/frontoffice/orders/OrdersView.vue'),
    },
    {
      path: '/boutique/panier',
      name: 'front-cart',
      meta: { layout: 'frontoffice', requiresClientAuth: true },
      component: () => import('../views/frontoffice/cart/CartView.vue'),
    },
    {
      path: '/boutique/:pathMatch(.*)*',
      name: 'front-notFound',
      meta: { layout: 'frontoffice' },
      component: () => import('../views/frontoffice/error/ForbiddenView.vue'),
    },
    {
      path: '/boutique/forbidden',
      name: 'front-forbidden',
      meta: { layout: 'frontoffice' },
      component: () => import('../views/frontoffice/error/ForbiddenView.vue'),
    },
    // =========================================================================
    // BACK OFFICE (ADMIN) ROUTES
    // =========================================================================
    {
      path: '/',
      name: 'dashboard',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/Dashboard.vue'),
    },
    {
      path: '/login',
      name: 'login',
      meta: { layout: 'centered' },
      component: () => import('../views/auth/LoginView.vue'),
    },
    {
      path: '/categories',
      name: 'categories',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/category/ListCategory.vue'),
    },
    {
      path: '/produits',
      name: 'products',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/product/ListProduct.vue'),
    },
    {
      path: '/taxe',
      name: 'taxe',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/teste/Teste.vue'),
    },
    {
      path: '/commandes',
      name: 'commandes',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/orders/OrdersList.vue'),
    },
    {
      path: '/statistiques',
      name: 'statistiques',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/statistique/Statistiques.vue'),
    },
    {
      path: '/stocks',
      name: 'stock-management',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/stock/StockManagement.vue'),
    },
    {
      path: '/stocks/evolution',
      name: 'stock-evolution',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/stock/StockEvolution.vue'),
    },
    {
      path: '/stocks/reservation',
      name: 'stock-reservation',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/stock/StockReservation.vue'),
    },
    {
      path: '/import',
      name: 'import',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/import/ImportData.vue'),
    },
    {
      path: '/reset',
      name: 'reset',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/reset/ResetData.vue'),
    },
    {
      path: '/dev',
      name: 'dev',
      meta: { layout: 'backoffice', requiresAuth: true },
      component: () => import('../views/backoffice/dev/Dev.vue'),
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      meta: { layout: 'centered' },
      component: () => import('../views/errors/ForbiddenView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/errors/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  const clientAuth = useClientAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/forbidden'
  }

  if (to.meta.requiresClientAuth && !clientAuth.isAuthenticated && !clientAuth.isAnonymous) {
    return '/boutique/forbidden'
  }
})

export default router
