import { ProductOptionValueApi } from '@/api/product_option_value/ProductOptionValueApi'
import type { ProductOptionValue } from '@/types/product_option_value'
import { parseProductOptionValueListXml } from '@/mappers/product_option_value'

const optionValueCache = new Map<string, number>()

const normalizeText = (value: string): string =>
    value
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')

export const ProductOptionValueService = {
    clearCache() {
        optionValueCache.clear();
    },

    async getAll(): Promise<ProductOptionValue[]> {
        const xml = await ProductOptionValueApi.getAll()
        return parseProductOptionValueListXml(xml)
    },

    async getByColonne(column: string, value: string): Promise<ProductOptionValue[]> {
        const xml = await ProductOptionValueApi.getByColonne(column, value)
        return parseProductOptionValueListXml(xml)
    },

    async getById(id: string | number): Promise<ProductOptionValue | undefined> {
        const xml = await ProductOptionValueApi.getById(id)
        const items = parseProductOptionValueListXml(xml)
        return items[0]
    },

    async findByName(name: string): Promise<ProductOptionValue | undefined> {
        const normalizedName = normalizeText(name)
        const items = await this.getByColonne('name', name)
        return items.find(item => normalizeText(item.name) === normalizedName)
    },

    async findOrCreate(optionId: number, name: string): Promise<ProductOptionValue> {
        const normalizedName = normalizeText(name)
        const cacheKey = `${optionId}_${normalizedName}`
        const cachedId = optionValueCache.get(cacheKey)

        if (cachedId) {
            return { id: cachedId, id_attribute_group: optionId, name: normalizedName, color: '', position: 0 } as ProductOptionValue
        }

        const allValues = await this.getAll()
        const existing = allValues.find(v => v.id_attribute_group === optionId && normalizeText(v.name) === normalizedName)

        if (existing) {
            optionValueCache.set(cacheKey, existing.id)
            return existing
        }

        const created = await this.create({ name, id_attribute_group: optionId })
        if (!created) {
            throw new Error(`Échec critique : Impossible de créer la valeur d'option "${name}" (groupe ${optionId}) dans PrestaShop.`)
        }
        optionValueCache.set(cacheKey, created.id)
        return created
    },

    buildXml(data: Partial<ProductOptionValue>): string {
        return `
    <?xml version="1.0" encoding="UTF-8"?>
    <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        <product_option_value>
            <id_attribute_group><![CDATA[${data.id_attribute_group || ''}]]></id_attribute_group>
            <color><![CDATA[${data.color || ''}]]></color>
            <position><![CDATA[${data.position || 0}]]></position>
            <name>
                <language id="1"><![CDATA[${data.name || ''}]]></language>
            </name>
        </product_option_value>
    </prestashop>
        `.trim()
    },

    async create(data: Partial<ProductOptionValue>): Promise<ProductOptionValue | undefined> {
        try {
            const xmlBody = this.buildXml(data)
            const xml = await ProductOptionValueApi.create(xmlBody)
            const items = parseProductOptionValueListXml(xml)
            if (items.length === 0) {
                console.error('[ProductOptionValueService] Retour API vide après création:', xml)
                return undefined
            }
            return items[0]
        } catch (err: any) {
            console.error('[ProductOptionValueService] Erreur API lors de la création:', err?.response?.data || err)
            throw new Error(`Erreur API PrestaShop (Option Value): ${err?.message || err}`)
        }
    }
}
