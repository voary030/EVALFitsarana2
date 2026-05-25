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
    <!-- Header -->
    <header
      class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5 pb-4 border-bottom border-secondary border-opacity-10">
      <div class="d-flex align-items-center">
        <div class="premium-icon-box me-3">
          <i class="bi bi-speedometer2 fs-3 text-glow-primary"></i>
        </div>
        <div>
          <h1 class="h2 mb-1 fw-extrabold tracking-tight text-body">Tableau de bord & Analytique</h1>
          <p class="text-secondary mb-0 small">Pilotez votre activité commerciale et suivez les performances en temps
            réel</p>
        </div>
      </div>
    </header>

    <div v-if="loadingMetrics && !metrics" class="text-center py-5">
      <div class="spinner-premium mb-3"></div>
      <p class="text-secondary animate-pulse">Chargement de vos analyses financières...</p>
    </div>

    <div v-else-if="metrics" class="animate-fade-in">
      <!-- SECTION 2: GÉNÉRAL (TOTAL HISTORIQUE) -->
      <section class="mb-5">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h2 class="h5 mb-0 fw-bold d-flex align-items-center text-body text-uppercase tracking-wider">
            <i class="bi bi-graph-up-arrow me-2 text-primary"></i>Total général
          </h2>
          <span class="badge bg-glow-primary px-3 py-2 rounded-pill fw-semibold">Global</span>
        </div>

        <div class="row g-4">
          <!-- CARD GROUP: VENTES HISTORIQUES -->
          <div class="col-12 col-xl-6">
            <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
              <h3 class="group-title mb-4 d-flex align-items-center">
                <span class="icon-indicator bg-primary me-2"></span>Cumul des ventes
              </h3>
              <div class="row g-3">
                <!-- Nb Commandes -->
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-blue p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Total Commandes</span>
                      <i class="bi bi-archive metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.general.ordersCount }}</div>
                    <div class="metric-sub">Depuis la création</div>
                  </div>
                </div>
                <!-- Montant HT commenté
                <div class="col-12 col-md-4">
                  <div class="premium-metric-card card-amber p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Chiffre d'Affaires HT</span>
                      <i class="bi bi-bank metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.general.ordersAmountHt.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2
                    }) }} €</div>
                    <div class="metric-sub">Cumul HT</div>
                  </div>
                </div>
                -->
                <!-- Montant TTC -->
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-emerald p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Chiffre d'Affaires TTC</span>
                      <i class="bi bi-shield-check metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.general.ordersAmountTtc.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2
                    }) }} €</div>
                    <div class="metric-sub">Cumul TTC global</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD GROUP: PANIERS EN ATTENTE GÉNÉRAUX -->
          <div class="col-12 col-xl-6">
            <div class="dashboard-group-card p-4 rounded-4 shadow-lg border border-secondary border-opacity-10">
              <h3 class="group-title mb-4 d-flex align-items-center">
                <span class="icon-indicator bg-purple me-2"></span>Encours paniers globaux
              </h3>
              <div class="row g-3">
                <!-- Nb Paniers -->
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-purple p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Total Paniers Actifs</span>
                      <i class="bi bi-bag-check metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.general.cartsCount }}</div>
                    <div class="metric-sub">Paniers non validés</div>
                  </div>
                </div>
                <!-- Montant HT commenté
                <div class="col-12 col-md-4">
                  <div class="premium-metric-card card-amber p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Valeur HT Globale</span>
                      <i class="bi bi-calculator metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.general.cartsAmountHt.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2
                    }) }} €</div>
                    <div class="metric-sub">Valeur HT globale</div>
                  </div>
                </div>
                -->
                <!-- Montant TTC -->
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-pink p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Valeur TTC Globale</span>
                      <i class="bi bi-safe metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.general.cartsAmountTtc.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2
                    }) }} €</div>
                    <div class="metric-sub">Valeur TTC globale</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BILAN CONSOLIDÉ HISTORIQUE -->
        <div class="row g-4 mt-3">
          <div class="col-12">
            <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
              <h3 class="group-title mb-4 d-flex align-items-center">
                <span class="icon-indicator bg-success me-2"></span>Bilan consolidé historique (Commandes + Paniers)
              </h3>
              <div class="row g-3">
                <!-- Total HT Historique Consolidé commenté
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-amber p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Total HT Historique (Commandes + Paniers)</span>
                      <i class="bi bi-wallet2 metric-icon text-warning"></i>
                    </div>
                    <div class="metric-value">{{ (metrics.general.ordersAmountHt +
                      metrics.general.cartsAmountHt).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €</div>
                    <div class="metric-sub">Total HT historique global</div>
                  </div>
                </div>
                -->
                <!-- Total TTC Historique Consolidé -->
                <div class="col-12">
                  <div class="premium-metric-card card-emerald p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Total TTC Historique (Commandes + Paniers)</span>
                      <i class="bi bi-cash-stack metric-icon text-success"></i>
                    </div>
                    <div class="metric-value">{{ (metrics.general.ordersAmountTtc +
                      metrics.general.cartsAmountTtc).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €</div>
                    <div class="metric-sub">Total TTC historique global</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="glass-divider my-5"></div>

      <!-- SECTION 1: PÉRIODE SÉLECTIONNÉE -->
      <section class="mb-4">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h2 class="h5 mb-0 fw-bold d-flex align-items-center text-body text-uppercase tracking-wider">
            <i class="bi bi-calendar-check me-2 text-primary"></i>Statistiques du {{
              dateDebut.split('-').reverse().join('/') }} au {{ dateFin.split('-').reverse().join('/') }}
          </h2>
          <div class="d-flex align-items-center gap-3 bg-glass-light p-2 rounded-4 border shadow-sm flex-nowrap"
            :class="{ 'border-danger': isDateRangeInvalid }">
            <span class="fw-semibold text-nowrap ps-2 small"
              :class="isDateRangeInvalid ? 'text-danger' : 'text-secondary'">Du :</span>
            <input type="date" v-model="dateDebut" class="form-control premium-date-input border-0 bg-transparent"
              :class="{ 'text-danger': isDateRangeInvalid }" />
            <span class="fw-semibold text-nowrap small"
              :class="isDateRangeInvalid ? 'text-danger' : 'text-secondary'">Au
              :</span>
            <input type="date" v-model="dateFin" class="form-control premium-date-input border-0 bg-transparent"
              :class="{ 'text-danger': isDateRangeInvalid }" />
            <button class="btn btn-premium-refresh me-1" @click="fetchDashboardData"
              :disabled="loadingMetrics || isDateRangeInvalid">
              <i class="bi bi-arrow-clockwise" :class="{ 'spin-anim': loadingMetrics }"></i>
            </button>
          </div>
        </div>

        <div class="row g-4">
          <!-- CARD GROUP: COMMANDES VALIDÉES -->
          <div class="col-12 col-xl-6">
            <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
              <h3 class="group-title mb-4 d-flex align-items-center">
                <span class="icon-indicator bg-primary me-2"></span>Commandes de la période
              </h3>
              <div class="row g-3">
                <!-- Nb Commandes -->
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-blue p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Commandes</span>
                      <i class="bi bi-box-seam metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.period.ordersCount }}</div>
                    <div class="metric-sub">Commandes validées</div>
                  </div>
                </div>
                <!-- Montant HT commenté
                <div class="col-12 col-md-4">
                  <div class="premium-metric-card card-amber p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Chiffre d'Affaires HT</span>
                      <i class="bi bi-cash metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.period.ordersAmountHt.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2
                    }) }} €</div>
                    <div class="metric-sub">Total Hors Taxes</div>
                  </div>
                </div>
                -->
                <!-- Montant TTC -->
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-emerald p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Chiffre d'Affaires TTC</span>
                      <i class="bi bi-cash-stack metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.period.ordersAmountTtc.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2
                    }) }} €</div>
                    <div class="metric-sub">Total TTC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD GROUP: PANIERS EN ATTENTE -->
          <div class="col-12 col-xl-6">
            <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
              <h3 class="group-title mb-4 d-flex align-items-center">
                <span class="icon-indicator bg-purple me-2"></span>Paniers non commandés
              </h3>
              <div class="row g-3">
                <!-- Nb Paniers -->
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-purple p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Paniers Actifs</span>
                      <i class="bi bi-cart3 metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.period.cartsCount }}</div>
                    <div class="metric-sub">Non transformés</div>
                  </div>
                </div>
                <!-- Montant HT commenté
                <div class="col-12 col-md-4">
                  <div class="premium-metric-card card-amber p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Valeur HT</span>
                      <i class="bi bi-currency-exchange metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.period.cartsAmountHt.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2
                    }) }} €</div>
                    <div class="metric-sub">Valeur Hors Taxes</div>
                  </div>
                </div>
                -->
                <!-- Montant TTC -->
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-pink p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Valeur TTC</span>
                      <i class="bi bi-wallet2 metric-icon"></i>
                    </div>
                    <div class="metric-value">{{ metrics.period.cartsAmountTtc.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2
                    }) }} €</div>
                    <div class="metric-sub">Valeur TTC estimée</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BILAN CONSOLIDÉ DE LA PÉRIODE -->
        <div class="row g-4 mt-3">
          <div class="col-12">
            <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
              <h3 class="group-title mb-4 d-flex align-items-center">
                <span class="icon-indicator bg-success me-2"></span>Bilan consolidé de la période (Commandes + Paniers)
              </h3>
              <div class="row g-3">
                <!-- Total HT Consolidé commenté
                <div class="col-12 col-md-6">
                  <div class="premium-metric-card card-amber p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Total HT Consolidé (Commandes + Paniers)</span>
                      <i class="bi bi-wallet2 metric-icon text-warning"></i>
                    </div>
                    <div class="metric-value">{{ (metrics.period.ordersAmountHt +
                      metrics.period.cartsAmountHt).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €</div>
                    <div class="metric-sub">Total HT cumulé sur la période</div>
                  </div>
                </div>
                -->
                <!-- Total TTC Consolidé -->
                <div class="col-12">
                  <div class="premium-metric-card card-emerald p-3 rounded-4 border">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="metric-label">Total TTC Consolidé (Commandes + Paniers)</span>
                      <i class="bi bi-cash-stack metric-icon text-success"></i>
                    </div>
                    <div class="metric-value">{{ (metrics.period.ordersAmountTtc +
                      metrics.period.cartsAmountTtc).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €</div>
                    <div class="metric-sub">Total TTC cumulé sur la période</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DÉTAIL QUOTIDIEN DE LA PÉRIODE -->
        <div class="row g-4 mt-3">
          <div class="col-12">
            <div class="dashboard-group-card p-4 rounded-4 shadow-sm border border-secondary border-opacity-10">
              <h3 class="group-title mb-4 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <span class="icon-indicator bg-info me-2"></span>Détail quotidien de l'activité (Filtre)
                </div>
                <span
                  class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-20 px-3 py-2 rounded-pill fw-semibold small">
                  {{ metrics.dailyBreakdown.length }} jour(s)
                </span>
              </h3>

              <div class="table-responsive premium-scrollbar" style="max-height: 350px; overflow-y: auto;">
                <table class="table table-dark table-hover align-middle mb-0">
                  <thead class="sticky-top border-bottom border-secondary-light" style="z-index: 10;">
                    <tr class="text-secondary">
                      <th class="ps-3 py-3 font-weight-bold text-uppercase fs-7 tracking-wider">Date</th>
                      <th class="py-3 font-weight-bold text-uppercase fs-7 tracking-wider text-center">Commandes</th>
                      <th class="py-3 font-weight-bold text-uppercase fs-7 tracking-wider text-center">Paniers actifs
                      </th>
                      <th class="pe-3 py-3 font-weight-bold text-uppercase fs-7 tracking-wider text-end">Total Consolidé
                        TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="day in metrics.dailyBreakdown" :key="day.date"
                      class="border-bottom border-secondary-light">
                      <td class="ps-3 py-3 fw-semibold text-white">
                        <i class="bi bi-calendar3 me-2 text-primary"></i>{{ formatDateFr(day.date) }}
                      </td>
                      <td class="py-3 text-center">
                        <div class="d-flex flex-column align-items-center gap-1">
                          <span v-if="day.ordersCount > 0"
                            class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 px-3 py-1.5 rounded-pill fw-bold">
                            {{ day.ordersCount }} {{ day.ordersCount > 1 ? 'commandes' : 'commande' }}
                          </span>
                          <span v-else class="text-muted small">Aucune commande</span>
                          <span v-if="day.ordersAmountTtc > 0" class="text-secondary fw-semibold small">
                            {{ day.ordersAmountTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €
                          </span>
                        </div>
                      </td>
                      <td class="py-3 text-center">
                        <div class="d-flex flex-column align-items-center gap-1">
                          <span v-if="day.cartsCount > 0"
                            class="badge bg-purple bg-opacity-10 text-purple border border-purple border-opacity-20 px-3 py-1.5 rounded-pill fw-bold">
                            {{ day.cartsCount }} {{ day.cartsCount > 1 ? 'paniers' : 'panier' }}
                          </span>
                          <span v-else class="text-muted small">Aucun panier</span>
                          <span v-if="day.cartsAmountTtc > 0" class="text-secondary fw-semibold small">
                            {{ day.cartsAmountTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) }} €
                          </span>
                        </div>
                      </td>
                      <td class="pe-3 py-3 text-end fw-bold text-success fs-6">
                        {{ (day.ordersAmountTtc + day.cartsAmountTtc).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2
                        }) }} €
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- STATISTIQUES FINANCIÈRES SECTORIELLES (INTÉGRATION COMPLÈTE) -->
        <div class="row g-4 mt-4">
          <div class="col-12">
            <hr class="border-secondary border-opacity-20 my-4" />
            <h2 class="h4 mb-4 fw-extrabold text-white d-flex align-items-center">
              <i class="bi bi-wallet2 me-2 text-primary"></i>Statistiques Financières de Référence (Toutes dates)
            </h2>
          </div>
        </div>

        <div v-if="loadingStats" class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
          <span class="text-secondary fw-semibold">Calcul en cours des indicateurs de vente et d'achat par
            catégorie...</span>
        </div>

        <div v-else class="animate-fade-in">
          <!-- Global Cards -->
          <div class="row g-4 mb-5">
            <!-- Sales Card -->
            <div class="col-12 col-md-6">
              <div class="card stat-card border-0 shadow-sm overflow-hidden h-100 bg-glass-blue">
                <div class="card-body p-4 position-relative">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="text-uppercase text-info fw-bold tracking-wider fs-7">Ventes Totales (HT)</span>
                    <div class="icon-circle bg-info-light text-info">
                      <i class="bi bi-cash-stack fs-4"></i>
                    </div>
                  </div>
                  <h2 class="h3 fw-bold mb-1 text-white">{{ totalSalesHt.toLocaleString('fr-FR', {
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
                    <span class="text-uppercase text-warning fw-bold tracking-wider fs-7">Achats Totaux (HT)</span>
                    <div class="icon-circle bg-warning-light text-warning">
                      <i class="bi bi-cart-check fs-4"></i>
                    </div>
                  </div>
                  <h2 class="h3 fw-bold mb-1 text-white">{{ totalPurchasesHt.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                  }) }} €</h2>
                  <p class="text-warning-light mb-0 fs-7">Valorisation totale des entrées de stock</p>
                  <div class="card-glow bg-warning"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Category Table -->
          <div class="card border-0 shadow-sm bg-glass-dark mb-4">
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
                      <td class="px-4 text-end fw-bold" :class="stat.marginHt >= 0 ? 'text-success' : 'text-danger'">
                        {{ stat.marginHt.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) }} €
                      </td>
                    </tr>
                    <tr v-if="categoryStats.length === 0">
                      <td colspan="6" class="text-center py-4 text-secondary fs-6">Aucune catégorie trouvée ou
                        configurée.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- TABLEAU RÉPARTITION DES COMMANDES PAR ÉTAT -->
        <div class="row g-4 mt-4">
          <div class="col-12">
            <hr class="border-secondary border-opacity-20 my-4" />
            <h2 class="h4 mb-4 fw-extrabold text-white d-flex align-items-center">
              <i class="bi bi-bar-chart-line me-2 text-primary"></i>Répartition des Commandes par État
            </h2>
          </div>
        </div>

        <div v-if="loadingOrderStatus" class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
          <span class="text-secondary fw-semibold">Chargement des statistiques de commandes...</span>
        </div>

        <div v-else class="animate-fade-in">
          <div class="card border-0 shadow-sm bg-glass-dark mb-4">
            <div
              class="card-header bg-transparent border-0 px-4 py-3 d-flex align-items-center justify-content-between">
              <h5 class="mb-0 fw-bold text-white">Nombre de commandes par état</h5>
              <span class="badge bg-secondary-light text-secondary rounded-pill px-3">
                {{orderStatusCounts.reduce((s, o) => s + o.count, 0)}} commandes au total
              </span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-dark table-hover mb-0 align-middle">
                  <thead>
                    <tr class="text-secondary border-bottom border-secondary-light">
                      <th class="px-4 py-3 text-uppercase tracking-wider fs-8 fw-bold">État</th>
                      <th class="py-3 text-end text-uppercase tracking-wider fs-8 fw-bold">Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="status in orderStatusCounts" :key="status.stateId"
                      class="border-bottom border-secondary-light">
                      <td class="px-4">
                        <div class="d-flex align-items-center gap-2">
                          <i :class="[status.icon, status.color, 'fs-5']"></i>
                          <span class="fw-semibold text-white">{{ status.label }}</span>
                        </div>
                      </td>
                      <td class="text-end pe-4">
                        <span class="fw-bold fs-5" :class="status.color">{{ status.count }}</span>
                      </td>
                    </tr>
                    <tr v-if="orderStatusCounts.length === 0">
                      <td colspan="2" class="text-center py-4 text-secondary fs-6">Aucune donnée disponible.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

/* Style global du tableau de bord - Intégration naturelle avec le thème de base */
.dashboard-premium {
  font-family: 'Outfit', sans-serif;
  color: var(--bs-body-color);
}

.tracking-wide {
  letter-spacing: 0.05em;
}

.fw-extrabold {
  font-weight: 800;
}

/* Icon box du header */
.premium-icon-box {
  width: 55px;
  height: 55px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.03));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.25);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.08);
}

