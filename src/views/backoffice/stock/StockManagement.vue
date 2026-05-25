<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ProductService } from '@/service/product/ProductService'
import { CombinationService } from '@/service/combination/CombinationService'
import { StockAvailableService } from '@/service/stock_available/StockAvailableService'
import { StockDeltaService } from '@/service/stock_delta/StockDeltaService'
import { ProductOptionService } from '@/service/product_option/ProductOptionService'
import { ProductOptionValueService } from '@/service/product_option_value/ProductOptionValueService'
import { ImageApi } from '@/api/image/ImageApi'
import type { Product } from '@/types/product'
import type { Combination } from '@/types/combination'
import type { StockAvailable } from '@/types/stock_available'

const stocks = ref<StockAvailable[]>([])
const productData = ref<Record<number, { name: string, reference: string, image: string }>>({})
const combinationData = ref<Record<number, { reference: string, attributes: string }>>({})
const adjustmentValues = ref<Record<number, number | null>>({})
const loading = ref(true)
const updatingId = ref<number | null>(null)

const fetchStocks = async () => {
  try {
    const [stockList, productList, comboList, options, optionValues] = await Promise.all([
      StockAvailableService.getAll(),
      ProductService.getAll(),
      CombinationService.getAll(),
      ProductOptionService.getAll(),
      ProductOptionValueService.getAll()
    ])

    // Map des options et valeurs pour un accès rapide
    const optMap: Record<number, string> = {}
    for (const o of options) optMap[o.id] = o.name

    const valMap: Record<number, { name: string, optId: number }> = {}
    for (const v of optionValues) valMap[v.id] = { name: v.name, optId: v.id_attribute_group }

    // Map des produits
    const pMap: Record<number, { name: string, reference: string, image: string }> = {}
    for (const p of productList) {
      const imageId = p.image_ids?.[0] || p.id_default_image
      pMap[p.id] = {
        name: p.name,
        reference: p.reference,
        image: imageId ? ImageApi.getProductImageUrl(p.id, imageId) : ''
      }
    }
    productData.value = pMap

    // Map des combinaisons et identification des produits avec déclinaisons
    const cMap: Record<number, { reference: string, attributes: string }> = {}
    const productsWithCombos = new Set<number>()
    for (const c of comboList) {
      // Construire la chaîne des attributs
      const attrParts: string[] = []
      if (c.product_option_value_ids) {
        for (const vId of c.product_option_value_ids) {
          const val = valMap[vId]
          if (val) {
            const optName = optMap[val.optId] || ''
            attrParts.push(`${optName}: ${val.name}`)
          }
        }
      }

      cMap[c.id] = {
        reference: c.reference,
        attributes: attrParts.join(', ')
      }
      productsWithCombos.add(c.id_product)
    }
    combinationData.value = cMap

    // Filtrer les stocks : si un produit a des déclinaisons, on n'affiche pas son entrée de base (ID Attribut = 0)
    const filteredStocks: StockAvailable[] = []
    for (const s of stockList) {
      if (s.id_product_attribute === 0) {
        if (!productsWithCombos.has(s.id_product)) {
          filteredStocks.push(s)
        }
      } else {
        filteredStocks.push(s)
      }
    }
    stocks.value = filteredStocks

  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
  } finally {
    loading.value = false
  }
}

const handleAjoutStock = async (idProduct: number, idProductAttribute: number, stockId: number) => {
  const adjustment = adjustmentValues.value[stockId]
  if (!adjustment || updatingId.value) return

  const stockIndex = stocks.value.findIndex(s => s.id === stockId)
  if (stockIndex === -1) return

  const currentStock = stocks.value[stockIndex]
  if (currentStock && (currentStock.quantity + adjustment) < 0) {
    alert(`Impossible de retirer ${Math.abs(adjustment)} unités. Le stock actuel est de ${currentStock.quantity}.`)
    return
  }

  // if ()

  updatingId.value = stockId
  try {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dateActuel = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    await StockDeltaService.create({
      id_product: idProduct,
      id_product_attribute: idProductAttribute,
      delta: adjustment,
      date_add: dateActuel
    })

    // Récupérer uniquement le stock mis à jour pour cette ligne
    const updatedStock = await StockAvailableService.getByProductId(idProduct, idProductAttribute)
    if (updatedStock) {
      stocks.value[stockIndex] = updatedStock
    }

    // Réinitialiser uniquement cet input
    adjustmentValues.value[stockId] = null

  } catch (error) {
    console.error('Erreur lors de l\'ajout du stock:', error)
    alert('Erreur lors de la mise à jour du stock.')
  } finally {
    updatingId.value = null
  }
}

