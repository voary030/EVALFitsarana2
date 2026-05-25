<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { StockReservationService, type CategoryStockReservation } from '@/service/stock_reservation/StockReservationService'

const loading = ref(false)
const error = ref<string | null>(null)
const stockReservations = ref<CategoryStockReservation[]>([])

const fetchReservations = async () => {
    loading.value = true
    error.value = null
    try {
        const reservations = await StockReservationService.getCategoryStockReservations()
        stockReservations.value = reservations
    } catch (err: any) {
        console.error('Erreur lors du chargement des réservations de stock:', err)
        error.value = 'Une erreur est survenue lors du chargement des données de réservations et stocks.'
    } finally {
        loading.value = false
    }
}

// Global computed totals
const totalPhysique = computed(() => {
    return stockReservations.value.reduce((sum, item) => sum + item.qtyPhysique, 0)
})

const totalReservee = computed(() => {
    return stockReservations.value.reduce((sum, item) => sum + item.qtyReservee, 0)
})

const totalDisponible = computed(() => {
    return stockReservations.value.reduce((sum, item) => sum + item.qtyDisponible, 0)
})

onMounted(() => {
    fetchReservations()
})
</script>

<template>
    <div class="container py-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 mb-1 text-white fw-bold">Réservations & Stocks par Catégorie</h1>
                <p class="text-secondary mb-0">Indicateurs de stocks physiques, réservés et disponibles ventilés par secteur d'activité.</p>
            </div>
            <button class="btn btn-outline-primary d-flex align-items-center gap-2" :disabled="loading"
                @click="fetchReservations">
                <i class="bi bi-arrow-clockwise" :class="{ 'spin-anim': loading }"></i>
                Actualiser
            </button>
        </div>

        <div v-if="error" class="alert alert-danger shadow-sm border-0 mb-4">{{ error }}</div>

        <!-- Loader -->
        <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
            <span class="text-secondary fw-semibold">Calcul en cours des stocks et réservations...</span>
        </div>

        <div v-else>
            <!-- Global Cards -->
            <div class="row g-4 mb-5">
                <!-- Physical Qty Card -->
                <div class="col-12 col-md-4">
                    <div class="card stat-card border-0 shadow-sm overflow-hidden h-100 bg-glass-blue">
                        <div class="card-body p-4 position-relative">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-uppercase text-info fw-bold tracking-wider fs-7">Qté physique</span>
                                <div class="icon-circle bg-info-light text-info">
                                    <i class="bi bi-boxes fs-4"></i>
                                </div>
                            </div>
                            <h2 class="display-6 fw-bold mb-1 text-white">{{ totalPhysique }}</h2>
                            <p class="text-info-light mb-0 fs-7">Quantité totale en stock physique (Réservée + Disponible)</p>
                            <div class="card-glow bg-info"></div>
                        </div>
                    </div>
                </div>

                <!-- Reserved Qty Card -->
                <div class="col-12 col-md-4">
                    <div class="card stat-card border-0 shadow-sm overflow-hidden h-100 bg-glass-orange">
                        <div class="card-body p-4 position-relative">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-uppercase text-warning fw-bold tracking-wider fs-7">Qté réservée</span>
                                <div class="icon-circle bg-warning-light text-warning">
                                    <i class="bi bi-bookmark-check fs-4"></i>
                                </div>
                            </div>
                            <h2 class="display-6 fw-bold mb-1 text-white">{{ totalReservee }}</h2>
                            <p class="text-warning-light mb-0 fs-7">Quantité dans les commandes non annulées et non livrées</p>
                            <div class="card-glow bg-warning"></div>
                        </div>
                    </div>
                </div>

                <!-- Available Qty Card -->
                <div class="col-12 col-md-4">
                    <div class="card stat-card border-0 shadow-sm overflow-hidden h-100 bg-glass-green">
                        <div class="card-body p-4 position-relative">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-uppercase text-success fw-bold tracking-wider fs-7">Qté disponible</span>
                                <div class="icon-circle bg-success-light text-success">
                                    <i class="bi bi-check-circle fs-4"></i>
                                </div>
                            </div>
                            <h2 class="display-6 fw-bold mb-1 text-white">{{ totalDisponible }}</h2>
                            <p class="text-success-light mb-0 fs-7">Quantité disponible à la vente dans les stocks</p>
                            <div class="card-glow bg-success"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stocks Reservation Table -->
            <div class="card border-0 shadow-sm bg-glass-dark">
                <div class="card-header bg-transparent border-0 px-4 py-3 d-flex align-items-center justify-content-between">
                    <h5 class="mb-0 fw-bold text-white">État des Stocks & Réservations par Catégorie</h5>
                    <span class="badge bg-secondary-light text-secondary rounded-pill px-3">{{ stockReservations.length }} catégories actives</span>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-dark table-hover mb-0 align-middle">
                            <thead>
                                <tr class="text-secondary border-bottom border-secondary-light">
                                    <th class="px-4 py-3 text-uppercase tracking-wider fs-8 fw-bold">ID</th>
                                    <th class="py-3 text-uppercase tracking-wider fs-8 fw-bold">Catégorie</th>
                                    <th class="py-3 text-end text-uppercase tracking-wider fs-8 fw-bold">Qté physique</th>
                                    <th class="py-3 text-end text-uppercase tracking-wider fs-8 fw-bold">Qté réservée</th>
                                    <th class="px-4 py-3 text-end text-uppercase tracking-wider fs-8 fw-bold">Qté disponible</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="res in stockReservations" :key="res.idCategory" class="border-bottom border-secondary-light">
                                    <td class="px-4 text-secondary-light font-monospace">{{ res.idCategory }}</td>
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <div class="avatar-init bg-secondary text-white rounded fw-bold fs-7">
                                                {{ (res.categoryName || 'C').charAt(0).toUpperCase() }}
                                            </div>
                                            <span class="fw-semibold text-white">{{ res.categoryName }}</span>
                                        </div>
                                    </td>
                                    <td class="text-end fw-semibold text-info">
                                        {{ res.qtyPhysique }}
                                    </td>
                                    <td class="text-end text-warning fw-semibold">
                                        {{ res.qtyReservee }}
                                    </td>
                                    <td class="px-4 text-end fw-bold text-success">
                                        {{ res.qtyDisponible }}
                                    </td>
                                </tr>
                                <tr v-if="stockReservations.length === 0">
                                    <td colspan="5" class="text-center py-4 text-secondary fs-6">Aucune catégorie trouvée ou configurée.</td>
                                </tr>
                            </tbody>
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
