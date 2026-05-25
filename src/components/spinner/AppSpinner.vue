<script setup lang="ts">
const props = defineProps({
    size: {
        type: String,
        default: 'md'
    },
    color: {
        type: String,
        default: 'primary'
    },
    text: {
        type: String,
        default: ''
    }
})
</script>

<template>
    <div class="d-flex flex-column align-items-center justify-content-center">
        <div class="spinner-border text-primary" :class="[
            `text-${color}`,
            size === 'sm' ? 'spinner-border-sm' : '',
            size === 'lg' ? 'spinner-lg' : ''
        ]" role="status">
            <span class="visually-hidden">Chargement...</span>
        </div>
        <span v-if="text" class="mt-2 small fw-medium" :class="`text-${color}`">{{ text }}</span>
    </div>
</template>

<style scoped>
.spinner-lg {
    width: 3rem;
    height: 3rem;
}
</style>
