<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ProductApi } from '@/api/product/ProductApi'
import { parseProductListXml } from '@/mappers/product'

const xmlData = ref('')
const jsonData = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const fetchProducts = async () => {
    loading.value = true
    error.value = null
    try {
        xmlData.value = await ProductApi.getAll()
        const mapped = parseProductListXml(xmlData.value)
        jsonData.value = JSON.stringify(mapped, null, 2)
    } catch (err: any) {
        error.value = err?.message || 'Erreur lors du chargement.'
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchProducts()
})
</script>

<template>
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h1 class="h4 mb-0">Liste des produits (XML)</h1>
            <button class="btn btn-outline-primary btn-sm" :disabled="loading" @click="fetchProducts">
                Actualiser
            </button>
        </div>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <div v-if="loading" class="text-center py-4">
            <div class="spinner-border" role="status"></div>
        </div>

        <div v-else class="row g-3">
            <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white fw-semibold">XML</div>
                    <div class="card-body">
                        <pre class="mb-0"
                            style="white-space: pre-wrap; max-height: 500px; overflow: auto;">{{ xmlData }}</pre>
                    </div>
                </div>
            </div>
            <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white fw-semibold">JSON</div>
                    <div class="card-body">
                        <pre class="mb-0"
                            style="white-space: pre-wrap; max-height: 500px; overflow: auto;">{{ jsonData }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
