<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { CategoryService } from '@/service/category/CategoryService'
import { StatistiqueService } from '@/service/statistique/StatistiqueService'
import type { Category } from '@/types/category'

interface CategoryStat {
    category: Category
    salesHt: number
    purchasesHt: number
    marginHt: number
    quantitySold: number
}

const loading = ref(false)
const error = ref<string | null>(null)

const totalSalesHt = ref(0)
const totalPurchasesHt = ref(0)
const netMarginHt = ref(0)
const categoryStats = ref<CategoryStat[]>([])

const totalQuantitySold = computed(() => categoryStats.value.reduce((acc, stat) => acc + stat.quantitySold, 0))
const totalTableSalesHt = computed(() => categoryStats.value.reduce((acc, stat) => acc + stat.salesHt, 0))
const totalTablePurchasesHt = computed(() => categoryStats.value.reduce((acc, stat) => acc + stat.purchasesHt, 0))
const totalTableMarginHt = computed(() => categoryStats.value.reduce((acc, stat) => acc + stat.marginHt, 0))

const fetchStats = async () => {
    loading.value = true
    error.value = null
    try {
        // Fetch global metrics
        const [sales, purchases, categories] = await Promise.all([
            StatistiqueService.getMontantTotalVenteHt(),
            StatistiqueService.getMontantTotalAchatHt(),
            CategoryService.getAll()
        ])

        totalSalesHt.value = sales
        totalPurchasesHt.value = purchases
        netMarginHt.value = sales - purchases

        const filteredCategories = categories.filter(cat => Number(cat.id) !== 1 && Number(cat.id) !== 2)

        // Fetch per-category metrics in parallel
        const statsPromises = filteredCategories.map(async (cat) => {
            const [catSales, catPurchases, catQty] = await Promise.all([
                StatistiqueService.getMontantTotalVenteByCatHt(cat.id),
                StatistiqueService.getMontantAchatVenduByCatHt(cat.id),
                StatistiqueService.getQuantiteVendueByCat(cat.id)
            ])
            return {
                category: cat,
                salesHt: catSales,
                purchasesHt: catPurchases,
                marginHt: catSales - catPurchases,
                quantitySold: catQty
            }
        })

        categoryStats.value = await Promise.all(statsPromises)
    } catch (err: any) {
        console.error('Erreur lors du chargement des statistiques:', err)
        error.value = 'Une erreur est survenue lors du calcul des indicateurs financiers.'
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchStats()
})
</script>

