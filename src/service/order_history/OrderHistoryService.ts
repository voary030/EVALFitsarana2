import { OrderHistoryApi } from '@/api/order_history/OrderHistoryApi'
import { parseOrderHistoryListXml } from '@/mappers/order_history'
import type { OrderHistory } from '@/types/order_history'

export const OrderHistoryService = {
    async changeOrderState(orderId: number, newState: number, employeeId: number = 1, date_add?: string): Promise<OrderHistory | undefined> {
        try {
            const now = date_add ? date_add : new Date().toISOString().slice(0, 19).replace('T', ' ')
            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <order_history>
                    <id_employee><![CDATA[${employeeId}]]></id_employee>
                    <id_order_state><![CDATA[${newState}]]></id_order_state>
                    <id_order><![CDATA[${orderId}]]></id_order>
                    <date_add><![CDATA[${now}]]></date_add>
                </order_history>
            </prestashop>`.trim()
            const responseXml = await OrderHistoryApi.create(xmlBody)
            const parser = new DOMParser()
            const doc = parser.parseFromString(responseXml, 'text/xml')
            const el = doc.querySelector('order_history')
            if (!el) return undefined
            return {
                id: parseInt(el.querySelector('id')?.textContent || '0'),
                id_employee: parseInt(el.querySelector('id_employee')?.textContent || '0'),
                id_order_state: parseInt(el.querySelector('id_order_state')?.textContent || '0'),
                id_order: parseInt(el.querySelector('id_order')?.textContent || '0'),
                date_add: el.querySelector('date_add')?.textContent || '',
            }
        } catch (error) {
            console.error(`Erreur changement état commande ${orderId} → ${newState}:`, error)
            throw error
        }
    },

    async getByOrderId(orderId: number): Promise<OrderHistory[]> {
        try {
            const xml = await OrderHistoryApi.getByOrderId(orderId)
            return parseOrderHistoryListXml(xml)
        } catch (error) {
            console.error(`Erreur récupération historique commande ${orderId}:`, error)
            return []
        }
    },

    async updateOrderHistoriesDate(orderId: number, dateStr: string): Promise<void> {
        try {
            const parts = dateStr.split('/')
            if (parts.length !== 3) return
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00`
            const histories = await this.getByOrderId(orderId)
            for (const history of histories) {
                if (!history.id) continue;
                const patchXml = `<?xml version="1.0" encoding="UTF-8"?>
                <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                    <order_history>
                        <id>${history.id}</id>
                        <date_add><![CDATA[${formattedDate}]]></date_add>
                    </order_history>
                </prestashop>`.trim()

                await OrderHistoryApi.patch(history.id, patchXml)
            }
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la date de l'historique pour la commande ${orderId}:`, error)
        }
    }
}
