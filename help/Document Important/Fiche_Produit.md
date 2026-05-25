
## Table des Matières

1. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService|Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService]]
	1. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#1. Contexte métier (Fichier 1)|1. Contexte métier (Fichier 1)]]
	2. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#2. Endpoint|2. Endpoint]]
		1. [[#2. Endpoint#Méthodes supportées|Méthodes supportées]]
	3. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#3. Paramètres de requête utiles|3. Paramètres de requête utiles]]
	4. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#4. Champs principaux de la ressource `products`|4. Champs principaux de la ressource `products`]]
		1. [[#4. Champs principaux de la ressource `products`#Traitement des prix et taxes|Traitement des prix et taxes]]
		2. [[#4. Champs principaux de la ressource `products`#Traitement des catégories|Traitement des catégories]]
	5. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#5. Schéma XML — Création d'un produit (POST)|5. Schéma XML — Création d'un produit (POST)]]
	6. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#6. Schéma XML — Réponse après création (201 Created)|6. Schéma XML — Réponse après création (201 Created)]]
	7. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#7. Schéma JSON — Réponse GET (output_format=JSON)|7. Schéma JSON — Réponse GET (output_format=JSON)]]
	8. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#8. Mise à jour du stock (après création du produit)|8. Mise à jour du stock (après création du produit)]]
	9. [[#Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService#9. Déclinaisons (`combinations`) — Fichier 2|9. Déclinaisons (`combinations`) — Fichier 2]]

# Fiche_Produit.md — Ressource `products` · PrestaShop 8.x WebService

## 1. Contexte métier (Fichier 1)

| reference | nom       | prix_ttc | Taxe    | categorie  | prix_achat | date_dispo   |
|-----------|-----------|----------|---------|------------|------------|--------------|
| T_01      | Tshirt    | 12,5     | 11,65 % | Akanjo     | 8,5        | 01/12/2025   |
| P_01      | Pantalon  | 18,99    | 11,65 % | Akanjo     | 14,33      | 02/05/2026   |
| C_03      | Casquette | 5        | 5,60 %  | Accessoire | 2          | 08/05/2026   |
| M_02      | Montre    | 56       | 5,60 %  | Accessoire | 40         | 08/05/2026   |

Les produits T_01 et P_01 possèdent des déclinaisons (Fichier 2) ; C_03 et M_02 n'en ont pas.

---

## 2. Endpoint

```
Base URL : https://{SHOP_DOMAIN}/api/products
Auth     : Basic Auth — clé API en username, mot de passe vide
```

### Méthodes supportées

| Méthode | URL                          | Usage                                 | Code retour |
|---------|------------------------------|---------------------------------------|-------------|
| GET     | `/api/products`              | Liste les IDs de tous les produits    | 200         |
| GET     | `/api/products/{id}`         | Lit un produit complet                | 200         |
| GET     | `/api/products?schema=blank` | Gabarit XML vide pour création        | 200         |
| GET     | `/api/products?schema=synopsis` | Décrit les types et contraintes    | 200         |
| POST    | `/api/products`              | Crée un produit                       | 201         |
| PUT     | `/api/products/{id}`         | Met à jour un produit (corps complet) | 200         |
| DELETE  | `/api/products/{id}`         | Supprime un produit                   | 200         |

> **Important :** PrestaShop 8.x retourne par défaut du XML. Pour obtenir du JSON en sortie, ajouter `?output_format=JSON`. Le corps des requêtes POST/PUT doit toujours être en XML.

---

## 3. Paramètres de requête utiles

```
?display=full                         → tous les champs
?display=[id,reference,price]         → champs sélectionnés
?filter[reference]=T_01               → filtre exact
?filter[date_add]=[2026-01-01|2026-12-31]  → plage de dates
?limit=0,50                           → pagination : 50 résultats depuis l'offset 0
?sort=[date_add_DESC]                 → tri
```

---

## 4. Champs principaux de la ressource `products`

| Champ                  | Type      | Requis | Description                                      |
|------------------------|-----------|--------|--------------------------------------------------|
| `id`                   | integer   | Auto   | Identifiant généré par PrestaShop                |
| `id_category_default`  | integer   | Oui    | ID de la catégorie principale                    |
| `id_tax_rules_group`   | integer   | Oui    | ID du groupe de règles de taxe                   |
| `reference`            | string 64 | Non    | Référence interne (T_01, P_01…)                  |
| `price`                | decimal   | Oui    | Prix HT (PrestaShop stocke **hors taxes**)       |
| `wholesale_price`      | decimal   | Non    | Prix d'achat                                     |
| `available_date`       | date      | Non    | Date de disponibilité (`YYYY-MM-DD`)             |
| `active`               | boolean   | Non    | Produit actif (1) ou inactif (0)                 |
| `name`                 | multilang | Oui    | Nom du produit (par langue)                      |
| `description`          | multilang | Non    | Description longue                               |
| `description_short`    | multilang | Non    | Description courte                               |
| `link_rewrite`         | multilang | Oui    | Slug URL (lettres minuscules, tirets)            |

### Traitement des prix et taxes

PrestaShop stocke le prix **HT** dans le champ `price`. Le prix TTC est calculé à la volée via `id_tax_rules_group`.

```
prix_HT = prix_TTC / (1 + taux_taxe)

Exemples fichier 1 :
  T_01 : 12,5 / 1,1165 ≈ 11,20 HT  →  id_tax_rules_group correspondant à 11,65 %
  C_03 : 5    / 1,0560 ≈ 4,73  HT  →  id_tax_rules_group correspondant à  5,60 %
```

Pour retrouver l'ID du groupe de taxe :

```
GET /api/tax_rule_groups
GET /api/tax_rules?filter[id_tax_rules_group]={ID}
```

### Traitement des catégories

```
GET /api/categories                          → liste toutes les catégories
GET /api/categories?filter[name]=Akanjo     → cherche par nom
```

L'ID retourné est utilisé dans `id_category_default` et dans l'association `<categories>`.

---

## 5. Schéma XML — Création d'un produit (POST)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product>
    <id_category_default></id_category_default>
    <id_tax_rules_group></id_tax_rules_group>
    <reference></reference>
    <supplier_reference></supplier_reference>
    <price></price>
    <wholesale_price></wholesale_price>
    <available_date></available_date>
    <active></active>
    <type></type>
    <minimal_quantity></minimal_quantity>
    <name>
      <language id="1"></language>
    </name>
    <description>
      <language id="1"></language>
    </description>
    <description_short>
      <language id="1"></language>
    </description_short>
    <link_rewrite>
      <language id="1"></language>
    </link_rewrite>
    <associations>
      <categories>
        <category>
          <id></id>
        </category>
      </categories>
    </associations>
  </product>
</prestashop>
```

## 6. Schéma XML — Réponse après création (201 Created)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product>
    <id><![CDATA[42]]></id>
    <id_category_default xlink:href="https://{SHOP}/api/categories/2">
      <![CDATA[2]]>
    </id_category_default>
    <id_tax_rules_group xlink:href="https://{SHOP}/api/tax_rule_groups/1">
      <![CDATA[1]]>
    </id_tax_rules_group>
    <reference><![CDATA[T_01]]></reference>
    <price><![CDATA[11.205084]]></price>
    <wholesale_price><![CDATA[8.5]]></wholesale_price>
    <active><![CDATA[1]]></active>
    <available_date><![CDATA[2025-12-01]]></available_date>
    <name>
      <language id="1"><![CDATA[Tshirt]]></language>
    </name>
    <link_rewrite>
      <language id="1"><![CDATA[tshirt]]></language>
    </link_rewrite>
    <associations>
      <categories>
        <category xlink:href="https://{SHOP}/api/categories/2">
          <id><![CDATA[2]]></id>
        </category>
      </categories>
      <stock_availables>
        <stock_available xlink:href="https://{SHOP}/api/stock_availables/1">
          <id><![CDATA[1]]></id>
          <id_product_attribute><![CDATA[0]]></id_product_attribute>
        </stock_available>
      </stock_availables>
    </associations>
  </product>
</prestashop>
```

## 7. Schéma JSON — Réponse GET (output_format=JSON)

```json
{
  "product": {
    "id": 42,
    "id_category_default": "2",
    "id_tax_rules_group": "1",
    "reference": "T_01",
    "price": "11.205084",
    "wholesale_price": "8.500000",
    "active": "1",
    "available_date": "2025-12-01",
    "name": [
      { "id": "1", "value": "Tshirt" }
    ],
    "link_rewrite": [
      { "id": "1", "value": "tshirt" }
    ],
    "associations": {
      "categories": [
        { "id": "2" }
      ],
      "stock_availables": [
        { "id": "1", "id_product_attribute": "0" }
      ]
    }
  }
}
```

---

## 8. Mise à jour du stock (après création du produit)

PrestaShop génère automatiquement un enregistrement `stock_available` à la création. Il faut ensuite le mettre à jour :

```
GET /api/stock_availables?filter[id_product]={ID_PRODUIT}&display=full
```

```xml
<!-- PUT /api/stock_availables/{ID_STOCK} -->
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <stock_available>
    <id></id>
    <id_product></id_product>
    <id_product_attribute></id_product_attribute>
    <id_shop></id_shop>
    <quantity></quantity>
    <depends_on_stock></depends_on_stock>
    <out_of_stock></out_of_stock>
  </stock_available>
</prestashop>
```

---

## 9. Déclinaisons (`combinations`) — Fichier 2

Les produits T_01 et P_01 ont des déclinaisons. Après création du produit principal, chaque déclinaison est créée via `/api/combinations`.

**Workflow :**
1. `GET /api/product_options` → identifier l'attribut "taille" ou "couleur"
2. `GET /api/product_option_values` → identifier les valeurs (ngoza, kely, mainty, fotsy)
3. `POST /api/combinations` avec `id_product` et les `product_option_values`
4. `PUT /api/stock_availables/{id}` → mettre le stock de la déclinaison

```xml
<!-- POST /api/combinations -->
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <combination>
    <id_product></id_product>
    <reference></reference>
    <price></price>
    <minimal_quantity></minimal_quantity>
    <default_on></default_on>
    <associations>
      <product_option_values>
        <product_option_value>
          <id></id>
        </product_option_value>
      </product_option_values>
    </associations>
  </combination>
</prestashop>
```

> Le champ `price` d'une déclinaison est un **delta de prix** (positif ou négatif) par rapport au prix du produit parent.