<template>
    <div class="container py-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 mb-1 text-white fw-bold">Statistiques Financières</h1>
                <p class="text-secondary mb-0">Analyse détaillée du chiffre d'affaires et des coûts d'acquisition par
                    catégorie.</p>
            </div>
            <button class="btn btn-outline-primary d-flex align-items-center gap-2" :disabled="loading"
                @click="fetchStats">
                <i class="bi bi-arrow-clockwise" :class="{ 'spin-anim': loading }"></i>
                Actualiser
            </button>
        </div>

        <div v-if="error" class="alert alert-danger shadow-sm border-0 mb-4">{{ error }}</div>

        <!-- Loader -->
        <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
            <span class="text-secondary fw-semibold">Calcul en cours des indicateurs de vente et d'achat...</span>
        </div>

        <div v-else>
            <!-- Global Cards -->
            <div class="row g-4 mb-5">
                <!-- Sales Card -->
                <div class="col-12 col-md-6">
                    <div class="card stat-card border-0 shadow-sm overflow-hidden h-100 bg-glass-blue">
                        <div class="card-body p-4 position-relative">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-uppercase text-info fw-bold tracking-wider fs-7">Ventes Totales
                                    (HT)</span>
                                <div class="icon-circle bg-info-light text-info">
                                    <i class="bi bi-cash-stack fs-4"></i>
                                </div>
                            </div>
                            <h2 class="display-6 fw-bold mb-1 text-white">{{ totalSalesHt.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2, maximumFractionDigits: 2
                            }) }} €</h2>
                            <p class="text-info-light mb-0 fs-7">Chiffre d'affaires cumulé hors taxe</p>
                            <div class="card-glow bg-info"></div>
                        </div>
                    </div>
                </div>

                <!-- Purchases Card -->
                <div class="col-12 col-md-6">
                    <div class="card stat-card border-0 shadow-sm overflow-hidden h-100 bg-glass-orange">
                        <div class="card-body p-4 position-relative">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-uppercase text-warning fw-bold tracking-wider fs-7">Achats Totaux
                                    (HT)</span>
                                <div class="icon-circle bg-warning-light text-warning">
                                    <i class="bi bi-cart-check fs-4"></i>
                                </div>
                            </div>
                            <h2 class="display-6 fw-bold mb-1 text-white">{{ totalPurchasesHt.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2, maximumFractionDigits: 2
                            }) }} €</h2>
                            <p class="text-warning-light mb-0 fs-7">Valorisation totale des entrées de stock</p>
                            <div class="card-glow bg-warning"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Category Table -->
            <div class="card border-0 shadow-sm bg-glass-dark">
                <div
                    class="card-header bg-transparent border-0 px-4 py-3 d-flex align-items-center justify-content-between">
                    <h5 class="mb-0 fw-bold text-white">Analyse Sectorielle par Catégorie</h5>
                    <span class="badge bg-secondary-light text-secondary rounded-pill px-3">{{ categoryStats.length }}
                        catégories actives</span>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-dark table-hover mb-0 align-middle">
                            <thead>
                                <tr class="text-secondary border-bottom border-secondary-light">
                                    <th class="px-4 py-3 text-uppercase tracking-wider fs-8 fw-bold">ID</th>
                                    <th class="py-3 text-uppercase tracking-wider fs-8 fw-bold">Catégorie</th>
                                    <th class="py-3 text-end text-uppercase tracking-wider fs-8 fw-bold">Qté vendue</th>
                                    <th class="py-3 text-end text-uppercase tracking-wider fs-8 fw-bold">Ventes (HT)</th>
                                    <th class="py-3 text-end text-uppercase tracking-wider fs-8 fw-bold">Achats (HT)</th>
                                    <th class="px-4 py-3 text-end text-uppercase tracking-wider fs-8 fw-bold">Marge Brute (HT)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="stat in categoryStats" :key="stat.category.id"
                                    class="border-bottom border-secondary-light">
                                    <td class="px-4 text-secondary-light font-monospace">{{ stat.category.id }}</td>
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <div class="avatar-init bg-secondary text-white rounded fw-bold fs-7">
                                                {{ (stat.category.name || 'C').charAt(0).toUpperCase() }}
                                            </div>
                                            <span class="fw-semibold text-white">{{ stat.category.name }}</span>
                                        </div>
                                    </td>
                                    <td class="text-end fw-bold text-white-50">
                                        {{ stat.quantitySold }}
                                    </td>
                                    <td class="text-end fw-semibold text-info">
                                        {{ stat.salesHt.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) }} €
                                    </td>
                                    <td class="text-end text-warning">
                                        {{ stat.purchasesHt.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) }} €
                                    </td>
                                    <td class="px-4 text-end fw-bold"
                                        :class="stat.marginHt >= 0 ? 'text-success' : 'text-danger'">
                                        {{ stat.marginHt.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) }} €
                                    </td>
                                </tr>
                                <tr v-if="categoryStats.length === 0">
                                    <td colspan="6" class="text-center py-4 text-secondary fs-6">Aucune catégorie trouvée ou configurée.</td>
                                </tr>
                            </tbody>
                            <tfoot v-if="categoryStats.length > 0" class="border-top border-secondary">
                                <tr class="bg-secondary bg-opacity-10">
                                    <td colspan="2" class="px-4 py-3 text-end fw-bold text-white text-uppercase tracking-wider fs-7">
                                        Total
                                    </td>
                                    <td class="text-end fw-bold text-white-50 fs-6">
                                        {{ totalQuantitySold }}
                                    </td>
                                    <td class="text-end fw-bold text-info fs-6">
                                        {{ totalTableSalesHt.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) }} €
                                    </td>
                                    <td class="text-end fw-bold text-warning fs-6">
                                        {{ totalTablePurchasesHt.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) }} €
                                    </td>
                                    <td class="px-4 text-end fw-bold fs-6"
                                        :class="totalTableMarginHt >= 0 ? 'text-success' : 'text-danger'">
                                        {{ totalTableMarginHt.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) }} €
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Glassmorphism custom styling */
.bg-glass-dark {
    background: rgba(30, 34, 45, 0.45) !important;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.bg-glass-blue {
    background: linear-gradient(135deg, rgba(13, 110, 253, 0.15), rgba(13, 110, 253, 0.05)) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(13, 110, 253, 0.2);
}

.bg-glass-orange {
    background: linear-gradient(135deg, rgba(253, 126, 20, 0.15), rgba(253, 126, 20, 0.05)) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(253, 126, 20, 0.2);
}

.bg-glass-green {
    background: linear-gradient(135deg, rgba(25, 135, 84, 0.15), rgba(25, 135, 84, 0.05)) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(25, 135, 84, 0.2);
}

.bg-glass-red {
    background: linear-gradient(135deg, rgba(220, 53, 69, 0.15), rgba(220, 53, 69, 0.05)) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(220, 53, 69, 0.2);
}

.stat-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3) !important;
}

.icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.bg-info-light {
    background-color: rgba(13, 202, 240, 0.15);
}

.bg-warning-light {
    background-color: rgba(255, 193, 7, 0.15);
}

.bg-success-light {
    background-color: rgba(25, 135, 84, 0.15);
}

.bg-danger-light {
    background-color: rgba(220, 53, 69, 0.15);
}

.bg-secondary-light {
    background-color: rgba(108, 117, 125, 0.15);
}

.text-info-light {
    color: rgba(13, 202, 240, 0.75);
}

.text-warning-light {
    color: rgba(255, 193, 7, 0.75);
}

.text-success-light {
    color: rgba(25, 135, 84, 0.75);
}

.text-danger-light {
    color: rgba(220, 53, 69, 0.75);
}

.card-glow {
    position: absolute;
    bottom: -30px;
    right: -30px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    filter: blur(45px);
    opacity: 0.15;
    pointer-events: none;
}

.border-secondary-light {
    border-color: rgba(255, 255, 255, 0.05) !important;
}

.avatar-init {
    width: 32px;
    height: 32px;
    background-color: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
}

.tracking-wider {
    letter-spacing: 0.07em;
}

.fs-7 {
    font-size: 0.85rem;
}

.fs-8 {
    font-size: 0.75rem;
}

.spin-anim {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>
