export interface CartRowNode {
    id_product?: any
    id_product_attribute?: any
    id_address_delivery?: any
    id_customization?: any
    quantity?: any
}

export interface CartNode {
    id?: any
    id_address_delivery?: any
    id_address_invoice?: any
    id_currency?: any
    id_customer?: any
    id_guest?: any
    id_lang?: any
    id_shop_group?: any
    id_shop?: any
    id_carrier?: any
    recyclable?: any
    gift?: any
    gift_message?: any
    mobile_theme?: any
    delivery_option?: any
    secure_key?: any
    allow_seperated_package?: any
    date_add?: any
    date_upd?: any
    associations?: {
        cart_rows?: {
            cart_row?: CartRowNode | CartRowNode[]
        }
    }
}

export interface CartRow {
    id_product: number
    id_product_attribute: number
    id_address_delivery: number
    id_customization: number
    quantity: number
}

export interface Cart {
    id: number
    id_address_delivery: number
    id_address_invoice: number
    id_currency: number
    id_customer: number
    id_guest: number
    id_lang: number
    id_shop_group: number
    id_shop: number
    id_carrier: number
    recyclable: boolean
    gift: boolean
    gift_message: string
    mobile_theme: boolean
    delivery_option: string
    secure_key: string
    allow_seperated_package: boolean
    date_add: string
    date_upd: string
    cart_rows: CartRow[]
}
