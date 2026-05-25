import type { StockMvt } from '@/types/stock_mvt'

export const parseStockMvtListXml = (xml: string): StockMvt[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items: StockMvt[] = []
    doc.querySelectorAll('stock_mvt').forEach(el => {
        items.push({
            id: parseInt(el.querySelector('id')?.textContent || '0'),
            id_product: parseInt(el.querySelector('id_product')?.textContent || '0'),
            id_product_attribute: parseInt(el.querySelector('id_product_attribute')?.textContent || '0'),
            id_warehouse: parseInt(el.querySelector('id_warehouse')?.textContent || '0'),
            id_currency: parseInt(el.querySelector('id_currency')?.textContent || '0'),
            management_type: el.querySelector('management_type')?.textContent || '',
            id_employee: parseInt(el.querySelector('id_employee')?.textContent || '1'),
            id_stock: parseInt(el.querySelector('id_stock')?.textContent || '0'),
            id_stock_mvt_reason: parseInt(el.querySelector('id_stock_mvt_reason')?.textContent || '11'),
            id_order: parseInt(el.querySelector('id_order')?.textContent || '0'),
            id_supply_order: parseInt(el.querySelector('id_supply_order')?.textContent || '0'),
            product_name: el.querySelector('product_name')?.textContent || '',
            ean13: el.querySelector('ean13')?.textContent || '',
            upc: el.querySelector('upc')?.textContent || '',
            reference: el.querySelector('reference')?.textContent || '',
            mpn: el.querySelector('mpn')?.textContent || '',
            physical_quantity: parseFloat(el.querySelector('physical_quantity')?.textContent || '0'),
            sign: parseInt(el.querySelector('sign')?.textContent || '1'),
            last_wa: parseFloat(el.querySelector('last_wa')?.textContent || '0'),
            current_wa: parseFloat(el.querySelector('current_wa')?.textContent || '0'),
            price_te: parseFloat(el.querySelector('price_te')?.textContent || '0'),
            date_add: el.querySelector('date_add')?.textContent || '',
        })
    })
    return items
}
