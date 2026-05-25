import { OrderStateChangeApi } from '@/api/order_state_change/OrderStateChangeApi'
import { parseOrderStateChangeListXml, parseOrderStateChangeXml } from '@/mappers/order_state_change'
import type { OrderStateChange } from '@/types/order_state_change'

export const OrderStateChangeService = {

    async create(orderId: number, newState: number, employeeId: number = 1, dateAdd?: string): Promise<OrderStateChange | undefined> {
        // console.log(`[OrderStateChangeService] create called for orderId=${orderId}, newState=${newState}, employeeId=${employeeId}, dateAdd=${dateAdd}`)
        try {
            const now = dateAdd ? dateAdd : new Date().toISOString().slice(0, 19).replace('T', ' ')
            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <order_state_change>
                    <id_employee><![CDATA[${employeeId}]]></id_employee>
                    <id_order_state><![CDATA[${newState}]]></id_order_state>
                    <id_order><![CDATA[${orderId}]]></id_order>
                    <date_add><![CDATA[${now}]]></date_add>
                </order_state_change>
            </prestashop>`.trim()
            const responseXml = await OrderStateChangeApi.create(xmlBody)
            const res = parseOrderStateChangeXml(responseXml)
            if (!res) {
                // console.warn('[OrderStateChangeService] Failed to parse order_state_change from response XML')
                return undefined
            }
            // console.log('[OrderStateChangeService] successfully parsed order_state_change response:', res)
            return res
        } catch (error) {
            // console.error(`Erreur création order_state_change pour commande ${orderId}:`, error)
            throw error
        }
    },

    async getByOrderId(orderId: number): Promise<OrderStateChange[]> {
        try {
            const xml = await OrderStateChangeApi.getByOrderId(orderId)
            return parseOrderStateChangeListXml(xml)
        } catch (error) {
            return []
        }
    },

    async annuler(orderId: number, employeeId: number = 1, dateAdd?: string): Promise<OrderStateChange | undefined> {
        return this.create(orderId, 6, employeeId, dateAdd)
    },

    async livrer(orderId: number, employeeId: number = 1, dateAdd?: string): Promise<OrderStateChange | undefined> {
        return this.create(orderId, 5, employeeId, dateAdd)
    }
}
