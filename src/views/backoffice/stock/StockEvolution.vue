<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ProductService } from '@/service/product/ProductService'
import { StockAvailableService } from '@/service/stock_available/StockAvailableService'
import { CombinationService } from '@/service/combination/CombinationService'
import { ProductOptionService } from '@/service/product_option/ProductOptionService'
import { ProductOptionValueService } from '@/service/product_option_value/ProductOptionValueService'
import { ImageApi } from '@/api/image/ImageApi'
import { StockMvtService } from '@/service/stock_mvt/StockMvtService'
import { StockEvolutionService, type EvolutionDay } from '@/service/stock_evolution/StockEvolutionService'
import type { Product } from '@/types/product'
import type { StockAvailable } from '@/types/stock_available'
import type { StockMvt } from '@/types/stock_mvt'

const products = ref<Product[]>([])
const selectedProductId = ref<number | null>(null)
const selectedProduct = ref<Product | null>(null)
const stocks = ref<StockAvailable[]>([])
const stockMovements = ref<Record<number, StockMvt[]>>({})
const evolutionData = ref<EvolutionDay[]>([])
const startDate = ref('')
const endDate = ref('')
const selectedProductAttributeId = ref<number | null>(null)
const productHasCombinations = ref(false)

const onDateChange = () => {
  showDetails.value = false
}

const optMap = ref<Record<number, string>>({})
const valMap = ref<Record<number, { name: string, optId: number }>>({})
const comboMap = ref<Record<number, string>>({})

const loading = ref(true)
const loadingDetails = ref(false)
const showDetails = ref(false)

const hasFiltered = ref(false)
const loadingEvolution = ref(false)

const onProductChange = () => {
  showDetails.value = false
  hasFiltered.value = false
  selectedProductAttributeId.value = null
  productHasCombinations.value = false
}

const formatDateFr = (dateStr: string) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const getProductImageUrl = (p: Product | null) => {
  if (!p) return ''
  const imageId = p.image_ids?.[0] || p.id_default_image
  return imageId ? ImageApi.getProductImageUrl(p.id, imageId) : ''
}

const initData = async () => {
  try {
    const [productList, options, optionValues, combos] = await Promise.all([
      ProductService.getAll(),
      ProductOptionService.getAll(),
      ProductOptionValueService.getAll(),
      CombinationService.getAll()
    ])

    products.value = productList

    // Préparer les maps pour les attributs
    for (const o of options) optMap.value[o.id] = o.name
    for (const v of optionValues) valMap.value[v.id] = { name: v.name, optId: v.id_attribute_group }

    for (const c of combos) {
      const attrParts: string[] = []
      if (c.product_option_value_ids) {
        for (const vId of c.product_option_value_ids) {
          const val = valMap.value[vId]
          if (val) {
            const optName = optMap.value[val.optId] || ''
            attrParts.push(`${optName}: ${val.name}`)
          }
        }
      }
      comboMap.value[c.id] = attrParts.join(', ')
    }

  } catch (error) {
    console.error('Erreur chargement initial:', error)
  } finally {
    loading.value = false
  }
}

