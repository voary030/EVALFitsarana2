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
    <div class="import-page">
        <!-- Page Header -->
        <header class="page-header mb-5 pb-4 border-bottom border-secondary border-opacity-10">
            <div class="d-flex align-items-center">
                <div class="header-icon-box me-3 shadow-glow-primary">
                    <i class="bi bi-cloud-upload fs-3 text-glow"></i>
                </div>
                <div>
                    <h1 class="h2 mb-1 fw-extrabold text-body">Importation de Données</h1>
                    <p class="text-secondary mb-0 small">Importez vos fichiers de produits, combinaisons et commandes
                    </p>
                </div>
            </div>
        </header>

        <form @submit.prevent="handleSubmit" class="import-form">
            <div class="row g-4">
                <!-- Left Column: File Upload Section -->
                <div class="col-12 col-lg-8">
                    <!-- CSV Files Upload -->
                    <div class="upload-section card-glass p-5 rounded-4 border border-secondary border-opacity-10 mb-4">
                        <div class="section-header mb-4">
                            <div class="d-flex align-items-center mb-3">
                                <span
                                    class="step-badge bg-primary text-white fw-bold rounded-circle d-flex align-items-center justify-content-center">1</span>
                                <h3 class="ms-3 mb-0 fs-5 fw-bold text-body">Fichiers CSV (3 fichiers requis)</h3>
                            </div>
                            <p class="text-secondary small ms-5 mb-0">Sélectionnez les trois fichiers dans le bon ordre
                            </p>
                        </div>

                        <div class="files-grid">
                            <!-- File 1: Products -->
                            <div class="file-upload-card">
                                <div class="file-upload-header">
                                    <div class="file-icon bg-blue-soft text-blue rounded-3">
                                        <i class="bi bi-box-seam"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h5 class="mb-0 fs-6 fw-bold">Produits</h5>
                                        <small class="text-secondary">Fichier 1 — références, prix, stocks</small>
                                    </div>
                                    <span v-if="file1" class="badge bg-success rounded-pill"><i
                                            class="bi bi-check-lg me-1"></i>Prêt</span>
                                </div>
                                <label class="file-input-wrapper">
                                    <input type="file" class="form-control d-none" accept=".csv" @change="handleFile1">
                                    <div class="file-drop-zone">
                                        <i class="bi bi-cloud-upload"></i>
                                        <span v-if="!file1" class="text-secondary">Cliquez ou déposez le fichier</span>
                                        <span v-else class="text-success fw-bold">{{ file1.name }}</span>
                                    </div>
                                </label>
                            </div>

                            <!-- File 2: Combinations -->
                            <div class="file-upload-card">
                                <div class="file-upload-header">
                                    <div class="file-icon bg-purple-soft text-purple rounded-3">
                                        <i class="bi bi-diagram-3"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h5 class="mb-0 fs-6 fw-bold">Combinaisons</h5>
                                        <small class="text-secondary">Fichier 2 — déclinaisons produits</small>
                                    </div>
                                    <span v-if="file2" class="badge bg-success rounded-pill"><i
                                            class="bi bi-check-lg me-1"></i>Prêt</span>
                                </div>
                                <label class="file-input-wrapper">
                                    <input type="file" class="form-control d-none" accept=".csv" @change="handleFile2">
                                    <div class="file-drop-zone">
                                        <i class="bi bi-cloud-upload"></i>
                                        <span v-if="!file2" class="text-secondary">Cliquez ou déposez le fichier</span>
                                        <span v-else class="text-success fw-bold">{{ file2.name }}</span>
                                    </div>
                                </label>
                            </div>

                            <!-- File 3: Orders + Carts -->
                            <div class="file-upload-card">
                                <div class="file-upload-header">
                                    <div class="file-icon bg-emerald-soft text-emerald rounded-3">
                                        <i class="bi bi-cart-check"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h5 class="mb-0 fs-6 fw-bold">Commandes & Paniers</h5>
                                        <small class="text-secondary">Fichier 3 — commandes et panier actifs</small>
                                    </div>
                                    <span v-if="file3" class="badge bg-success rounded-pill"><i
                                            class="bi bi-check-lg me-1"></i>Prêt</span>
                                </div>
                                <label class="file-input-wrapper">
                                    <input type="file" class="form-control d-none" accept=".csv" @change="handleFile3">
                                    <div class="file-drop-zone">
                                        <i class="bi bi-cloud-upload"></i>
                                        <span v-if="!file3" class="text-secondary">Cliquez ou déposez le fichier</span>
                                        <span v-else class="text-success fw-bold">{{ file3.name }}</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Images ZIP Upload -->
                    <div class="upload-section card-glass p-5 rounded-4 border border-secondary border-opacity-10 mb-4">
                        <div class="section-header mb-4">
                            <div class="d-flex align-items-center mb-3">
                                <span
                                    class="step-badge bg-info text-white fw-bold rounded-circle d-flex align-items-center justify-content-center">2</span>
                                <h3 class="ms-3 mb-0 fs-5 fw-bold text-body">Archive Images (Optionnel)</h3>
                            </div>
                            <p class="text-secondary small ms-5 mb-0">Fichier ZIP contenant les images produits (nom =
                                référence)</p>
                        </div>

                        <label class="file-input-wrapper">
                            <input type="file" class="form-control d-none" accept=".zip" @change="handleZip">
                            <div class="file-drop-zone-large">
                                <div class="d-flex flex-column align-items-center">
                                    <i class="bi bi-image fs-2 mb-2 text-info"></i>
                                    <span v-if="!zipFile" class="text-secondary">Cliquez ou déposez l'archive ZIP</span>
                                    <span v-else class="text-success fw-bold">{{ zipFile.name }}</span>
                                </div>
                            </div>
                        </label>
                    </div>

                    <!-- Results Section -->
                    <div v-if="importDone" class="results-section">
                        <div class="section-header mb-4">
                            <h3 class="fs-5 fw-bold text-body d-flex align-items-center">
                                <i class="bi bi-check-circle-fill text-success me-2"></i>Résumé d'Importation
                            </h3>
                        </div>

                        <!-- File 1 Results -->
                        <div class="results-cards-grid">
                            <div v-if="importResults1.length > 0" class="result-card"
                                :class="failCount1() === 0 ? 'success' : 'warning'">
                                <div class="result-header">
                                    <div class="result-icon">
                                        <i
                                            :class="failCount1() === 0 ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-warning'"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h5 class="mb-1">Produits</h5>
                                        <small class="text-secondary">Fichier 1 importé</small>
                                    </div>
                                </div>
                                <div class="result-stats">
                                    <div class="stat-item">
                                        <span class="stat-value text-success">{{ successCount1() }}</span>
                                        <span class="stat-label">Succès</span>
                                    </div>
                                    <div v-if="failCount1() > 0" class="stat-item">
                                        <span class="stat-value text-danger">{{ failCount1() }}</span>
                                        <span class="stat-label">Erreurs</span>
                                    </div>
                                </div>
                                <div v-if="failCount1() > 0"
                                    class="result-details mt-3 pt-3 border-top border-secondary border-opacity-20">
                                    <div class="error-list">
                                        <div v-for="r in importResults1.filter(r => !r.success).slice(0, 3)"
                                            :key="r.line" class="error-item small">
                                            <span class="text-danger">Ligne {{ r.line }}:</span>
                                            <code class="text-muted">{{ r.error }}</code>
                                        </div>
                                        <div v-if="failCount1() > 3" class="text-secondary small mt-2">+{{ failCount1()
                                            - 3 }} autres erreurs</div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="importResults2.length > 0" class="result-card"
                                :class="failCount2() === 0 ? 'success' : 'warning'">
                                <div class="result-header">
                                    <div class="result-icon">
                                        <i
                                            :class="failCount2() === 0 ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-warning'"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h5 class="mb-1">Combinaisons</h5>
                                        <small class="text-secondary">Fichier 2 importé</small>
                                    </div>
                                </div>
                                <div class="result-stats">
                                    <div class="stat-item">
                                        <span class="stat-value text-success">{{ successCount2() }}</span>
                                        <span class="stat-label">Succès</span>
                                    </div>
                                    <div v-if="failCount2() > 0" class="stat-item">
                                        <span class="stat-value text-danger">{{ failCount2() }}</span>
                                        <span class="stat-label">Erreurs</span>
                                    </div>
                                </div>
                                <div v-if="failCount2() > 0"
                                    class="result-details mt-3 pt-3 border-top border-secondary border-opacity-20">
                                    <div class="error-list">
                                        <div v-for="r in importResults2.filter(r => !r.success).slice(0, 3)"
                                            :key="r.line" class="error-item small">
                                            <span class="text-danger">Ligne {{ r.line }}:</span>
                                            <code class="text-muted">{{ r.error }}</code>
                                        </div>
                                        <div v-if="failCount2() > 3" class="text-secondary small mt-2">+{{ failCount2()
                                            - 3 }} autres erreurs</div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="importResults3.length > 0" class="result-card"
                                :class="failCount3() === 0 ? 'success' : 'warning'">
                                <div class="result-header">
                                    <div class="result-icon">
                                        <i
                                            :class="failCount3() === 0 ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-warning'"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h5 class="mb-1">Commandes & Paniers</h5>
                                        <small class="text-secondary">Fichier 3 importé</small>
                                    </div>
                                </div>
                                <div class="result-stats">
                                    <div class="stat-item">
                                        <span class="stat-value text-success">{{ successCount3() }}</span>
                                        <span class="stat-label">Succès</span>
                                    </div>
                                    <div v-if="failCount3() > 0" class="stat-item">
                                        <span class="stat-value text-danger">{{ failCount3() }}</span>
                                        <span class="stat-label">Erreurs</span>
                                    </div>
                                </div>
                                <div v-if="failCount3() > 0"
                                    class="result-details mt-3 pt-3 border-top border-secondary border-opacity-20">
                                    <div class="error-list">
                                        <div v-for="r in importResults3.filter(r => !r.success).slice(0, 3)"
                                            :key="r.line" class="error-item small">
                                            <span class="text-danger">Ligne {{ r.line }}:</span>
                                            <code class="text-muted">{{ r.error }}</code>
                                        </div>
                                        <div v-if="failCount3() > 3" class="text-secondary small mt-2">+{{ failCount3()
                                            - 3 }} autres erreurs</div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="imageResults.length > 0" class="result-card"
                                :class="failCountImages() === 0 ? 'success' : 'warning'">
                                <div class="result-header">
                                    <div class="result-icon">
                                        <i
                                            :class="failCountImages() === 0 ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-warning'"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h5 class="mb-1">Images</h5>
                                        <small class="text-secondary">Archive ZIP traitée</small>
                                    </div>
                                </div>
                                <div class="result-stats">
                                    <div class="stat-item">
                                        <span class="stat-value text-success">{{ successCountImages() }}</span>
                                        <span class="stat-label">Succès</span>
                                    </div>
                                    <div v-if="failCountImages() > 0" class="stat-item">
                                        <span class="stat-value text-danger">{{ failCountImages() }}</span>
                                        <span class="stat-label">Erreurs</span>
                                    </div>
                                </div>
                                <div v-if="failCountImages() > 0"
                                    class="result-details mt-3 pt-3 border-top border-secondary border-opacity-20">
                                    <div class="error-list">
                                        <div v-for="r in imageResults.filter(r => !r.success).slice(0, 3)"
                                            :key="r.fileName" class="error-item small">
                                            <span class="text-danger">{{ r.fileName }}:</span>
                                            <code class="text-muted">{{ r.error }}</code>
                                        </div>
                                        <div v-if="failCountImages() > 3" class="text-secondary small mt-2">+{{
                                            failCountImages() - 3 }} autres erreurs</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Summary & Controls -->
                <div class="col-12 col-lg-4">
                    <!-- Upload Status Summary -->
                    <div class="card-glass p-4 rounded-4 border border-secondary border-opacity-10 sticky-top"
                        style="top: 2rem;">
                        <h5 class="fw-bold mb-4 d-flex align-items-center">
                            <i class="bi bi-clipboard-check me-2 text-primary"></i>Votre Sélection
                        </h5>

                        <div class="files-summary mb-4">
                            <div class="summary-item" :class="file1 ? 'ready' : 'pending'">
                                <i class="bi"
                                    :class="file1 ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                                <div class="item-text">
                                    <div class="item-label">Produits</div>
                                    <div class="item-value">{{ file1?.name || 'Non sélectionné' }}</div>
                                </div>
                            </div>
                            <div class="summary-item" :class="file2 ? 'ready' : 'pending'">
                                <i class="bi"
                                    :class="file2 ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                                <div class="item-text">
                                    <div class="item-label">Combinaisons</div>
                                    <div class="item-value">{{ file2?.name || 'Non sélectionné' }}</div>
                                </div>
                            </div>
                            <div class="summary-item" :class="file3 ? 'ready' : 'pending'">
                                <i class="bi"
                                    :class="file3 ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                                <div class="item-text">
                                    <div class="item-label">Commandes</div>
                                    <div class="item-value">{{ file3?.name || 'Non sélectionné' }}</div>
                                </div>
                            </div>
                            <div class="summary-item" :class="zipFile ? 'ready' : ''">
                                <i class="bi"
                                    :class="zipFile ? 'bi-check-circle-fill text-success' : 'bi-circle-dashed text-secondary'"></i>
                                <div class="item-text">
                                    <div class="item-label">Images (optionnel)</div>
                                    <div class="item-value">{{ zipFile?.name || 'Non sélectionné' }}</div>
                                </div>
                            </div>
                        </div>

                        <hr class="border-secondary border-opacity-20 my-3">

                        <div class="skip-images-option mb-4 p-3 rounded-3 bg-secondary bg-opacity-5">
                            <label class="d-flex align-items-center cursor-pointer mb-0">
                                <input type="checkbox" class="form-check-input" v-model="ilainaNySary">
                                <span class="ms-2 small text-secondary">Ne pas importer les images</span>
                            </label>
                        </div>

                        <button type="submit"
                            class="btn btn-primary w-100 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                            :disabled="isImporting" :class="{ 'btn-danger': isRollingBack }">
                            <span v-if="isImporting" class="spinner-border spinner-border-sm"></span>
                            <i v-else-if="!isRollingBack" class="bi bi-cloud-upload"></i>
                            <span v-if="isRollingBack">Annulation en cours...</span>
                            <span v-else-if="isImporting">
                                {{ currentImport === 'f1' ? 'Produits' :
                                    currentImport === 'f2' ? 'Combinaisons' :
                                        currentImport === 'f3' ? 'Commandes' : 'Images' }}...
                            </span>
                            <span v-else>Lancer l'Importation</span>
                        </button>

                        <div v-if="isRollbackDone" class="alert alert-info mt-3 mb-0">
                            <i class="bi bi-shield-check me-2"></i>
                            <small>Base de données réinitialisée avec succès</small>
                        </div>
                    </div>
                </div>
            </div>
        </form>

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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

