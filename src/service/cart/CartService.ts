import { CartApi } from '@/api/cart/CartApi'
import { parseCartListXml } from '@/mappers/cart'
import type { Cart, CartRow } from '@/types/cart'

const getCurrentPrestaDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export const CartService = {

    async getAll(): Promise<Cart[]> {
        try {
            const xmlData = await CartApi.getAll()
            if (!xmlData) return []
            return parseCartListXml(xmlData)
        } catch (err: any) {
            throw err
        }
    },

    async getById(id: number): Promise<Cart | undefined> {
        try {
            const xmlData = await CartApi.getById(id)
            if (!xmlData) return undefined
            const list = parseCartListXml(xmlData)
            return list[0]
        } catch (err: any) {
            throw err
        }
    },

    async getByCustomerId(customerId: number): Promise<Cart[]> {
        try {
            const allCarts = await this.getAll()
            return allCarts.filter(c => c.id_customer === customerId)
        } catch (err: any) {
            throw err
        }
    },

    async findLatestActiveCart(customerId: number): Promise<Cart | undefined> {
        try {
            // 1. Récupérer tous les paniers du client
            const customerCarts = await this.getByCustomerId(customerId)
            if (customerCarts.length === 0) return undefined

            // 2. Trier par ID décroissant pour avoir le plus récent
            const sortedCarts = customerCarts.sort((a, b) => b.id - a.id)

            // 3. Vérifier si le panier le plus récent est déjà une commande
            const { OrderService } = await import('@/service/orders/OrderService')
            const customerOrders = await OrderService.getByCustomerId(customerId)
            const orderedCartIds = customerOrders.map(o => o.id_cart)

            for (const cart of sortedCarts) {
                if (!orderedCartIds.includes(cart.id)) {
                    return cart
                }
            }

            return undefined
        } catch (err: any) {
            console.error('Erreur findLatestActiveCart:', err)
            return undefined
        }
    },

    async create(data: {
        id_customer: number
        id_currency: number
        id_lang: number
        id_address_delivery: number
        id_address_invoice: number
        id_carrier: number
        id_shop: number
        date_add?: string
    }): Promise<Cart | undefined> {
        try {
            const xmlBody = this.buildCreateXml(data)
            try {
                const resultXml = await CartApi.create(xmlBody)
                const carts = parseCartListXml(resultXml)
                return carts[0]
            } catch {
                throw new Error("Erreur lors de la creation du panier")
            }
        } catch (err: any) {
            throw err
        }
    },

    async addToCart(data: {
        id_customer: number
        id_currency?: number
        id_lang?: number
        id_address_delivery: number
        id_address_invoice?: number
        id_carrier?: number
        id_product: number
        id_product_attribute: number
        quantity: number
        cartId?: number
        id_shop_group?: number
        id_shop?: number
        date_add?: string
    }): Promise<Cart | undefined> {
        try {
            let cart: Cart | undefined

            if (data.cartId) {
                try {
                    cart = await this.getById(data.cartId)
                } catch {
                    cart = undefined
                }
            }

            if (!cart) {
                try {
                    cart = await this.create({
                        id_customer: data.id_customer,
                        id_currency: data.id_currency ?? 1,
                        id_lang: data.id_lang ?? 1,
                        id_address_delivery: data.id_address_delivery,
                        id_address_invoice: data.id_address_invoice ?? data.id_address_delivery,
                        id_carrier: data.id_carrier ?? 1,
                        id_shop: data.id_shop ?? 1,
                        date_add: data.date_add
                    })
                } catch {
                    throw new Error("Erreur lors de la creation du panier dans add To cart")
                }
            }

            if (!cart) {
                throw new Error("Impossible de créer le panier")
            }

            const existingRows = cart.cart_rows || []

            const existingRowIndex = existingRows.findIndex(
                r => r.id_product === data.id_product && r.id_product_attribute === data.id_product_attribute
            )

            let updatedRows: CartRow[]

            if (existingRowIndex >= 0) {
                updatedRows = existingRows.map((r, i) => {
                    if (i === existingRowIndex) {
                        return { ...r, quantity: r.quantity + data.quantity }
                    }
                    return r
                })
            } else {
                updatedRows = [...existingRows, {
                    id_product: data.id_product,
                    id_product_attribute: data.id_product_attribute,
                    id_address_delivery: data.id_address_delivery,
                    id_customization: 0,
                    quantity: data.quantity
                }]
            }
            const updateXml = this.buildUpdateXml(cart, updatedRows, data.date_add)
            const resultXml = await CartApi.update(cart.id, updateXml)
            const carts = parseCartListXml(resultXml)
            return carts[0]

        } catch (err: any) {
            throw err
        }
    },

    async removeFromCart(cartId: number, id_product: number, id_product_attribute: number): Promise<Cart | undefined> {
        try {
            const cart = await this.getById(cartId)
            if (!cart) throw new Error("Panier introuvable")

            const updatedRows = cart.cart_rows.filter(
                r => !(r.id_product === id_product && r.id_product_attribute === id_product_attribute)
            )

            if (updatedRows.length === 0) {
                // Panier vide → patcher avec cart_rows vide
                const patchXml = this.buildPatchEmptyXml(cart)
                await CartApi.patch(cart.id, patchXml)
                return { ...cart, cart_rows: [] }
            }

            const updateXml = this.buildUpdateXml(cart, updatedRows)
            const resultXml = await CartApi.update(cart.id, updateXml)
            const carts = parseCartListXml(resultXml)
            return carts[0]
        } catch (err: any) {
            throw err
        }
    },

    async updateQuantity(cartId: number, id_product: number, id_product_attribute: number, newQuantity: number): Promise<Cart | undefined> {
        try {
            const cart = await this.getById(cartId)
            if (!cart) throw new Error("Panier introuvable")

            const updatedRows = cart.cart_rows.map(r => {
                if (r.id_product === id_product && r.id_product_attribute === id_product_attribute) {
                    return { ...r, quantity: newQuantity }
                }
                return r
            }).filter(r => r.quantity > 0)

            if (updatedRows.length === 0) {
                // Panier vide → patcher avec cart_rows vide
                const patchXml = this.buildPatchEmptyXml(cart)
                await CartApi.patch(cart.id, patchXml)
                return { ...cart, cart_rows: [] }
            }

            const updateXml = this.buildUpdateXml(cart, updatedRows)
            const resultXml = await CartApi.update(cart.id, updateXml)
            const carts = parseCartListXml(resultXml)
            return carts[0]
        } catch (err: any) {
            throw err
        }
    },

    async updateCartCustomer(cartId: number, customerId: number, secureKey: string): Promise<Cart | undefined> {
        try {
            const cart = await this.getById(cartId)
            if (!cart) throw new Error("Panier introuvable")

            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
            <cart>
                <id>${cart.id}</id>
                <id_customer>${customerId}</id_customer>
                <id_currency>${cart.id_currency}</id_currency>
                <id_lang>${cart.id_lang}</id_lang>
                <id_address_delivery>${cart.id_address_delivery}</id_address_delivery>
                <id_address_invoice>${cart.id_address_invoice}</id_address_invoice>
                <id_carrier>${cart.id_carrier}</id_carrier>
                <id_shop>${cart.id_shop}</id_shop>
                <secure_key>${secureKey}</secure_key>
                <associations>
                    <cart_rows>
                        ${(cart.cart_rows || []).map(r => `
                        <cart_row>
                            <id_product>${r.id_product}</id_product>
                            <id_product_attribute>${r.id_product_attribute}</id_product_attribute>
                            <id_address_delivery>${r.id_address_delivery}</id_address_delivery>
                            <id_customization>${r.id_customization || 0}</id_customization>
                            <quantity>${r.quantity}</quantity>
                        </cart_row>`).join('')}
                    </cart_rows>
                </associations>
            </cart>
            </prestashop>`.trim()

            const resultXml = await CartApi.update(cart.id, xmlBody)
            const carts = parseCartListXml(resultXml)
            return carts[0]
        } catch (err: any) {
            console.error('Erreur updateCartCustomer:', err)
            throw err
        }
    },

    async count(): Promise<number> {
        try {
            return (await this.getAll()).length
        } catch (err: any) {
            throw err
        }
    },

    async patchDate(cartId: number, dateStr: string): Promise<void> {
        try {
            const parts = dateStr.split('/')
            if (parts.length !== 3) return
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00`
            const patchXml = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <cart>
                    <id>${cartId}</id>
                    <date_add><![CDATA[${formattedDate}]]></date_add>
                    <date_upd><![CDATA[${formattedDate}]]></date_upd>
                </cart>
            </prestashop>`.trim()

            await CartApi.patch(cartId, patchXml)
        } catch (error) {
            console.error(`Erreur lors du patch de la date du panier ${cartId}:`, error)
        }
    },

    buildCreateXml(data: {
        id_customer: number
        id_currency: number
        id_lang: number
        id_address_delivery: number
        id_address_invoice: number
        id_carrier: number
        id_shop: number
        date_add?: string
    }): string {
        let now = getCurrentPrestaDate()
        if (data.date_add) {
            const parts = data.date_add.split('/')
            if (parts.length === 3) {
                now = `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00`
            }
        }
        // console.log(now)
        return `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        <cart>
            <id_customer>${data.id_customer}</id_customer>
            <id_currency>${data.id_currency}</id_currency>
            <id_lang>${data.id_lang}</id_lang>
            <id_address_delivery>${data.id_address_delivery}</id_address_delivery>
            <id_address_invoice>${data.id_address_invoice}</id_address_invoice>
            <id_carrier>${data.id_carrier}</id_carrier>
            <id_shop>${data.id_shop}</id_shop>
            <recyclable>0</recyclable>
            <gift>0</gift>
            <gift_message></gift_message>
            <secure_key></secure_key>
            <date_add><![CDATA[${now}]]></date_add>
            <date_upd><![CDATA[${now}]]></date_upd>
            <associations>
            </associations>
        </cart>
        </prestashop>`.trim()
    },

    buildUpdateXml(cart: Cart, cartRows: CartRow[], date_add?: string): string {
        const rowsXml = cartRows.map(r => `
        <cart_row>
          <id_product>${r.id_product}</id_product>
          <id_product_attribute>${r.id_product_attribute}</id_product_attribute>
          <id_address_delivery>${r.id_address_delivery}</id_address_delivery>
          <id_customization>${r.id_customization || 0}</id_customization>
          
          <quantity>${r.quantity}</quantity>
        </cart_row>`).join('')

        const associationsXml = cartRows.length > 0
            ? `<associations>
            <cart_rows>${rowsXml}</cart_rows>
            </associations>`
            : `<associations>
            <cart_rows/>
            </associations>`

        let dateStr = ''
        if (date_add) {
            const parts = date_add.split('/')
            if (parts.length === 3) {
                const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00`
                dateStr = `<date_add><![CDATA[${formattedDate}]]></date_add><date_upd><![CDATA[${formattedDate}]]></date_upd>`
            }
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        <cart>
            <id>${cart.id}</id>
            <id_customer>${cart.id_customer}</id_customer>
            <id_currency>${cart.id_currency}</id_currency>
            <id_lang>${cart.id_lang}</id_lang>
            <id_address_delivery>${cart.id_address_delivery}</id_address_delivery>
            <id_address_invoice>${cart.id_address_invoice}</id_address_invoice>
            <id_carrier>${cart.id_carrier}</id_carrier>
            <id_shop>${cart.id_shop}</id_shop>
            <secure_key>${cart.secure_key || ''}</secure_key>
            ${dateStr}
            ${associationsXml}
        </cart>
        </prestashop>`.trim()
    },

    buildPatchEmptyXml(cart: Cart): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        <cart>
            <id>${cart.id}</id>
            <id_customer>${cart.id_customer}</id_customer>
            <id_currency>${cart.id_currency}</id_currency>
            <id_lang>${cart.id_lang}</id_lang>
            <id_address_delivery>${cart.id_address_delivery}</id_address_delivery>
            <id_address_invoice>${cart.id_address_invoice}</id_address_invoice>
            <id_carrier>${cart.id_carrier}</id_carrier>
            <id_shop>${cart.id_shop}</id_shop>
            <associations>
            <cart_rows>
            <cart_row>
                <id_product></id_product>
                <id_product_attribute></id_product_attribute>
                <id_address_delivery></id_address_delivery>
                <quantity></quantity>
            </cart_row>
            </cart_rows>
            </associations>
        </cart>
        </prestashop>`.trim()
    }
}
