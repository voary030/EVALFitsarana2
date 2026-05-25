import { XMLParser } from 'fast-xml-parser'
import type { TaxRule, TaxRuleNode } from '@/types/tax/tax_rule'

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

export const mapTaxRuleToJson = (node: TaxRuleNode): TaxRule => {
    return {
        id: toNumber(node?.id),
        id_tax_rules_group: toNumber(node?.id_tax_rules_group),
        id_state: toNumber(node?.id_state),
        id_country: toNumber(node?.id_country),
        zipcode_from: toText(node?.zipcode_from),
        zipcode_to: toText(node?.zipcode_to),
        id_tax: toNumber(node?.id_tax),
        behavior: toNumber(node?.behavior),
        description: toText(node?.description)
    }
}

export const mapTaxRulesToJson = (nodes: TaxRuleNode[] | TaxRuleNode): TaxRule[] => {
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list.map(mapTaxRuleToJson)
}

export const parseTaxRuleXml = (xml: string): TaxRule | null => {
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
    const raw = parsed?.prestashop?.tax_rules?.tax_rule || parsed?.prestashop?.tax_rule
    const first = Array.isArray(raw) ? raw[0] : raw
    return first ? mapTaxRuleToJson(first) : null
}

export const parseTaxRuleListXml = (xml: string): TaxRule[] => {
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
    const raw = parsed?.prestashop?.tax_rules?.tax_rule || parsed?.prestashop?.tax_rule || []
    return mapTaxRulesToJson(raw)
}
