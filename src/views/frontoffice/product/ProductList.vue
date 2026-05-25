<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import ProductCard from '@/components/product/ProductCard.vue'
import { ProductService } from '@/service/product/ProductService'
import { CategoryService } from '@/service/category/CategoryService'
import type { Product } from '@/types/product'
import type { Category } from '@/types/category'

const categories = ref<Category[]>([])
const selectedCategory = ref<string | number>('Tout')

const searchName = ref('')
const priceMin = ref(0)
const priceMax = ref(1000)
const products = ref<Product[]>([])
const currentPage = ref(1)
const itemsPerPage = 11
const totalProducts = ref(0)
const isLoading = ref(true)

const totalPages = computed(() => Math.ceil(totalProducts.value / itemsPerPage))

const paginationPages = computed(() => {
    const pages: number[] = []
    const start = Math.max(1, currentPage.value - 2)
    const end = Math.min(totalPages.value, currentPage.value + 2)
    for (let i = start; i <= end; i++) {
        pages.push(i)
    }
    return pages
})

const fetchCategories = async () => {
    try {
        const cats = await CategoryService.getAll()
        categories.value = cats
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error)
    }
}

const fetchProducts = async () => {
    isLoading.value = true
    try {
        const filters =
        {
            name: searchName.value.trim(),
            category: selectedCategory.value !== 'Tout' ? String(selectedCategory.value) : undefined,
            priceMin: priceMin.value,
            priceMax: priceMax.value,
        }
        const data = await ProductService.getAllDynamique(currentPage.value, itemsPerPage, filters)
        products.value = data
    } catch (error) {
        alert(error)
        console.error('Erreur lors du chargement des produits:', error)
    } finally {
        isLoading.value = false
    }
}

const fetchTotalCount = async () => {
    try {
        totalProducts.value = await ProductService.countAll()
    } catch (error) {
        console.error('Erreur lors du comptage des produits:', error)
    }
}

const changePage = (page: number) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetFilters = () => {
    searchName.value = ''
    selectedCategory.value = 'Tout'
    priceMin.value = 0
    priceMax.value = 1000
    currentPage.value = 1
    fetchProducts()
}

const applyFilters = () => {
    currentPage.value = 1
    fetchProducts()
}

onMounted(() => {
    fetchCategories()
    fetchTotalCount()
    fetchProducts()
})
watch(currentPage, fetchProducts)

</script>

