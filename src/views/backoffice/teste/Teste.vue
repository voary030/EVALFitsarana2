<script setup lang="ts">
import { TaxRuleGroupService } from '@/service/tax/tax_rule_group/TaxRuleGroupService';
import type { TaxRuleGroup } from '@/types/tax/tax_rule_group/index';
import { onMounted, ref } from 'vue';

const taxe_rule_groupes = ref<TaxRuleGroup[] | []>([])

const input_model = ref<string>('');

const fetchTaxeRule = async () => {
    try {
        const data = await TaxRuleGroupService.getAll();
        taxe_rule_groupes.value = data;
    } catch (err: any) {
        console.error(err);
    }
}
const submitForm = async () => {
    try {
        const name = input_model.value;
        const result = await TaxRuleGroupService.create(name)
        console.log(result)
    } catch (err: any) {
        alert(err)
    }
}

onMounted(() => {
    fetchTaxeRule()
})

</script>

<template>
    <div>
        <h1>Hello</h1>
        <input type="text" v-model="input_model">
        <button v-on:click="submitForm()">Oke</button>
    </div>
</template>