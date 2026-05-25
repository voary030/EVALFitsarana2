export interface CdataValue {
    __cdata?: string
    [key: string]: any
}

export interface LangValue {
    language?: CdataValue | CdataValue[]
}

export interface TaxNode {
    id?: CdataValue | string
    rate?: CdataValue | string
    active?: CdataValue | string
    deleted?: CdataValue | string
    name?: LangValue | string
}

export interface Tax {
    id: number
    rate: number
    active: number
    deleted: number
    name: string
}
