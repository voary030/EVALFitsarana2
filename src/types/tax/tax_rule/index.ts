export interface CdataValue {
    __cdata?: string
    [key: string]: any
}

export interface TaxRuleNode {
    id?: CdataValue | string
    id_tax_rules_group?: CdataValue | string
    id_state?: CdataValue | string
    id_country?: CdataValue | string
    zipcode_from?: CdataValue | string
    zipcode_to?: CdataValue | string
    id_tax?: CdataValue | string
    behavior?: CdataValue | string
    description?: CdataValue | string
}

export interface TaxRule {
    id: number
    id_tax_rules_group: number
    id_state: number
    id_country: number
    zipcode_from: string
    zipcode_to: string
    id_tax: number
    behavior: number
    description: string
}
