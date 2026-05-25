<script setup lang="ts">
import { ref } from 'vue'
import { ResetService } from '@/service/reset/ResetService'

const isResetting = ref(false)
const resetDone = ref(false)
const resetSuccess = ref(false)
const resetLogs = ref<Array<{ resource: string; deleted: number }>>([])

const confirmReset = async () => {
    const isConfirmed = confirm(
        "⚠️ Êtes-vous sûr de vouloir réinitialiser TOUTES les données ?\n\n" +
        "Cette action est IRRÉVERSIBLE. Tous les produits, commandes, clients, paniers, " +
        "catégories, taxes seront définitivement supprimés (sauf catégories racine)."
    )
    if (!isConfirmed) return

    isResetting.value = true
    resetDone.value = false

    try {
        const result = await ResetService.resetAll()
        resetSuccess.value = result.success
        resetLogs.value = result.logs
    } catch (err: any) {
        resetSuccess.value = false
        resetLogs.value = []
    } finally {
        resetDone.value = true
        isResetting.value = false
    }
}
</script>

<template>
    <div>
        <div class="d-flex justify-content-center align-items-center mb-4">
            <h2 class="h3 mb-0 text-body">Réinitialisation</h2>
        </div>

        <div class="row justify-content-center">
            <div class="col-lg-8 col-xl-6">
                <div class="card border border-danger shadow-sm bg-body-tertiary">
                    <div class="card-body p-4 p-md-5 text-center">
                        <div class="mb-4">
                            <div class="rounded-circle bg-danger bg-opacity-10 d-inline-flex p-3">
                                <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                            </div>
                        </div>

                        <h3 class="text-danger fw-bold mb-3">Zone de danger</h3>

                        <p class="text-muted mb-4 px-md-4">
                            Cette action va réinitialiser l'ensemble des données de votre projet PrestaShop.
                            Veuillez noter que cette opération est <strong class="text-body">définitive et
                                irréversible</strong>.
                        </p>

                        <hr class="my-4 opacity-25">

                        <button class="btn btn-danger d-inline-flex align-items-center gap-2 shadow-sm"
                            @click="confirmReset" :disabled="isResetting">
                            <span v-if="isResetting" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="bi bi-trash"></i>
                            {{ isResetting ? 'Réinitialisation en cours...' : 'Réinitialiser toutes les données' }}
                        </button>

                        <!-- Résultat -->
                        <div v-if="resetDone" class="mt-4 text-start">
                            <div class="alert" :class="resetSuccess ? 'alert-success' : 'alert-danger'">
                                <h6 class="fw-bold mb-2">
                                    <i class="bi" :class="resetSuccess ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
                                    {{ resetSuccess ? 'Réinitialisation terminée' : 'Erreur lors de la réinitialisation' }}
                                </h6>
                            </div>

                            <!-- Logs -->
                            <div v-if="resetLogs.length > 0" class="card border-secondary-subtle">
                                <div class="card-header bg-body-tertiary fw-bold small">
                                    <i class="bi bi-list-ul me-2"></i>Détail des suppressions
                                </div>
                                <div class="card-body p-0">
                                    <table class="table table-sm mb-0">
                                        <thead>
                                            <tr>
                                                <th>Ressource</th>
                                                <th class="text-end">Supprimés</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="log in resetLogs" :key="log.resource">
                                                <td><code>{{ log.resource }}</code></td>
                                                <td class="text-end fw-bold">{{ log.deleted }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
