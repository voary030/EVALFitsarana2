import { XMLParser } from 'fast-xml-parser'
import type { ProductOption, ProductOptionNode } from '@/types/product_option'

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

export const mapProductOptionToJson = (node: ProductOptionNode): ProductOption => {
    return {
        id: toNumber(node.id),
        is_color_group: toNumber(node.is_color_group),
        group_type: toText(node.group_type),
        position: toNumber(node.position),
        name: toLangText(node.name),
        public_name: toLangText(node.public_name),
        product_option_value_ids: toIdList(node.associations?.product_option_values, 'product_option_value')
    }
}

export const mapProductOptionsToJson = (nodes: ProductOptionNode[] | ProductOptionNode): ProductOption[] => {
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list.map(mapProductOptionToJson)
}

export const parseProductOptionListXml = (xml: string): ProductOption[] => {
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
    const raw = parsed?.prestashop?.product_options?.product_option || parsed?.prestashop?.product_option || []
    return mapProductOptionsToJson(raw)
}
