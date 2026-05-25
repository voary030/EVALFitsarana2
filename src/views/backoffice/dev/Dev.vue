<script setup lang="ts">
import { CategoryService } from '@/service/category/CategoryService';
import { TaxService } from '@/service/tax/taxe/TaxService';
import { ProductService } from '@/service/product/ProductService';
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth'
import { TaxRuleService } from '@/service/tax/tax_rule/TaxRuleService';

const authStore = useAuthStore()

// Accéder à l'ID de l'employé connecté
const employeeId = authStore.user?.id

const nomcat = ref<string | ''>('')
const searchcat = ref<string | ''>('')
const searchtaxe = ref<number | 0>(0)

const insertTax = ref<{ name: string, rate: number }>({
    name: '',
    rate: 0
})

const insertProduct = ref<{ name: string, price: number, wholesale_price: number, reference: string, id_category_default: number, available_date: string }>({
    name: '',
    price: 0,
    wholesale_price: 0,
    reference: '',
    id_category_default: 2,
    available_date: '0000-00-00'
})

const submitForm = async () => {
    try {
        const c = nomcat.value;
        const cat = await CategoryService.create(c);
        console.log(cat)
        nomcat.value = "";
        alert("Succes")
    } catch (err: any) {
        alert(err)
    }
}

const searchCat = async () => {
    try {
        const c = searchcat.value;
        const cat = await CategoryService.getByName(c);
        if (cat) {
            alert(JSON.stringify(cat, null, 2))
        } else {
            alert("Categorie non trouvee")
        }
    } catch (err: any) {
        alert(err)
    }
}

const searchTaxe = async () => {
    try {
        const c = searchtaxe.value;
        const taxe = await TaxService.getByRate(c)
        const id_taxe_rules_group = await TaxService.getIdTaxeRulesGroupByRateTax(c)
        if (taxe) {
            const taxe_rule = await TaxRuleService.getByIdTax(taxe?.id)
            alert(
                JSON.stringify(
                    {
                        taxe: taxe,
                        taxe_rule: taxe_rule,
                        id_taxe_rules_group: id_taxe_rules_group
                    },
                    null,
                    2
                )
            );
        } else {
            alert("Taxe non trouvee")
        }
    } catch (err: any) {
        alert(err)
    }
}

const submitCreateTaxe = async () => {
    try {
        const name = insertTax.value.name
        const rate = insertTax.value.rate

        const taxRuleGroupe = await TaxService.mamoronaTaxeSyNyZanany(name, rate, 8);

        alert(JSON.stringify(taxRuleGroupe, null, 2))

        insertTax.value.name = ''
        insertTax.value.rate = 0
    } catch (err: any) {
        alert(err)
    }
}

const submitCreateProduct = async () => {
    try {
        // const prod = await ProductService.create(insertProduct.value)
        // alert(JSON.stringify(prod, null, 2))
        insertProduct.value = {
            name: '',
            price: 0,
            wholesale_price: 0,
            reference: '',
            id_category_default: 2,
            available_date: '0000-00-00'
        }
    } catch (err: any) {
        alert(err)
    }
}

const testeLigne1csvFichier1 = async () => {

    const data = {
        date_availability_produit: "01/12/2025",
        nom: "Tshirt - teste",
        reference: "T_01",
        prix_ttc: "12,5",
        Taxe: "11,65%",
        categorie: "Kiraro",
        prix_achat: "1,5",
    }
    const product = await ProductService.creerProduit(data);
}

onMounted(() => {
    // testeLigne1csvFichier1();
})

</script>


<template>
    <h1>Page teste fonction {{ employeeId }}</h1>
    <p>Creer un categorie</p>
    <input type="text" v-model="nomcat" placeholder="Nom categorie">
    <button class="btn btn-primary" v-on:click="submitForm()">OK</button>
    <hr>
    <p>Rechercher un categorie</p>
    <input type="text" v-model="searchcat" placeholder="Nom categorie">
    <button class="btn btn-primary" v-on:click="searchCat()">OK</button>
    <hr>
    <p>Rechercher un taxe par valeur</p>
    <input type="number" v-model="searchtaxe" placeholder="Valeur du taxe">
    <button class="btn btn-primary" v-on:click="searchTaxe()">OK</button>
    <hr>
    <p>Insertion taxe</p>
    <input type="text" v-model="insertTax.name" placeholder="Name">
    <input type="number" v-model="insertTax.rate" placeholder="Rate">
    <button class="btn btn-primary" v-on:click="submitCreateTaxe()">OK</button>
    <hr>
    <p>Insertion Produit</p>
    <!--<div class="d-flex flex-column gap-2" style="max-width: 300px;">
        <div>
            <label class="form-label mb-1">Nom du produit</label>
            <input type="text" v-model="insertProduct.name" class="form-control" placeholder="Nom du produit">
        </div>
        <div>
            <label class="form-label mb-1">Référence</label>
            <input type="text" v-model="insertProduct.reference" class="form-control"
                placeholder="Référence (ex: PROD-001)">
        </div>
        <div>
            <label class="form-label mb-1">Prix</label>
            <input type="number" v-model="insertProduct.price" class="form-control" placeholder="Prix (ex: 20)">
        </div>
        <div>
            <label class="form-label mb-1">Prix d'achat</label>
            <input type="number" v-model="insertProduct.wholesale_price" class="form-control"
                placeholder="Prix d'achat (ex: 10)">
        </div>
        <div>
            <label class="form-label mb-1">ID Catégorie Défaut</label>
            <input type="number" v-model="insertProduct.id_category_default" class="form-control"
                placeholder="ID Catégorie (défaut: 2)">
        </div>
        <div>
            <label class="form-label mb-1">Date de disponibilité</label>
            <input type="date" v-model="insertProduct.available_date" class="form-control">
        </div>
        <button class="btn btn-success mt-2" v-on:click="submitCreateProduct()">Créer Produit</button>
    </div>-->

    <div>
        <button v-on:click="testeLigne1csvFichier1()">Cliquer ici</button>
    </div>
</template>