<template>
    <div class="shop-container py-4">
        <div class="d-flex align-items-center mb-4">
            <div class="icon-box me-3">
                <i class="bi bi-box-seam-fill fs-4 text-primary"></i>
            </div>
            <h2 class="h4 mb-0 fw-bold">Liste des produits</h2>
        </div>

        <div class="row g-4">
            <aside class="col-lg-3">
                <div class="filter-card p-4 rounded-4 border bg-body shadow-sm">
                    <!-- Recherche par nom -->
                    <h5 class="fw-bold mb-3 d-flex align-items-center">
                        <i class="bi bi-search me-2 text-primary"></i>Recherche
                    </h5>
                    <input type="text" class="form-control mb-4 bg-dark text-white border-secondary rounded-3"
                        v-model="searchName" placeholder="Nom du produit...">

                    <hr class="my-4 opacity-50">
                    <h5 class="fw-bold mb-4 d-flex align-items-center">
                        <i class="bi bi-filter-left me-2 text-primary"></i>Catégories
                    </h5>

                    <select class="form-select bg-dark text-white border-secondary rounded-3 mb-4"
                        v-model="selectedCategory">
                        <option value="Tout">Tout</option>
                        <template v-for="cat in categories" :key="cat.id">
                            <template v-if="cat.id != 1 && cat.id != 2">
                                <option :value="cat.id">
                                    {{ cat.name }}
                                </option>
                            </template>
                        </template>
                    </select>

                    <hr class="my-4 opacity-50">
                    <h5 class="fw-bold mb-3">Prix</h5>
                    <div class="row g-2">
                        <div class="col-6">
                            <label class="small text-muted mb-2 d-block">Min €</label>
                            <input type="number" class="form-control bg-dark text-white border-secondary rounded-3"
                                v-model.number="priceMin" min="0" step="0.01" placeholder="0,00">
                        </div>
                        <div class="col-6">
                            <label class="small text-muted mb-2 d-block">Max €</label>
                            <input type="number" class="form-control bg-dark text-white border-secondary rounded-3"
                                v-model.number="priceMax" min="0" step="0.01" placeholder="1000,00">
                        </div>
                    </div>

                    <div class="d-flex gap-2 mt-4">
                        <button class="btn btn-primary btn-sm w-100 rounded-3" @click="applyFilters">
                            <i class="bi bi-funnel me-2"></i>Appliquer
                        </button>
                        <button class="btn btn-outline-secondary btn-sm w-100 rounded-3" @click="resetFilters">
                            <i class="bi bi-arrow-counterclockwise me-2"></i>Réinitialiser
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Liste des Produits -->
            <div class="col-lg-9">
                <!-- Toolbar Supérieure -->
                <div
                    class="d-flex justify-content-between align-items-center mb-4 bg-body p-3 rounded-4 border shadow-sm">
                    <p class="mb-0 text-muted small fw-medium">
                        Affichage de <span class="text-white fw-bold">{{ products.length }}</span> produits
                    </p>

                    <!-- <div class="d-flex align-items-center gap-3">
                        <label class="small text-muted fw-bold text-uppercase d-none d-md-block"
                            style="font-size: 0.7rem; letter-spacing: 1px;">Trier par :</label>
                        <select class="form-select border-0 bg-light shadow-none rounded-3 cursor-pointer select-sort">
                            <option selected>Pertinence</option>
                            <option>Nom, A à Z</option>
                            <option>Nom, Z à A</option>
                            <option>Prix, croissant</option>
                            <option>Prix, décroissant</option>
                        </select>
                    </div> -->
                </div>

                <div v-if="isLoading" class="row g-4">
                    <div v-for="n in 11" :key="n" class="col-sm-6 col-md-4 col-xl-3">
                        <div class="card h-100 border-0 shadow-sm bg-body overflow-hidden rounded-4 skeleton-card">
                            <div class="skeleton-img bg-secondary opacity-10" style="height: 250px;"></div>
                            <div class="card-body p-3">
                                <div class="skeleton-badge mb-3 pb-2"></div>
                                <div class="skeleton-text mb-2 pb-2" style="width: 85%;"></div>
                                <div class="skeleton-text" style="width: 50%;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="row g-4">
                    <div v-for="product in products" :key="product.id" class="col-sm-6 col-md-4 col-xl-3">
                        <ProductCard :product="product" />
                    </div>
                </div>

                <nav class="mt-5 d-flex justify-content-center">
                    <ul class="pagination pagination-rounded gap-2">
                        <li class="page-item" :class="{ disabled: currentPage === 1 }">
                            <a class="page-link border-0 shadow-sm rounded-3" href="#"
                                @click.prevent="changePage(currentPage - 1)">
                                <i class="bi bi-chevron-left"></i>
                            </a>
                        </li>
                        <li v-for="page in paginationPages" :key="page" class="page-item"
                            :class="{ active: currentPage === page }">
                            <a class="page-link border-0 shadow-sm rounded-3 px-3" href="#"
                                @click.prevent="changePage(page)">{{
                                    page }}</a>
                        </li>
                        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                            <a class="page-link border-0 shadow-sm rounded-3" href="#"
                                @click.prevent="changePage(currentPage + 1)">
                                <i class="bi bi-chevron-right"></i>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>
</template>

<style scoped>
.icon-box {
    width: 45px;
    height: 45px;
    background: rgba(var(--bs-primary-rgb), 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.filter-card {
    position: sticky;
    top: 100px;
}

.custom-check .form-check-input {
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.05);
}

.custom-check .form-check-label:hover {
    color: var(--bs-primary);
}

.select-sort {
    font-size: 0.9rem;
    width: 200px;
    background-color: #2b2b2b !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.select-sort option {
    background-color: #2b2b2b;
    color: #ffffff;
}

.pagination-rounded .page-link {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--bs-body-color);
}

.pagination-rounded .page-item.active .page-link {
    background-color: var(--bs-primary);
    color: white;
}

.cursor-pointer {
    cursor: pointer;
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

.skeleton-card {
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-img {
    animation: pulse 1.5s infinite ease-in-out;
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

.form-control.bg-dark {
    color: #ffffff !important;
}

.form-control.bg-dark::placeholder {
    color: rgba(255, 255, 255, 0.5);
}
</style>