.text-glow-primary {
  color: #3b82f6;
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

/* Date Input et Glass light background matching base color */
.bg-glass-light {
  background: var(--bs-tertiary-bg);
  border-color: var(--bs-border-color) !important;
}

.premium-date-input {
  background-color: transparent !important;
  color: var(--bs-body-color) !important;
  font-weight: 600;
  outline: none;
  font-size: 0.95rem;
  width: 160px;
  padding: 0.375rem 0.5rem;
}

.premium-date-input:focus {
  box-shadow: none;
}

.btn-premium-refresh {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid var(--bs-border-color);
  color: var(--bs-body-color);
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-premium-refresh:hover {
  background: rgba(0, 0, 0, 0.06);
  border-color: var(--bs-border-color-translucent);
  transform: scale(1.05);
}

.btn-premium-refresh:active {
  transform: scale(0.95);
}

/* Spinner premium */
.spinner-premium {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(59, 130, 246, 0.1);
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
}

/* Divider glass */
.glass-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--bs-border-color-translucent), transparent);
}

/* Group container cards */
/* Group container cards with glassmorphism */
.dashboard-group-card {
  background: rgba(30, 34, 45, 0.45) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  height: 100%;
  transition: all 0.4s ease;
}

.dashboard-group-card:hover {
  background: rgba(30, 34, 45, 0.6) !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.group-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--bs-body-color);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.icon-indicator {
  display: inline-block;
  width: 6px;
  height: 16px;
  border-radius: 3px;
}

