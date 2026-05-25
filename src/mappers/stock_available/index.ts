import type { StockAvailable } from '@/types/stock_available'

export const parseStockAvailableListXml = (xml: string): StockAvailable[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items: StockAvailable[] = []
    doc.querySelectorAll('stock_available').forEach(el => {
        items.push({
            id: parseInt(el.querySelector('id')?.textContent || '0'),
            id_product: parseInt(el.querySelector('id_product')?.textContent || '0'),
            id_product_attribute: parseInt(el.querySelector('id_product_attribute')?.textContent || '0'),
            id_shop: parseInt(el.querySelector('id_shop')?.textContent || '1'),
            id_shop_group: parseInt(el.querySelector('id_shop_group')?.textContent || '0'),
            quantity: parseInt(el.querySelector('quantity')?.textContent || '0'),
            depends_on_stock: parseInt(el.querySelector('depends_on_stock')?.textContent || '0'),
            out_of_stock: parseInt(el.querySelector('out_of_stock')?.textContent || '2'),
            location: el.querySelector('location')?.textContent || '',
        })
    })
    return items
}
