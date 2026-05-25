import { StockDeltaApi } from '@/api/stock_delta/StockDeltaApi'
import { parseStockDeltaListXml } from '@/mappers/stock_delta'
import type { StockDelta } from '@/types/stock_delta'

export const StockDeltaService = {
    async getAll(): Promise<StockDelta[]> {
        try {
            const xml = await StockDeltaApi.getAll()
            return parseStockDeltaListXml(xml)
        } catch (error) {
            console.error('Erreur StockDeltaService.getAll:', error)
            return []
        }
    },

    async create(data: Omit<StockDelta, 'id'>): Promise<void> {
        try {
            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <stock_delta>
                    <id_product><![CDATA[${data.id_product}]]></id_product>
                    <id_product_attribute><![CDATA[${data.id_product_attribute}]]></id_product_attribute>
                    <delta><![CDATA[${data.delta}]]></delta>
                    <date_add><![CDATA[${data.date_add}]]></date_add>
                </stock_delta>
            </prestashop>`.trim()
            await StockDeltaApi.create(xmlBody)
        } catch (error) {
            console.error('Erreur StockDeltaService.create:', error)
            throw error
        }
    }
}
