import { OrdersApi } from '@/api/orders/OrdersApi'
import type { Order } from '@/types/orders'
import type { Cart } from '@/types/cart'
import { parseOrderListXml, parseOrderXml } from '@/mappers/orders'

const getCurrentPrestaDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

export const OrderService = {

    async createOrderFromCart(cart: Cart, cartItems: Array<{ id_product: number; id_product_attribute: number; priceTtc: number; quantity: number }>, clientId: number, clientEmail: string, orderDate?: string): Promise<Order | undefined> {
        try {
            if (!cart.id_address_delivery || !cart.id_address_invoice) {
                throw new Error('Aucune adresse valide pour ce panier. Verifiez l\'adresse du client.')
            }
            const totalPaid = cartItems.reduce((sum, item) => sum + item.priceTtc * item.quantity, 0)
            const reference = `CMD-${Date.now().toString(36).toUpperCase()}`
            let dateStr = ''
            if (orderDate) {
                // Convert DD/MM/YYYY to YYYY-MM-DD HH:MM:SS
                const parts = orderDate.split('/')
                if (parts.length === 3) {
                    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00`
                    console.log(`[OrderService] Date formatée pour PrestaShop (date_add) : ${formattedDate}`)
                    dateStr = `<date_add><![CDATA[${formattedDate}]]></date_add><date_upd><![CDATA[${formattedDate}]]></date_upd>`
                } else {
                    console.warn(`[OrderService] Format de date inattendu : ${orderDate}`)
                }
            } else {
                console.log(`[OrderService] Aucune date fournie, PrestaShop utilisera la date actuelle par défaut.`)
            }

            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <order>
                    <id_address_delivery>${cart.id_address_delivery}</id_address_delivery>
                    <id_address_invoice>${cart.id_address_invoice}</id_address_invoice>
                    <id_cart>${cart.id}</id_cart>
                    <id_currency>${cart.id_currency || 1}</id_currency>
                    <id_lang>${cart.id_lang || 1}</id_lang>
                    <id_customer>${clientId}</id_customer>
                    <id_carrier>${cart.id_carrier || 1}</id_carrier>
                    <current_state>11</current_state>
                    <module><![CDATA[ps_cashondelivery]]></module>
                    <payment><![CDATA[Paiement comptant à la livraison (Cash on delivery)]]></payment>
                    <total_paid>${totalPaid.toFixed(6)}</total_paid>
                    <total_paid_tax_incl>${totalPaid.toFixed(6)}</total_paid_tax_incl>
                    <total_paid_tax_excl>${totalPaid.toFixed(6)}</total_paid_tax_excl>
                    <total_paid_real>${totalPaid.toFixed(6)}</total_paid_real>
                    <total_products>${totalPaid.toFixed(6)}</total_products>
                    <total_products_wt>${totalPaid.toFixed(6)}</total_products_wt>
                    <total_shipping>0.000000</total_shipping>
                    <total_shipping_tax_incl>0.000000</total_shipping_tax_incl>
                    <total_shipping_tax_excl>0.000000</total_shipping_tax_excl>
                    <conversion_rate>1.000000</conversion_rate>
                    <reference><![CDATA[${reference}]]></reference>
                    ${dateStr}
                </order>
            </prestashop>`.trim()

            const responseXml = await OrdersApi.create(xmlBody)
            const order = parseOrderXml(responseXml)
            return order
        } catch (error) {
            console.error('Erreur lors de la création de la commande depuis le panier:', error)
            throw error
        }
    },

    async updateOrderDate(orderId: number, dateStr: string): Promise<void> {
        try {
            const xml = await OrdersApi.getById(orderId)
            const order = parseOrderXml(xml)
            if (!order) return

            const parts = dateStr.split('/')
            if (parts.length !== 3) return
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00`

            const patchXml = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <order>
                    <id>${orderId}</id>
                    <date_add><![CDATA[${formattedDate}]]></date_add>
                    <date_upd><![CDATA[${formattedDate}]]></date_upd>
                </order>
            </prestashop>`.trim()

            await OrdersApi.patch(orderId, patchXml)
        } catch (error) {
            console.error(`Erreur lors du patch de la date de la commande ${orderId}:`, error)
        }
    },

    async getByCustomerId(customerId: number): Promise<Order[]> {
        try {
            const xml = await OrdersApi.getByCustomerId(customerId)
            return parseOrderListXml(xml)
        } catch (error) {
            console.error(`Erreur lors de la récupération des commandes du client ${customerId}:`, error)
            return []
        }
    },

    async getByCustomerIdPaginated(customerId: number, page: number, limit: number): Promise<Order[]> {
        try {
            const xml = await OrdersApi.getByCustomerIdPaginated(customerId, page, limit)
            return parseOrderListXml(xml)
        } catch (error) {
            console.error(`Erreur lors de la récupération paginée des commandes du client ${customerId}:`, error)
            return []
        }
    },

    async countByCustomerId(customerId: number): Promise<number> {
        try {
            return await OrdersApi.countByCustomerId(customerId)
        } catch (error) {
            console.error(`Erreur lors du comptage des commandes du client ${customerId}:`, error)
            return 0
        }
    },

    async getById(id: number): Promise<Order | undefined> {
        try {
            const xml = await OrdersApi.getById(id)
            return parseOrderXml(xml)
        } catch (error) {
            console.error(`Erreur lors de la récupération de la commande ${id}:`, error)
            return undefined
        }
    },

    async getAll(): Promise<Order[]> {
        try {
            const xml = await OrdersApi.getAll()
            return parseOrderListXml(xml)
        } catch (error) {
            console.error('Erreur lors de la récupération de toutes les commandes:', error)
            return []
        }
    },

    async getPaginated(page: number, limit: number): Promise<Order[]> {
        try {
            const xml = await OrdersApi.getPaginated(page, limit)
            return parseOrderListXml(xml)
        } catch (error) {
            console.error('Erreur lors de la récupération paginée de toutes les commandes:', error)
            return []
        }
    },

    async countAll(): Promise<number> {
        try {
            return await OrdersApi.countAll()
        } catch (error) {
            console.error('Erreur lors du comptage de toutes les commandes:', error)
            return 0
        }
    },

    async getAllSansAnnuler(): Promise<Order[]> {
        try {
            const allOrders = await this.getAll()
            return allOrders.filter(order => order.current_state !== 6)
        } catch (error) {
            console.error('Erreur lors de la récupération des commandes non annulées:', error)
            return []
        }
    },

    async getByDateRange(dateFrom: string, dateTo: string): Promise<Order[]> {
        try {
            const xml = await OrdersApi.getByDateRange(dateFrom, dateTo)
            const allOrders = parseOrderListXml(xml)
            const orders = allOrders.filter(order => {
                if (!order.date_add) return false
                return order.date_add >= dateFrom && order.date_add <= dateTo
            })
            return orders
        } catch (error) {
            console.error(`Erreur lors de la récupération des commandes entre ${dateFrom} et ${dateTo}:`, error)
            return []
        }
    }
}
