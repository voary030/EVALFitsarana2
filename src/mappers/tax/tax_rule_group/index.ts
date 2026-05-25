import { XMLParser } from 'fast-xml-parser'
import type { TaxRuleGroup, TaxRuleGroupNode } from '@/types/tax/tax_rule_group'

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

export const mapTaxRuleGroupToJson = (node: TaxRuleGroupNode): TaxRuleGroup => {
    return {
        id: toNumber(node?.id),
        name: toText(node?.name),
        active: toNumber(node?.active),
        deleted: toNumber(node?.deleted),
        date_add: toText(node?.date_add),
        date_upd: toText(node?.date_upd)
    }
}

export const mapTaxRuleGroupsToJson = (nodes: TaxRuleGroupNode[] | TaxRuleGroupNode): TaxRuleGroup[] => {
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list.map(mapTaxRuleGroupToJson)
}

export const parseTaxRuleGroupXml = (xml: string): TaxRuleGroup | null => {
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
    const raw = parsed?.prestashop?.tax_rule_groups?.tax_rule_group || parsed?.prestashop?.tax_rule_group
    const first = Array.isArray(raw) ? raw[0] : raw
    return first ? mapTaxRuleGroupToJson(first) : null
}

export const parseTaxRuleGroupListXml = (xml: string): TaxRuleGroup[] => {
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
    const raw = parsed?.prestashop?.tax_rule_groups?.tax_rule_group || parsed?.prestashop?.tax_rule_group || []
    return mapTaxRuleGroupsToJson(raw)
}
