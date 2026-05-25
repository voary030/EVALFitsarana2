import { TaxRuleGroupApi } from '@/api/tax/tax_rule_group/TaxRuleGroupApi'
import { parseTaxRuleGroupListXml, parseTaxRuleGroupXml } from '@/mappers/tax/tax_rule_group'
import type { TaxRuleGroup } from '@/types/tax/tax_rule_group'

const getCurrentPrestaDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export const TaxRuleGroupService = {

    async getAll(): Promise<TaxRuleGroup[]> {
        const xml = await TaxRuleGroupApi.getAll()
        return parseTaxRuleGroupListXml(xml)
    },

    async getById(id: string): Promise<TaxRuleGroup | null> {
        const xml = await TaxRuleGroupApi.getById(id)
        return parseTaxRuleGroupXml(xml)
    },

    async create(name: string): Promise<TaxRuleGroup | null> {
        const active = "1";
        const deleted = "0";
        const now = getCurrentPrestaDate();
        const xmlBody = this.buildXml(name, active, deleted, now, now);
        const xml = await TaxRuleGroupApi.create(xmlBody);
        return parseTaxRuleGroupXml(xml);
    },

    async update(id: string, xmlBody: string): Promise<TaxRuleGroup | null> {
        const xml = await TaxRuleGroupApi.update(id, xmlBody)
        return parseTaxRuleGroupXml(xml)
    },

    async delete(id: string): Promise<void> {
        await TaxRuleGroupApi.delete(id)
    },

    buildXml(name: string, active: string, deleted: string, date_add: string, date_upd: string): string {
        const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
                <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                    <tax_rule_group>
                        <name><![CDATA[${name}]]></name>
                        <active>${active}</active>
                        <deleted>${deleted}</deleted>
                        <date_add>${date_add}</date_add>
                        <date_upd>${date_upd}</date_upd>
                    </tax_rule_group>
                </prestashop>`.trim();
        return xmlBody;
    }
}
