export interface CdataValue {
    __cdata?: string
    [key: string]: any
}

export interface EmployeeNode {
    id?: CdataValue | string
    id_lang?: CdataValue | string
    last_passwd_gen?: CdataValue | string
    stats_date_from?: CdataValue | string
    stats_date_to?: CdataValue | string
    stats_compare_from?: CdataValue | string
    stats_compare_to?: CdataValue | string
    passwd?: CdataValue | string
    lastname?: CdataValue | string
    firstname?: CdataValue | string
    email?: CdataValue | string
    active?: CdataValue | string
    id_profile?: CdataValue | string
    bo_color?: CdataValue | string
    default_tab?: CdataValue | string
    bo_theme?: CdataValue | string
    bo_css?: CdataValue | string
    bo_width?: CdataValue | string
    bo_menu?: CdataValue | string
    stats_compare_option?: CdataValue | string
    preselect_date_range?: CdataValue | string
    id_last_order?: CdataValue | string
    id_last_customer_message?: CdataValue | string
    id_last_customer?: CdataValue | string
    reset_password_token?: CdataValue | string
    reset_password_validity?: CdataValue | string
    has_enabled_gravatar?: CdataValue | string
}

export interface Employee {
    id: number
    id_lang: number
    last_passwd_gen: string
    stats_date_from: string
    stats_date_to: string
    passwd: string
    lastname: string
    firstname: string
    email: string
    active: number
    id_profile: number
    bo_color: string
    default_tab: number
    bo_theme: string
    bo_css: string
    bo_width: number
    bo_menu: number
    stats_compare_option: number
    preselect_date_range: string
    id_last_order: number
    id_last_customer_message: number
    id_last_customer: number
    reset_password_token: string
    reset_password_validity: string
    has_enabled_gravatar: number
}
