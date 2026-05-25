export interface CdataValue {
    __cdata?: string
    [key: string]: any
}

export interface TaxRuleGroupNode {
    id?: CdataValue | string
    name?: CdataValue | string
    active?: CdataValue | string
    deleted?: CdataValue | string
    date_add?: CdataValue | string
    date_upd?: CdataValue | string
}

export interface TaxRuleGroup {
    id: number
    name: string
    active: number
    deleted: number
    date_add: string
    date_upd: string
}
