import { XMLParser } from 'fast-xml-parser'
import type {
    Product,
    ProductBundleItem,
    ProductFeatureItem,
    ProductNode,
    StockAvailableItem,
} from '@/types/product/index'

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

const toFeatureList = (value: any): ProductFeatureItem[] => {
    return toAssocList(value, 'product_feature')
        .map((entry: any) => ({
            id: toNumber(entry?.id),
            id_feature_value: toNumber(entry?.id_feature_value),
        }))
        .filter((item) => item.id !== 0)
}

const toStockAvailableList = (value: any): StockAvailableItem[] => {
    return toAssocList(value, 'stock_available')
        .map((entry: any) => ({
            id: toNumber(entry?.id),
            id_product_attribute: toNumber(entry?.id_product_attribute),
        }))
        .filter((item) => item.id !== 0)
}

const toProductBundleList = (value: any): ProductBundleItem[] => {
    return toAssocList(value, 'product')
        .map((entry: any) => ({
            id: toNumber(entry?.id),
            id_product_attribute: toNumber(entry?.id_product_attribute),
            quantity: toNumber(entry?.quantity),
        }))
        .filter((item) => item.id !== 0)
}

export const mapProductToJson = (node: ProductNode): Product => {
    return {
        id: toNumber(node?.id),
        id_manufacturer: toNumber(node?.id_manufacturer),
        id_supplier: toNumber(node?.id_supplier),
        id_category_default: toNumber(node?.id_category_default),
        is_new: toNumber(node?.new),
        cache_default_attribute: toNumber(node?.cache_default_attribute),
        id_default_image: toNumber(node?.id_default_image),
        id_default_combination: toNumber(node?.id_default_combination),
        id_tax_rules_group: toNumber(node?.id_tax_rules_group),
        position_in_category: toNumber(node?.position_in_category),
        type: toText(node?.type),
        id_shop_default: toNumber(node?.id_shop_default),
        reference: toText(node?.reference),
        supplier_reference: toText(node?.supplier_reference),
        location: toText(node?.location),
        width: toNumber(node?.width),
        height: toNumber(node?.height),
        depth: toNumber(node?.depth),
        weight: toNumber(node?.weight),
        quantity_discount: toNumber(node?.quantity_discount),
        ean13: toText(node?.ean13),
        isbn: toText(node?.isbn),
        upc: toText(node?.upc),
        mpn: toText(node?.mpn),
        cache_is_pack: toNumber(node?.cache_is_pack),
        cache_has_attachments: toNumber(node?.cache_has_attachments),
        is_virtual: toNumber(node?.is_virtual),
        state: toNumber(node?.state),
        additional_delivery_times: toNumber(node?.additional_delivery_times),
        delivery_in_stock: toLangText(node?.delivery_in_stock),
        delivery_out_stock: toLangText(node?.delivery_out_stock),
        product_type: toText(node?.product_type),
        on_sale: toNumber(node?.on_sale),
        online_only: toNumber(node?.online_only),
        ecotax: toNumber(node?.ecotax),
        minimal_quantity: toNumber(node?.minimal_quantity),
        low_stock_threshold: toNumber(node?.low_stock_threshold),
        low_stock_alert: toNumber(node?.low_stock_alert),
        price: toNumber(node?.price),
        wholesale_price: toNumber(node?.wholesale_price),
        unity: toText(node?.unity),
        unit_price_ratio: toNumber(node?.unit_price_ratio),
        additional_shipping_cost: toNumber(node?.additional_shipping_cost),
        customizable: toNumber(node?.customizable),
        text_fields: toNumber(node?.text_fields),
        uploadable_files: toNumber(node?.uploadable_files),
        active: toNumber(node?.active),
        redirect_type: toText(node?.redirect_type),
        id_type_redirected: toNumber(node?.id_type_redirected),
        available_for_order: toNumber(node?.available_for_order),
        available_date: toText(node?.available_date),
        show_condition: toNumber(node?.show_condition),
        condition: toText(node?.condition),
        show_price: toNumber(node?.show_price),
        indexed: toNumber(node?.indexed),
        visibility: toText(node?.visibility),
        advanced_stock_management: toNumber(node?.advanced_stock_management),
        date_add: toText(node?.date_add),
        date_upd: toText(node?.date_upd),
        pack_stock_type: toNumber(node?.pack_stock_type),
        meta_description: toLangText(node?.meta_description),
        meta_keywords: toLangText(node?.meta_keywords),
        meta_title: toLangText(node?.meta_title),
        link_rewrite: toLangText(node?.link_rewrite),
        name: toLangText(node?.name),
        description: toLangText(node?.description),
        description_short: toLangText(node?.description_short),
        available_now: toLangText(node?.available_now),
        available_later: toLangText(node?.available_later),
        category_ids: toIdList(node?.associations?.categories, 'category'),
        image_ids: toIdList(node?.associations?.images, 'image'),
        combination_ids: toIdList(node?.associations?.combinations, 'combination'),
        product_option_value_ids: toIdList(
            node?.associations?.product_option_values,
            'product_option_value',
        ),
        product_features: toFeatureList(node?.associations?.product_features),
        tag_ids: toIdList(node?.associations?.tags, 'tag'),
        stock_available_items: toStockAvailableList(node?.associations?.stock_availables),
        attachment_ids: toIdList(node?.associations?.attachments, 'attachment'),
        accessory_ids: toIdList(node?.associations?.accessories, 'product'),
        product_bundle_items: toProductBundleList(node?.associations?.product_bundle),
    }
}

export const mapProductsToJson = (nodes: ProductNode[] | ProductNode): Product[] => {
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list.map(mapProductToJson)
}

export const parseProductXml = (xml: string): Product | null => {
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
    const raw = parsed?.prestashop?.products?.product || parsed?.prestashop?.product
    const first = Array.isArray(raw) ? raw[0] : raw
    return first ? mapProductToJson(first) : null
}

export const parseProductListXml = (xml: string): Product[] => {
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
    const raw = parsed?.prestashop?.products?.product || parsed?.prestashop?.product || []
    return mapProductsToJson(raw)
}
