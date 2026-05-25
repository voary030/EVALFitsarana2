export interface StockAvailable {
    id: number
    id_product: number
    id_product_attribute: number
    id_shop: number
    id_shop_group: number
    quantity: number
    depends_on_stock: number
    out_of_stock: number
    location: string
}
