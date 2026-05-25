export interface CdataValue {
    __cdata?: string
    [key: string]: any
}

export interface LangValue {
    language?: CdataValue | CdataValue[]
}

export interface AssociationItem {
    id?: CdataValue | string
    [key: string]: any
}

export interface CategoryNode {
    id?: CdataValue | string
    id_parent?: CdataValue | string
    level_depth?: CdataValue | string
    nb_products_recursive?: CdataValue | string
    active?: CdataValue | string
    id_shop_default?: CdataValue | string
    is_root_category?: CdataValue | string
    position?: CdataValue | string
    date_add?: CdataValue | string
    date_upd?: CdataValue | string
    name?: LangValue | string
    link_rewrite?: LangValue | string
    description?: LangValue | string
    additional_description?: LangValue | string
    meta_title?: LangValue | string
    meta_description?: LangValue | string
    meta_keywords?: LangValue | string
    associations?: {
        categories?: {
            category?: AssociationItem | AssociationItem[]
        }
        products?: {
            product?: AssociationItem | AssociationItem[]
        }
    }
}

export interface Category {
    id: number
    id_parent: number
    level_depth: number
    nb_products_recursive: number
    active: number
    id_shop_default: number
    is_root_category: number
    position: number
    date_add: string
    date_upd: string
    name: string
    link_rewrite: string
    description: string
    additional_description: string
    meta_title: string
    meta_description: string
    meta_keywords: string
    children_ids: number[]
    product_ids: number[]
}


