export interface ProductOptionNode {
    id?: any
    is_color_group?: any
    group_type?: any
    position?: any
    name?: any
    public_name?: any
    associations?: {
        product_option_values?: {
            product_option_value?: any | any[]
        }
    }
}

export interface ProductOption {
    id: number
    is_color_group: number
    group_type: string
    position: number
    name: string
    public_name: string
    product_option_value_ids: number[]
}
