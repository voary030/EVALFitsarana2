import { XMLParser } from 'fast-xml-parser'
import type { Combination, CombinationNode } from '@/types/combination'

const toText = (value: any): string => {
    if (value == null) return ''
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    if (value.__cdata != null) return String(value.__cdata)
    return String(value)
}

const toNumber = (value: any): number => {
    const text = toText(value)
    const parsed = Number(text)
    return Number.isNaN(parsed) ? 0 : parsed
}

const toLangText = (value: any): string => {
    if (value == null) return ''
    if (typeof value === 'string') return value
    if (value.__cdata != null) return String(value.__cdata)
    const lang = value.language
    if (Array.isArray(lang)) {
        const first = lang[0]
        if (first?.__cdata != null) return String(first.__cdata)
        return String(first ?? '')
    }
    if (lang?.__cdata != null) return String(lang.__cdata)
    return String(lang ?? '')
}

const toAssocList = (value: any, key: string): any[] => {
    const raw = value?.[key]
    if (!raw) return []
    return Array.isArray(raw) ? raw : [raw]
}

const toIdList = (value: any, key: string): number[] => {
    return toAssocList(value, key)
        .map((entry: any) => toNumber(entry?.id ?? ''))
        .filter((id) => id !== 0)
}

export const mapCombinationNode = (node: CombinationNode): Combination => {
    return {
        id: toNumber(node?.id),
        id_product: toNumber(node?.id_product),
        ean13: toText(node?.ean13),
        isbn: toText(node?.isbn),
        upc: toText(node?.upc),
        mpn: toText(node?.mpn),
        reference: toText(node?.reference),
        supplier_reference: toText(node?.supplier_reference),
        wholesale_price: toNumber(node?.wholesale_price),
        price: toNumber(node?.price),
        ecotax: toNumber(node?.ecotax),
        weight: toNumber(node?.weight),
        unit_price_impact: toNumber(node?.unit_price_impact),
        minimal_quantity: toNumber(node?.minimal_quantity) || 1,
        low_stock_threshold: toNumber(node?.low_stock_threshold),
        low_stock_alert: toNumber(node?.low_stock_alert) === 1,
        default_on: toNumber(node?.default_on) === 1,
        available_date: toText(node?.available_date),
        available_now: toLangText(node?.available_now),
        available_later: toLangText(node?.available_later),
        product_option_value_ids: toIdList(node?.associations?.product_option_values, 'product_option_value'),
        image_ids: toIdList(node?.associations?.images, 'image')
    }
}

export const parseCombinationListXml = (xmlString: string): Combination[] => {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            ignoreDeclaration: true,
            attributeNamePrefix: '_',
            trimValues: true,
            parseTagValue: true,
            parseAttributeValue: false,
            cdataPropName: '__cdata',
        })

        const result = parser.parse(xmlString)
        const nodes = result?.prestashop?.combinations?.combination || result?.prestashop?.combination

        if (!nodes) return []

        const combinationNodes = Array.isArray(nodes) ? nodes : [nodes]

        return combinationNodes.map((node: CombinationNode) => mapCombinationNode(node))
    } catch (error) {
        console.error('Erreur parsing XML Combination:', error)
        return []
    }
}
