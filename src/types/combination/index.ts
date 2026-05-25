export interface CombinationNode {
    id?: any
    id_product?: any
    ean13?: any
    isbn?: any
    upc?: any
    mpn?: any
    reference?: any
    supplier_reference?: any
    wholesale_price?: any
    price?: any
    ecotax?: any
    weight?: any
    unit_price_impact?: any
    minimal_quantity?: any
    low_stock_threshold?: any
    low_stock_alert?: any
    default_on?: any
    available_date?: any
    available_now?: any
    available_later?: any
    associations?: {
        product_option_values?: {
            product_option_value?: any | any[]
        }
        images?: {
            image?: any | any[]
        }
    }
}

export interface Combination {
    id: number
    id_product: number
    ean13: string
    isbn: string
    upc: string
    mpn: string
    reference: string
    supplier_reference: string
    wholesale_price: number
    price: number
    ecotax: number
    weight: number
    unit_price_impact: number
    minimal_quantity: number
    low_stock_threshold: number
    low_stock_alert: boolean
    default_on: boolean
    available_date: string
    available_now: string
    available_later: string
    product_option_value_ids: number[]
    image_ids: number[]
}