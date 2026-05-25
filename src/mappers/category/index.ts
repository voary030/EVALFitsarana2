import { XMLParser } from 'fast-xml-parser'
import type { Category, CategoryNode } from '@/types/category'

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

const toIdList = (value: any, key: string): number[] => {
    const raw = value?.[key]
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : [raw]
    return list
        .map((entry: any) => toNumber(entry?.id ?? ''))
        .filter((id) => id !== 0)
}

export const mapCategoryToJson = (node: CategoryNode): Category => {
    const children_ids = toIdList(node?.associations?.categories, 'category')
    const product_ids = toIdList(node?.associations?.products, 'product')

    return {
        id: toNumber(node?.id),
        id_parent: toNumber(node?.id_parent),
        level_depth: toNumber(node?.level_depth),
        nb_products_recursive: toNumber(node?.nb_products_recursive),
        active: toNumber(node?.active),
        id_shop_default: toNumber(node?.id_shop_default),
        is_root_category: toNumber(node?.is_root_category),
        position: toNumber(node?.position),
        date_add: toText(node?.date_add),
        date_upd: toText(node?.date_upd),
        name: toLangText(node?.name),
        link_rewrite: toLangText(node?.link_rewrite),
        description: toLangText(node?.description),
        additional_description: toLangText(node?.additional_description),
        meta_title: toLangText(node?.meta_title),
        meta_description: toLangText(node?.meta_description),
        meta_keywords: toLangText(node?.meta_keywords),
        children_ids,
        product_ids
    }
}

export const mapCategoriesToJson = (nodes: CategoryNode[] | CategoryNode): Category[] => {
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list.map(mapCategoryToJson)
}

export const parseCategoryXml = (xml: string): Category | undefined => {
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
    const raw = parsed?.prestashop?.categories?.category || parsed?.prestashop?.category
    const first = Array.isArray(raw) ? raw[0] : raw
    return first ? mapCategoryToJson(first) : undefined
}

export const parseCategoryListXml = (xml: string): Category[] => {
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
    const raw = parsed?.prestashop?.categories?.category || parsed?.prestashop?.category || []
    return mapCategoriesToJson(raw)
}
