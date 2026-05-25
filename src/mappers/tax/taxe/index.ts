import { XMLParser } from 'fast-xml-parser'
import type { Tax, TaxNode } from '@/types/tax/taxe'

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

export const mapTaxToJson = (node: TaxNode): Tax => {
    return {
        id: toNumber(node?.id),
        rate: toNumber(node?.rate),
        active: toNumber(node?.active),
        deleted: toNumber(node?.deleted),
        name: toLangText(node?.name)
    }
}

export const mapTaxesToJson = (nodes: TaxNode[] | TaxNode): Tax[] => {
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list.map(mapTaxToJson)
}

export const parseTaxXml = (xml: string): Tax | null => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        ignoreDeclaration: true,
        attributeNamePrefix: '_',
        trimValues: true,
        parseTagValue: true,
        parseAttributeValue: false,
        cdataPropName: '__cdata'
    })

    const parsed = parser.parse(xml)
    const raw = parsed?.prestashop?.taxes?.tax || parsed?.prestashop?.tax
    const first = Array.isArray(raw) ? raw[0] : raw
    return first ? mapTaxToJson(first) : null
}

export const parseTaxListXml = (xml: string): Tax[] => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        ignoreDeclaration: true,
        attributeNamePrefix: '_',
        trimValues: true,
        parseTagValue: true,
        parseAttributeValue: false,
        cdataPropName: '__cdata'
    })

    const parsed = parser.parse(xml)
    const raw = parsed?.prestashop?.taxes?.tax || parsed?.prestashop?.tax || []
    return mapTaxesToJson(raw)
}
