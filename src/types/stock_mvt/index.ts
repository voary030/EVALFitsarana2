export interface StockMvt {
    id: number
    id_product: number
    id_product_attribute: number
    id_warehouse: number
    id_currency: number
    management_type: string
    id_employee: number
    id_stock: number
    id_stock_mvt_reason: number
    id_order: number
    id_supply_order: number
    product_name: string
    ean13: string
    upc: string
    reference: string
    mpn: string
    physical_quantity: number
    sign: number
    last_wa: number
    current_wa: number
    price_te: number
    date_add: string
}
