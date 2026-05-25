import { ProductService } from '../product/ProductService'
import { StockMvtService } from '../stock_mvt/StockMvtService'
import { OrderService } from '../orders/OrderService'
import { CategoryService } from '../category/CategoryService'

export const StatistiqueService = {

    async getMontantTotalVenteByCatHt(id_category: number): Promise<number> {
        try {
            const products = await ProductService.getByIdCategory(id_category)
            const categoryProductIds = new Set(products.map(p => p.id))
            const orders = await OrderService.getAllSansAnnuler()
            let total = 0
            for (const order of orders) {
                if (!order.order_rows) continue
                for (const row of order.order_rows) {
                    if (categoryProductIds.has(Number(row.product_id))) {
                        total += (Number(row.product_quantity) || 0) * (Number(row.unit_price_tax_excl) || 0)
                    }
                }
            }
            return parseFloat(total.toFixed(6))
        } catch (error) {
            console.error('Erreur getMontantTotalVenteByCatHt:', error)
            return 0
        }
    },

    async getMontantTotalAchatByCatHt(id_category: number): Promise<number> {
        try {
            const products = await ProductService.getByIdCategory(id_category)
            const categoryProductMap = new Map<number, typeof products[0]>()
            products.forEach(p => categoryProductMap.set(p.id, p))

            const mvts = await StockMvtService.getAll()
            let total = 0
            for (const mvt of mvts) {
                if (Number(mvt.sign) === 1) {
                    const product = categoryProductMap.get(Number(mvt.id_product))
                    if (product) {
                        const unitPrice = Number(mvt.price_te) || Number(product.wholesale_price) || 0
                        total += (Number(mvt.physical_quantity) || 0) * unitPrice
                    }
                }
            }
            return parseFloat(total.toFixed(6))
        } catch (error) {
            console.error('Erreur getMontantTotalAchatByCatHt:', error)
            return 0
        }
    },

    async getMontantAchatVenduByCatHt(id_category: number): Promise<number> {
        try {
            const products = await ProductService.getByIdCategory(id_category)
            const categoryProductMap = new Map<number, typeof products[0]>()
            products.forEach(p => categoryProductMap.set(p.id, p))

            const orders = await OrderService.getAllSansAnnuler()
            let total = 0
            for (const order of orders) {
                if (!order.order_rows) continue
                for (const row of order.order_rows) {
                    const product = categoryProductMap.get(Number(row.product_id))
                    if (product) {
                        const unitPurchasePrice = Number(product.wholesale_price) || 0
                        total += (Number(row.product_quantity) || 0) * unitPurchasePrice
                    }
                }
            }
            return parseFloat(total.toFixed(6))
        } catch (error) {
            console.error('Erreur getMontantAchatVenduByCatHt:', error)
            return 0
        }
    },

    async getQuantiteVendueByCat(id_category: number): Promise<number> {
        try {
            const products = await ProductService.getByIdCategory(id_category)
            const categoryProductIds = new Set(products.map(p => p.id))
            const orders = await OrderService.getAllSansAnnuler()
            let qty = 0
            for (const order of orders) {
                if (!order.order_rows) continue
                for (const row of order.order_rows) {
                    if (categoryProductIds.has(Number(row.product_id))) {
                        qty += Number(row.product_quantity) || 0
                    }
                }
            }
            return qty
        } catch (error) {
            console.error('Erreur getQuantiteVendueByCat:', error)
            return 0
        }
    },

    async getMontantTotalVenteHt(): Promise<number> {
        try {
            const categories = await CategoryService.getAll()
            let total = 0
            for (const category of categories) {
                if (Number(category.id) !== 1 && Number(category.id) !== 2) {
                    total += await this.getMontantTotalVenteByCatHt(category.id)
                }
            }
            return parseFloat(total.toFixed(6))
        } catch (error) {
            console.error('Erreur getMontantTotalVenteHt:', error)
            return 0
        }
    },

    async getMontantTotalAchatHt(): Promise<number> {
        try {
            const categories = await CategoryService.getAll()
            let total = 0
            for (const category of categories) {
                if (Number(category.id) !== 1 && Number(category.id) !== 2) {
                    total += await this.getMontantTotalAchatByCatHt(category.id)
                }
            }
            return parseFloat(total.toFixed(6))
        } catch (error) {
            console.error('Erreur getMontantTotalAchatHt:', error)
            return 0
        }
    }
}