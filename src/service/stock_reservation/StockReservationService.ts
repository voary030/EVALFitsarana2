import { ProductService } from '../product/ProductService'
import { OrderService } from '../orders/OrderService'
import { CategoryService } from '../category/CategoryService'
import { StockAvailableService } from '../stock_available/StockAvailableService'

export interface CategoryStockReservation {
    idCategory: number
    categoryName: string
    qtyPhysique: number
    qtyReservee: number
    qtyDisponible: number
}

export const StockReservationService = {
    async getCategoryStockReservations(): Promise<CategoryStockReservation[]> {
        try {
            // 1. Fetch all categories, products, orders, and stock availables in parallel
            const [categories, allProducts, allOrders, allStocks] = await Promise.all([
                CategoryService.getAll(),
                ProductService.getAll(),
                OrderService.getAll(),
                StockAvailableService.getAll()
            ])

            // Exclude category IDs 1 and 2
            const filteredCategories = categories.filter(cat => Number(cat.id) !== 1 && Number(cat.id) !== 2)

            // 2. Map products by their default category
            const productsByCat = new Map<number, number[]>() // catId -> productIds
            allProducts.forEach(p => {
                const catId = Number(p.id_category_default)
                if (!productsByCat.has(catId)) {
                    productsByCat.set(catId, [])
                }
                productsByCat.get(catId)!.push(p.id)
            })

            // 3. Map orders and calculate reserved quantities per product
            // Qty reserved = qty in orders that are not cancelled (current_state !== 6) and not delivered (current_state !== 5)
            const reservedQtyByProduct = new Map<number, number>()
            allOrders.forEach(order => {
                const state = Number(order.current_state)
                if (state !== 6 && state !== 5) {
                    if (order.order_rows) {
                        order.order_rows.forEach(row => {
                            const productId = Number(row.product_id)
                            const qty = Number(row.product_quantity) || 0
                            reservedQtyByProduct.set(productId, (reservedQtyByProduct.get(productId) || 0) + qty)
                        })
                    }
                }
            })

            // 4. Map stock available quantities per product
            // Pour les produits avec déclinaisons, ne PAS compter la ligne de base (id_product_attribute = 0)
            // car elle est redondante avec les lignes par déclinaison
            const productsWithCombinations = new Set(
                allProducts.filter(p => p.combination_ids && p.combination_ids.length > 0).map(p => p.id)
            )
            const availableQtyByProduct = new Map<number, number>()
            allStocks.forEach(stock => {
                const productId = Number(stock.id_product)
                const productAttributeId = Number(stock.id_product_attribute) || 0
                // Si le produit a des déclinaisons, ignorer la ligne de base (attribut = 0)
                if (productAttributeId === 0 && productsWithCombinations.has(productId)) {
                    return
                }
                const qty = Number(stock.quantity) || 0
                availableQtyByProduct.set(productId, (availableQtyByProduct.get(productId) || 0) + qty)
            })

            // 5. Calculate for each category
            const results: CategoryStockReservation[] = filteredCategories.map(cat => {
                const productIds = productsByCat.get(Number(cat.id)) || []
                
                let qtyReservee = 0
                let qtyDisponible = 0

                productIds.forEach(pId => {
                    qtyReservee += reservedQtyByProduct.get(pId) || 0
                    qtyDisponible += availableQtyByProduct.get(pId) || 0
                })

                const qtyPhysique = qtyReservee + qtyDisponible

                return {
                    idCategory: Number(cat.id),
                    categoryName: cat.name || 'Sans nom',
                    qtyPhysique,
                    qtyReservee,
                    qtyDisponible
                }
            })

            return results
        } catch (error) {
            console.error('Erreur getCategoryStockReservations:', error)
            return []
        }
    }
}
