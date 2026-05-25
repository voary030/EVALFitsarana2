<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClientAuthStore } from '@/stores/clientAuth'
import { CartService } from '@/service/cart/CartService'

const isMenuOpen = ref(false)
const route = useRoute()
const router = useRouter()
const clientAuth = useClientAuthStore()

const isActive = (path: string) => {
    return route.path === path
}

const handleLogout = () => {
    clientAuth.logout()
    router.push('/boutique')
}

const ordersCount = ref(2)
const cartCount = ref(0)

const fetchCartCount = async () => {
    const savedCartId = localStorage.getItem('current_cart_id')
    if (savedCartId && !clientAuth.isAnonymous) {
        try {
            const cart = await CartService.getById(Number(savedCartId))
            if (cart?.cart_rows) {
                cartCount.value = cart.cart_rows.filter(r => r.id_product && r.id_product > 0).length
            } else {
                cartCount.value = 0
            }
        } catch (error) {
            cartCount.value = 0
        }
    } else {
        cartCount.value = 0
    }
}

onMounted(fetchCartCount)

// Écouter l'événement d'ajout au panier
onMounted(() => {
    fetchCartCount()
    window.addEventListener('cart-updated', fetchCartCount)
})

watch(() => route.path, fetchCartCount)
watch(() => clientAuth.client, fetchCartCount)
</script>

<template>
    <nav class="navbar navbar-expand-lg bg-dark navbar-dark border-bottom shadow-sm py-3 sticky-top">
        <div class="container">
            <RouterLink class="navbar-brand d-flex align-items-center" to="/boutique">
                <h2 class="fw-bold text-uppercase h4 mb-0">
                    <span class="text-primary">Vue</span>Shop
                </h2>
            </RouterLink>

            <button class="navbar-toggler border-0 shadow-none" type="button" @click="isMenuOpen = !isMenuOpen">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" :class="{ 'show': isMenuOpen }">
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0 gap-3 align-items-center">
                    <li class="nav-item">
                        <RouterLink class="nav-link px-3 rounded-3" :class="{ 'active': isActive('/boutique') }"
                            to="/boutique" @click="isMenuOpen = false">
                            Accueil
                        </RouterLink>
                    </li>

                    <li class="nav-item">
                        <RouterLink class="nav-link px-3 rounded-3" :class="{ 'active': isActive('/boutique/produit') }"
                            to="/boutique/produit" @click="isMenuOpen = false">
                            Produits
                        </RouterLink>
                    </li>

                    <!-- v-if="!clientAuth.isAnonymous" -->
                    <li class="nav-item">
                        <RouterLink class="nav-link px-3 rounded-3"
                            :class="{ 'active': isActive('/boutique/commandes') }" to="/boutique/commandes"
                            @click="isMenuOpen = false">
                            Mes commandes
                        </RouterLink>
                    </li>

                    <!-- Commande Badge -->
                    <!-- <li class="nav-item">
                        <RouterLink
                            class="nav-link px-3 rounded-3 position-relative d-flex align-items-center gap-2 btn-order"
                            to="/boutique/commandes" @click="isMenuOpen = false">
                            <i class="bi bi-box-seam fs-5 text-warning"></i>
                            <span class="d-lg-none">Commandes</span>
                            <span
                                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark border border-dark border-2 small"
                                style="font-size: 0.65rem;">
                                {{ ordersCount }}
                            </span>
                        </RouterLink>
                    </li> -->

                    <!-- Panier Badge -->
                    <li class="nav-item">
                        <RouterLink
                            class="nav-link px-3 rounded-3 position-relative d-flex align-items-center gap-2 btn-cart"
                            to="/boutique/panier" @click="isMenuOpen = false">
                            <i class="bi bi-cart3 fs-5 text-primary"></i>
                            <span class="d-lg-none">Panier</span>
                            <span
                                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary border border-dark border-2 small"
                                style="font-size: 0.65rem;">
                                {{ cartCount }}
                            </span>
                        </RouterLink>
                    </li>

                    <li v-if="!clientAuth.isAuthenticated && !clientAuth.isAnonymous" class="nav-item ms-lg-2">
                        <RouterLink class="btn btn-primary px-4 fw-bold rounded-pill shadow-sm" to="/boutique"
                            @click="isMenuOpen = false">
                            Connexion
                        </RouterLink>
                    </li>
                    <li v-else class="nav-item ms-lg-2">
                        <div class="dropdown">
                            <button class="btn btn-link p-0 border-0 dropdown-toggle no-caret" type="button"
                                data-bs-toggle="dropdown">
                                <div v-if="clientAuth.client?.id == 1"
                                    class="avatar-circle bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                    style="width: 40px; height: 40px;">
                                    <i class="bi bi-incognito"></i>
                                </div>
                                <div v-else
                                    class="avatar-circle bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                    style="width: 40px; height: 40px;">
                                    {{ clientAuth.clientInitials }}
                                </div>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 mt-2">
                                <li v-if="clientAuth.client?.id == 1"
                                    class="px-3 py-2 text-muted small fw-bold text-uppercase">
                                    Anonyme</li>
                                <li v-else class="px-3 py-2 text-muted small fw-bold text-uppercase">
                                    {{ clientAuth.client?.firstname }} {{ clientAuth.client?.lastname }}
                                </li>
                                <li>
                                    <hr class="dropdown-divider opacity-50">
                                </li>
                                <li><a class="dropdown-item text-danger rounded-3" @click="handleLogout" href="#"><i
                                            class="bi bi-box-arrow-right me-2"></i>Déconnexion</a></li>
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<style scoped>
.nav-link {
    transition: all 0.2s ease;
    font-weight: 500;
}

.nav-link:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
}

.btn-order:hover i {
    transform: translateY(-2px);
    transition: transform 0.2s;
}

.btn-cart:hover i {
    transform: translateY(-2px);
    transition: transform 0.2s;
}

.no-caret::after {
    display: none;
}

.avatar-circle {
    transition: transform 0.2s;
}

.avatar-circle:hover {
    transform: scale(1.1);
}

.dropdown-item {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.dropdown-item:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
    color: var(--bs-primary);
}
</style>

<style scoped>
.nav-link {
    transition: all 0.2s ease;
    font-weight: 500;
}

.nav-link:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
}
</style>