import { AddressApi } from '@/api/adresse/AddressApi'
import { parseAddressListXml, parseAddressXml } from '@/mappers/adresse'
import type { Address } from '@/types/adresse'

const getCurrentPrestaDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

export const AddressService = {
    async getAll(): Promise<Address[]> {
        try {
            const xml = await AddressApi.getAll()
            return parseAddressListXml(xml)
        } catch (error) {
            console.error('Erreur récupération adresses:', error)
            return []
        }
    },

    async getById(id: string | number): Promise<Address | undefined> {
        try {
            const xml = await AddressApi.getById(id)
            return parseAddressXml(xml)
        } catch (error) {
            console.error(`Erreur récupération adresse ${id}:`, error)
            return undefined
        }
    },

    async getByCustomerId(customerId: number): Promise<Address[]> {
        try {
            const xml = await AddressApi.getByCustomerId(customerId)
            return parseAddressListXml(xml)
        } catch (error) {
            console.error(`Erreur récupération adresses client ${customerId}:`, error)
            return []
        }
    },

    async create(data: Partial<Address>): Promise<Address | undefined> {
        try {
            const xmlBody = this.buildXml(data)
            const responseXml = await AddressApi.create(xmlBody)
            return parseAddressXml(responseXml)
        } catch (error) {
            console.error('Erreur création adresse:', error)
            return undefined
        }
    },

    async update(id: string | number, data: Partial<Address>): Promise<Address | undefined> {
        try {
            const xmlBody = this.buildXml(data, id)
            const responseXml = await AddressApi.update(id, xmlBody)
            return parseAddressXml(responseXml)
        } catch (error) {
            console.error(`Erreur mise à jour adresse ${id}:`, error)
            return undefined
        }
    },

    async delete(id: string | number): Promise<void> {
        try {
            await AddressApi.delete(id)
        } catch (error) {
            console.error(`Erreur suppression adresse ${id}:`, error)
            throw error
        }
    },

    async count(): Promise<number> {
        try {
            return (await this.getAll()).length
        } catch {
            return 0
        }
    },

    buildXml(data: Partial<Address>, id?: string | number): string {
        const now = getCurrentPrestaDate()
        return `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
            <address>
                ${id ? `<id><![CDATA[${id}]]></id>` : ''}
                <id_customer><![CDATA[${data.id_customer ?? ''}]]></id_customer>
                <id_manufacturer><![CDATA[${data.id_manufacturer ?? ''}]]></id_manufacturer>
                <id_supplier><![CDATA[${data.id_supplier ?? ''}]]></id_supplier>
                <id_warehouse><![CDATA[${data.id_warehouse ?? ''}]]></id_warehouse>
                <id_country><![CDATA[8]]></id_country>
                <id_state><![CDATA[${data.id_state ?? ''}]]></id_state>
                <alias><![CDATA[${data.alias || ''}]]></alias>
                <company><![CDATA[${data.company || ''}]]></company>
                <lastname><![CDATA[${data.lastname || ''}]]></lastname>
                <firstname><![CDATA[${data.firstname || ''}]]></firstname>
                <vat_number><![CDATA[${data.vat_number || ''}]]></vat_number>
                <address1><![CDATA[${data.address1 || ''}]]></address1>
                <address2><![CDATA[${data.address2 || ''}]]></address2>
                <postcode><![CDATA[${data.postcode || ''}]]></postcode>
                <city><![CDATA[${data.city || ''}]]></city>
                <other><![CDATA[${data.other || ''}]]></other>
                <phone><![CDATA[${data.phone || ''}]]></phone>
                <phone_mobile><![CDATA[${data.phone_mobile || ''}]]></phone_mobile>
                <dni><![CDATA[${data.dni || ''}]]></dni>
                <deleted><![CDATA[${data.deleted ?? 0}]]></deleted>
                <date_add>${data.date_add || now}</date_add>
                <date_upd>${now}</date_upd>
            </address>
        </prestashop>`.trim()
    }
}
