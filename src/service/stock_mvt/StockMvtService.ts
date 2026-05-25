import { StockMvtApi } from '@/api/stock_mvt/StockMvtApi'
import { parseStockMvtListXml } from '@/mappers/stock_mvt'
import type { StockMvt } from '@/types/stock_mvt'

export const StockMvtService = {

    async getAll(): Promise<StockMvt[]> {
        try {
            const xml = await StockMvtApi.getAll()
            return parseStockMvtListXml(xml)
        } catch (error) {
            console.error('Erreur récupération mouvements de stock:', error)
            return []
        }
    },

    async getById(id: string | number): Promise<StockMvt | undefined> {
        try {
            const xml = await StockMvtApi.getById(id)
            const items = parseStockMvtListXml(xml)
            return items[0]
        } catch (error) {
            console.error(`Erreur récupération mouvement ${id}:`, error)
            return undefined
        }
    },

    async getByProductId(productId: number): Promise<StockMvt[]> {
        try {
            const all = await this.getAll()
            return all.filter(m => m.id_product === productId)
        } catch (error) {
            console.error(`Erreur récupération mouvements produit ${productId}:`, error)
            return []
        }
    },

    async createMouvement(data: {
        id_product: number
        id_product_attribute: number
        id_stock: number
        physical_quantity: number
        sign?: number
        id_employee?: number
        id_stock_mvt_reason?: number
        date_add?: string
    }): Promise<StockMvt | undefined> {
        try {
            const now = data.date_add || new Date().toISOString().slice(0, 19).replace('T', ' ')
            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <stock_mvt>
                    <id_product><![CDATA[${data.id_product}]]></id_product>
                    <id_product_attribute><![CDATA[${data.id_product_attribute}]]></id_product_attribute>
                    <id_stock><![CDATA[${data.id_stock}]]></id_stock>
                    <id_employee><![CDATA[${data.id_employee || 1}]]></id_employee>
                    <id_stock_mvt_reason><![CDATA[${data.id_stock_mvt_reason || 1}]]></id_stock_mvt_reason>
                    <physical_quantity><![CDATA[${data.physical_quantity}]]></physical_quantity>
                    <sign><![CDATA[${data.sign}]]></sign>
                    <price_te>0</price_te>
                    <date_add><![CDATA[${now}]]></date_add>
                </stock_mvt>
            </prestashop>`.trim()
            const responseXml = await StockMvtApi.create(xmlBody)
            const items = parseStockMvtListXml(responseXml)
            const createdMvt = items[0]
            if (createdMvt && data.date_add) {
                await this.patch(createdMvt.id, data.date_add)
                createdMvt.date_add = data.date_add
            }
            return createdMvt
        } catch (error) {
            console.error('Erreur création mouvement de stock:', error)
            return undefined
        }
    },

    async count(): Promise<number> {
        try {
            return (await this.getAll()).length
        } catch {
            return 0
        }
    },

    async update(id: string | number, data: Partial<StockMvt>): Promise<StockMvt | undefined> {
        try {
            const now = data.date_add || new Date().toISOString().slice(0, 19).replace('T', ' ')
            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <stock_mvt>
                    <id><![CDATA[${id}]]></id>
                    ${data.id_product !== undefined ? `<id_product><![CDATA[${data.id_product}]]></id_product>` : ''}
                    ${data.id_product_attribute !== undefined ? `<id_product_attribute><![CDATA[${data.id_product_attribute}]]></id_product_attribute>` : ''}
                    ${data.id_stock !== undefined ? `<id_stock><![CDATA[${data.id_stock}]]></id_stock>` : ''}
                    ${data.physical_quantity !== undefined ? `<physical_quantity><![CDATA[${data.physical_quantity}]]></physical_quantity>` : ''}
                    ${data.sign !== undefined ? `<sign><![CDATA[${data.sign}]]></sign>` : ''}
                    ${data.id_employee !== undefined ? `<id_employee><![CDATA[${data.id_employee}]]></id_employee>
                    <id_stock_mvt_reason><![CDATA[1]]></id_stock_mvt_reason>` : ''}
                    ${data.id_stock_mvt_reason !== undefined ? `<id_stock_mvt_reason><![CDATA[${data.id_stock_mvt_reason}]]></id_stock_mvt_reason>` : ''}
                    <date_add><![CDATA[${now}]]></date_add>
                </stock_mvt>
            </prestashop>`.trim()

            const responseXml = await StockMvtApi.update(id, xmlBody)
            const items = parseStockMvtListXml(responseXml)
            return items[0]
        } catch (error) {
            console.error(`Erreur mise à jour mouvement ${id}:`, error)
            return undefined
        }
    },

    async patch(id: string | number, dateAdd: string): Promise<StockMvt | undefined> {
        try {
            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <stock_mvt>
                    <id>${id}</id>
                    <date_add><![CDATA[${dateAdd}]]></date_add>
                </stock_mvt>
            </prestashop>`.trim()
            const responseXml = await StockMvtApi.patch(id, xmlBody)
            const items = parseStockMvtListXml(responseXml)
            return items[0]
        } catch (error) {
            console.error(`Erreur patch mouvement ${id}:`, error)
            return undefined
        }
    },

    async delete(id: string | number): Promise<void> {
        try {
            await StockMvtApi.delete(id)
        } catch (error) {
            console.error(`Erreur suppression mouvement ${id}:`, error)
            throw error
        }
    },

    async getByStockId(stockId: number | string): Promise<StockMvt[]> {
        try {
            const xml = await StockMvtApi.getByStockId(stockId)
            return parseStockMvtListXml(xml)
        } catch (error) {
            console.error(`Erreur récupération mouvements pour stock ${stockId}:`, error)
            return []
        }
    }
}
