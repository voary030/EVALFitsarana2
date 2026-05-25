import { TaxRuleApi } from '@/api/tax/tax_rules/TaxRuleApi'
import { parseTaxRuleListXml, parseTaxRuleXml } from '@/mappers/tax/tax_rule'
import type { TaxRule } from '@/types/tax/tax_rule'

export const TaxRuleService = {

    async getAll(): Promise<TaxRule[]> {
        const xml = await TaxRuleApi.getAll()
        return parseTaxRuleListXml(xml)
    },

    async getById(id: string): Promise<TaxRule | null> {
        const xml = await TaxRuleApi.getById(id)
        return parseTaxRuleXml(xml)
    },

    async getByIdTax(idTax: number): Promise<TaxRule | undefined> {
        const xml = await TaxRuleApi.getByIdTax(idTax, 8);
        const taxRule = parseTaxRuleListXml(xml)
        return taxRule[0]
    },

    async getByTaxRuleGroupAndCountry(idTaxeRuleGroup: number, idCountry: number): Promise<TaxRule | undefined> {
        const xml = await TaxRuleApi.getByTaxRuleGroupAndCountry(idTaxeRuleGroup, idCountry)
        const taxRule = parseTaxRuleListXml(xml)
        return taxRule[0]
    },

    async create(id_tax_rules_group: number, id_tax: number, id_country: number): Promise<TaxRule | null> {
        const data = {
            id_tax_rules_group: id_tax_rules_group,
            id_tax: id_tax,
            id_country: id_country,
            id_state: 0,
            zipcode_from: "0",
            zipcode_to: "0",
            behavior: 0,
            description: ""
        }
        const xmlBody = this.buildXml(data)
        const xml = await TaxRuleApi.create(xmlBody)
        return parseTaxRuleXml(xml)
    },

    async delete(id: string): Promise<void> {
        await TaxRuleApi.delete(id)
    },

    buildXml(data: {
        id_tax_rules_group: number,
        id_tax: number,
        id_country: number,
        id_state: number,
        zipcode_from: string,
        zipcode_to: string,
        behavior: number,
        description: string
    }): string {
        const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <tax_rule>
        <id_tax_rules_group><![CDATA[${data.id_tax_rules_group}]]></id_tax_rules_group>
        <id_tax><![CDATA[${data.id_tax}]]></id_tax>
        <id_country><![CDATA[${data.id_country}]]></id_country>
        <id_state><![CDATA[${data.id_state || 0}]]></id_state>
        <zipcode_from><![CDATA[${data.zipcode_from || ''}]]></zipcode_from>
        <zipcode_to><![CDATA[${data.zipcode_to || ''}]]></zipcode_to>
        <behavior><![CDATA[${data.behavior || 0}]]></behavior>
        <description><![CDATA[${data.description || ''}]]></description>
    </tax_rule>
</prestashop>`.trim();
        return xmlBody;
    }
}
