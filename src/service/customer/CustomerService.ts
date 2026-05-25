import { CustomerApi } from "@/api/customer/CustomerApi"
import type { Customer } from "@/types/customer"
import { parseCustomerListXml, parseCustomerXml } from '@/mappers/customer'
import bcryptjs from 'bcryptjs'

const getCurrentPrestaDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export const CustomerService = {

    async getAll(): Promise<Customer[]> {
        try {
            const xml = await CustomerApi.getAll();
            return parseCustomerListXml(xml);
        } catch (err: any) {
            console.error('Error fetching customers:', err);
            throw err;
        }
    },

    async getById(id: string | number): Promise<Customer | undefined> {
        try {
            const xml = await CustomerApi.getById(id);
            return parseCustomerXml(xml);
        } catch (err: any) {
            console.error(`Error fetching customer ${id}:`, err);
            throw err;
        }
    },

    async create(customerData: Partial<Customer>): Promise<Customer | undefined> {
        const xmlBody = this.buildXml(customerData);
        const xmlResponse = await CustomerApi.create(xmlBody);
        return parseCustomerXml(xmlResponse);
    },

    async update(id: string | number, customerData: Partial<Customer>): Promise<Customer | undefined> {
        const xmlBody = this.buildXml(customerData, id);
        const xmlResponse = await CustomerApi.update(id, xmlBody);
        return parseCustomerXml(xmlResponse);
    },

    async findByEmail(email: string): Promise<Customer | undefined> {
        try {
            const xml = await CustomerApi.getByEmail(email)
            const customers = parseCustomerListXml(xml)
            return customers.find(c => c.email.toLowerCase() === email.toLowerCase())
        } catch {
            return undefined
        }
    },

    async login(email: string, password: string): Promise<Customer | null> {
        try {
            const customer = await this.findByEmail(email)
            if (!customer) {
                console.error('Client non trouvé')
                return null
            }
            if (customer.active === 0) {
                console.error('Client inactif')
                return null
            }

            const passwordMatch = await bcryptjs.compare(password, customer.passwd || '')
            if (!passwordMatch) {
                console.error('Mot de passe incorrect')
                return null
            }

            return customer
        } catch (error) {
            console.error('Erreur lors de la connexion client:', error)
            return null
        }
    },

    async delete(id: string | number): Promise<void> {
        await CustomerApi.delete(id);
    },

    buildXml(data: Partial<Customer>, id?: string | number): string {
        const now = getCurrentPrestaDate();

        const xmlBody = `
        <?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
            <customer>
                ${id ? `<id>${id}</id>` : ''}
                <lastname><![CDATA[${data.lastname || ''}]]></lastname>
                <firstname><![CDATA[${data.firstname || ''}]]></firstname>
                <email><![CDATA[${data.email || ''}]]></email>
                <passwd><![CDATA[${data.passwd || ''}]]></passwd>
                <id_gender>${data.id_gender || 1}</id_gender>
                <birthday><![CDATA[${data.birthday || '0000-00-00'}]]></birthday>
                <newsletter>${data.newsletter || 0}</newsletter>
                <optin>${data.optin || 0}</optin>
                <active>${data.active !== undefined ? data.active : 1}</active>
                <id_default_group>${data.id_default_group || 3}</id_default_group>
                <id_lang>${data.id_lang || 1}</id_lang>
                <id_shop>${data.id_shop || 1}</id_shop>
                <id_shop_group>${data.id_shop_group || 1}</id_shop_group>
                <date_add>${now}</date_add>
                <date_upd>${now}</date_upd>
                <associations>
                    <groups>
                        ${(data.group_ids || [3]).map(groupId => `<group><id>${groupId}</id></group>`).join('')}
                    </groups>
                </associations>
            </customer>
        </prestashop>
        `.trim();

        return xmlBody;
    }
}
