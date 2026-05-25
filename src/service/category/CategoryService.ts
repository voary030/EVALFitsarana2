import { CategoryApi } from "@/api/category/CategoryApi"
import type { Category } from "@/types/category"
import { parseCategoryListXml, parseCategoryXml } from '@/mappers/category'


const getCurrentPrestaDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export const CategoryService = {

    async create(nom: string): Promise<Category | undefined> {
        const exist = await this.getByName(nom.trim());
        if (exist) {
            throw new Error("Un categorie avec ce libelle (" + nom.trim() + ") existe deja");
        }
        const xmlBody = this.buildXml(nom.trim());
        const cat = await CategoryApi.create(xmlBody);
        return parseCategoryXml(cat);
    },

    async getByName(name: string): Promise<Category | undefined> {
        const catXml = await CategoryApi.getByName(name.trim());
        const cats = parseCategoryListXml(catXml)
        return cats[0];
    },

    async getById(id: number | string): Promise<Category | undefined> {
        try {
            const catXml = await CategoryApi.getById(String(id));
            const cat = parseCategoryXml(catXml);
            return cat;
        } catch (error) {
            console.error(`Erreur lors de la récupération de la catégorie ${id}:`, error);
            return undefined;
        }
    },

    buildXml(name: string): string {
        name = name.trim();
        const id_parent = 2;
        const active = 1;
        const id_shop_default = 1;
        const is_root_category = 0;
        const now = getCurrentPrestaDate();
        const description = "<p>Desc " + name + " </p>";
        const add_description = "<p>Additional Desc " + name + " </p>";
        const meta_title = "Meta title categorie " + name;
        const meta_desc = "Meta desc categorie " + name;
        const meta_key = "Meta key categorie " + name;
        // <position></position>

        const xmlBody = `
        <?xml version="1.0" encoding="UTF-8"?>
            <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
                <category>
                    <id_parent>${id_parent}</id_parent>
                    <active>${active}</active>
                    <id_shop_default>${id_shop_default}</id_shop_default>
                    <is_root_category>${is_root_category}</is_root_category>

                    <date_add>${now}</date_add>
                    <date_upd>${now}</date_upd>
                    <name>
                        <language id="1"><![CDATA[${name}]]></language>
                    </name>
                    <link_rewrite>
                        <language id="1"><![CDATA[${name.toLowerCase()}]]></language>
                    </link_rewrite>
                    <description>
                        <language id="1"><![CDATA[${description}]]></language>
                    </description>
                    <additional_description>
                        <language id="1"><![CDATA[${add_description}]]></language>
                    </additional_description>
                    <meta_title>
                        <language id="1"><![CDATA[${meta_title}]]></language>
                    </meta_title>
                    <meta_description>
                        <language id="1"><![CDATA[${meta_desc}]]></language>
                    </meta_description>
                    <meta_keywords>
                        <language id="1"><![CDATA[${meta_key}]]></language>
                    </meta_keywords>
                </category>
            </prestashop>
        `.trim();
        return xmlBody;
    },

    async getAll(): Promise<Category[] | []> {
        try {
            const categoriesXml = await CategoryApi.getAll();
            const categories = parseCategoryListXml(categoriesXml);
            return categories;
        } catch (err: any) {
            throw err;
        }
    },

    // tohizana
    async deleteMultiple() {
        const ids: string[] = []
        try {
            const categories = await this.getAll();
            if (categories.length >= 2) {
                const deleteMultiple = await CategoryApi.deleteMultiple(ids);
                return deleteMultiple;
            }
        } catch (err: any) {
            throw err;
        }
    },

    async count(): Promise<number> {
        try {
            return (await this.getAll()).length;
        } catch (err: any) {
            throw err;
        }
    },
}