const fetchProductDetails = async () => {
  if (!selectedProductId.value) {
    selectedProduct.value = null
    stocks.value = []
    return
  }

  loadingDetails.value = true
  try {
    selectedProduct.value = products.value.find(p => p.id === selectedProductId.value) || null
    const allStocks = await StockAvailableService.getAll()
    const productStocks = allStocks.filter(s => s.id_product === selectedProductId.value)

    // Déterminer s'il y a des déclinaisons
    const hasCombos = productStocks.some(s => s.id_product_attribute !== 0)
    productHasCombinations.value = hasCombos
    selectedProductAttributeId.value = null

    let filtered: StockAvailable[] = []
    if (hasCombos) {
      // Si déclinaisons : on ne prend que celles-ci (pas le total de base)
      filtered = productStocks.filter(s => s.id_product_attribute !== 0)
    } else {
      // Sinon : on ne prend que le produit standard
      filtered = productStocks.filter(s => s.id_product_attribute === 0)
    }

    // Trier les stocks restants
    stocks.value = filtered.sort((a, b) => a.id_product_attribute - b.id_product_attribute)

    // Récupérer les mouvements pour chaque ligne de stock
    const mvtPromises = stocks.value.map(s => StockMvtService.getByStockId(s.id))
    const mvtResults = await Promise.all(mvtPromises)

    const mvtMap: Record<number, StockMvt[]> = {}
    stocks.value.forEach((s, index) => {
      const results = mvtResults[index]
      mvtMap[s.id] = results ?? []
    })
    stockMovements.value = mvtMap

    // Réinitialiser l'état du filtre pour l'évolution
    hasFiltered.value = false
    evolutionData.value = []

    showDetails.value = true
  } catch (error) {
    console.error('Erreur chargement détails:', error)
  } finally {
    loadingDetails.value = false
  }
}

const filterEvolution = async () => {
  if (!selectedProductId.value) return
  
  loadingEvolution.value = true
  try {
    evolutionData.value = await StockEvolutionService.calculateEvolution(
      selectedProductId.value,
      startDate.value,
      endDate.value,
      selectedProductAttributeId.value
    )
    hasFiltered.value = true
  } catch (error) {
    console.error('Erreur filtrage évolution:', error)
  } finally {
    loadingEvolution.value = false
  }
}

