import { XMLParser } from 'fast-xml-parser'
import type { Cart, CartNode, CartRow, CartRowNode } from '@/types/cart'

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

const toCartRowList = (value: any): CartRow[] => {
    const raw = value?.cart_rows?.cart_row
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : [raw]
    return list.map((entry: CartRowNode) => ({
        id_product: toNumber(entry?.id_product),
        id_product_attribute: toNumber(entry?.id_product_attribute),
        id_address_delivery: toNumber(entry?.id_address_delivery),
        id_customization: toNumber(entry?.id_customization),
        quantity: toNumber(entry?.quantity),
    }))
}

export const mapCartNode = (node: CartNode): Cart => {
    return {
        id: toNumber(node?.id),
        id_address_delivery: toNumber(node?.id_address_delivery),
        id_address_invoice: toNumber(node?.id_address_invoice),
        id_currency: toNumber(node?.id_currency),
        id_customer: toNumber(node?.id_customer),
        id_guest: toNumber(node?.id_guest),
        id_lang: toNumber(node?.id_lang),
        id_shop_group: toNumber(node?.id_shop_group),
        id_shop: toNumber(node?.id_shop),
        id_carrier: toNumber(node?.id_carrier),
        recyclable: Boolean(toNumber(node?.recyclable)),
        gift: Boolean(toNumber(node?.gift)),
        gift_message: toText(node?.gift_message),
        mobile_theme: Boolean(toNumber(node?.mobile_theme)),
        delivery_option: toText(node?.delivery_option),
        secure_key: toText(node?.secure_key),
        allow_seperated_package: Boolean(toNumber(node?.allow_seperated_package)),
        date_add: toText(node?.date_add),
        date_upd: toText(node?.date_upd),
        cart_rows: toCartRowList(node?.associations)
    }
}

export const parseCartListXml = (xmlString: string): Cart[] => {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            ignoreDeclaration: true,
            attributeNamePrefix: '_',
            trimValues: true,
            parseTagValue: true,
            parseAttributeValue: false,
            cdataPropName: '__cdata'
        })

        const result = parser.parse(xmlString)

        const nodes = result?.prestashop?.carts?.cart || result?.prestashop?.cart

        if (!nodes) return []

        const cartNodes = Array.isArray(nodes) ? nodes : [nodes]

        return cartNodes.map((node: CartNode) => mapCartNode(node))
    } catch (error) {
        console.error('Erreur parsing XML Cart:', error)
        return []
    }
}
