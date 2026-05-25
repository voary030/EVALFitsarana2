import { XMLParser } from 'fast-xml-parser'
import type { ProductOptionValue, ProductOptionValueNode } from '@/types/product_option_value'

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

export const mapProductOptionValueToJson = (node: ProductOptionValueNode): ProductOptionValue => {
    return {
        id: toNumber(node.id),
        id_attribute_group: toNumber(node.id_attribute_group),
        color: toText(node.color),
        position: toNumber(node.position),
        name: toLangText(node.name)
    }
}

export const mapProductOptionValuesToJson = (nodes: ProductOptionValueNode[] | ProductOptionValueNode): ProductOptionValue[] => {
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list.map(mapProductOptionValueToJson)
}

export const parseProductOptionValueListXml = (xml: string): ProductOptionValue[] => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        ignoreDeclaration: true,
        attributeNamePrefix: '_',
        trimValues: true,
        parseTagValue: true,
        parseAttributeValue: false,
        cdataPropName: '__cdata',
    })

    const parsed = parser.parse(xml)
    const raw = parsed?.prestashop?.product_option_values?.product_option_value || parsed?.prestashop?.product_option_value || []
    return mapProductOptionValuesToJson(raw)
}
