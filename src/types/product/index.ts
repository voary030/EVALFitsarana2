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

export interface ProductFeatureAssociation {
    id?: CdataValue | string
    id_feature_value?: CdataValue | string
}

export interface StockAvailableAssociation {
    id?: CdataValue | string
    id_product_attribute?: CdataValue | string
}

export interface ProductBundleAssociation {
    id?: CdataValue | string
    id_product_attribute?: CdataValue | string
    quantity?: CdataValue | string
}

export interface ProductNode {
    id?: CdataValue | string
    id_manufacturer?: CdataValue | string
    id_supplier?: CdataValue | string
    id_category_default?: CdataValue | string
    new?: CdataValue | string
    cache_default_attribute?: CdataValue | string
    id_default_image?: CdataValue | string
    id_default_combination?: CdataValue | string
    id_tax_rules_group?: CdataValue | string
    position_in_category?: CdataValue | string
    type?: CdataValue | string
    id_shop_default?: CdataValue | string
    reference?: CdataValue | string
    supplier_reference?: CdataValue | string
    location?: CdataValue | string
    width?: CdataValue | string
    height?: CdataValue | string
    depth?: CdataValue | string
    weight?: CdataValue | string
    quantity_discount?: CdataValue | string
    ean13?: CdataValue | string
    isbn?: CdataValue | string
    upc?: CdataValue | string
    mpn?: CdataValue | string
    cache_is_pack?: CdataValue | string
    cache_has_attachments?: CdataValue | string
    is_virtual?: CdataValue | string
    state?: CdataValue | string
    additional_delivery_times?: CdataValue | string
    delivery_in_stock?: LangValue | string
    delivery_out_stock?: LangValue | string
    product_type?: CdataValue | string
    on_sale?: CdataValue | string
    online_only?: CdataValue | string
    ecotax?: CdataValue | string
    minimal_quantity?: CdataValue | string
    low_stock_threshold?: CdataValue | string
    low_stock_alert?: CdataValue | string
    price?: CdataValue | string
    wholesale_price?: CdataValue | string
    unity?: CdataValue | string
    unit_price_ratio?: CdataValue | string
    additional_shipping_cost?: CdataValue | string
    customizable?: CdataValue | string
    text_fields?: CdataValue | string
    uploadable_files?: CdataValue | string
    active?: CdataValue | string
    redirect_type?: CdataValue | string
    id_type_redirected?: CdataValue | string
    available_for_order?: CdataValue | string
    available_date?: CdataValue | string
    show_condition?: CdataValue | string
    condition?: CdataValue | string
    show_price?: CdataValue | string
    indexed?: CdataValue | string
    visibility?: CdataValue | string
    advanced_stock_management?: CdataValue | string
    date_add?: CdataValue | string
    date_upd?: CdataValue | string
    pack_stock_type?: CdataValue | string
    meta_description?: LangValue | string
    meta_keywords?: LangValue | string
    meta_title?: LangValue | string
    link_rewrite?: LangValue | string
    name?: LangValue | string
    description?: LangValue | string
    description_short?: LangValue | string
    available_now?: LangValue | string
    available_later?: LangValue | string
    associations?: {
        categories?: {
            category?: AssociationItem | AssociationItem[]
        }
        images?: {
            image?: AssociationItem | AssociationItem[]
        }
        combinations?: {
            combination?: AssociationItem | AssociationItem[]
        }
        product_option_values?: {
            product_option_value?: AssociationItem | AssociationItem[]
        }
        product_features?: {
            product_feature?: ProductFeatureAssociation | ProductFeatureAssociation[]
        }
        tags?: {
            tag?: AssociationItem | AssociationItem[]
        }
        stock_availables?: {
            stock_available?: StockAvailableAssociation | StockAvailableAssociation[]
        }
        attachments?: {
            attachment?: AssociationItem | AssociationItem[]
        }
        accessories?: {
            product?: AssociationItem | AssociationItem[]
        }
        product_bundle?: {
            product?: ProductBundleAssociation | ProductBundleAssociation[]
        }
    }
}

export interface ProductFeatureItem {
    id: number
    id_feature_value: number
}

export interface StockAvailableItem {
    id: number
    id_product_attribute: number
}

export interface ProductBundleItem {
    id: number
    id_product_attribute: number
    quantity: number
}

export interface Product {
    id: number
    id_manufacturer: number
    id_supplier: number
    id_category_default: number
    is_new: number
    cache_default_attribute: number
    id_default_image: number
    id_default_combination: number
    id_tax_rules_group: number
    position_in_category: number
    type: string
    id_shop_default: number
    reference: string
    supplier_reference: string
    location: string
    width: number
    height: number
    depth: number
    weight: number
    quantity_discount: number
    ean13: string
    isbn: string
    upc: string
    mpn: string
    cache_is_pack: number
    cache_has_attachments: number
    is_virtual: number
    state: number
    additional_delivery_times: number
    delivery_in_stock: string
    delivery_out_stock: string
    product_type: string
    on_sale: number
    online_only: number
    ecotax: number
    minimal_quantity: number
    low_stock_threshold: number
    low_stock_alert: number
    price: number
    wholesale_price: number
    unity: string
    unit_price_ratio: number
    additional_shipping_cost: number
    customizable: number
    text_fields: number
    uploadable_files: number
    active: number
    redirect_type: string
    id_type_redirected: number
    available_for_order: number
    available_date: string
    show_condition: number
    condition: string
    show_price: number
    indexed: number
    visibility: string
    advanced_stock_management: number
    date_add: string
    date_upd: string
    pack_stock_type: number
    meta_description: string
    meta_keywords: string
    meta_title: string
    link_rewrite: string
    name: string
    description: string
    description_short: string
    available_now: string
    available_later: string
    category_ids: number[]
    image_ids: number[]
    combination_ids: number[]
    product_option_value_ids: number[]
    product_features: ProductFeatureItem[]
    tag_ids: number[]
    stock_available_items: StockAvailableItem[]
    attachment_ids: number[]
    accessory_ids: number[]
    product_bundle_items: ProductBundleItem[]
    images?: string[]
    prix_ttc?: number
}