.bg-purple {
  background-color: #a855f7;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.4);
}

/* Metric custom Cards */
.premium-metric-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 130px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bs-secondary-color);
}

.metric-icon {
  font-size: 1.25rem;
  opacity: 0.8;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--bs-body-color);
  margin-top: auto;
  margin-bottom: 4px;
  line-height: 1.2;
}

.metric-sub {
  font-size: 0.68rem;
  color: var(--bs-secondary-color);
}

/* Color palettes for specific metric cards */
.card-blue {
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.15), rgba(13, 110, 253, 0.05)) !important;
  border: 1px solid rgba(13, 110, 253, 0.2) !important;
}

.card-blue .metric-icon {
  color: #3b82f6;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
}

.card-blue:hover {
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.25), rgba(13, 110, 253, 0.1)) !important;
  transform: translateY(-5px);
}

.card-amber {
  background: linear-gradient(135deg, rgba(253, 126, 20, 0.15), rgba(253, 126, 20, 0.05)) !important;
  border: 1px solid rgba(253, 126, 20, 0.2) !important;
}

.card-amber .metric-icon {
  color: #f59e0b;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
}

.card-amber:hover {
  background: linear-gradient(135deg, rgba(253, 126, 20, 0.25), rgba(253, 126, 20, 0.1)) !important;
  transform: translateY(-5px);
}

