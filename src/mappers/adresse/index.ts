import type { Address } from '@/types/adresse'

export const parseAddressListXml = (xml: string): Address[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items: Address[] = []
    doc.querySelectorAll('address').forEach(el => {
        items.push({
            id: parseInt(el.querySelector('id')?.textContent || '0'),
            id_customer: parseInt(el.querySelector('id_customer')?.textContent || '0'),
            id_manufacturer: parseInt(el.querySelector('id_manufacturer')?.textContent || '0'),
            id_supplier: parseInt(el.querySelector('id_supplier')?.textContent || '0'),
            id_warehouse: parseInt(el.querySelector('id_warehouse')?.textContent || '0'),
            id_country: parseInt(el.querySelector('id_country')?.textContent || '0'),
            id_state: parseInt(el.querySelector('id_state')?.textContent || '0'),
            alias: el.querySelector('alias')?.textContent || '',
            company: el.querySelector('company')?.textContent || '',
            lastname: el.querySelector('lastname')?.textContent || '',
            firstname: el.querySelector('firstname')?.textContent || '',
            vat_number: el.querySelector('vat_number')?.textContent || '',
            address1: el.querySelector('address1')?.textContent || '',
            address2: el.querySelector('address2')?.textContent || '',
            postcode: el.querySelector('postcode')?.textContent || '',
            city: el.querySelector('city')?.textContent || '',
            other: el.querySelector('other')?.textContent || '',
            phone: el.querySelector('phone')?.textContent || '',
            phone_mobile: el.querySelector('phone_mobile')?.textContent || '',
            dni: el.querySelector('dni')?.textContent || '',
            deleted: parseInt(el.querySelector('deleted')?.textContent || '0'),
            date_add: el.querySelector('date_add')?.textContent || '',
            date_upd: el.querySelector('date_upd')?.textContent || '',
        })
    })
    return items
}

export const parseAddressXml = (xml: string): Address | undefined => {
    const items = parseAddressListXml(xml)
    return items[0]
}
