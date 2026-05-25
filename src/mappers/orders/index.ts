import type { Order, OrderRow } from '@/types/orders'

const parseOrderRowXml = (rowElement: Element): OrderRow => {
    return {
        id: parseInt(rowElement.querySelector('id')?.textContent || '0'),
        product_id: parseInt(rowElement.querySelector('product_id')?.textContent || '0'),
        product_attribute_id: parseInt(rowElement.querySelector('product_attribute_id')?.textContent || '0'),
        product_quantity: parseInt(rowElement.querySelector('product_quantity')?.textContent || '0'),
        product_name: rowElement.querySelector('product_name')?.textContent || '',
        product_reference: rowElement.querySelector('product_reference')?.textContent || '',
        product_ean13: rowElement.querySelector('product_ean13')?.textContent || '',
        product_isbn: rowElement.querySelector('product_isbn')?.textContent || '',
        product_upc: rowElement.querySelector('product_upc')?.textContent || '',
        product_price: parseFloat(rowElement.querySelector('product_price')?.textContent || '0'),
        id_customization: parseInt(rowElement.querySelector('id_customization')?.textContent || '0'),
        unit_price_tax_incl: parseFloat(rowElement.querySelector('unit_price_tax_incl')?.textContent || '0'),
        unit_price_tax_excl: parseFloat(rowElement.querySelector('unit_price_tax_excl')?.textContent || '0'),
    }
}

const parseOrderElement = (orderElement: Element): Order => {
    const orderRows: OrderRow[] = []
    const orderRowElements = orderElement.querySelectorAll('associations order_rows order_row')
    orderRowElements.forEach((rowElement) => {
        orderRows.push(parseOrderRowXml(rowElement))
    })

    return {
        id: parseInt(orderElement.querySelector('id')?.textContent || '0'),
        id_address_delivery: parseInt(orderElement.querySelector('id_address_delivery')?.textContent || '0'),
        id_address_invoice: parseInt(orderElement.querySelector('id_address_invoice')?.textContent || '0'),
        id_cart: parseInt(orderElement.querySelector('id_cart')?.textContent || '0'),
        id_currency: parseInt(orderElement.querySelector('id_currency')?.textContent || '0'),
        id_lang: parseInt(orderElement.querySelector('id_lang')?.textContent || '0'),
        id_customer: parseInt(orderElement.querySelector('id_customer')?.textContent || '0'),
        id_carrier: parseInt(orderElement.querySelector('id_carrier')?.textContent || '0'),
        current_state: parseInt(orderElement.querySelector('current_state')?.textContent || '0'),
        module: orderElement.querySelector('module')?.textContent || '',
        invoice_number: parseInt(orderElement.querySelector('invoice_number')?.textContent || '0'),
        invoice_date: orderElement.querySelector('invoice_date')?.textContent || '',
        delivery_number: parseInt(orderElement.querySelector('delivery_number')?.textContent || '0'),
        delivery_date: orderElement.querySelector('delivery_date')?.textContent || '',
        valid: parseInt(orderElement.querySelector('valid')?.textContent || '0'),
        date_add: orderElement.querySelector('date_add')?.textContent || '',
        date_upd: orderElement.querySelector('date_upd')?.textContent || '',
        shipping_number: orderElement.querySelector('shipping_number')?.textContent || '',
        note: orderElement.querySelector('note')?.textContent || '',
        id_shop_group: parseInt(orderElement.querySelector('id_shop_group')?.textContent || '0'),
        id_shop: parseInt(orderElement.querySelector('id_shop')?.textContent || '0'),
        secure_key: orderElement.querySelector('secure_key')?.textContent || '',
        payment: orderElement.querySelector('payment')?.textContent || '',
        recyclable: parseInt(orderElement.querySelector('recyclable')?.textContent || '0'),
        gift: parseInt(orderElement.querySelector('gift')?.textContent || '0'),
        gift_message: orderElement.querySelector('gift_message')?.textContent || '',
        mobile_theme: parseInt(orderElement.querySelector('mobile_theme')?.textContent || '0'),
        total_discounts: parseFloat(orderElement.querySelector('total_discounts')?.textContent || '0'),
        total_discounts_tax_incl: parseFloat(orderElement.querySelector('total_discounts_tax_incl')?.textContent || '0'),
        total_discounts_tax_excl: parseFloat(orderElement.querySelector('total_discounts_tax_excl')?.textContent || '0'),
        total_paid: parseFloat(orderElement.querySelector('total_paid')?.textContent || '0'),
        total_paid_tax_incl: parseFloat(orderElement.querySelector('total_paid_tax_incl')?.textContent || '0'),
        total_paid_tax_excl: parseFloat(orderElement.querySelector('total_paid_tax_excl')?.textContent || '0'),
        total_paid_real: parseFloat(orderElement.querySelector('total_paid_real')?.textContent || '0'),
        total_products: parseFloat(orderElement.querySelector('total_products')?.textContent || '0'),
        total_products_wt: parseFloat(orderElement.querySelector('total_products_wt')?.textContent || '0'),
        total_shipping: parseFloat(orderElement.querySelector('total_shipping')?.textContent || '0'),
        total_shipping_tax_incl: parseFloat(orderElement.querySelector('total_shipping_tax_incl')?.textContent || '0'),
        total_shipping_tax_excl: parseFloat(orderElement.querySelector('total_shipping_tax_excl')?.textContent || '0'),
        carrier_tax_rate: parseFloat(orderElement.querySelector('carrier_tax_rate')?.textContent || '0'),
        total_wrapping: parseFloat(orderElement.querySelector('total_wrapping')?.textContent || '0'),
        total_wrapping_tax_incl: parseFloat(orderElement.querySelector('total_wrapping_tax_incl')?.textContent || '0'),
        total_wrapping_tax_excl: parseFloat(orderElement.querySelector('total_wrapping_tax_excl')?.textContent || '0'),
        round_mode: parseInt(orderElement.querySelector('round_mode')?.textContent || '0'),
        round_type: parseInt(orderElement.querySelector('round_type')?.textContent || '0'),
        conversion_rate: parseFloat(orderElement.querySelector('conversion_rate')?.textContent || '1'),
        reference: orderElement.querySelector('reference')?.textContent || '',
        order_rows: orderRows,
    }
}

export const parseOrderXml = (xml: string): Order | undefined => {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')
        const orderElement = doc.querySelector('order')
        if (!orderElement) return undefined
        return parseOrderElement(orderElement)
    } catch (error) {
        console.error('Erreur lors du parsing du XML Order:', error)
        return undefined
    }
}

export const parseOrderListXml = (xml: string): Order[] => {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')
        const orders: Order[] = []
        const orderElements = doc.querySelectorAll('order')
        orderElements.forEach((orderElement) => {
            orders.push(parseOrderElement(orderElement))
        })
        return orders
    } catch (error) {
        console.error('Erreur lors du parsing de la liste des Orders:', error)
        return []
    }
}
