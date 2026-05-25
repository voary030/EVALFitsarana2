import { StockAvailableApi } from '@/api/stock_available/StockAvailableApi'
import { parseStockAvailableListXml } from '@/mappers/stock_available'
import type { StockAvailable } from '@/types/stock_available'

export const StockAvailableService = {
    async getByProductId(productId: number, productAttributeId: number = 0): Promise<StockAvailable | undefined> {
        try {
            const xml = await StockAvailableApi.getByProductId(productId, productAttributeId)
            const items = parseStockAvailableListXml(xml)
            return items[0]
        } catch (error) {
            console.error(`Erreur getByProductId ${productId}:`, error)
            return undefined
        }
    },

    async getAll(): Promise<StockAvailable[]> {
        try {
            const xml = await StockAvailableApi.getAll()
            return parseStockAvailableListXml(xml)
        } catch (error) {
            console.error('Erreur getAll StockAvailable:', error)
            return []
        }
    },

    async updateStock(productId: number, productAttributeId: number, quantity: number): Promise<void> {
        const stock = await this.getByProductId(productId, productAttributeId)
        if (!stock) return

        const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
            <stock_available>
                <id><![CDATA[${stock.id}]]></id>
                <id_product><![CDATA[${productId}]]></id_product>
                <id_product_attribute><![CDATA[${productAttributeId}]]></id_product_attribute>
                <id_shop><![CDATA[1]]></id_shop>
                <quantity><![CDATA[${quantity}]]></quantity>
                <depends_on_stock><![CDATA[0]]></depends_on_stock>
                <out_of_stock><![CDATA[2]]></out_of_stock>
            </stock_available>
        </prestashop>`.trim()
        await StockAvailableApi.update(stock.id, xmlBody)
    }
}
