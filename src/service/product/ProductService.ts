import { ProductApi } from "@/api/product/ProductApi"
import type { Product } from "@/types/product"
import { parseProductListXml, parseProductXml } from '@/mappers/product'
import { CategoryService } from "../category/CategoryService";
import { TaxService } from "../tax/taxe/TaxService";
import { ImageApi } from "@/api/image/ImageApi";
import { ProductOptionService } from "../product_option/ProductOptionService";
import { ProductOptionValueService } from "../product_option_value/ProductOptionValueService";
import { CombinationService } from "../combination/CombinationService";
import { TaxRuleService } from "../tax/tax_rule/TaxRuleService";

const getCurrentPrestaDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

/** Cache des taux de taxe par id_tax_rules_group pour éviter les appels API en boucle */
const taxRateCache = new Map<number, number>()

export const ProductService = {

    clearCache() {
        taxRateCache.clear();
    },

    async creerProduit(data: {
        date_availability_produit: string, nom: string, reference: string
        , prix_ttc: string, Taxe: string, categorie: string, prix_achat: string
    }): Promise<Product | undefined> {
        try {
            const prix_ttc = Number(data.prix_ttc.replace(',', '.'));
            const prix_achat = Number(data.prix_achat.replace(',', '.'));
            const taxe_str = data.Taxe.replace('%', '').trim();
            const taxe = Number(taxe_str.replace(',', '.'))
            const prixHT = prix_ttc / (1 + (taxe / 100));

            let categorie = await CategoryService.getByName(data.categorie.trim())

            if (!categorie) {
                // console.log("Categorie non trouver. Creation en cours");
                categorie = await CategoryService.create(data.categorie.trim())
            } if (categorie) {
                // console.log("Categorie trouver")
                console.log(categorie)
            }

            const formattedDate = data.date_availability_produit.split('/').reverse().join('-');

            let id_tax_rules_group = await TaxService.getIdTaxeRulesGroupByRateTax(taxe)

            if (id_tax_rules_group == 0) {
                // console.log("Taxe avec la valeur " + taxe + " n'existe pas. Creation en cours");
                const tax_rule_groupe = await TaxService.mamoronaTaxeSyNyZanany(`Taxe ${taxe} %`, taxe, 8);
                // console.log("Created : " + tax_rule_groupe)
                id_tax_rules_group = tax_rule_groupe?.id
            }

            // console.log("id taxe rule groupe " + id_tax_rules_group);

            // console.log("Creation de produit");

            if (categorie?.id && id_tax_rules_group) {
                const dataProduct = {
                    "name": data.nom.trim(),
                    "price": prixHT,
                    "wholesale_price": prix_achat,
                    "available_date": formattedDate,
                    "reference": data.reference,
                    "id_category": categorie?.id,
                    "id_tax_rules_group": id_tax_rules_group
                }
                const product = await this.create(dataProduct)
                // console.log(product)
                return product;
            }
        } catch (err: any) {
            throw err;
        }
    },

    async create(data: { name: string; price: number; wholesale_price: number; available_date: string; reference: string; id_category: number, id_tax_rules_group: number }): Promise<Product | undefined> {
        const xmlBody = this.buildXml(data);
        // console.log(xmlBody)
        const productXml = await ProductApi.create(xmlBody);
        const products = parseProductListXml(productXml);
        return products[0];
    },

    async computePrixTtc(product: Product): Promise<number> {
        try {
            const taux = await this.fetchTaxRate(product);
            if (taux === 0) return product.price;
            return parseFloat((product.price * (1 + taux / 100)).toFixed(2));
        } catch {
            return product.price;
        }
    },

    /** Récupère le taux de taxe SANS appeler getById (évite la boucle infinie) */
    async fetchTaxRate(product: Product): Promise<number> {
        try {
            if (!product.id_tax_rules_group) return 0;

            // Cache : ne pas refaire l'appel API pour le même groupe fiscal
            const cached = taxRateCache.get(product.id_tax_rules_group);
            if (cached !== undefined) return cached;

            const taxRule = await TaxRuleService.getByTaxRuleGroupAndCountry(
                product.id_tax_rules_group, 8
            );
            if (!taxRule) return 0;

            const taxe = await TaxService.getById(String(taxRule.id_tax));
            const rate = taxe?.rate || 0;

            taxRateCache.set(product.id_tax_rules_group, rate);
            return rate;
        } catch {
            return 0;
        }
    },

    async getById(id: string): Promise<Product | undefined> {
        const productXml = await ProductApi.getById(id);
        const products = parseProductListXml(productXml);
        const product = products[0];

        if (product) {
            product.images = ImageApi.getAllProductImages(product);
            product.prix_ttc = await this.computePrixTtc(product);
        }

        return product;
    },

    async findByReference(reference: string): Promise<Product | undefined> {
        try {
            const xml = await ProductApi.getByReference(reference)
            const products = parseProductListXml(xml)
            if (products[0]) {
                products[0].images = ImageApi.getAllProductImages(products[0])
                products[0].prix_ttc = await this.computePrixTtc(products[0])
            }
            return products[0]
        } catch {
            return undefined
        }
    },

    async getProductOptionGroups(productId: string) {
        const product = await this.getById(productId)
        if (!product || !product.product_option_value_ids?.length) return []

        const [allVals, allOpts] = await Promise.all([
            ProductOptionValueService.getAll(),
            ProductOptionService.getAll()
        ])
        const productValues = allVals.filter(v => product.product_option_value_ids.includes(v.id))
        // console.log({ productValues })
        const groups = []
        for (const opt of allOpts) {
            const values = productValues.filter(v => v.id_attribute_group === opt.id)
            if (values.length > 0) {
                groups.push({ option: opt, values })
            }
        }
        // console.log({ groups })
        return groups
    },

    async getIdProductOption(idProduct: string): Promise<number[] | []> {
        console.log("debug");
        const p = await this.getById(idProduct);
        const p_option_values = p?.product_option_value_ids;
        // console.log({ opt_values: p_option_values });
        const valiny: number[] = []
        if (p_option_values) {
            // console.log("IF")
            for (let index = 0; index < p_option_values.length; index++) {
                const id_p_option_val = p_option_values[index];
                console.log(id_p_option_val)
                if (id_p_option_val) {
                    const p_option_val = await ProductOptionValueService.getById(id_p_option_val);
                    // console.log(p_option_val)
                    const id_p_option = p_option_val?.id_attribute_group
                    if (id_p_option && !valiny.includes(id_p_option)) {
                        valiny.push(id_p_option);
                    }
                } else {
                    throw new Error("Tsisy ilay p_option_val")
                }
            }
        }
        return valiny;
    },

    async getAllDynamique(page: number, nombre = 8, filters?: { name?: string; category?: string; priceMin?: number; priceMax?: number }): Promise<Product[]> {

        if (filters?.priceMin !== undefined && filters?.priceMax !== undefined) {
            if (filters.priceMin > filters.priceMax) {
                throw new Error("Prix min doit etre < prix max");
            }
        }

        // On récupère une liste plus large pour pouvoir filtrer précisément en TTC côté client
        // Car l'API ne filtre que sur le prix HT (price)
        const productXml = await ProductApi.getAllDynamique(page, nombre, filters);
        const products = parseProductListXml(productXml);

        const enriched = await Promise.all(products.map(async product => ({
            ...product,
            images: ImageApi.getAllProductImages(product),
            prix_ttc: await this.computePrixTtc(product),
        })));

        // Filtrage précis par prix TTC si demandé
        if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
            return enriched.filter(p => {
                const ttc = p.prix_ttc || p.price;
                const minOk = filters.priceMin === undefined || ttc >= filters.priceMin;
                const maxOk = filters.priceMax === undefined || ttc <= filters.priceMax;
                return minOk && maxOk;
            });
        }

        return enriched;
    },

    async getAll(): Promise<Product[]> {
        const productsXml = await ProductApi.getAll();
        const products = parseProductListXml(productsXml);
        const enriched = await Promise.all(products.map(async p => ({
            ...p,
            prix_ttc: await this.computePrixTtc(p),
        })));
        return enriched;
    },

    async getByIdCategory(categoryId: number): Promise<Product[]> {
        const productsXml = await ProductApi.getByIdCategory(categoryId);
        const products = parseProductListXml(productsXml);
        const enriched = await Promise.all(products.map(async p => ({
            ...p,
            prix_ttc: await this.computePrixTtc(p),
        })));
        return enriched;
    },

    async count(): Promise<number> {
        return (await this.getAll()).length;
    },

    async countAll(): Promise<number> {
        try {
            const xml = await ProductApi.countAll();
            const products = parseProductListXml(xml);
            return products.length;
        } catch (error) {
            console.error('Erreur lors du comptage des produits:', error);
            return 0;
        }
    },

    async getTaxByIdProduct(idProduct: string): Promise<number> {
        try {
            const product = await this.getById(idProduct);
            if (!product || !product.id_tax_rules_group) {
                return 0;
            }

            const taxRule = await TaxRuleService.getByTaxRuleGroupAndCountry(
                product.id_tax_rules_group,
                8 // Country ID (France)
            );

            if (!taxRule) {
                return 0;
            }

            const taxe = await TaxService.getById(String(taxRule.id_tax));
            // Le taux de taxe peut être dans différentes structures, vérifier tous les cas
            return taxe?.rate || 0;
        } catch (error) {
            console.error('Erreur lors de la récupération de la taxe:', error);
            return 0;
        }
    },

    async getPrixTtc(idProduct: string, idProductAttribute: number): Promise<number> {
        try {
            // Calculer le prix HT (base + combinaison si applicable)
            const prixHt = await this.getPrix(idProduct, idProductAttribute);

            // Récupérer le taux de taxe
            const tauxTaxe = await this.getTaxByIdProduct(idProduct);

            if (tauxTaxe === 0) {
                return prixHt;
            }

            // Appliquer la taxe : Prix TTC = Prix HT * (1 + taux_taxe / 100)
            const prixTtc = prixHt * (1 + tauxTaxe / 100);

            return parseFloat(prixTtc.toFixed(2));
        } catch (error) {
            console.error('Erreur lors du calcul du prix TTC:', error);
            throw error;
        }
    },

    async getPrix(idProduct: string, idProductAttribute: number): Promise<number> {
        try {
            const product = await this.getById(idProduct);


            if (!product) {
                throw new Error(`Produit avec l'ID ${idProduct} non trouvé`);
            }

            const basePrice = product.price || 0;

            // Si pas de combinaison, retourner le prix de base directement
            if (!idProductAttribute || idProductAttribute === 0) {
                return basePrice;
            }

            const combinations = await CombinationService.getByProductId(idProduct);
            const combination = combinations.find(c => c.id === idProductAttribute);

            if (!combination) {
                return basePrice;
            }

            const additionalPrice = combination.price || 0;
            return basePrice + additionalPrice;
        } catch (error) {
            console.error('Erreur lors du calcul du prix:', error);
            throw error;
        }
    },

    async prepareForCombinations(productId: number, optionValueId: number): Promise<void> {
        try {
            // Récupérer le produit actuel (nécessaire pour garder les anciennes associations)
            const product = await this.getById(String(productId))
            if (!product) return

            // Vérifier si déjà associé et si déjà en type combinations
            const currentValues = product.product_option_value_ids || []
            const isAlreadyCombinable = product.product_type === 'combinations'
            const isAlreadyLinked = currentValues.includes(optionValueId)

            if (isAlreadyCombinable && isAlreadyLinked) return

            // Préparer le XML de PATCH
            const newValues = isAlreadyLinked ? currentValues : [...currentValues, optionValueId]

            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <product>
                    <id>${productId}</id>
                    <product_type><![CDATA[combinations]]></product_type>
                    <associations>
                        <product_option_values>
                            ${newValues.map(id => `<product_option_value><id><![CDATA[${id}]]></id></product_option_value>`).join('')}
                        </product_option_values>
                    </associations>
                </product>
            </prestashop>`.trim()

            await ProductApi.patch(String(productId), xmlBody)
            console.log(`[ProductService] Produit ${productId} préparé (product_type: combinations, Option: ${optionValueId})`)
        } catch (error) {
            console.warn(`[ProductService] Échec préparation produit ${productId}:`, error)
        }
    },

    buildXml(data: { name: string; price: number; wholesale_price: number; available_date: string; reference: string; id_category: number, id_tax_rules_group: number }): string {
        const name = data.name.trim();
        const link_rewrite = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        const price = data.price.toFixed(6);
        const wholesale_price = data.wholesale_price.toFixed(6);

        const available_date = data.available_date || '0000-00-00';
        const reference = data.reference || '';
        const id_category_default = data.id_category || 2;
        const active = 1;
        const state = 1;
        const show_price = 1;
        const indexed = 1;
        const available_for_order = 1;
        const redirect_type = 'default';

        return `
    <?xml version="1.0" encoding="UTF-8"?>
    <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        <product>
            <id_category_default><![CDATA[${id_category_default}]]></id_category_default>
            <id_shop_default><![CDATA[1]]></id_shop_default>
            <id_tax_rules_group><![CDATA[${data.id_tax_rules_group}]]></id_tax_rules_group>
            <product_type><![CDATA[standard]]></product_type>
            <active><![CDATA[${active}]]></active>
            <state><![CDATA[${state}]]></state>
            <redirect_type><![CDATA[${redirect_type}]]></redirect_type>
            <show_price><![CDATA[${show_price}]]></show_price>
            <indexed><![CDATA[${indexed}]]></indexed>
            <available_for_order><![CDATA[${available_for_order}]]></available_for_order>
            <available_date><![CDATA[${available_date}]]></available_date>
            <reference><![CDATA[${reference}]]></reference>
            
            <price><![CDATA[${price}]]></price>
            <wholesale_price><![CDATA[${wholesale_price}]]></wholesale_price>

            <low_stock_threshold><![CDATA[0]]></low_stock_threshold>
            <name>
                <language id="1"><![CDATA[${name}]]></language>
            </name>
            <link_rewrite>
                <language id="1"><![CDATA[${link_rewrite}]]></language>
            </link_rewrite>
            <associations>
                <categories>
                    <category>
                        <id><![CDATA[${data.id_category}]]></id>
                    </category>
                    <category>
                        <id><![CDATA[2]]></id>
                    </category>
                </categories>
            </associations>
        </product>
    </prestashop>
    `.trim();
    }
}
