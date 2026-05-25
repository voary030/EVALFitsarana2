<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ProductService } from '@/service/product/ProductService'
import type { Product } from '@/types/product'
import { CombinationService } from '@/service/combination/CombinationService'
import { ImageApi } from '@/api/image/ImageApi'
import type { ProductOption } from '@/types/product_option'
import type { ProductOptionValue } from '@/types/product_option_value'
import type { Combination } from '@/types/combination'
import { CartService } from '@/service/cart/CartService'
import { useClientAuthStore } from '@/stores/clientAuth'
import apiClient from '@/api/client'
import { StockAvailableService } from '@/service/stock_available/StockAvailableService'

const route = useRoute()
const productId = route.params.id as string
const clientAuth = useClientAuthStore()

const product = ref<Product | null>(null)
const isLoading = ref(true)
const activeImage = ref('')
const quantity = ref(1)
const stockQuantity = ref<number | null>(null)

const optionGroups = ref<{ option: ProductOption; values: ProductOptionValue[] }[]>([])
const selectedOptions = ref<Record<number, number>>({})
const combinations = ref<Combination[]>([])
const displayPrice = ref(0)
const displayPriceTtc = ref(0)

const addingToCart = ref(false)

const currentCombination = computed(() => {
    return combinations.value.find(c => {
        const selectedVals = Object.values(selectedOptions.value)
        return selectedVals.every(val => val !== undefined && c.product_option_value_ids.includes(val))
    })
})

watch(currentCombination, async (combo) => {
    if (combo && combo.image_ids.length > 0) {
        activeImage.value = ImageApi.getProductImageUrl(productId, combo.image_ids[0])
    }
    await Promise.all([
        updateDisplayPrice(),
        updateStock()
    ])
})

const updateStock = async () => {
    try {
        const comboId = currentCombination.value?.id ?? 0
        const stock = await StockAvailableService.getByProductId(Number(productId), comboId)
        stockQuantity.value = stock ? Number(stock.quantity) : 0
    } catch (error) {
        console.error('Erreur lors du chargement du stock:', error)
        stockQuantity.value = 0
    }
}

const updateDisplayPrice = async () => {
    try {
        const comboId = currentCombination.value?.id ?? 0
        displayPrice.value = await ProductService.getPrix(productId, comboId)
        displayPriceTtc.value = await ProductService.getPrixTtc(productId, comboId)
    } catch (error) {
        console.error('Erreur lors du calcul du prix:', error)
        displayPrice.value = product.value?.price || 0
        displayPriceTtc.value = (product.value?.prix_ttc ?? product.value?.price) || 0
    }
}

const fetchProduct = async () => {
    isLoading.value = true
    try {
        const [data, combos] = await Promise.all([
            ProductService.getById(productId),
            CombinationService.getByProductId(productId)
        ])
        if (!data) return
        product.value = data
        activeImage.value = data.images?.[0] ?? ''
        combinations.value = combos
        const groups = await ProductService.getProductOptionGroups(productId)
        for (const group of groups) {
            selectedOptions.value[group.option.id] = group.values[0]?.id ?? 0
        }
        optionGroups.value = groups
        await Promise.all([
            updateDisplayPrice(),
            updateStock()
        ])
    } catch (error) {
        console.error('Erreur lors du chargement du produit:', error)
    } finally {
        isLoading.value = false
    }
}

const setActiveImage = (img: string) => {
    activeImage.value = img
}

const selectColor = (optionId: number, val: ProductOptionValue) => {
    selectedOptions.value[optionId] = val.id
}

async function getCustomerAddressId(customerId: number): Promise<number> {
    try {
        const response = await apiClient.get(`/addresses?filter[id_customer]=${customerId}&display=[id]`)
        const xml = response.data as string
        const match = xml.match(/<id>\s*<!\[CDATA\[(\d+)\]\]>\s*<\/id>/)
            || xml.match(/<id>(\d+)<\/id>/)
        return match ? Number(match[1]) : 0
    } catch {
        return 0
    }
}