onMounted(initData)
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex align-items-center mb-4">
      <div class="icon-box me-3">
        <i class="bi bi-graph-up fs-4 text-primary"></i>
      </div>
      <div>
        <h2 class="h3 mb-0 fw-bold">Évolution journalière</h2>
        <p class="text-muted small mb-0">Analysez l'historique des stocks par produit</p>
      </div>
    </div>

    <!-- Sélecteur de produit initial -->
    <div class="card shadow-sm border-0 rounded-4 mb-4">
      <div class="card-body p-4">
        <div class="row g-3 align-items-center">
          <div class="col-md-9">
            <label class="form-label fw-bold mb-2">Produit à analyser</label>
            <select v-model="selectedProductId" class="form-select form-select-lg shadow-none border-2 custom-select"
              :disabled="loading" @change="onProductChange">
              <option :value="null">-- Choisir un produit --</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }} (ID: {{ p.id }})
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label d-none d-md-block">&nbsp;</label>
            <button class="btn btn-primary btn-lg w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              @click="fetchProductDetails" :disabled="!selectedProductId || loadingDetails || loading">
              <i class="bi bi-search"></i>
              <span class="fw-bold">Analyser</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Affichage des détails si un produit est sélectionné et "Voir" cliqué -->
    <div v-if="showDetails && !loadingDetails">
      <div class="row g-4">
        <!-- Résumé du produit -->
        <div class="col-lg-4">
          <div class="card shadow-sm border-0 rounded-4 h-100 overflow-hidden">
            <div class="p-4 text-center info-header border-bottom">
              <img v-if="getProductImageUrl(selectedProduct)" :src="getProductImageUrl(selectedProduct)"
                class="img-fluid rounded-3 shadow-sm product-img-preview"
                style="max-height: 180px; object-fit: contain;">
              <div v-else
                class="no-image-placeholder mx-auto mb-2 rounded-3 border d-flex align-items-center justify-content-center bg-body-tertiary text-muted"
                style="height: 180px; width: 100%; max-width: 180px;">
                <i class="bi bi-image fs-1"></i>
              </div>
            </div>
            <div class="card-body p-4">
              <div class="mb-3">
                <label class="text-muted small text-uppercase fw-bold opacity-75">Nom du produit</label>
                <div class="h5 fw-bold mb-0">{{ selectedProduct?.name }}</div>
              </div>
              <div class="mb-3">
                <label class="text-muted small text-uppercase fw-bold opacity-75">Référence</label>
                <div class="fw-medium">{{ selectedProduct?.reference || 'N/A' }}</div>
              </div>
              <div class="mb-0">
                <label class="text-muted small text-uppercase fw-bold opacity-75">ID PrestaShop</label>
                <div class="fw-medium text-primary">#{{ selectedProduct?.id }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- État actuel des stocks -->
        <div class="col-lg-8">
          <div class="card shadow-sm border-0 rounded-4 h-100">
            <div
              class="card-header bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h5 class="fw-bold mb-0">État actuel des stocks</h5>
              <span class="badge bg-primary rounded-pill">{{ stocks.length }} ligne(s)</span>
            </div>
            <div class="card-body p-4">
              <div class="table-responsive border rounded-3">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th class="ps-3">Déclinaison / Attributs</th>
                      <th class="text-center" style="width: 100px;">Quantité</th>
                      <th>Historique récents (5 derniers)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="stock in stocks" :key="stock.id">
                      <td class="ps-3">
                        <span v-if="stock.id_product_attribute !== 0" class="fw-bold text-primary">
                          {{ comboMap[stock.id_product_attribute] || 'Déclinaison #' + stock.id_product_attribute }}
                        </span>
                        <span v-else class="fw-bold text-muted opacity-75">
                          Total (produit standard)
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="h6 mb-0 fw-bold" :class="stock.quantity > 0 ? 'text-success' : 'text-danger'">
                          {{ stock.quantity }}
                        </span>
                      </td>
                      <td>
                        <div v-if="stockMovements[stock.id]?.length" class="mvt-list">
                          <div v-for="mvt in stockMovements[stock.id]?.slice(0, 5)" :key="mvt.id"
                            class="mvt-item d-flex justify-content-between align-items-center py-1 px-2 mb-1 rounded">
                            <span class="x-small opacity-75">{{ mvt.date_add }}</span>
                            <span class="fw-bold small" :class="mvt.sign > 0 ? 'text-success' : 'text-danger'">
                              {{ mvt.sign > 0 ? '+' : '-' }}{{ mvt.physical_quantity }}
                            </span>
                          </div>
                        </div>
                        <div v-else class="text-muted x-small ps-2 italic">
                          Aucun mouvement enregistré
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau d'évolution journalière -->
      <div class="card shadow-sm border-0 rounded-4 mt-4 overflow-hidden">
        <div class="card-header bg-transparent border-0 pt-4 px-4">
          <div class="row align-items-center">
            <div class="col-md-4">
              <h5 class="fw-bold mb-0">Évolution journalière</h5>
              <p class="text-muted small mb-0 text-truncate">
                {{ selectedProductAttributeId === null ? 'Consolidation de tous les attributs' : (comboMap[selectedProductAttributeId] || 'Déclinaison #' + selectedProductAttributeId) }}
              </p>
            </div>
            <div class="col-md-8">
              <div class="d-flex flex-wrap gap-2 justify-content-md-end mt-3 mt-md-0">
                <div v-if="productHasCombinations" class="input-group input-group-sm w-auto">
                  <span class="input-group-text bg-body-tertiary border-2 border-end-0 small">Déclinaison</span>
                  <select v-model="selectedProductAttributeId" class="form-select border-2 bg-body-tertiary shadow-none" style="max-width: 250px;">
                    <option :value="null">Tout (Total consolidé)</option>
                    <option v-for="stock in stocks" :key="stock.id_product_attribute" :value="stock.id_product_attribute">
                      {{ comboMap[stock.id_product_attribute] || 'Déclinaison #' + stock.id_product_attribute }}
                    </option>
                  </select>
                </div>
                <div class="input-group input-group-sm w-auto">
                  <span class="input-group-text bg-body-tertiary border-2 border-end-0 small">Du</span>
                  <input type="date" v-model="startDate" class="form-control border-2 border-start-0 shadow-none bg-body-tertiary" style="width: 130px;">
                </div>
                <div class="input-group input-group-sm w-auto">
                  <span class="input-group-text bg-body-tertiary border-2 border-end-0 small">Au</span>
                  <input type="date" v-model="endDate" class="form-control border-2 border-start-0 shadow-none bg-body-tertiary" style="width: 130px;">
                </div>
                <button class="btn btn-primary btn-sm px-3 rounded-2 shadow-sm" @click="filterEvolution" :disabled="loadingEvolution">
                  <span v-if="loadingEvolution" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-funnel me-1"></i> Filtrer
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-body p-4">
          <div v-if="loadingEvolution" class="text-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 2rem; height: 2rem;"></div>
            <p class="text-muted small">Calcul de l'évolution en cours...</p>
          </div>
          <template v-else-if="hasFiltered">
            <div v-if="evolutionData.length > 0" class="table-responsive border rounded-3">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-body-tertiary">
                  <tr>
                    <th class="ps-3">Date</th>
                    <th class="text-center">Stock Initial</th>
                    <th class="text-center text-success">Entrée (+)</th>
                    <th class="text-center text-danger">Sortie (-)</th>
                    <th class="text-center fw-bold">Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="day in evolutionData" :key="day.date">
                    <td class="ps-3 fw-medium text-capitalize">{{ formatDateFr(day.date) }}</td>
                    <td class="text-center opacity-75">{{ day.initialStock }}</td>
                    <td class="text-center">
                      <span v-if="day.in > 0" class="badge bg-success-subtle text-success border border-success-subtle">
                        +{{ day.in }}
                      </span>
                      <span v-else class="text-muted opacity-50">0</span>
                    </td>
                    <td class="text-center">
                      <span v-if="day.out > 0" class="badge bg-danger-subtle text-danger border border-danger-subtle">
                        -{{ day.out }}
                      </span>
                      <span v-else class="text-muted opacity-50">0</span>
                    </td>
                    <td class="text-center bg-primary-subtle fw-bold">
                      {{ day.available }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center py-5 text-muted italic">
              Aucun historique trouvé pour cette période.
            </div>
          </template>
          <div v-else class="text-center py-5 text-muted">
            <i class="bi bi-funnel text-primary opacity-25 display-4 mb-3 d-block"></i>
            Cliquez sur <strong>Filtrer</strong> pour générer l'historique d'évolution des stocks.
          </div>
        </div>
      </div>
    </div>

    <!-- État de chargement des détails -->
    <div v-else-if="loadingDetails" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
      <p class="text-muted fw-medium">Analyse des données en cours...</p>
    </div>

    <!-- État initial ou attente de clic sur Voir -->
    <div v-else-if="!showDetails && !loadingDetails"
      class="text-center py-5 mt-4 empty-state-container rounded-4 border-2">
      <i class="bi bi-cursor text-primary opacity-25 display-1 mb-3"></i>
      <h4 class="fw-bold">Prêt pour l'analyse</h4>
      <p class="text-muted">Sélectionnez un produit et cliquez sur <strong>Voir</strong> pour visualiser son état.</p>
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

.custom-select {
  border-radius: 12px;
  padding-left: 1.25rem;
  font-weight: 500;
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.05);
  border: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.1);
  color: inherit;
}

.custom-select:focus {
  background-color: var(--bs-body-bg);
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.1);
}

.info-header {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.03);
}

.product-img-preview {
  background-color: white;
  /* Garder blanc pour les PNG détourés */
  padding: 5px;
}

.table thead th {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.05);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  border-bottom: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.1);
  color: var(--bs-secondary);
}

.empty-state-container {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.02);
  border: 2px dashed rgba(var(--bs-emphasis-color-rgb), 0.1) !important;
}

.evolution-card {
  background-image: linear-gradient(to bottom right, rgba(var(--bs-primary-rgb), 0.02), transparent);
}

.evolution-icon-container {
  width: 100px;
  height: 100px;
  background: rgba(var(--bs-primary-rgb), 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.mvt-item {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.03);
  transition: background-color 0.2s;
}

.mvt-item:hover {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.07);
}

.x-small {
  font-size: 0.7rem;
}

.italic {
  font-style: italic;
}
</style>
