<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { CartService } from '@/service/cart/CartService'
import { ProductService } from '@/service/product/ProductService'
import { OrderService } from '@/service/orders/OrderService'
import { StockAvailableService } from '@/service/stock_available/StockAvailableService'
import { StockDeltaService } from '@/service/stock_delta/StockDeltaService'
import { useClientAuthStore } from '@/stores/clientAuth'
import type { Cart, CartRow } from '@/types/cart'
import type { Product } from '@/types/product'

const router = useRouter()
const clientAuth = useClientAuthStore()

const cart = ref<Cart | null>(null)
const isLoading = ref(true)
const isOrdering = ref(false)
const products = ref<Map<number, Product>>(new Map())
const updatingRow = ref<string | null>(null)
const removingRow = ref<string | null>(null)
const errorMessage = ref('')

const cartItems = ref<CartRowItem[]>([])

interface CartRowItem extends CartRow {
    product?: Product
    name: string
    price: number
    priceTtc: number
    image: string
    total: number
    stockQuantity?: number
}

async function computeCartItems() {
    if (!cart.value?.cart_rows) {
        cartItems.value = []
        return
    }

    // Ignorer les cart_rows vides (id_product absent ou null)
    const validRows = cart.value.cart_rows.filter(row => row.id_product && row.id_product > 0)

    const items = await Promise.all(validRows.map(async (row) => {
        const product = products.value.get(row.id_product)
        let price = product?.price || 0
        let priceTtc = price

        if (row.id_product_attribute) {
            try {
                price = await ProductService.getPrix(String(row.id_product), row.id_product_attribute)
            } catch {
                price = product?.price || 0
            }
        }

        // Calculer le prix TTC
        try {
            priceTtc = await ProductService.getPrixTtc(String(row.id_product), row.id_product_attribute)
        } catch {
            priceTtc = price
        }

        // Récupérer le stock disponible
        let stockQty = 0
        try {
            const stock = await StockAvailableService.getByProductId(row.id_product, row.id_product_attribute || 0)
            stockQty = stock ? Number(stock.quantity) : 0
        } catch (err) {
            console.error('Erreur lors du chargement du stock pour le produit', row.id_product, err)
        }

        return {
            ...row,
            product,
            name: product?.name || `Produit #${row.id_product}`,
            price,
            priceTtc,
            image: product?.images?.[0] || '',
            total: priceTtc * row.quantity,
            stockQuantity: stockQty
        }
    }))

    cartItems.value = items
}

const cartTotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.total, 0)
})

const cartItemCount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

async function loadCart() {
    isLoading.value = true
    errorMessage.value = ''
    try {
        const savedCartId = localStorage.getItem('current_cart_id')


        if (!savedCartId || clientAuth.isAnonymous) {
            cart.value = null
            return
        }

        const data = await CartService.getById(Number(savedCartId))

        if (!data) {
            cart.value = null
            localStorage.removeItem('current_cart_id')
            return
        }

        // Filtrer les cart_rows vides (id_product = 0 ou null)
        const validRows = data.cart_rows.filter((r: CartRow) => r.id_product && r.id_product > 0)

        if (validRows.length === 0) {
            cart.value = data
            return
        }

        cart.value = data

        const productIds = [...new Set(validRows.map((r: { id_product: number }) => r.id_product))]
        const productPromises = productIds.map((id: number) => ProductService.getById(String(id)))
        const productResults = await Promise.all(productPromises)

        const map = new Map<number, Product>()
        productResults.forEach(p => {
            if (p) map.set(p.id, p)
        })
        products.value = map

        // Calculer les prix de chaque article
        await computeCartItems()
    } catch (err: any) {
        console.error('Erreur chargement panier:', err)
        // Si erreur 404 ou "not found", le panier n'existe plus
        if (err?.response?.status === 404 || err?.message?.toLowerCase().includes('not found')) {
            cart.value = null
            localStorage.removeItem('current_cart_id')
        } else {
            errorMessage.value = 'Erreur lors du chargement du panier'
        }
    } finally {
        isLoading.value = false
    }
}

