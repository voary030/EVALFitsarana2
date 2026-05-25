import apiClient from '../client'

export const ImageApi = {

    getProductImageUrl(productId: string | number, imageId: string | number = '') {
        const path = imageId
            ? `/images/products/${productId}/${imageId}`
            : `/images/products/${productId}`
        return apiClient.getUri({ url: path })
    },

    /** Upload une image pour un produit. Retourne l'ID de l'image créée. */
    async uploadImage(productId: number, file: File): Promise<number | undefined> {
        try {
            const formData = new FormData()
            formData.append('image', file)

            const response = await apiClient.post(`/images/products/${productId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                params: {
                    ws_key: apiClient.defaults.params.ws_key,
                },
            })

            // La réponse XML contient <image><id>...</id></image>
            const xml = response.data as string
            const match = xml.match(/<id>(?:\<!\[CDATA\[)?(\d+)(?:\]\]>)?<\/id>/)
            if (match && match[1]) {
                return parseInt(match[1])
            }
            return undefined
        } catch (error) {
            console.error(`Erreur upload image pour produit ${productId}:`, error)
            throw error
        }
    },

    getAllProductImages(product: any): string[] {
        if (!product || !product.image_ids || !Array.isArray(product.image_ids)) {

            const rawImages = product?.associations?.images?.image

            if (!rawImages) return []

            const images = Array.isArray(rawImages) ? rawImages : [rawImages]
            return images
                .filter((img: any) => img && (img.id || typeof img === 'string' || typeof img === 'number'))
                .map((img: any) => {
                    const id = img.id || img
                    return this.getProductImageUrl(product.id, id)
                })
        }

        return product.image_ids.map((id: number | string) =>
            this.getProductImageUrl(product.id, id)
        )
    }
}