.card-emerald {
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.15), rgba(25, 135, 84, 0.05)) !important;
  border: 1px solid rgba(25, 135, 84, 0.2) !important;
}

.card-emerald .metric-icon {
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
}

.card-emerald:hover {
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.25), rgba(25, 135, 84, 0.1)) !important;
  transform: translateY(-5px);
}

.card-purple {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05)) !important;
  border: 1px solid rgba(168, 85, 247, 0.2) !important;
}

.card-purple .metric-icon {
  color: #a855f7;
  text-shadow: 0 0 10px rgba(168, 85, 247, 0.2);
}

.card-purple:hover {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(168, 85, 247, 0.1)) !important;
  transform: translateY(-5px);
}

.card-pink {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.05)) !important;
  border: 1px solid rgba(236, 72, 153, 0.2) !important;
}

.card-pink .metric-icon {
  color: #ec4899;
  text-shadow: 0 0 10px rgba(236, 72, 153, 0.2);
}

.card-pink:hover {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(236, 72, 153, 0.1)) !important;
  transform: translateY(-5px);
}

.bg-glow-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

/* Animations */
.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-pulse {
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Premium scrollbar */
.premium-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.premium-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.premium-scrollbar::-webkit-scrollbar-thumb {
  background: var(--bs-border-color);
  border-radius: 4px;
}

.premium-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--bs-secondary-color);
}

/* Glassmorphism custom styling for stats */
.bg-glass-blue {
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.15), rgba(13, 110, 253, 0.05)) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(13, 110, 253, 0.2) !important;
}

.bg-glass-orange {
  background: linear-gradient(135deg, rgba(253, 126, 20, 0.15), rgba(253, 126, 20, 0.05)) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(253, 126, 20, 0.2) !important;
}

.bg-glass-green {
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.15), rgba(25, 135, 84, 0.05)) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(25, 135, 84, 0.2) !important;
}

.bg-glass-red {
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.15), rgba(220, 53, 69, 0.05)) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(220, 53, 69, 0.2) !important;
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

.avatar-init {
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fs-8 {
  font-size: 0.75rem;
}
</style>
