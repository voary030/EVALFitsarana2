<script setup lang="ts">
import FrontNavbar from './fragments/FrontNavbar.vue'
</script>

<template>
    <div class="min-vh-100 d-flex flex-column bg-body">
        <FrontNavbar />

        <main class="flex-grow-1">
            <div class="container-fluid px-md-5 py-4">
                <div class="content-wrapper p-4 bg-body rounded-4 shadow-sm border mt-3">
                    <slot></slot>
                </div>
            </div>
        </main>

        <footer class="bg-body-tertiary text-center py-3 border-top">
            <div class="container text-muted small">
                &copy; {{ new Date().getFullYear() }}
            </div>
        </footer>
    </div>

</template>

<style scoped>
.content-wrapper {
    min-height: calc(100vh - 250px);
    transition: all 0.3s ease;
    width: 100%;
}

/* Effet de profondeur léger pour le mode sombre */
/* [data-bs-theme="dark"] .content-wrapper {
    background-color: #1e1e1e !important;
    border-color: rgba(255, 255, 255, 0.05) !important;
} */
</style>