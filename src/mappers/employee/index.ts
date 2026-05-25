import { XMLParser } from 'fast-xml-parser'
import type { Employee, EmployeeNode } from '@/types/employee'

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

export const mapEmployeeToJson = (node: EmployeeNode): Employee => {
    return {
        id: toNumber(node?.id),
        id_lang: toNumber(node?.id_lang),
        last_passwd_gen: toText(node?.last_passwd_gen),
        stats_date_from: toText(node?.stats_date_from),
        stats_date_to: toText(node?.stats_date_to),
        passwd: toText(node?.passwd),
        lastname: toText(node?.lastname),
        firstname: toText(node?.firstname),
        email: toText(node?.email),
        active: toNumber(node?.active),
        id_profile: toNumber(node?.id_profile),
        bo_color: toText(node?.bo_color),
        default_tab: toNumber(node?.default_tab),
        bo_theme: toText(node?.bo_theme),
        bo_css: toText(node?.bo_css),
        bo_width: toNumber(node?.bo_width),
        bo_menu: toNumber(node?.bo_menu),
        stats_compare_option: toNumber(node?.stats_compare_option),
        preselect_date_range: toText(node?.preselect_date_range),
        id_last_order: toNumber(node?.id_last_order),
        id_last_customer_message: toNumber(node?.id_last_customer_message),
        id_last_customer: toNumber(node?.id_last_customer),
        reset_password_token: toText(node?.reset_password_token),
        reset_password_validity: toText(node?.reset_password_validity),
        has_enabled_gravatar: toNumber(node?.has_enabled_gravatar),
    }
}

export const parseEmployeeXml = (xml: string): Employee | null => {
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
    const raw = parsed?.prestashop?.employees?.employee || parsed?.prestashop?.employee
    const first = Array.isArray(raw) ? raw[0] : raw
    return first ? mapEmployeeToJson(first) : null
}

export const parseEmployeeListXml = (xml: string): Employee[] => {
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
    const raw = parsed?.prestashop?.employees?.employee || parsed?.prestashop?.employee || []
    const list = Array.isArray(raw) ? raw : [raw]
    return list.map(mapEmployeeToJson)
}
