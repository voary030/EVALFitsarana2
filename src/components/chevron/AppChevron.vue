<script setup lang="ts">
defineProps<{
    isOpen: boolean
}>()
</script>

<template>
    <span class="chevron ms-1" :class="{ 'open': isOpen }">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6" />
        </svg>
    </span>
</template>

<style scoped>
.chevron {
    display: inline-flex;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: inherit;
    opacity: 0.7;
}

.chevron.open {
    transform: rotate(-180deg);
    opacity: 1;
}

svg {
    display: block;
}
</style>
