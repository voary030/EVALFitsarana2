import type { StockDelta } from '@/types/stock_delta'

export const parseStockDeltaListXml = (xml: string): StockDelta[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items: StockDelta[] = []
    
    doc.querySelectorAll('stock_delta').forEach(el => {
        items.push({
            id: parseInt(el.querySelector('id')?.textContent || '0'),
            id_product: parseInt(el.querySelector('id_product')?.textContent || '0'),
            id_product_attribute: parseInt(el.querySelector('id_product_attribute')?.textContent || '0'),
            delta: parseInt(el.querySelector('delta')?.textContent || '0'),
            date_add: el.querySelector('date_add')?.textContent || '',
        })
    })
    
    return items
}