async function cartToOrder() {
    if (!cart.value || cartItems.value.length === 0) return

    // Vérifier si la quantité de tous les articles est supérieure au stock disponible
    for (const item of cartItems.value) {
        if (item.stockQuantity !== undefined && item.quantity > item.stockQuantity) {
            alert(`La quantité demandée pour "${item.name}" (${item.quantity}) est supérieure au stock disponible (${item.stockQuantity}).`)
            return
        }
    }

    let currentClientId: number | undefined = clientAuth.client?.id
    let currentClientEmail: string | undefined = clientAuth.client?.email

    // Si non authentifié, ou connecté en tant qu'anonyme (client ID 1 ou isAnonymous)
    if (!clientAuth.isAuthenticated || currentClientId === 1 || clientAuth.isAnonymous) {
        const email = prompt("Connexion requise pour valider la commande.\nVeuillez saisir votre adresse email :")
        if (email === null) return // Annulé par l'utilisateur
        if (!email.trim()) {
            alert("L'adresse email ne peut pas être vide.")
            return
        }

        const password = prompt("Veuillez saisir votre mot de passe :")
        if (password === null) return // Annulé par l'utilisateur
        if (!password.trim()) {
            alert("Le mot de passe ne peut pas être vide.")
            return
        }

        isOrdering.value = true
        errorMessage.value = ''

        try {
            const { CustomerService } = await import('@/service/customer/CustomerService')
            const authenticatedCustomer = await CustomerService.login(email.trim(), password.trim())

            if (!authenticatedCustomer) {
                alert("Identifiants incorrects ou compte inactif. La commande n'a pas été validée.")
                isOrdering.value = false
                return
            }

            // Mettre à jour la session avec le client authentifié
            await clientAuth.setClient({
                id: authenticatedCustomer.id,
                email: authenticatedCustomer.email,
                firstname: authenticatedCustomer.firstname,
                lastname: authenticatedCustomer.lastname,
                birthday: authenticatedCustomer.birthday,
                newsletter: !!authenticatedCustomer.newsletter
            }, 'dummy-token-' + authenticatedCustomer.id)

            // Mettre à jour le panier en base de données pour l'associer au nouveau client (évite l'erreur Secure Key mismatch de PrestaShop)
            const updatedCart = await CartService.updateCartCustomer(
                cart.value.id,
                authenticatedCustomer.id,
                authenticatedCustomer.secure_key || ''
            )
            if (updatedCart) {
                cart.value = updatedCart
            }

            currentClientId = authenticatedCustomer.id
            currentClientEmail = authenticatedCustomer.email

            alert(`Connexion réussie ! Bienvenue ${authenticatedCustomer.firstname} ${authenticatedCustomer.lastname}. Votre commande va être validée.`)
        } catch (authErr) {
            console.error('Erreur lors de la connexion via prompt:', authErr)
            alert("Erreur lors de la connexion. Veuillez réessayer.")
            isOrdering.value = false
            return
        }
    }

    if (!currentClientId || !currentClientEmail) {
        alert("Une erreur est survenue : client non identifié.")
        return
    }

    isOrdering.value = true
    errorMessage.value = ''

    try {
        const order = await OrderService.createOrderFromCart(
            cart.value,
            cartItems.value.map(item => ({
                id_product: item.id_product,
                id_product_attribute: item.id_product_attribute,
                priceTtc: item.priceTtc,
                quantity: item.quantity,
            })),
            currentClientId,
            currentClientEmail
        )

        if (order) {
            localStorage.removeItem('current_cart_id')
            router.push('/boutique/commandes')
        } else {
            errorMessage.value = 'Erreur lors de la création de la commande'
        }
    } catch (err: any) {
        console.error('Erreur validation commande:', err)
        errorMessage.value = 'Erreur lors de la validation de la commande'
    }
}


async function updateQuantity(row: CartRow, delta: number) {
    if (!cart.value) return
    const newQty = row.quantity + delta
    if (newQty < 1) return

    const key = `${row.id_product}-${row.id_product_attribute}`

    // Vérifier si le stock est suffisant lors de l'incrémentation
    if (delta > 0) {
        const item = cartItems.value.find(i => getRowKey(i) === key)
        if (item && item.stockQuantity !== undefined && newQty > item.stockQuantity) {
            alert('La quantité demandée est supérieure au stock disponible.')
            return
        }
    }

    updatingRow.value = key

    try {
        const updated = await CartService.updateQuantity(
            cart.value.id,
            row.id_product,
            row.id_product_attribute,
            newQty
        )
        if (updated) {
            cart.value = updated
            await computeCartItems()
            window.dispatchEvent(new CustomEvent('cart-updated'))
        }
    } catch (err: any) {
        console.error('Erreur mise à jour quantité:', err)
        errorMessage.value = 'Erreur lors de la mise à jour'
    } finally {
        updatingRow.value = null
    }
}

async function removeItem(row: CartRow) {
    if (!cart.value) return

    const key = `${row.id_product}-${row.id_product_attribute}`
    removingRow.value = key

    try {
        const updated = await CartService.removeFromCart(
            cart.value.id,
            row.id_product,
            row.id_product_attribute
        )
        if (updated) {
            cart.value = updated
            await computeCartItems()
            window.dispatchEvent(new CustomEvent('cart-updated'))
        }
    } catch (err: any) {
        console.error('Erreur suppression:', err)
        errorMessage.value = 'Erreur lors de la suppression'
    } finally {
        removingRow.value = null
    }
}

