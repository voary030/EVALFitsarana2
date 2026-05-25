import { TaxRuleApi as TaxApi } from '@/api/tax/taxe/TaxeApi'
import { parseTaxListXml, parseTaxXml } from '@/mappers/tax/taxe'
import type { Tax } from '@/types/tax/taxe'
import { TaxRuleService } from '../tax_rule/TaxRuleService'
import type { TaxRuleGroup } from '@/types/tax/tax_rule_group'
import { TaxRuleGroupService } from '../tax_rule_group/TaxRuleGroupService'

export const TaxService = {
    async getAll(): Promise<Tax[]> {
        const xml = await TaxApi.getAll()
        return parseTaxListXml(xml)
    },

    async getById(id: string): Promise<Tax | null> {
        const xml = await TaxApi.getById(id)
        return parseTaxXml(xml)
    },

    async getByRate(rate: number): Promise<Tax | undefined> {
        const xml = await TaxApi.getByRate(rate)
        const taxes = parseTaxListXml(xml)
        return taxes[0]
    },

    async getIdTaxeRulesGroupByRateTax(rate: number): Promise<number | undefined> {
        const tax = await this.getByRate(rate);
        if (tax) {
            const tax_rule = await TaxRuleService.getByIdTax(tax?.id)
            if (tax_rule) {
                return tax_rule.id_tax_rules_group;
            }
            return 0;
        }
        return 0;
    },

    async mamoronaTaxeSyNyZanany(name: string, rate: number, id_country: number): Promise<TaxRuleGroup | null> {
        let tax = await this.getByRate(rate);
        if (!tax) {
            const dataTax = {
                name: name,
                rate: rate,
                active: 1
            }
            tax = await this.create(dataTax) || undefined;
        }

        if (!tax) {
            throw new Error("Erreur lors de creation de tax");
        }

        const taxRuleGroup = await TaxRuleGroupService.create(name);
        if (!taxRuleGroup) {
            throw new Error("Erreur lors de creation de tax_rule_groupe");
        }
        if (tax && taxRuleGroup) {
            const taxRule = await TaxRuleService.create(taxRuleGroup.id, tax.id, id_country);
            if (!taxRule) {
                throw new Error("Erreur lors de creation de tax_rule");
            }
        }
        return taxRuleGroup;
    },

    async create(data: { name: string, rate: number, active?: number }): Promise<Tax | null> {
        const active = data.active ?? 1;
        const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
            <tax>
                <rate><![CDATA[${data.rate}]]></rate>
                <active><![CDATA[${active}]]></active>
                <name>
                    <language id="1"><![CDATA[${data.name}]]></language>
                </name>
            </tax>
        </prestashop>`.trim();
        const xml = await TaxApi.create(xmlBody)
        return parseTaxXml(xml)
    },

    async delete(id: string): Promise<void> {
        await TaxApi.delete(id)
    }
}
