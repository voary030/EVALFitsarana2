import type { OrderHistory } from '@/types/order_history'

export const parseOrderHistoryListXml = (xml: string): OrderHistory[] => {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')
        const histories: OrderHistory[] = []
        const elements = doc.querySelectorAll('order_history')
        elements.forEach((el) => {
            histories.push({
                id: parseInt(el.querySelector('id')?.textContent || '0'),
                id_employee: parseInt(el.querySelector('id_employee')?.textContent || '0'),
                id_order_state: parseInt(el.querySelector('id_order_state')?.textContent || '0'),
                id_order: parseInt(el.querySelector('id_order')?.textContent || '0'),
                date_add: el.querySelector('date_add')?.textContent || '',
            })
        })
        return histories
    } catch (error) {
        console.error('Erreur parsing order_history XML:', error)
        return []
    }
}
