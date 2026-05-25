<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import { CategoryService } from '@/service/category/CategoryService';
import { StockAvailableService } from '@/service/stock_available/StockAvailableService';

const props = defineProps<{
    product: Product
}>()

const category = ref<Category | undefined>(undefined)
const stockAvailable = ref<number | null>(null)
const isLoading = ref(true)

const productBadge = computed<'HOT' | 'NEW' | null>(() => {
    // console.log(`[productBadge] id=${props.product.id} | available_date="${props.product.available_date}"`)

    if (!props.product.available_date || props.product.available_date === '0000-00-00') {
        // console.log(`[productBadge] id=${props.product.id} → null (pas de date valide)`)
        return null
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const availDate = new Date(props.product.available_date)
    availDate.setHours(0, 0, 0, 0)

    const diffMs = now.getTime() - availDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // console.log(`[productBadge] id=${props.product.id} | now: ${now.toISOString()} | availDate: ${availDate.toISOString()} | diffDays: ${diffDays}`)

    if (diffDays >= 0 && diffDays <= 1) {
        // console.log('[productBadge] → HOT')
        return 'HOT'
    }
    if (diffDays >= 0 && diffDays <= 7) {
        // console.log('[productBadge] → NEW')
        return 'NEW'
    }
    // console.log('[productBadge] → null (diffDays hors plage)')
    return null
})

const categoryColorMap: Record<string, string> = {
    'Vêtements': '#198754',
    'Accessoires': '#198754',
    'Art': '#ffc107',
    'Maison': '#0dcaf0',
    'Tout': '#6c757d',
}

const getCategoryBgColor = (categoryName?: string): string => {
    if (!categoryName) return '#0d6efd'
    const cleanName = categoryName.trim()
    // console.log('Recherche couleur pour:', cleanName, 'Disponible:', Object.keys(categoryColorMap))
    return categoryColorMap[cleanName] || '#0d6efd'
}

const loadData = async () => {
    try {
        const promises: Promise<any>[] = []

        if (props.product.id_category_default) {
            promises.push(CategoryService.getById(props.product.id_category_default)
                .then(c => { category.value = c }))
        }

        promises.push(StockAvailableService.getByProductId(props.product.id, 0)
            .then(s => {
                if (s) stockAvailable.value = Number(s.quantity)
            }))

        await Promise.all(promises)
    } finally {
        isLoading.value = false
    }
}

onMounted(loadData)
</script>

<template>
    <div class="card h-100 border-0 shadow-sm bg-body product-card overflow-hidden rounded-4">
        <div class="position-relative badge-container">
            <div class="overflow-hidden group">
                <img :src="product.images?.[0] || 'https://placehold.co/400x400?text=Pas+d\'image'"
                    class="card-img-top transition-all scale-hover" :alt="product.name"
                    style="width: 100%; height: auto; display: block;">
            </div>

            <div class="product-overlay d-flex align-items-center justify-content-center">
                <RouterLink :to="`/boutique/produit/${product.id}`"
                    class="btn btn-light btn-sm rounded-pill px-4 shadow fw-bold">
                    <i class="bi bi-eye me-2"></i>Voir
                </RouterLink>
            </div>
        </div>
        <div class="card-body p-3">
            <div v-if="!isLoading">
                <div v-if="category" class="product-info mb-3 pb-2">
                    <span class="info-label">Catégorie:</span>
                    <span :style="{ backgroundColor: getCategoryBgColor(category.name) }"
                        class="badge rounded-pill px-2 py-1 ms-1 text-white">{{ category.name }}</span>
                </div>
                <div class="product-info mb-2 pb-2">
                    <span class="info-label">Produit:</span>
                    <h6 class="card-title mb-0 text-truncate fw-bold d-inline-block ms-1" style="max-width: 70%;">{{
                        product.name }}</h6>
                </div>

                <div class="product-info d-block">
                    <div class="d-flex align-items-center mb-1">
                        <span class="info-label">Prix:</span>
                        <p class="card-text fw-bold text-success mb-0 fs-5 ms-1">
                            {{ (product.prix_ttc ?? product.price).toFixed(2) }} € TTC
                        </p>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="info-label invisible" style="font-size: 0.6rem;">Prix:</span>
                        <p class="text-muted small mb-0 ms-1" style="font-size: 0.8rem;">
                            soit {{ product.price.toFixed(2) }} € HT
                        </p>
                    </div>
                </div>
                <br>
                <div class="product-info mb-2 pb-2">
                    <span class="info-label">Stock:</span>
                    <span class="badge rounded-pill px-2 py-1 ms-1 text-white"
                        :class="stockAvailable !== null && stockAvailable > 0 ? 'bg-success' : 'bg-danger'">
                        <span v-if="stockAvailable !== null">{{ stockAvailable }} en stock</span>
                        <span v-else class="spinner-border spinner-border-sm" role="status"
                            style="width: 0.8rem; height: 0.8rem;"></span>
                    </span>
                </div>
                <div v-if="productBadge" class="mb-2 pb-2 text-center">
                    <span v-if="productBadge === 'HOT'" class="badge bg-danger rounded-pill px-3 py-1">
                        <i class="bi bi-fire me-1"></i>HOT
                    </span>
                    <span v-else-if="productBadge === 'NEW'" class="badge bg-info rounded-pill px-3 py-1">
                        <i class="bi bi-star-fill me-1"></i>NEW
                    </span>
                </div>
                <!-- <div v-if="!productBadge" class="mb-2 pb-2 text-center">
                    <span class="badge bg-info rounded-pill px-3 py-1">
                        <i class="bi bi-star-fill me-1"></i>RIEN
                    </span>
                </div> -->
            </div>
            <div v-else class="skeleton-loader">
                <div class="skeleton-badge mb-3 pb-2"></div>
                <div class="skeleton-text mb-2 pb-2" style="width: 85%;"></div>
                <div class="skeleton-text" style="width: 50%;"></div>
            </div>
        </div>
    </div>
</template>


<style scoped>
:root {
    --color-label: #6c757d;
    --color-category-bg: #0d6efd;
    --color-category-text: #ffffff;
    --color-product-text: #212529;
    --color-price-text: #198754;
    --color-card-shadow: rgba(0, 0, 0, 0.3);
    --color-card-border: rgba(13, 110, 253, 0.2);
}

.product-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent !important;
}

.product-card:hover {
    border-color: var(--color-card-border) !important;
}

.badge-container {
    position: relative;
    width: 100%;
    height: auto;
}

.badge-absolute {
    z-index: 10 !important;
    display: inline-block !important;
    pointer-events: auto;
}

.scale-hover {
    transition: transform 0.6s ease;
    display: block;
}

.product-card:hover .scale-hover {
    transform: scale(1.05);
}

.product-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    /* background: linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%); */
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
}

.product-card:hover .product-overlay {
    opacity: 1;
    visibility: visible;
}



.product-info {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 0.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.product-info:last-child {
    border-bottom: none;
}

.info-label {
    font-size: 0.7rem;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--color-label);
    font-weight: 600;
}

.badge {
    font-size: 0.75rem;
    font-weight: 500;
}

@keyframes pulse {
    0% {
        opacity: 0.6;
    }

    50% {
        opacity: 0.3;
    }

    100% {
        opacity: 0.6;
    }
}

.skeleton-loader {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.skeleton-badge {
    height: 24px;
    width: 70px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-text {
    height: 16px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
}
</style>
