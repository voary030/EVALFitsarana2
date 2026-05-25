import { OrderService } from '../orders/OrderService'
import { CartService } from '../cart/CartService'
import { ProductService } from '../product/ProductService'
import { CombinationService } from '../combination/CombinationService'
import type { Order } from '@/types/orders'
import type { Cart } from '@/types/cart'

export interface DashboardMetrics {
  period: {
    dateFrom: string
    dateTo: string
    ordersCount: number
    ordersAmountTtc: number
    ordersAmountHt: number
    cartsCount: number
    cartsAmountTtc: number
    cartsAmountHt: number
  }
  general: {
    ordersCount: number
    ordersAmountTtc: number
    ordersAmountHt: number
    cartsCount: number
    cartsAmountTtc: number
    cartsAmountHt: number
  }
  dailyBreakdown: {
    date: string
    ordersCount: number
    ordersAmountTtc: number
    cartsCount: number
    cartsAmountTtc: number
  }[]
}

export const DashboardService = {
  async getMetrics(dateFrom: string, dateTo: string): Promise<DashboardMetrics> {
    try {
      // 1. Récupérer toutes les données en parallèle pour optimiser les performances
      const [allOrders, allCarts, allProducts, allCombinations] = await Promise.all([
        OrderService.getAll(),
        CartService.getAll(),
        ProductService.getAll(),
        CombinationService.getAll()
      ])

      // Filtrer les commandes annulées (current_state === 6) pour les montants
      const validOrders = allOrders.filter(o => o.current_state !== 6)

      // 2. Identifier les IDs de paniers qui sont déjà convertis en commande
      const orderedCartIds = new Set(allOrders.map(o => o.id_cart))

      // 3. Filtrer les paniers non commandés et non vides
      const nonOrderedCarts = allCarts.filter(c => {
        if (orderedCartIds.has(c.id)) return false
        // Ignorer les paniers vides (sans lignes ou avec id_product <= 0)
        const validRows = c.cart_rows?.filter(r => r.id_product && r.id_product > 0 && r.quantity > 0) || []
        return validRows.length > 0
      })

      // Helper pour calculer les montants HT et TTC d'un panier
      const computeCartAmount = (cart: Cart) => {
        let totalHt = 0
        let totalTtc = 0

        const validRows = cart.cart_rows?.filter(r => r.id_product && r.id_product > 0 && r.quantity > 0) || []
        for (const row of validRows) {
          const product = allProducts.find(p => p.id === row.id_product)
          if (!product) continue

          const basePriceHt = product.price || 0
          const basePriceTtc = product.prix_ttc || basePriceHt
          const taxFactor = basePriceHt > 0 ? (basePriceTtc / basePriceHt) : 1

          let rowPriceHt = basePriceHt
          let rowPriceTtc = basePriceTtc

          if (row.id_product_attribute && row.id_product_attribute > 0) {
            const comb = allCombinations.find(c => c.id === row.id_product_attribute)
            if (comb) {
              rowPriceHt = basePriceHt + (comb.price || 0)
              rowPriceTtc = rowPriceHt * taxFactor
            }
          }

          totalHt += rowPriceHt * row.quantity
          totalTtc += rowPriceTtc * row.quantity
        }

        return { ht: totalHt, ttc: totalTtc }
      }

      // 4. Calculs des métriques générales (globales)
      const generalOrdersCount = validOrders.length
      const generalOrdersAmountTtc = validOrders.reduce((sum, o) => sum + (o.total_products_wt || 0), 0)
      const generalOrdersAmountHt = validOrders.reduce((sum, o) => sum + (o.total_products || 0), 0)

      const generalCartsCount = nonOrderedCarts.length
      let generalCartsAmountTtc = 0
      let generalCartsAmountHt = 0

      for (const cart of nonOrderedCarts) {
        const amt = computeCartAmount(cart)
        generalCartsAmountTtc += amt.ttc
        generalCartsAmountHt += amt.ht
      }

      // 5. Calculs des métriques sur la période sélectionnée (dateFrom et dateTo au format YYYY-MM-DD)
      const startLimit = dateFrom + ' 00:00:00'
      const endLimit = dateTo + ' 23:59:59'

      const periodOrders = validOrders.filter(o => o.date_add && o.date_add >= startLimit && o.date_add <= endLimit)
      const periodOrdersCount = periodOrders.length
      const periodOrdersAmountTtc = periodOrders.reduce((sum, o) => sum + (o.total_products_wt || 0), 0)
      const periodOrdersAmountHt = periodOrders.reduce((sum, o) => sum + (o.total_products || 0), 0)

      const periodCarts = nonOrderedCarts.filter(c => c.date_add && c.date_add >= startLimit && c.date_add <= endLimit)
      const periodCartsCount = periodCarts.length
      let periodCartsAmountTtc = 0
      let periodCartsAmountHt = 0

      for (const cart of periodCarts) {
        const amt = computeCartAmount(cart)
        periodCartsAmountTtc += amt.ttc
        periodCartsAmountHt += amt.ht
      }

      // 5b. Calculer le détail quotidien par date comprise dans le filtre
      const dailyMap = new Map<string, { ordersCount: number; ordersAmountTtc: number; cartsCount: number; cartsAmountTtc: number }>()

      const start = new Date(dateFrom)
      const end = new Date(dateTo)

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        dailyMap.set(dateStr, { ordersCount: 0, ordersAmountTtc: 0, cartsCount: 0, cartsAmountTtc: 0 })
      }

      periodOrders.forEach(o => {
        if (!o.date_add) return
        const dateStr = o.date_add.slice(0, 10)
        const current = dailyMap.get(dateStr)
        if (current) {
          current.ordersCount += 1
          current.ordersAmountTtc += (o.total_products_wt || 0)
        } else {
          dailyMap.set(dateStr, {
            ordersCount: 1,
            ordersAmountTtc: o.total_products_wt || 0,
            cartsCount: 0,
            cartsAmountTtc: 0
          })
        }
      })

      periodCarts.forEach(c => {
        if (!c.date_add) return
        const dateStr = c.date_add.slice(0, 10)
        const current = dailyMap.get(dateStr)
        const amt = computeCartAmount(c)
        if (current) {
          current.cartsCount += 1
          current.cartsAmountTtc += amt.ttc
        } else {
          dailyMap.set(dateStr, {
            ordersCount: 0,
            ordersAmountTtc: 0,
            cartsCount: 1,
            cartsAmountTtc: amt.ttc
          })
        }
      })

      const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        ordersCount: data.ordersCount,
        ordersAmountTtc: parseFloat(data.ordersAmountTtc.toFixed(2)),
        cartsCount: data.cartsCount,
        cartsAmountTtc: parseFloat(data.cartsAmountTtc.toFixed(2))
      })).sort((a, b) => a.date.localeCompare(b.date))

      return {
        period: {
          dateFrom,
          dateTo,
          ordersCount: periodOrdersCount,
          ordersAmountTtc: parseFloat(periodOrdersAmountTtc.toFixed(2)),
          ordersAmountHt: parseFloat(periodOrdersAmountHt.toFixed(2)),
          cartsCount: periodCartsCount,
          cartsAmountTtc: parseFloat(periodCartsAmountTtc.toFixed(2)),
          cartsAmountHt: parseFloat(periodCartsAmountHt.toFixed(2))
        },
        general: {
          ordersCount: generalOrdersCount,
          ordersAmountTtc: parseFloat(generalOrdersAmountTtc.toFixed(2)),
          ordersAmountHt: parseFloat(generalOrdersAmountHt.toFixed(2)),
          cartsCount: generalCartsCount,
          cartsAmountTtc: parseFloat(generalCartsAmountTtc.toFixed(2)),
          cartsAmountHt: parseFloat(generalCartsAmountHt.toFixed(2))
        },
        dailyBreakdown
      }
    } catch (error) {
      console.error('Erreur getDashboardMetrics:', error)
      throw error
    }
  }
}