onMounted(() => {
  fetchStocks()
})
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex align-items-center mb-4">
      <div class="icon-box me-3">
        <i class="bi bi-box-seam-fill fs-4 text-primary"></i>
      </div>
      <h2 class="h3 mb-0 fw-bold">Gestion des stocks</h2>
    </div>

    <!-- Table Container -->
    <div v-if="loading" class="table-responsive">
      <table class="table table-hover align-middle table-bordered">
        <thead>
          <tr>
            <th class="ps-4 text-end" style="width: 80px;">ID</th>
            <th>Produit</th>
            <th style="width: 150px;">Référence</th>
            <th class="text-end pe-4" style="width: 180px;">Disponible</th>
            <th class="text-center" style="width: 140px;">Ajouter</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in 5" :key="n">
            <td colspan="5" class="ps-4">
              <div class="skeleton-text rounded" style="height: 40px; width: 100%;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="stocks.length > 0" class="table-responsive"
      style="max-height: calc(100vh - 200px); overflow-y: auto;">
      <table class="table table-hover align-middle sticky-header table-bordered">
        <thead class="sticky-top">
          <tr>
            <th class="ps-4 text-end" style="width: 80px;">ID</th>
            <th>Produit</th>
            <th style="width: 150px;">Référence</th>
            <th class="text-end pe-4" style="width: 180px;">Disponible</th>
            <th class="text-center" style="width: 140px;">Ajouter</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in stocks" :key="stock.id" class="stock-row">
            <td class="ps-4 text-end text-muted x-small">{{ stock.id }}</td>
            <td>
              <div class="d-flex align-items-center gap-3">
                <img v-if="productData[stock.id_product]?.image" :src="productData[stock.id_product]?.image"
                  :alt="productData[stock.id_product]?.name" class="product-img"
                  style="height: 45px; width: 45px; object-fit: cover;">
                <div v-else class="no-image-box">
                  N/A
                </div>
                <div>
                  <div class="fw-bold">{{ productData[stock.id_product]?.name || 'Produit inconnu' }}</div>
                  <div v-if="stock.id_product_attribute > 0" class="text-primary x-small fw-bold">
                    {{ combinationData[stock.id_product_attribute]?.attributes }}
                  </div>
                  <div class="text-muted x-small">
                    ID P: {{ stock.id_product }}
                    <span v-if="stock.id_product_attribute > 0"> | ID PA: {{ stock.id_product_attribute }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span v-if="stock.id_product_attribute > 0" class="text-muted">
                {{ combinationData[stock.id_product_attribute]?.reference || '-' }}
              </span>
              <span v-else class="text-muted">
                {{ productData[stock.id_product]?.reference || '-' }}
              </span>
            </td>
            <td class="text-end pe-4">
              <span class="fw-bold">
                {{ stock.quantity }}
                <span v-if="adjustmentValues[stock.id]" class="text-primary mx-1">
                  → {{ stock.quantity + (adjustmentValues[stock.id] || 0) }}
                </span>
              </span>
            </td>
            <td class="text-center">
              <div class="d-flex align-items-center justify-content-center gap-2">
                <input type="number" class="form-control form-control-sm text-center shadow-none adjustment-input"
                  v-model.number="adjustmentValues[stock.id]" placeholder="0">
                <button v-if="adjustmentValues[stock.id] !== null && adjustmentValues[stock.id] !== undefined"
                  class="btn btn-sm btn-success rounded-circle p-0 d-flex align-items-center justify-content-center"
                  style="width: 28px; height: 28px; flex-shrink: 0;"
                  @click="handleAjoutStock(stock.id_product, stock.id_product_attribute, stock.id)"
                  :disabled="updatingId === stock.id">
                  <span v-if="updatingId === stock.id" class="spinner-border spinner-border-sm" role="status"></span>
                  <i v-else class="bi bi-check-lg"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center py-5">
      <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
      <h3 class="text-muted mt-3">Aucun stock trouvé</h3>
    </div>
  </div>
</template>

<style scoped>
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

.skeleton-text {
  animation: pulse 1.5s infinite ease-in-out;
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.1);
}

.icon-box {
  width: 45px;
  height: 45px;
  background: rgba(var(--bs-primary-rgb), 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.075);
}

.table thead th {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.03);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  padding-top: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.1);
  border-right: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.05);
}

.sticky-top {
  top: 0;
  z-index: 10;
}

.table tbody td {
  padding-top: 12px;
  padding-bottom: 12px;
  border-right: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.05);
}

.table th:last-child,
.table td:last-child {
  border-right: none;
}

.table-hover tbody tr:hover {
  background-color: rgba(var(--bs-primary-rgb), 0.05);
}

.stock-row {
  transition: background-color 0.15s ease;
}

.product-img {
  border-radius: 8px;
  border: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.1);
}

.no-image-box {
  height: 45px;
  width: 45px;
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.05);
  border: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.x-small {
  font-size: 0.75rem;
}

.table-responsive {
  scrollbar-width: thin;
}

.adjustment-input {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.075);
  border: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.15);
  color: inherit;
  border-radius: 8px;
  max-width: 80px;
  margin: 0 auto;
}

.adjustment-input:focus {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.1);
  border-color: var(--bs-primary);
  color: inherit;
}
</style>