async function addCart() {
    if (addingToCart.value) return
    addingToCart.value = true

    if (stockQuantity.value !== null && quantity.value > stockQuantity.value) {
        alert('La quantité demandée est supérieure au stock disponible.')
        addingToCart.value = false
        return
    }

    try {
        const customerId = clientAuth.client?.id
        if (!customerId) {
            alert('Vous devez être connecté pour ajouter au panier')
            return
        }

        const addressId = await getCustomerAddressId(customerId)
        if (!addressId) {
            alert("Aucune adresse trouvée pour ce client")
            return
        }

        const savedCartId = localStorage.getItem('current_cart_id')

        const cart = await CartService.addToCart({
            id_customer: customerId,
            id_address_delivery: addressId,
            id_product: Number(productId),
            id_product_attribute: currentCombination.value?.id ?? 0,
            quantity: quantity.value,
            cartId: savedCartId ? Number(savedCartId) : undefined,
            id_shop_group: 1,
        })

        if (cart) {
            localStorage.setItem('current_cart_id', String(cart.id))
            alert(`Produit ajouté au panier ! (${quantity.value}x)`)
            // Recharger le compteur du panier dans la navbar
            window.dispatchEvent(new CustomEvent('cart-updated'))
        }
    } catch (error: any) {
        console.error('Erreur ajout panier:', error)
        alert(error.message || "Erreur lors de l'ajout au panier")
    } finally {
        addingToCart.value = false
    }
}

onMounted(fetchProduct)
</script>

