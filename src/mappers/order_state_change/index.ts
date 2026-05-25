import type { OrderStateChange } from '@/types/order_state_change'

export const parseOrderStateChangeListXml = (xml: string): OrderStateChange[] => {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')
        const changes: OrderStateChange[] = []
        const elements = doc.querySelectorAll('order_state_change')
        elements.forEach((el) => {
            changes.push({
                id: parseInt(el.querySelector('id')?.textContent || '0'),
                id_employee: parseInt(el.querySelector('id_employee')?.textContent || '0'),
                id_order_state: parseInt(el.querySelector('id_order_state')?.textContent || '0'),
                id_order: parseInt(el.querySelector('id_order')?.textContent || '0'),
                date_add: el.querySelector('date_add')?.textContent || '',
            })
        })
        return changes
    } catch (error) {
        console.error('Erreur parsing order_state_change XML:', error)
        return []
    }
}

export const parseOrderStateChangeXml = (xml: string): OrderStateChange | undefined => {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')
        const el = doc.querySelector('order_state_change')
        if (!el) return undefined
        return {
            id: parseInt(el.querySelector('id')?.textContent || '0'),
            id_employee: parseInt(el.querySelector('id_employee')?.textContent || '0'),
            id_order_state: parseInt(el.querySelector('id_order_state')?.textContent || '0'),
            id_order: parseInt(el.querySelector('id_order')?.textContent || '0'),
            date_add: el.querySelector('date_add')?.textContent || '',
        }
    } catch (error) {
        console.error('Erreur parsing order_state_change XML:', error)
        return undefined
    }
}
