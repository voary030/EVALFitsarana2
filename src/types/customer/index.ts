import type { CdataValue, AssociationItem } from '../category'

export interface CustomerNode {
    id?: CdataValue | string
    id_default_group?: CdataValue | string
    id_lang?: CdataValue | string
    newsletter_date_add?: CdataValue | string
    ip_registration_newsletter?: CdataValue | string
    last_passwd_gen?: CdataValue | string
    secure_key?: CdataValue | string
    deleted?: CdataValue | string
    passwd?: CdataValue | string
    lastname?: CdataValue | string
    firstname?: CdataValue | string
    email?: CdataValue | string
    id_gender?: CdataValue | string
    birthday?: CdataValue | string
    newsletter?: CdataValue | string
    optin?: CdataValue | string
    website?: CdataValue | string
    company?: CdataValue | string
    siret?: CdataValue | string
    ape?: CdataValue | string
    outstanding_allow_amount?: CdataValue | string
    show_public_prices?: CdataValue | string
    id_risk?: CdataValue | string
    max_payment_days?: CdataValue | string
    active?: CdataValue | string
    note?: CdataValue | string
    is_guest?: CdataValue | string
    id_shop?: CdataValue | string
    id_shop_group?: CdataValue | string
    date_add?: CdataValue | string
    date_upd?: CdataValue | string
    reset_password_token?: CdataValue | string
    reset_password_validity?: CdataValue | string
    associations?: {
        groups?: {
            group?: AssociationItem | AssociationItem[]
        }
    }
}

export interface Customer {
    id: number
    id_default_group: number
    id_lang: number
    newsletter_date_add: string
    ip_registration_newsletter: string
    last_passwd_gen: string
    secure_key: string
    deleted: number
    passwd?: string
    lastname: string
    firstname: string
    email: string
    id_gender: number
    birthday: string
    newsletter: number
    optin: number
    website: string
    company: string
    siret: string
    ape: string
    outstanding_allow_amount: number
    show_public_prices: number
    id_risk: number
    max_payment_days: number
    active: number
    note: string
    is_guest: number
    id_shop: number
    id_shop_group: number
    date_add: string
    date_upd: string
    reset_password_token: string
    reset_password_validity: string
    group_ids: number[]
}