.import-page {
    font-family: 'Outfit', sans-serif;
    color: var(--bs-body-color);
}

/* Header */
.page-header {
    display: flex;
    align-items: center;
}

.header-icon-box {
    width: 55px;
    height: 55px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.05));
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.text-glow {
    color: #60a5fa;
    text-shadow: 0 0 12px rgba(96, 165, 250, 0.4);
}

.shadow-glow-primary {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
}

/* Cards & Sections */
.card-glass {
    background: rgba(30, 41, 59, 0.4) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-color: rgba(255, 255, 255, 0.1) !important;
}

.upload-section {
    transition: all 0.3s ease;
}

.upload-section:hover {
    background: rgba(30, 41, 59, 0.5) !important;
}

.section-header h3 {
    font-size: 1.05rem;
    font-weight: 700;
}

.step-badge {
    width: 36px;
    height: 36px;
    font-size: 0.85rem;
    flex-shrink: 0;
}

/* File Upload Cards */
.files-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.file-upload-card {
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.02);
}

.file-upload-card:hover {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-4px);
}

.file-upload-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
}

.file-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.bg-blue-soft {
    background: rgba(59, 130, 246, 0.1);
}

.text-blue {
    color: #60a5fa;
}

.bg-purple-soft {
    background: rgba(168, 85, 247, 0.1);
}