<template>
    <div class="product-detail-container pb-5">
        <!-- Skeleton Loader -->
        <div v-if="isLoading">
            <nav aria-label="breadcrumb" class="mb-4">
                <div class="skeleton-text bg-secondary opacity-10 rounded" style="height: 20px; width: 200px;"></div>
            </nav>
            <div class="row g-5">
                <div class="col-lg-6">
                    <div class="skeleton-img bg-secondary opacity-10 rounded-4 mb-3 pulse" style="height: 500px;"></div>
                    <div class="row g-2">
                        <div v-for="n in 4" :key="n" class="col-3">
                            <div class="skeleton-img bg-secondary opacity-10 rounded-3 pulse" style="height: 80px;">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="ps-lg-4">
                        <div class="skeleton-text bg-secondary opacity-10 rounded-pill mb-3 pulse"
                            style="height: 25px; width: 100px;"></div>
                        <div class="skeleton-text bg-secondary opacity-10 rounded mb-3 pulse"
                            style="height: 40px; width: 80%;"></div>
                        <div class="skeleton-text bg-secondary opacity-10 rounded mb-4 pulse"
                            style="height: 30px; width: 30%;"></div>
                        <div class="skeleton-img bg-secondary opacity-10 rounded-4 mb-4 pulse" style="height: 120px;">
                        </div>
                        <div class="skeleton-img bg-secondary opacity-10 rounded-4 mb-4 pulse" style="height: 200px;">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Real Content -->
        <div v-else-if="product">
            <nav aria-label="breadcrumb" class="mb-4">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item">
                        <RouterLink to="/boutique" class="text-decoration-none">Accueil</RouterLink>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">{{ product.name }}</li>
                </ol>
            </nav>

            <div class="row g-5">
                <!-- Galerie Images -->
                <div class="col-lg-6">
                    <div class="main-image-container rounded-4 overflow-hidden border shadow-sm mb-3 bg-body-tertiary">
                        <img :src="activeImage || 'https://placehold.co/600x600?text=Pas+d\'image'"
                            class="img-fluid w-100" alt="Product Image">
                    </div>
                    <div class="row g-2" v-if="product.images && product.images.length > 1">
                        <div v-for="(img, index) in product.images" :key="index" class="col-3">
                            <div class="thumb-container rounded-3 overflow-hidden border cursor-pointer transition-all"
                                :class="{ 'border-primary border-2 shadow-sm': activeImage === img }"
                                @click="setActiveImage(img)">
                                <img :src="img" class="img-fluid" alt="thumb">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Infos Produit -->
                <div class="col-lg-6">
                    <div class="ps-lg-4">
                        <h1 class="fw-bold mb-3 h2">{{ product.name }}</h1>
                        <p class="h3 text-primary fw-bold mb-3">
                            {{ displayPriceTtc.toFixed(2) }} € TTC
                            <small class="text-muted fs-6 fw-normal ms-2">({{ displayPrice.toFixed(2) }} € HT)</small>
                        </p>

                        <div class="d-flex align-items-center mb-4">
                            <span class="fw-bold me-2">Stock:</span>
                            <span class="badge rounded-pill px-3 py-2 text-white"
                                :class="stockQuantity !== null && stockQuantity > 0 ? 'bg-success' : 'bg-danger'">
                                <span v-if="stockQuantity !== null">{{ stockQuantity }} en stock</span>
                                <span v-else class="spinner-border spinner-border-sm" role="status"
                                    style="width: 1rem; height: 1rem;"></span>
                            </span>
                        </div>

                        <div class="description mb-4 p-4 rounded-4 bg-body-tertiary border border-secondary-subtle">
                            <div v-if="product.description" class="mb-0 text-light opacity-75 lh-base"
                                v-html="product.description"></div>
                            <p v-else class="mb-0 text-muted opacity-50 italic">Aucune description disponible.</p>
                        </div>

                        <!-- Options du produit (Couleur, Taille, etc.) -->
                        <div class="options-container mb-4" v-if="optionGroups.length > 0">
                            <div v-for="group in optionGroups" :key="group.option.id" class="mb-3">
                                <h6 class="fw-bold text-uppercase small letter-spacing-1 mb-2 text-primary">{{
                                    group.option.name }}</h6>

                                <div v-if="group.option.is_color_group === 1" class="d-flex flex-wrap gap-2">
                                    <div v-for="val in group.values" :key="val.id"
                                        class="color-option rounded-circle border cursor-pointer"
                                        :class="{ 'border-primary border-3': selectedOptions[group.option.id] === val.id }"
                                        :style="{ backgroundColor: val.color || '#ccc', width: '35px', height: '35px', outline: selectedOptions[group.option.id] === val.id ? '2px solid white' : 'none' }"
                                        @click="selectColor(group.option.id, val)" :title="val.name">
                                    </div>
                                </div>
                                <div v-else>
                                    <select
                                        class="form-select bg-dark text-white border-secondary-subtle rounded-3 w-auto"
                                        v-model="selectedOptions[group.option.id]">
                                        <option v-for="val in group.values" :key="val.id" :value="val.id">{{ val.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Quantité et Panier -->
                        <div class="action-bar p-3 rounded-4 bg-body-tertiary border border-secondary-subtle mb-4">
                            <div class="row g-3 align-items-center">
                                <div class="col-12 col-sm-auto">
                                    <label class="small text-uppercase fw-bold text-muted mb-2 d-block">Quantité</label>
                                    <div class="input-group quantity-selector rounded-3 overflow-hidden border border-secondary-subtle"
                                        style="height: 48px;">
                                        <button class="btn btn-dark border-0 px-3 h-100"
                                            @click="quantity > 1 ? quantity-- : null">
                                            <i class="bi bi-dash-lg"></i>
                                        </button>
                                        <input type="number"
                                            class="form-control bg-dark border-0 text-center text-white fw-bold shadow-none h-100"
                                            v-model="quantity" style="width: 60px;">
                                        <button class="btn btn-dark border-0 px-3 h-100" @click="quantity++">
                                            <i class="bi bi-plus-lg"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="col-12 col-sm">
                                    <label
                                        class="small text-uppercase fw-bold text-transparent mb-2 d-none d-sm-block">&nbsp;</label>
                                    <button @click="addCart()" :disabled="addingToCart"
                                        class="btn btn-primary w-100 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 hover-lift"
                                        style="height: 48px;">
                                        <span v-if="addingToCart" class="spinner-border spinner-border-sm"
                                            role="status"></span>
                                        <i v-else class="bi bi-basket3-fill fs-5"></i>
                                        <span>{{ addingToCart ? 'Ajout...' : 'Ajouter au panier' }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="text-center py-5">
            <h2 class="text-muted">Produit non trouvé</h2>
            <RouterLink to="/boutique" class="btn btn-primary mt-3">Retour à la boutique</RouterLink>
        </div>
    </div>
</template>

<style scoped>
.letter-spacing-1 {
    letter-spacing: 1px;
}

.thumb-container:hover {
    transform: scale(0.95);
    opacity: 0.8;
}

.main-image-container img {
    transition: transform 0.3s ease;
}

.main-image-container:hover img {
    transform: scale(1.05);
}

.cursor-pointer {
    cursor: pointer;
}

.quantity-selector input::-webkit-outer-spin-button,
.quantity-selector input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.py-2-5 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
}

.hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.color-option {
    transition: all 0.2s ease;
}

.color-option:hover {
    transform: scale(1.15);
}
</style>
