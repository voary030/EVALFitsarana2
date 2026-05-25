import { ProductOptionApi } from '@/api/product_option/ProductOptionApi'
import type { ProductOption } from '@/types/product_option'
import { parseProductOptionListXml } from '@/mappers/product_option'

const optionCache = new Map<string, ProductOption>()

export const ProductOptionService = {

    clearCache() {
        optionCache.clear();
    },

    async getAll(): Promise<ProductOption[]> {
        const xml = await ProductOptionApi.getAll()
        return parseProductOptionListXml(xml)
    },

    async getById(id: string | number): Promise<ProductOption | undefined> {
        const xml = await ProductOptionApi.getById(id)
        const items = parseProductOptionListXml(xml)
        return items[0]
    },

    async findOrCreate(name: string): Promise<ProductOption> {
        const normalizedName = name.trim().toLowerCase()
        const cached = optionCache.get(normalizedName)
        if (cached) return cached

        const allOpts = await this.getAll()
        const existing = allOpts.find(o => o.name.toLowerCase() === normalizedName)
        if (existing) {
            optionCache.set(normalizedName, existing)
            return existing
        }

        const created = await this.create({ name, public_name: name })
        if (!created) {
            throw new Error(`Échec critique : Impossible de créer l'option de produit "${name}" dans PrestaShop.`)
        }
        optionCache.set(normalizedName, created)
        return created
    },

    buildXml(data: Partial<ProductOption>): string {
        return `
    <?xml version="1.0" encoding="UTF-8"?>
    <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        <product_option>
            <is_color_group><![CDATA[${data.is_color_group || 0}]]></is_color_group>
            <group_type><![CDATA[${data.group_type || 'select'}]]></group_type>
            <position><![CDATA[${data.position || 0}]]></position>
            <name>
                <language id="1"><![CDATA[${data.name || ''}]]></language>
            </name>
            <public_name>
                <language id="1"><![CDATA[${data.public_name || data.name || ''}]]></language>
            </public_name>
        </product_option>
    </prestashop>
        `.trim()
    },

    async create(data: Partial<ProductOption>): Promise<ProductOption | undefined> {
        try {
            const xmlBody = this.buildXml(data)
            const xml = await ProductOptionApi.create(xmlBody)
            const items = parseProductOptionListXml(xml)
            if (items.length === 0) {
                console.error('[ProductOptionService] Retour API vide après création:', xml)
                return undefined
            }
            return items[0]
        } catch (err: any) {
            console.error('[ProductOptionService] Erreur API lors de la création:', err?.response?.data || err)
            throw new Error(`Erreur API PrestaShop (Option): ${err?.message || err}`)
        }
    }
}
