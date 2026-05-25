<template>
    <div class="col-md-3">
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title text-muted text-uppercase text-center fs-6">
                    {{ title }}
                </h5>
                <h2 class="text-center">
                    {{ displayValue }}
                </h2>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import { computed } from 'vue'

interface Props {
    title: string
    value: number | string
    color?: 'primary' | 'success' | 'danger' | 'warning' | 'info' // Couleur optionnelle
}

const props = withDefaults(defineProps<Props>(), {
    color: 'primary'
})

const displayValue = computed(() => {
    if (typeof props.value === 'number') {
        return props.value.toLocaleString()
    }
    return props.value
})

</script>