import { XMLParser } from 'fast-xml-parser'
import type { Customer, CustomerNode } from '@/types/customer'

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

const toIdList = (value: any, key: string): number[] => {
    const raw = value?.[key]
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : [raw]
    return list
        .map((entry: any) => toNumber(entry?.id ?? ''))
        .filter((id) => id !== 0)
}

export const mapCustomerToJson = (node: CustomerNode): Customer => {
    const group_ids = toIdList(node?.associations?.groups, 'group')

    return {
        id: toNumber(node?.id),
        id_default_group: toNumber(node?.id_default_group),
        id_lang: toNumber(node?.id_lang),
        newsletter_date_add: toText(node?.newsletter_date_add),
        ip_registration_newsletter: toText(node?.ip_registration_newsletter),
        last_passwd_gen: toText(node?.last_passwd_gen),
        secure_key: toText(node?.secure_key),
        deleted: toNumber(node?.deleted),
        passwd: toText(node?.passwd),
        lastname: toText(node?.lastname),
        firstname: toText(node?.firstname),
        email: toText(node?.email),
        id_gender: toNumber(node?.id_gender),
        birthday: toText(node?.birthday),
        newsletter: toNumber(node?.newsletter),
        optin: toNumber(node?.optin),
        website: toText(node?.website),
        company: toText(node?.company),
        siret: toText(node?.siret),
        ape: toText(node?.ape),
        outstanding_allow_amount: toNumber(node?.outstanding_allow_amount),
        show_public_prices: toNumber(node?.show_public_prices),
        id_risk: toNumber(node?.id_risk),
        max_payment_days: toNumber(node?.max_payment_days),
        active: toNumber(node?.active),
        note: toText(node?.note),
        is_guest: toNumber(node?.is_guest),
        id_shop: toNumber(node?.id_shop),
        id_shop_group: toNumber(node?.id_shop_group),
        date_add: toText(node?.date_add),
        date_upd: toText(node?.date_upd),
        reset_password_token: toText(node?.reset_password_token),
        reset_password_validity: toText(node?.reset_password_validity),
        group_ids
    }
}

export const mapCustomersToJson = (nodes: CustomerNode[] | CustomerNode): Customer[] => {
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list.map(mapCustomerToJson)
}

export const parseCustomerXml = (xml: string): Customer | undefined => {
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
    const raw = parsed?.prestashop?.customers?.customer || parsed?.prestashop?.customer
    const first = Array.isArray(raw) ? raw[0] : raw
    return first ? mapCustomerToJson(first) : undefined
}

export const parseCustomerListXml = (xml: string): Customer[] => {
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
    const raw = parsed?.prestashop?.customers?.customer || parsed?.prestashop?.customer || []
    return mapCustomersToJson(raw)
}
