<script setup lang="ts">
import { ref } from 'vue'
import { ImportService } from '@/service/import/ImportService'
import type { ImportRowResult, ImageImportResult } from '@/service/import/ImportService'
import { ResetService } from '@/service/reset/ResetService'

const file1 = ref<File | null>(null)
const file2 = ref<File | null>(null)
const file3 = ref<File | null>(null)
const zipFile = ref<File | null>(null)

const isImporting = ref(false)
const importResults1 = ref<ImportRowResult[]>([])
const importResults2 = ref<ImportRowResult[]>([])
const importResults3 = ref<ImportRowResult[]>([])
const imageResults = ref<ImageImportResult[]>([])
const importDone = ref(false)
const currentImport = ref<'f1' | 'f2' | 'f3' | 'images'>('f1')
const isRollingBack = ref(false)
const isRollbackDone = ref(false)
const showErrorModal = ref(false)
const importError = ref('')

const ilainaNySary = ref(false)

const handleFile1 = (e: Event) => {
    const target = e.target as HTMLInputElement
    file1.value = target.files?.[0] || null
}

const handleFile2 = (e: Event) => {
    const target = e.target as HTMLInputElement
    file2.value = target.files?.[0] || null
}

const handleFile3 = (e: Event) => {
    const target = e.target as HTMLInputElement
    file3.value = target.files?.[0] || null
}

const handleZip = (e: Event) => {
    const target = e.target as HTMLInputElement
    zipFile.value = target.files?.[0] || null
}

const handleSubmit = async () => {

    console.log(ilainaNySary.value)

    // if (!file1.value || !file2.value || !file3.value || !zipFile.value) {
    //     alert('Erreur : Veuillez sélectionner les 4 fichiers (Produits, Combinaisons, Paniers/Commandes et Archive ZIP) avant de lancer l\'importation.')
    //     return
    // }

    isImporting.value = true
    importResults1.value = []
    importResults2.value = []
    importResults3.value = []
    imageResults.value = []
    importDone.value = false

    try {
        // Fichier 1 : Produits
        if (file1.value) {
            currentImport.value = 'f1'
            const csv1 = await file1.value.text()
            const res = await ImportService.importFichier1(csv1)
            importResults1.value = res
            const err = res.find(r => !r.success)
            if (err) throw { file: 'Fichier 1', line: err.line, column: err.column, message: err.error }
        }

        // Fichier 2 : Combinaisons
        if (file2.value) {
            currentImport.value = 'f2'
            const csv2 = await file2.value.text()
            const res = await ImportService.importFichier2(csv2)
            importResults2.value = res
            const err = res.find(r => !r.success)
            if (err) throw { file: 'Fichier 2', line: err.line, column: err.column, message: err.error }
        }

        // Fichier 3 : Paniers + Commandes
        if (file3.value) {
            currentImport.value = 'f3'
            const csv3 = await file3.value.text()
            const res = await ImportService.importFichier3(csv3)
            importResults3.value = res
            const err = res.find(r => !r.success)
            if (err) throw { file: 'Fichier 3', line: err.line, column: err.column, message: err.error }
        }

        // Images ZIP
        if (zipFile.value && !ilainaNySary.value) {
            console.log("=>Miditra ny sary")
            currentImport.value = 'images'
            const res = await ImportService.importImagesZip(zipFile.value)
            imageResults.value = res
            const err = res.find(r => !r.success)
            if (err) throw { file: 'Archive ZIP', line: 0, column: 'Image', message: `Erreur sur image ${err.fileName}: ${err.error}` }
        }

        importDone.value = true
    } catch (err: any) {
        const file = err.file || currentImport.value
        const line = err.line !== undefined ? err.line : 'Inconnue'
        const column = err.column || 'Inconnue'
        const reason = err.message || err

        const lineVal = typeof line === 'number' ? line : parseInt(String(line))
        const lineStr = isNaN(lineVal) ? String(line) : `Ligne ${lineVal - 1}`
        importError.value = `Fichier : ${file}\nPosition : ${lineStr}\nColonne : ${column}\nRaison : ${reason}`
        showErrorModal.value = true

        isRollingBack.value = true
        isRollbackDone.value = false
        // ROLLBACK via ResetService
        await ResetService.resetAll()
        isRollingBack.value = false
        isRollbackDone.value = true
    } finally {
        isImporting.value = false
    }
}

