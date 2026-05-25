<script setup lang="ts">
import { CategoryService } from '@/service/category/CategoryService';
import { DashboardService, type DashboardMetrics } from '@/service/dashboard/DashboardService';
import { StatistiqueService } from '@/service/statistique/StatistiqueService';
import { OrderService } from '@/service/orders/OrderService';
import { onMounted, ref, watch, computed } from 'vue';

interface CategoryStat {
  category: any
  salesHt: number
  purchasesHt: number
  marginHt: number
  quantitySold: number
}

const totalCategory = ref(0)
const loadingCategory = ref(false)

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateFr = (dateStr: string): string => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parts[0]
  const month = parts[1]
  const day = parts[2]
  if (!year || !month || !day) return dateStr
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ]
  const mIndex = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[mIndex] || ''} ${year}`
}

// Période sélectionnée (par défaut le jour actuel en heure locale)
const dateDebut = ref(formatDateLocal(new Date()))
const dateFin = ref(formatDateLocal(new Date()))

const isDateRangeInvalid = computed(() => {
  if (!dateDebut.value || !dateFin.value) return true
  return dateDebut.value > dateFin.value
})

const metrics = ref<DashboardMetrics | null>(null)
const loadingMetrics = ref(false)

const totalSalesHt = ref(0)
const totalPurchasesHt = ref(0)
const netMarginHt = ref(0)
const categoryStats = ref<CategoryStat[]>([])
const loadingStats = ref(false)

// Compteurs d'états de commande
interface OrderStatusCount {
  label: string
  stateId: number
  count: number
  color: string
  icon: string
}
const orderStatusCounts = ref<OrderStatusCount[]>([])
const loadingOrderStatus = ref(false)

const fetchCategories = async () => {
  loadingCategory.value = true
  try {
    totalCategory.value = await CategoryService.count()
  } catch (err) {
    console.error('Erreur categories count:', err)
  } finally {
    loadingCategory.value = false
  }
}

const fetchDashboardData = async () => {
  if (isDateRangeInvalid.value) return
  loadingMetrics.value = true
  try {
    metrics.value = await DashboardService.getMetrics(dateDebut.value, dateFin.value)
  } catch (err: any) {
    alert("Erreur lors de la récupération des données : " + (err.message || err))
  } finally {
    loadingMetrics.value = false
  }
}

const fetchFinancialStats = async () => {
  loadingStats.value = true
  try {
    const [sales, purchases, categories] = await Promise.all([
      StatistiqueService.getMontantTotalVenteHt(),
      StatistiqueService.getMontantTotalAchatHt(),
      CategoryService.getAll()
    ])

    totalSalesHt.value = sales
    totalPurchasesHt.value = purchases
    netMarginHt.value = sales - purchases

    const filteredCategories = categories.filter(cat => Number(cat.id) !== 1 && Number(cat.id) !== 2)

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
    console.error('Erreur lors du chargement des statistiques financières:', err)
  } finally {
    loadingStats.value = false
  }
}

const fetchOrderStatusCounts = async () => {
  loadingOrderStatus.value = true
  try {
    const allOrders = await OrderService.getAll()
    const statusDefs: Array<{ label: string; stateId: number; color: string; icon: string }> = [
      { label: 'Livré', stateId: 5, color: 'text-success', icon: 'bi-check-circle-fill' },
      { label: 'Annulé', stateId: 6, color: 'text-danger', icon: 'bi-x-circle-fill' },
      { label: 'Paiement à distance accepté', stateId: 11, color: 'text-primary', icon: 'bi-globe' },
    ]
    orderStatusCounts.value = statusDefs.map(def => ({
      ...def,
      count: allOrders.filter(o => Number(o.current_state) === def.stateId).length
    }))
  } catch (err: any) {
    console.error('Erreur fetchOrderStatusCounts:', err)
  } finally {
    loadingOrderStatus.value = false
  }
}

// Recharger les données quand les dates changent (si elles sont valides)
watch([dateDebut, dateFin], () => {
  if (isDateRangeInvalid.value) return
  fetchDashboardData()
})

onMounted(() => {
  fetchCategories()
  fetchDashboardData()
  fetchFinancialStats()
  fetchOrderStatusCounts()
})</script>

<template>
  <main class="dashboard-premium py-4">
    <!-- Header: Dashboard Title & Integrated Date Filter -->
    <header
      class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4 mb-5 pb-4 border-bottom border-secondary border-opacity-10">
      <div class="d-flex align-items-center">
        <div class="premium-icon-box me-3 shadow-glow-primary">
          <i class="bi bi-speedometer2 fs-3 text-glow-primary"></i>
        </div>
        <div>
          <h1 class="h2 mb-1 fw-extrabold tracking-tight text-body">Analytique & Pilotage</h1>
          <p class="text-secondary mb-0 small opacity-75">Suivi des performances commerciales en temps réel</p>
        </div>
      </div>

      <!-- Compact Date Selector -->
      <div
        class="d-flex align-items-center gap-3 bg-glass-dark p-2 rounded-4 border border-secondary border-opacity-20 shadow-sm"
        :class="{ 'border-danger border-opacity-50': isDateRangeInvalid }">
        <div class="d-flex align-items-center gap-2 group-date-picker px-2">
          <div class="d-flex flex-column">
            <label class="text-uppercase fs-9 fw-bold text-secondary mb-0" style="font-size: 0.65rem;">Début</label>
            <input type="date" v-model="dateDebut" class="form-control premium-date-input border-0 bg-transparent p-0"
              :class="{ 'text-danger': isDateRangeInvalid }" />
          </div>
          <div class="vr mx-1 opacity-25" style="height: 20px;"></div>
          <div class="d-flex flex-column">
            <label class="text-uppercase fs-9 fw-bold text-secondary mb-0" style="font-size: 0.65rem;">Fin</label>
            <input type="date" v-model="dateFin" class="form-control premium-date-input border-0 bg-transparent p-0"
              :class="{ 'text-danger': isDateRangeInvalid }" />
          </div>
        </div>
        <button class="btn btn-premium-refresh" @click="fetchDashboardData"
          :disabled="loadingMetrics || isDateRangeInvalid">
          <i class="bi bi-arrow-clockwise" :class="{ 'spin-anim': loadingMetrics }"></i>
        </button>
      </div>
    </header>

    <div v-if="loadingMetrics && !metrics" class="text-center py-5">
      <div class="spinner-premium mb-3"></div>
      <p class="text-secondary animate-pulse fw-medium">Synchronisation des données financières...</p>
    </div>

    <div v-else-if="metrics" class="animate-fade-in">

      <!-- Row 1: Key Performance Indicators (Impactful Ribbon) -->
      <div class="row g-4 mb-5">
        <!-- Revenue Period -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div
            class="premium-metric-card card-emerald p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
            <div class="d-flex justify-content-between mb-3">
              <span class="metric-label">Ventes (Période)</span>
              <div class="icon-badge bg-emerald-soft text-emerald"><i class="bi bi-cash-stack fs-5"></i></div>
            </div>
            <div class="metric-value h3 mb-1 fw-bold">{{ metrics.period.ordersAmountTtc.toLocaleString('fr-FR', {
              minimumFractionDigits: 2 }) }} €</div>
            <div class="metric-sub opacity-75">TTC sur la période sélectionnée</div>
          </div>
        </div>

        <!-- Orders Period -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="premium-metric-card card-blue p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
            <div class="d-flex justify-content-between mb-3">
              <span class="metric-label">Commandes</span>
              <div class="icon-badge bg-blue-soft text-blue"><i class="bi bi-archive-fill fs-5"></i></div>
            </div>
            <div class="metric-value h3 mb-1 fw-bold">{{ metrics.period.ordersCount }}</div>
            <div class="metric-sub opacity-75">Validées dans cet intervalle</div>
          </div>
        </div>

        <!-- Carts Period -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div
            class="premium-metric-card card-purple p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
            <div class="d-flex justify-content-between mb-3">
              <span class="metric-label">Paniers Actifs</span>
              <div class="icon-badge bg-purple-soft text-purple"><i class="bi bi-bag-check-fill fs-5"></i></div>
            </div>
            <div class="metric-value h3 mb-1 fw-bold">{{ metrics.period.cartsCount }}</div>
            <div class="metric-sub opacity-75">Non transformés (Période)</div>
          </div>
        </div>

        <!-- Global Revenue -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="premium-metric-card card-pink p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
            <div class="d-flex justify-content-between mb-3">
              <span class="metric-label">Total Global TTC</span>
              <div class="icon-badge bg-pink-soft text-pink"><i class="bi bi-shield-check fs-5"></i></div>
            </div>
            <div class="metric-value h3 mb-1 fw-bold">{{ (metrics.general.ordersAmountTtc +
              metrics.general.cartsAmountTtc).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €</div>
            <div class="metric-sub opacity-75">Cumul historique consolidé</div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Left Column: Detailed Insights & Tables (2/3) -->
        <div class="col-12 col-xl-8">

          <!-- Activity Timeline (Daily Breakdown) -->
          <div
            class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10 mb-4 h-auto">
            <header class="d-flex align-items-center justify-content-between mb-4">
              <h3 class="group-title mb-0 d-flex align-items-center">
                <span class="icon-indicator bg-info me-2"></span>Chronologie d'Activité
              </h3>
              <div
                class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-10 rounded-pill px-3 py-2 fw-semibold">
                {{ metrics.dailyBreakdown.length }} Jours Analysis
              </div>
            </header>

            <div class="table-responsive premium-scrollbar" style="max-height: 400px; overflow-y: auto;">
              <table class="table table-dark table-hover align-middle mb-0 border-0">
                <thead class="sticky-top bg-dark border-bottom border-secondary border-opacity-20" style="z-index: 5;">
                  <tr class="text-secondary small fw-bold text-uppercase tracking-wider">
                    <th class="ps-3 py-3 border-0">Date</th>
                    <th class="py-3 text-center border-0">Commandes</th>
                    <th class="py-3 text-center border-0">Paniers</th>
                    <th class="pe-3 py-3 text-end border-0">Volume TTC</th>
                  </tr>
                </thead>
                <tbody class="border-0">
                  <tr v-for="day in metrics.dailyBreakdown" :key="day.date"
                    class="border-bottom border-secondary border-opacity-10">
                    <td class="ps-3 py-3 text-white-50">
                      <div class="d-flex align-items-center">
                        <i class="bi bi-calendar3 me-2 text-primary opacity-50"></i>
                        <span class="fw-semibold">{{ formatDateFr(day.date) }}</span>
                      </div>
                    </td>
                    <td class="text-center py-3">
                      <span v-if="day.ordersCount > 0"
                        class="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 px-2.5 py-1.5 fw-bold">
                        {{ day.ordersCount }}
                      </span>
                      <span v-else class="text-muted opacity-25 italic small">Aucune</span>
                    </td>
                    <td class="text-center py-3">
                      <span v-if="day.cartsCount > 0"
                        class="badge rounded-pill bg-purple bg-opacity-10 text-purple border border-purple border-opacity-10 px-2.5 py-1.5 fw-bold">
                        {{ day.cartsCount }}
                      </span>
                      <span v-else class="text-muted opacity-25 italic small">Aucun</span>
                    </td>
                    <td class="pe-3 py-3 text-end fw-bold text-success font-monospace">
                      {{ (day.ordersAmountTtc + day.cartsAmountTtc).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2
                      }) }} €
                    </td>
                  </tr>
                  <tr v-if="metrics.dailyBreakdown.length === 0">
                    <td colspan="4" class="text-center py-5 text-secondary">Aucune activité enregistrée sur cette
                      période.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Financial analysis by category -->
          <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10 h-auto">
            <header class="mb-4">
              <h3 class="group-title d-flex align-items-center">
                <span class="icon-indicator bg-primary me-2"></span>Analyse Sectorielle
              </h3>
              <p class="text-secondary small mb-0 mt-1 opacity-75">Répartition de la rentabilité par catégorie de
                produits</p>
            </header>

            <div v-if="loadingStats" class="d-flex flex-column align-items-center justify-content-center py-5">
              <div class="spinner-border text-primary spinner-border-sm mb-3"></div>
              <span class="text-secondary small">Calcul de la marge brute...</span>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-dark table-hover mb-0 align-middle border-0">
                <thead>
                  <tr
                    class="text-secondary small fw-bold text-uppercase border-bottom border-secondary border-opacity-20">
                    <th class="ps-3 py-3 border-0">Catégorie</th>
                    <th class="py-3 text-end border-0">Ventes HT</th>
                    <th class="py-3 text-end border-0">Achats HT</th>
                    <th class="pe-3 py-3 text-end border-0">Marge Brute</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stat in categoryStats" :key="stat.category.id"
                    class="border-bottom border-secondary border-opacity-10">
                    <td class="ps-3 py-3">
                      <div class="d-flex align-items-center">
                        <div
                          class="avatar-init-sm bg-glass-light border border-secondary border-opacity-20 rounded me-2">
                          {{ (stat.category.name || 'C').charAt(0).toUpperCase() }}
                        </div>
                        <span class="fw-semibold text-white">{{ stat.category.name }}</span>
                      </div>
                    </td>
                    <td class="text-end text-info fw-semibold font-monospace">{{ stat.salesHt.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2 }) }} €</td>
                    <td class="text-end text-warning font-monospace">{{ stat.purchasesHt.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2 }) }} €</td>
                    <td class="pe-3 text-end border-0">
                      <span class="fw-bold font-monospace px-2 py-1 rounded"
                        :class="stat.marginHt >= 0 ? 'text-success bg-success bg-opacity-10' : 'text-danger bg-danger bg-opacity-10'">
                        {{ stat.marginHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Column: Secondary metrics & Status (1/3) -->
        <div class="col-12 col-xl-4">
          <!-- Order status distribution -->
          <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10 mb-4">
            <h3 class="group-title mb-4 d-flex align-items-center">
              <span class="icon-indicator bg-warning me-2"></span>Répartition par État
            </h3>

            <div v-if="loadingOrderStatus" class="text-center py-5">
              <div class="spinner-border text-primary spinner-border-sm"></div>
            </div>

            <div v-else class="d-flex flex-column gap-3">
              <div v-for="status in orderStatusCounts" :key="status.stateId"
                class="status-pill d-flex align-items-center justify-content-between p-3 rounded-4 bg-glass-light border border-secondary border-opacity-10 hover-lift">
                <div class="d-flex align-items-center gap-3">
                  <div class="status-icon-wrapper" :style="{ backgroundColor: 'rgba(255,255,255,0.03)' }">
                    <i :class="[status.icon, status.color, 'fs-5']"></i>
                  </div>
                  <div>
                    <div class="text-white fw-semibold small">{{ status.label }}</div>
                    <div class="text-secondary fs-8 opacity-50 text-uppercase tracking-wider">État ID: {{ status.stateId
                      }}</div>
                  </div>
                </div>
                <div class="text-end">
                  <span class="fw-bold fs-4" :class="status.color">{{ status.count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Consolidated Financial Reference (All Time) -->
          <div
            class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10 mb-4 bg-glass-dark">
            <h3 class="group-title mb-4 d-flex align-items-center">
              <span class="icon-indicator bg-success me-2"></span>Référence HT Globale
            </h3>

            <div class="row g-3">
              <div class="col-12">
                <div class="p-3 rounded-4 bg-glass-blue border border-info border-opacity-10">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-info fs-8 fw-bold text-uppercase tracking-wider">Ventes Totales HT</span>
                    <i class="bi bi-graph-up text-info opacity-50"></i>
                  </div>
                  <div class="h4 mb-0 fw-bold text-white">{{ totalSalesHt.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2 }) }} €</div>
                </div>
              </div>
              <div class="col-12">
                <div class="p-3 rounded-4 bg-glass-orange border border-warning border-opacity-10">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-warning fs-8 fw-bold text-uppercase tracking-wider">Achats Totaux HT</span>
                    <i class="bi bi-cart-check text-warning opacity-50"></i>
                  </div>
                  <div class="h4 mb-0 fw-bold text-white">{{ totalPurchasesHt.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2 }) }} €</div>
                </div>
              </div>
            </div>
          </div>

          <!-- General Stats Summary (Footer Sidebar) -->
          <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
            <h3 class="group-title mb-4 d-flex align-items-center">
              <span class="icon-indicator bg-white me-2"></span>Aperçu Historique
            </h3>

            <div class="summary-list d-flex flex-column gap-3">
              <div class="summary-item d-flex justify-content-between align-items-center">
                <span class="text-secondary small">Total Commandes</span>
                <span class="text-white fw-bold">{{ metrics.general.ordersCount }}</span>
              </div>
              <div class="summary-item d-flex justify-content-between align-items-center">
                <span class="text-secondary small">Total Paniers Actifs</span>
                <span class="text-white fw-bold">{{ metrics.general.cartsCount }}</span>
              </div>
              <hr class="border-secondary border-opacity-10 my-1">
              <div class="summary-item d-flex justify-content-between align-items-center">
                <span class="text-secondary small">Valeur Paniers TTC</span>
                <span class="text-pink fw-bold">{{ metrics.general.cartsAmountTtc.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2 }) }} €</span>
              </div>
              <div
                class="summary-item d-flex justify-content-between align-items-center p-3 rounded-3 bg-success bg-opacity-5 mt-2">
                <span class="text-success small fw-bold">Trésorerie Consolidée</span>
                <span class="text-success fw-extrabold">{{ (metrics.general.ordersAmountTtc +
                  metrics.general.cartsAmountTtc).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

.dashboard-premium {
  font-family: 'Outfit', sans-serif;
  color: var(--bs-body-color);
}

.fw-extrabold {
  font-weight: 800;
}

.tracking-tight {
  letter-spacing: -0.025em;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.fs-7 {
  font-size: 0.85rem;
}

.fs-8 {
  font-size: 0.75rem;
}

.fs-9 {
  font-size: 0.65rem;
}

/* Header & Icons */
.premium-icon-box {
  width: 55px;
  height: 55px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.shadow-glow-primary {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
}

.text-glow-primary {
  color: #60a5fa;
  text-shadow: 0 0 12px rgba(96, 165, 250, 0.4);
}

/* Date Picker */
.bg-glass-dark {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
}

.premium-date-input {
  color: #f8fafc !important;
  font-weight: 600;
  font-size: 0.9rem;
  width: 130px;
  cursor: pointer;
}

.premium-date-input:focus {
  box-shadow: none;
}

.btn-premium-refresh {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 12px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-premium-refresh:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(15deg);
}

/* Metrics Cards */
.premium-metric-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.premium-metric-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.5);
}

.metric-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
}

.icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-emerald-soft {
  background: rgba(16, 185, 129, 0.1);
}

.text-emerald {
  color: #34d399;
}

.bg-blue-soft {
  background: rgba(59, 130, 246, 0.1);
}

.text-blue {
  color: #60a5fa;
}

.bg-purple-soft {
  background: rgba(168, 85, 247, 0.1);
}

.text-purple {
  color: #c084fc;
}

.bg-pink-soft {
  background: rgba(236, 72, 153, 0.1);
}

.text-pink {
  color: #f472b6;
}

.card-emerald {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.03));
  border-color: rgba(16, 185, 129, 0.2) !important;
}

.card-blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.03));
  border-color: rgba(59, 130, 246, 0.2) !important;
}

.card-purple {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.03));
  border-color: rgba(168, 85, 247, 0.2) !important;
}

.card-pink {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(236, 72, 153, 0.03));
  border-color: rgba(236, 72, 153, 0.2) !important;
}

/* Group Cards */
.dashboard-group-card {
  background: rgba(30, 41, 59, 0.4) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background 0.3s ease;
}

.dashboard-group-card:hover {
  background: rgba(30, 41, 59, 0.5) !important;
}

.group-title {
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #f1f5f9;
}

.icon-indicator {
  display: inline-block;
  width: 4px;
  height: 14px;
  border-radius: 2px;
}

/* Status Pills */
.status-pill {
  transition: all 0.2s ease;
  cursor: default;
}

.hover-lift:hover {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.05) !important;
}

.status-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-glass-blue {
  background: rgba(59, 130, 246, 0.05);
}

.bg-glass-orange {
  background: rgba(245, 158, 11, 0.05);
}

/* Tables */
.table {
  --bs-table-bg: transparent;
}

.avatar-init-sm {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
}

.premium-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.premium-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.premium-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.spin-anim {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: .5;
  }
}
</style>