.text-purple {
    color: #c084fc;
}

.bg-emerald-soft {
    background: rgba(16, 185, 129, 0.1);
}

.text-emerald {
    color: #34d399;
}

.file-input-wrapper {
    cursor: pointer;
}

.file-drop-zone,
.file-drop-zone-large {
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 2rem 1rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
}

.file-drop-zone:hover,
.file-drop-zone-large:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.05);
}

.file-drop-zone i,
.file-drop-zone-large i {
    font-size: 1.5rem;
    display: block;
    margin-bottom: 0.5rem;
    opacity: 0.6;
}

.file-drop-zone-large {
    padding: 3rem 2rem;
}

/* Results Section */
.results-section {
    margin-top: 2rem;
}

.results-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.result-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.02);
    transition: all 0.3s ease;
}

.result-card.success {
    border-color: rgba(16, 185, 129, 0.3);
}

.result-card.warning {
    border-color: rgba(245, 158, 11, 0.3);
}

.result-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
}

.result-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
}

.result-stats {
    display: flex;
    gap: 1.5rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 800;
}

.stat-label {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.result-details {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    padding: 1rem;
}

.error-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.error-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

/* Summary Sidebar */
.files-summary {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.summary-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    transition: all 0.2s ease;
}

.summary-item.ready {
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.summary-item.pending {
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.item-text {
    flex-grow: 1;
    min-width: 0;
}

.item-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--bs-body-color);
}

.item-value {
    font-size: 0.75rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.skip-images-option {
    transition: all 0.2s ease;
}

.skip-images-option:hover {
    background: rgba(255, 255, 255, 0.08) !important;
}

/* Modal */
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

.cursor-pointer {
    cursor: pointer;
}

.sticky-top {
    position: sticky;
}
</style>