const handleCloseModal = () => {
    showErrorModal.value = false
    window.location.reload()
}

const successCount1 = () => importResults1.value.filter(r => r.success).length
const failCount1 = () => importResults1.value.filter(r => !r.success).length
const successCount2 = () => importResults2.value.filter(r => r.success).length
const failCount2 = () => importResults2.value.filter(r => !r.success).length
const successCount3 = () => importResults3.value.filter(r => r.success).length
const failCount3 = () => importResults3.value.filter(r => !r.success).length
const successCountImages = () => imageResults.value.filter(r => r.success).length
const failCountImages = () => imageResults.value.filter(r => !r.success).length

</script>

<template>
    <div>
        <div class="d-flex justify-content-center align-items-center mb-4">
            <h2 class="h3 mb-0 text-body">Importer des données</h2>
        </div>

        <div class="row justify-content-center">
            <div class="col-lg-8 col-xl-6">
                <div class="card shadow-sm border bg-body-tertiary">
                    <div class="card-body p-4">
                        <form @submit.prevent="handleSubmit">

                            <div class="mb-4">
                                <label class="form-label fw-bold">Fichiers CSV</label>
                                <div class="text-muted small mb-2 d-flex align-items-center gap-1">
                                    <i class="bi bi-exclamation-circle"></i> Sélectionner les 3 fichiers
                                </div>
                                <div class="d-flex flex-column gap-2">
                                    <div>
                                        <label class="form-label small mb-1">Fichier 1 — Produits</label>
                                        <input type="file" class="form-control bg-body shadow-none" accept=".csv"
                                            @change="handleFile1">
                                    </div>
                                    <div>
                                        <label class="form-label small mb-1">Fichier 2 — Combinaisons</label>
                                        <input type="file" class="form-control bg-body shadow-none" accept=".csv"
                                            @change="handleFile2">
                                    </div>
                                    <div>
                                        <label class="form-label small mb-1">Fichier 3 — Paniers + Commandes</label>
                                        <input type="file" class="form-control bg-body shadow-none" accept=".csv"
                                            @change="handleFile3">
                                    </div>
                                </div>
                            </div>

                            <div class="mb-4 pt-2 border-top">
                                <label class="form-label fw-bold mt-2">Archive des images</label>
                                <div class="text-muted small mb-2">Fichier .zip contenant les images (nom = référence
                                    produit)</div>
                                <input type="file" class="form-control bg-body shadow-none" accept=".zip"
                                    @change="handleZip">
                            </div>

                            <div>
                                Ne pas importer
                                <input type="checkbox" name="" id="" v-model="ilainaNySary">
                            </div>

                            <!-- Résultats -->
                            <div v-if="importDone" class="alert mb-4"
                                :class="failCount1() === 0 ? 'alert-success' : 'alert-warning'">
                                <h6 class="fw-bold mb-2">
                                    <i class="bi"
                                        :class="failCount1() === 0 ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
                                    Import fichier 1 terminé
                                </h6>
                                <div class="d-flex gap-4">
                                    <span class="text-success">✅ {{ successCount1() }} succès</span>
                                    <span v-if="failCount1() > 0" class="text-danger">❌ {{ failCount1() }}
                                        erreurs</span>
                                </div>
                            </div>

                            <!-- Erreurs détaillées fichier 1 -->
                            <div v-if="importDone && failCount1() > 0" class="mb-4">
                                <div class="card border-danger">
                                    <div class="card-header bg-danger bg-opacity-10 text-danger fw-bold">
                                        <i class="bi bi-exclamation-triangle me-2"></i>Erreurs fichier 1
                                    </div>
                                    <div class="card-body p-0">
                                        <table class="table table-sm mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Ligne</th>
                                                    <th>Erreur</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="r in importResults1.filter(r => !r.success)" :key="r.line"
                                                    class="table-danger">
                                                    <td class="fw-bold">#{{ r.line }}</td>
                                                    <td><code>{{ r.error }}</code></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- Résultats fichier 2 -->
                            <div v-if="importDone && importResults2.length > 0" class="alert mb-4"
                                :class="failCount2() === 0 ? 'alert-success' : 'alert-warning'">
                                <h6 class="fw-bold mb-2">
                                    <i class="bi"
                                        :class="failCount2() === 0 ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
                                    Import fichier 2 terminé
                                </h6>
                                <div class="d-flex gap-4">
                                    <span class="text-success">✅ {{ successCount2() }} succès</span>
                                    <span v-if="failCount2() > 0" class="text-danger">❌ {{ failCount2() }}
                                        erreurs</span>
                                </div>
                            </div>

                            <!-- Résultats fichier 3 -->
                            <div v-if="importDone && importResults3.length > 0" class="alert mb-4"
                                :class="failCount3() === 0 ? 'alert-success' : 'alert-warning'">
                                <h6 class="fw-bold mb-2">
                                    <i class="bi"
                                        :class="failCount3() === 0 ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
                                    Import fichier 3 terminé
                                </h6>
                                <div class="d-flex gap-4">
                                    <span class="text-success">✅ {{ successCount3() }} succès</span>
                                    <span v-if="failCount3() > 0" class="text-danger">❌ {{ failCount3() }}
                                        erreurs</span>
                                </div>
                            </div>

                            <!-- Résultats images -->
                            <div v-if="importDone && imageResults.length > 0" class="alert mb-4"
                                :class="failCountImages() === 0 ? 'alert-success' : 'alert-warning'">
                                <h6 class="fw-bold mb-2">
                                    <i class="bi"
                                        :class="failCountImages() === 0 ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
                                    Import images terminé
                                </h6>
                                <div class="d-flex gap-4">
                                    <span class="text-success">✅ {{ successCountImages() }} succès</span>
                                    <span v-if="failCountImages() > 0" class="text-danger">❌ {{ failCountImages() }}
                                        erreurs</span>
                                </div>
                            </div>

                            <!-- Erreurs détaillées images -->
                            <div v-if="importDone && failCountImages() > 0" class="mb-4">
                                <div class="card border-danger">
                                    <div class="card-header bg-danger bg-opacity-10 text-danger fw-bold">
                                        <i class="bi bi-exclamation-triangle me-2"></i>Erreurs images
                                    </div>
                                    <div class="card-body p-0">
                                        <table class="table table-sm mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Fichier</th>
                                                    <th>Référence</th>
                                                    <th>Erreur</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="r in imageResults.filter(r => !r.success)" :key="r.fileName"
                                                    class="table-danger">
                                                    <td class="fw-bold">{{ r.fileName }}</td>
                                                    <td><code>{{ r.reference || '—' }}</code></td>
                                                    <td><code>{{ r.error }}</code></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- Erreurs détaillées fichier 3 -->
                            <div v-if="importDone && failCount3() > 0" class="mb-4">
                                <div class="card border-danger">
                                    <div class="card-header bg-danger bg-opacity-10 text-danger fw-bold">
                                        <i class="bi bi-exclamation-triangle me-2"></i>Erreurs fichier 3
                                    </div>
                                    <div class="card-body p-0">
                                        <table class="table table-sm mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Ligne</th>
                                                    <th>Erreur</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="r in importResults3.filter(r => !r.success)" :key="r.line"
                                                    class="table-danger">
                                                    <td class="fw-bold">#{{ r.line }}</td>
                                                    <td><code>{{ r.error }}</code></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- Erreurs détaillées fichier 2 -->
                            <div v-if="importDone && failCount2() > 0" class="mb-4">
                                <div class="card border-danger">
                                    <div class="card-header bg-danger bg-opacity-10 text-danger fw-bold">
                                        <i class="bi bi-exclamation-triangle me-2"></i>Erreurs fichier 2
                                    </div>
                                    <div class="card-body p-0">
                                        <table class="table table-sm mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Ligne</th>
                                                    <th>Erreur</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="r in importResults2.filter(r => !r.success)" :key="r.line"
                                                    class="table-danger">
                                                    <td class="fw-bold">#{{ r.line }}</td>
                                                    <td><code>{{ r.error }}</code></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div class="d-flex justify-content-end mt-4">
                                <button type="submit"
                                    class="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4 py-2"
                                    :disabled="isImporting" :class="{ 'btn-danger': isRollingBack }">
                                    <span v-if="isImporting" class="spinner-border spinner-border-sm"></span>
                                    <i v-else class="bi bi-cloud-upload"></i>
                                    <span v-if="isRollingBack">Rollback en cours...</span>
                                    <span v-else-if="isImporting">
                                        Importation {{ currentImport === 'f1' ? 'Produits' :
                                            currentImport === 'f2' ? 'Combinaisons' :
                                                currentImport === 'f3' ? 'Commandes' : 'Images' }}...
                                    </span>
                                    <span v-else>Lancer l'importation</span>
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>



        <!-- Modal d'erreur personnalisé -->
        <div v-if="showErrorModal" class="modal-backdrop-blur fade show"></div>
        <div v-if="showErrorModal" class="modal fade show d-block" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-error-shake">
                <div class="modal-content border-0 shadow-2xl rounded-5 overflow-hidden modal-glass">
                    <div class="modal-header border-0 py-4 px-4 bg-gradient-danger text-white">
                        <div class="d-flex align-items-center">
                            <div class="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                                <i class="bi bi-exclamation-triangle-fill fs-3 d-flex"></i>
                            </div>
                            <div>
                                <h5 class="modal-title fw-bold mb-0">Échec de l'importation</h5>
                                <small class="text-white-50">L'intégrité des données a été préservée</small>
                            </div>
                        </div>
                        <button type="button" class="btn-close btn-close-white ms-auto shadow-none"
                            @click="handleCloseModal"></button>
                    </div>

                    <div class="modal-body p-4">
                        <!-- Statut du Reset -->
                        <div v-if="isRollbackDone" class="rollback-status-badge d-flex align-items-center mb-4 fade-in">
                            <div class="status-dot"></div>
                            <span class="fw-semibold small">Base de données réinitialisée avec succès</span>
                        </div>

                        <div class="error-container">
                            <div class="error-header mb-3">
                                <i class="bi bi-shield-lock-fill text-danger me-2"></i>
                                <span class="fw-bold text-dark">Rapport d'incident technique</span>
                            </div>

                            <div class="error-details-box shadow-inner">
                                <div v-for="(line, index) in importError.split('\n')" :key="index" class="detail-row">
                                    <span class="detail-label">{{ line.split(' : ')[0] }}</span>
                                    <span class="detail-value">{{ line.split(' : ')[1] }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer border-0 p-4 pt-0">
                        <button type="button" class="btn btn-danger-premium w-100 py-3 rounded-4 fw-bold"
                            @click="handleCloseModal">
                            <i class="bi bi-arrow-left-circle me-2"></i>Retour à l'importation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-backdrop-blur {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    z-index: 1050;
}

