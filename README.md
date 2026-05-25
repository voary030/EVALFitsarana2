# vue-prestashop

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Tables PrestaShop concernées (Création de produit)

Lors de la création d'un produit dans PrestaShop, les tables suivantes sont impactées :

| Table                     | Opération   | Description                                        |
| :------------------------ | :---------- | :------------------------------------------------- |
| `ps_product`              | Création    | Données principales du produit.                    |
| `ps_product_shop`         | Création    | Association du produit à la boutique.              |
| `ps_product_lang`         | Création    | Traductions du nom et descriptions.                |
| `ps_stock_available`      | Création    | Gestion des stocks et quantités.                   |
| `ps_layered_price_index`  | Création    | Indexation des prix pour la navigation à facettes. |
| `ps_category_product`     | Création    | Association du produit à ses catégories.           |
| `ps_configuration`        | Mise à jour | Mise à jour des jetons ou configurations globales. |
| `ps_layered_filter_block` | Truncate    | Réinitialisation des blocs de filtres.             |