function getRowKey(row: CartRow): string {
    return `${row.id_product}-${row.id_product_attribute}`
}

function getProductImage(row: CartRow): string | undefined {
    const product = products.value.get(row.id_product)
    if (product?.images && product.images.length > 0) {
        return product.images[0] ?? ''
    }
}

onMounted(loadCart)

</script>

<template>
    <div class="cart-container pb-5">
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb">
                <li class="breadcrumb-item">
                    <RouterLink to="/boutique" class="text-decoration-none">Accueil</RouterLink>
                </li>
                <li class="breadcrumb-item">
                    <RouterLink to="/boutique/produit" class="text-decoration-none">Produits</RouterLink>
                </li>
                <li class="breadcrumb-item active" aria-current="page">Mon Panier</li>
            </ol>
        </nav>

        <h1 class="fw-bold mb-4 h2 d-flex align-items-center gap-3">
            <i class="bi bi-cart3 text-primary"></i>
            Mon Panier
        </h1>

        <!-- Error message -->
        <div v-if="errorMessage" class="alert alert-danger rounded-3 d-flex align-items-center gap-2 mb-4">
            <i class="bi bi-exclamation-triangle-fill"></i>
            {{ errorMessage }}
            <button type="button" class="btn-close ms-auto" @click="errorMessage = ''"></button>
        </div>

        <!-- Skeleton Loader -->
        <div v-if="isLoading">
            <div class="row g-4">
                <div class="col-lg-8">
                    <div v-for="n in 3" :key="n"
                        class="card bg-body-tertiary border border-secondary-subtle rounded-4 mb-3">
                        <div class="card-body d-flex gap-3 align-items-center p-3">
                            <div class="skeleton-img bg-secondary opacity-10 rounded-3 pulse"
                                style="width: 100px; height: 100px; flex-shrink: 0;"></div>
                            <div class="flex-grow-1">
                                <div class="skeleton-text bg-secondary opacity-10 rounded mb-2 pulse"
                                    style="height: 20px; width: 60%;"></div>
                                <div class="skeleton-text bg-secondary opacity-10 rounded mb-2 pulse"
                                    style="height: 16px; width: 30%;"></div>
                                <div class="skeleton-text bg-secondary opacity-10 rounded pulse"
                                    style="height: 16px; width: 20%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="skeleton-img bg-secondary opacity-10 rounded-4 pulse" style="height: 220px;"></div>
                </div>
            </div>
        </div>

        <!-- Empty Cart -->
        <div v-else-if="!cart || !cart.cart_rows || cart.cart_rows.filter(r => r.id_product && r.id_product > 0).length === 0"
            class="text-center py-5">
            <div class="empty-cart-icon mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle bg-body-tertiary border border-secondary-subtle"
                style="width: 120px; height: 120px;">
                <i class="bi bi-cart-x fs-1 text-muted"></i>
            </div>
            <h3 class="text-muted fw-bold mb-2">Votre panier est vide</h3>
            <p class="text-muted opacity-75 mb-4">Découvrez nos produits et ajoutez-les à votre panier</p>
            <RouterLink to="/boutique/produit"
                class="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm hover-lift">
                <i class="bi bi-shop me-2"></i>Voir les produits
            </RouterLink>
        </div>

        <!-- Cart Content -->
        <div v-else class="row g-4">
            <!-- Cart Items -->
            <div class="col-lg-8">
                <div v-for="item in cartItems" :key="getRowKey(item)"
                    class="card bg-body-tertiary border border-secondary-subtle rounded-4 mb-3 cart-item-card overflow-hidden">
                    <div class="card-body d-flex gap-3 p-3">
                        <!-- Image Produit -->
                        <div class="cart-item-image rounded-3 overflow-hidden border bg-dark flex-shrink-0"
                            style="width: 110px; height: 110px;">
                            <img :src="getProductImage(item)" class="w-100 h-100 object-fit-cover" alt="produit">
                        </div>

                        <!-- Info Produit -->
                        <div class="flex-grow-1 d-flex flex-column justify-content-between">
                            <div>
                                <RouterLink :to="`/boutique/produit/${item.id_product}`"
                                    class="fw-bold text-decoration-none text-white h6 mb-1 d-block hover-primary">
                                    {{ item.name }}
                                </RouterLink>
                                <span v-if="item.id_product_attribute"
                                    class="badge bg-primary-subtle text-primary rounded-pill small me-2">
                                    Variante #{{ item.id_product_attribute }}
                                </span>
                                <span class="badge rounded-pill px-2 py-1 text-white fs-8 ms-1"
                                    :class="item.stockQuantity !== undefined && item.stockQuantity > 0 ? 'bg-success' : 'bg-danger'">
                                    <span v-if="item.stockQuantity !== undefined">{{ item.stockQuantity }} en stock</span>
                                    <span v-else class="spinner-border spinner-border-sm" role="status" style="width: 0.6rem; height: 0.6rem;"></span>
                                </span>
                            </div>

                            <div class="d-flex align-items-center justify-content-between mt-2">
                                <!-- Quantité Controls -->
                                <div class="input-group rounded-3 overflow-hidden border border-secondary-subtle"
                                    style="width: 130px; height: 38px;">
                                    <button class="btn btn-dark border-0 px-2 h-100"
                                        :disabled="updatingRow === getRowKey(item) || item.quantity <= 1"
                                        @click="updateQuantity(item, -1)">
                                        <i class="bi bi-dash"></i>
                                    </button>
                                    <div
                                        class="form-control bg-dark border-0 text-center text-white fw-bold d-flex align-items-center justify-content-center shadow-none h-100">
                                        <span v-if="updatingRow === getRowKey(item)"
                                            class="spinner-border spinner-border-sm"></span>
                                        <span v-else>{{ item.quantity }}</span>
                                    </div>
                                    <button class="btn btn-dark border-0 px-2 h-100"
                                        :disabled="updatingRow === getRowKey(item)" @click="updateQuantity(item, 1)">
                                        <i class="bi bi-plus"></i>
                                    </button>
                                </div>

                                <!-- Prix -->
                                <div class="text-end">
                                    <div class="text-muted small">{{ item.priceTtc.toFixed(2) }} € TTC × {{
                                        item.quantity }}
                                    </div>
                                    <div class="fw-bold text-primary h6 mb-0">{{ item.total.toFixed(2) }} € TTC</div>
                                </div>

                                <!-- Supprimer -->
                                <button class="btn btn-outline-danger rounded-3 ms-2 px-2"
                                    :disabled="removingRow === getRowKey(item)" @click="removeItem(item)">
                                    <span v-if="removingRow === getRowKey(item)"
                                        class="spinner-border spinner-border-sm"></span>
                                    <i v-else class="bi bi-trash3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Résumé Panier -->
            <div class="col-lg-4">
                <div class="card bg-body-tertiary border border-secondary-subtle rounded-4 sticky-top"
                    style="top: 90px;">
                    <div class="card-body p-4">
                        <h5 class="fw-bold mb-4 d-flex align-items-center gap-2">
                            <i class="bi bi-receipt text-primary"></i>
                            Résumé
                        </h5>

                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Articles</span>
                            <span class="fw-bold">{{ cartItemCount }}</span>
                        </div>

                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Sous-total TTC</span>
                            <span class="fw-bold">{{ cartTotal.toFixed(2) }} €</span>
                        </div>

                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Livraison</span>
                            <span class="text-success fw-bold">Gratuite</span>
                        </div>

                        <hr class="border-secondary opacity-25">

                        <div class="d-flex justify-content-between mb-4">
                            <span class="h5 fw-bold mb-0">Total TTC</span>
                            <span class="h5 fw-bold text-primary mb-0">{{ cartTotal.toFixed(2) }} €</span>
                        </div>

                        <!-- Bouton Valider Commande -->
                        <button v-if="clientAuth.isAuthenticated || clientAuth.isAnonymous"
                            class="btn btn-primary w-100 rounded-3 fw-bold py-3 shadow-sm hover-lift"
                            :disabled="isOrdering || cartItems.length === 0" @click="cartToOrder">
                            <span v-if="isOrdering" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-check-circle me-2"></i>
                            {{ isOrdering ? 'Validation en cours...' : 'Valider la commande' }}
                        </button>

                        <RouterLink v-else to="/boutique/auth"
                            class="btn btn-primary w-100 rounded-3 fw-bold py-3 shadow-sm hover-lift text-decoration-none text-center">
                            <i class="bi bi-person-check me-2"></i>
                            Connectez-vous pour commander
                        </RouterLink>

                        <RouterLink to="/boutique/produit" class="btn btn-outline-light w-100 rounded-3 mt-2 fw-bold">
                            <i class="bi bi-arrow-left me-2"></i>
                            Continuer les achats
                        </RouterLink>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cart-item-card {
    transition: all 0.2s ease;
}

.cart-item-card:hover {
    border-color: rgba(var(--bs-primary-rgb), 0.3) !important;
    box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
}

.hover-primary:hover {
    color: var(--bs-primary) !important;
}

.hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.pulse {
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.1;
    }

    50% {
        opacity: 0.2;
    }
}

.object-fit-cover {
    object-fit: cover;
}
</style>
