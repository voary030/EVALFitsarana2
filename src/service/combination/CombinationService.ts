import { CombinationApi } from '@/api/combination/CombinationApi'
import { parseCombinationListXml } from '@/mappers/combination'
import type { Combination } from '@/types/combination'

function buildCombinationXml(data: {
    id_product: number
    price: number
    reference: string
    id_product_option_value: number
}, isUpdate = false, combinationId?: number): string {
    const idTag = isUpdate ? `<id><![CDATA[${combinationId}]]></id>` : '';
    const imagesTag = isUpdate ? '<images nodeType="image" api="images"></images>' : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
    <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        <combination>
            ${idTag}
            <id_product><![CDATA[${data.id_product}]]></id_product>
            <reference><![CDATA[${data.reference}]]></reference>
            <price><![CDATA[${data.price}]]></price>
            <minimal_quantity><![CDATA[1]]></minimal_quantity>
            <associations>
                <product_option_values nodeType="product_option_value" api="product_option_values">
                    <product_option_value>
                        <id><![CDATA[${data.id_product_option_value}]]></id>
                    </product_option_value>
                </product_option_values>
                ${imagesTag}
            </associations>
        </combination>
    </prestashop>`.trim();
}

export const CombinationService = {
    async getAll(): Promise<Combination[]> {
        const xml = await CombinationApi.getAll()
        return parseCombinationListXml(xml)
    },

    async getById(id: string | number): Promise<Combination | undefined> {
        const xml = await CombinationApi.getById(`${id}?display=full`)
        const combinations = parseCombinationListXml(xml)
        return combinations[0]
    },

    async getByProductId(productId: string | number): Promise<Combination[]> {
        const xml = await CombinationApi.getByProductId(productId)
        return parseCombinationListXml(xml)
    },

    async create(data: {
        id_product: number
        price: number
        reference: string
        id_product_option_value: number
        quantity: number
    }): Promise<Combination | undefined> {
        try {
            const xmlBody = buildCombinationXml(data)
            const responseXml = await CombinationApi.create(xmlBody)
            const combinations = parseCombinationListXml(responseXml)
            let created = combinations[0]

            // RE-FETCH immédiat pour être sûr d'avoir l'objet complet
            if (created) {
                created = await this.getById(created.id)
            }

            // Double check associations
            if (created && !(created.product_option_value_ids || []).includes(data.id_product_option_value)) {
                console.warn(`Combination ${created.id} created but association ${data.id_product_option_value} still missing. Retrying with explicit PUT...`)
                
                const updateXml = buildCombinationXml(data, true, created.id)
                await CombinationApi.update(created.id, updateXml)
                
                // RE-FETCH final
                created = await this.getById(created.id)

                // Final check: si toujours manquant, erreur radicale
                if (!created || !(created.product_option_value_ids || []).includes(data.id_product_option_value)) {
                    throw new Error(`Échec critique : PrestaShop refuse de lier la valeur d'option ${data.id_product_option_value} à la déclinaison ${created?.id || '?'}.`)
                }
            }

            return created
        } catch (error) {
            console.error('Erreur création combinaison:', error)
            throw error // Bubble up pour rollback
        }
    }
}