.modal-glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
}

.bg-gradient-danger {
    background: linear-gradient(135deg, #dc3545 0%, #a71d2a 100%);
}

.modal-error-shake {
    animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
}

@keyframes shake {

    10%,
    90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%,
    80% {
        transform: translate3d(2px, 0, 0);
    }

    30%,
    50%,
    70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%,
    60% {
        transform: translate3d(4px, 0, 0);
    }
}

.rollback-status-badge {
    background: #e6fcf5;
    color: #0ca678;
    padding: 10px 16px;
    border-radius: 12px;
    border-left: 4px solid #0ca678;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #0ca678;
    border-radius: 50%;
    margin-right: 12px;
    box-shadow: 0 0 0 4px rgba(12, 166, 120, 0.2);
}

.error-details-box {
    background: #f8f9fa;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #e9ecef;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed #dee2e6;
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-label {
    font-weight: 600;
    color: #6c757d;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.detail-value {
    font-family: 'Monaco', 'Consolas', monospace;
    font-weight: 600;
    color: #d63384;
    font-size: 0.9rem;
    text-align: right;
    max-width: 60%;
    word-break: break-all;
}

.btn-danger-premium {
    background: #dc3545;
    border: none;
    color: white;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
}

.btn-danger-premium:hover {
    background: #c82333;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }

    100% {
        opacity: 1;
    }
}
</style>
