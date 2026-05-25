<template>
    <section class="min-vh-100 d-flex align-items-center justify-content-center px-3">
        <div class="text-center" style="max-width: 480px;">
            <p class="display-1 fw-bold mb-0">403</p>
            <h1 class="mb-3">Accès interdit</h1>
            <p class="text-muted mb-4">
                Vous n'avez pas la permission d'accéder à cette page.
            </p>
            <RouterLink class="btn btn-primary rounded-pill px-4" to="/boutique">Retour à l'accueil</RouterLink>
        </div>
    </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
