# Marked Responsive Images

> [!RÉSUMÉ]
>
> |                 |                                                      |
> | --------------- | ---------------------------------------------------- |
> | **Langages**    | JavaScript, Markdown                                 |
> | **Outils**      | [Marked.js](https://github.com/markedjs/marked), NPM |
> | **Compétences** | Dev Web, Packaging                                   |
>
> - 📦 [Package NPM pour une installation facile](https://www.npmjs.com/package/marked-responsive-images)
> - 🗎 [Code source sur GitHub](https://github.com/ELowry/MarkedResponsiveImages)
>
> **Licence:** GNU AGPL 3.0

## Transformer les images Markdown en HTML responsive

Quand j'ai commencé à coder ce portfolio, j'ai choisi [Marked.js](https://github.com/markedjs/marked) afin de pouvoir facilement écrire le contenu. Je voulais utiliser du Markdown "pur" pour qu'il puisse être lu par n'importe quel outil ou système compatible. Pour autant, je ne souhaitais pas pour autant faire une croix sur les bonnes pratiques modernes du web design: il fallait que mon site serve des images responsive avec des balises `<picture>` qui contiennent plusieurs résolutions et les formats pour chaque image.

Il m'a donc fallu coder une extension pour Marked, que j'ai pu rendre publique par la suite. Comme je voulais apprendre les bonnes pratiques en matière de mise à disposition d'outils JavaScript, j'ai publié [Marked Responsive Images](https://github.com/ELowry/MarkedResponsiveImages) sur [NPM](https://www.npmjs.com/package/marked-responsive-images).

## Le fonctionnement

L'extension agit comme un moteur de rendu personnalisé pour Marked. Quand le parseur rencontre un _token_ d'image Markdown classique, l'extension l'intercepte et analyse le nom de fichier de l'image.

En adoptant un format de nom de fichier spécifique, le script extrait les métadonnées sur les tailles et formats d'image disponibles. À partir de ces données, il génère automatiquement soit un élément `<picture>` complet rempli de balises `<source>`, soit une simple balise `<img>` avec un attribut `srcset`.

### Garantir la compatibilité

Le tour de magie de cette approche est que malgré des noms de fichiers un peu complexes (`image__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-546-webp_820-546_1400-933-webp_1400-933_1920-1279-webp_1920-1279_1951-1300-webp_1951-1300.png` par exemple), l'extension permet d'en tirer toutes les informations nécessaires pour construire un ensemble complet de balises HTML à partir de ce seul nom de fichier autrement valide. Le système permet donc d'ajouter des fonctionnalités supplémentaires tout en restant du code Markdown parfaitement fonctionnel, sans ajout de complexité.

## Entre simplicité et fiabilité

Comme j'ai rapidement décidé de rendre l'extension publique et _open source_, j'ai souhaité la rendre aussi simple d'usage que possible tout en m'assurant qu'elle soit adaptable, stable et respectueuse des standards modernes.

Le fonctionnement de l'extension et la manière dont elle est codée et distribuée visent à réduire au minimum le besoin de maintenance tout en garantissant son bon fonctionnement et sa sécurité.

## Conclusion

Marked Responsive Images est un petit utilitaire qui résout un point de friction structurel très précis. Il permet aux développeurs de conserver la nature propre et lisible du Markdown tout en respectant scrupuleusement les standards modernes de performance web et de design responsive.
