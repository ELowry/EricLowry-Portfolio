# Obsidian Replace Commands

> [!RÉSUMÉ]
>
> |                 |                                   |
> | --------------- | --------------------------------- |
> | **Langages**    | TypeScript, JavaScript, HTML, CSS |
> | **Outils**      | API Obsidian                      |
> | **Compétences** | Dev Web, Design UI/UX             |
>
> - 📦 [Disponible en tant que plugin communautaire pour Obsidian](https://community.obsidian.md/plugins/replace-commands)
> - 🗎 [Code source sur GitHub](https://github.com/ELowry/obsidian-replace-commands)
>
> **Licence:** 0-BSD

## Remplacements automatiques

![Le logo Obsidian et le texte Replace Commands, et trois bulles lisant plug-in, plugin et amazing plugin](/assets/images/osd/obsidian-replace-commands/cover__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-547-webp_820-547_1200-800-webp_1200-800.jpg)

Dans le cadre de la correction, de la mise en page et de l'édition de plus de 300 articles pour CinQ [sur Medium](https://medium.com/odile-ai), j'ai décidé d'utiliser Obsidian afin de pouvoir mieux organiser et cataloguer l'ensemble. Rapidement, j'ai adopté Obsidian comme outil d'édition principal. Un des avantages du format Markdown utilisé par le logiciel est qu'il permet d'utiliser efficacement les expressions régulières (regex) pour automatiser la mise ne forme, corriger les tics d'écriture récurrents et nettoyer la structure des documents.

J'ai initialement utilisé la fonction de recherche avancée, mais à force de répéter d'innombrable fois les mêmes actions, j'ai décidé de chercher un outil permettant d'automatiser ce processus.  
N'ayant pas trouvé d'outil intégré à Obsidian servant cette fonction, j'ai choisi de coder moi-même un plugin Obsidian adapté à mes besoins. Ce qui a commencé comme un outil codé de manière approximative pour mon usage personnel est rapidement devenu indispensable. J'ai donc choisi d'en peaufiner l'interface et la maniabilité afin de le publier sur la plateforme communautaire officielle d'Obsidian.

## Le concept

Plutôt que d'entrer d'innombrables recherches et remplacements isolés l'une après l'autre, Obsidian Replace Commands permet aux utilisateur·rice·s de créer et de sauvegarder une séquence complète de commandes à exécuter en un seul clic. L'outil vise la simplicité, la flexibilité et peut être configuré très simplement.

<!-- prettier-ignore -->
| Gallery |  |  |
| -- | -- | -- |
| ![Une capture d'écran du menu de configuration d'Obsidian Replace Commands](/assets/images/osd/obsidian-replace-commands/options__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-547-webp_820-547_1400-933-webp_1400-933_1920-1280-webp_1920-1280.jpg) | ![Une capture d'écran du menu de configuration d'Obsidian Replace Commands avec des expressions régulières actives](/assets/images/osd/obsidian-replace-commands/options2__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-547-webp_820-547_1400-933-webp_1400-933_1920-1280-webp_1920-1280.jpg) | ![Une capture d'écran des commandes Obsidian Replace Commands accessibles via le menu clic droit](/assets/images/osd/obsidian-replace-commands/shortcut__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-547-webp_820-547_1400-933-webp_1400-933_1920-1280-webp_1920-1280.jpg) |

<!-- prettier-ignore end -->

### Traitement séquentiel

Obsidian Replace Commands permet de créer des commandes libellées sur mesure (par exemple "Supprimer les références" ou "Orthographe UK vers US") contenant plusieurs actions qui sont exécutées de manière séquentielle.

### Remplacement contextuel

Le plugin s'adapte intelligemment au contexte: si du texte est sélectionné, l'action s'applique uniquement à la sélection; sinon, il traite automatiquement l'ensemble du document.

### Correspondance de texte robuste

Obsidian Replace Commands gère l'ensemble des fonctionnalités des expressions régulières _regex_, y compris les groupes de capture et les modificateurs (`flags`), ainsi que les remplacements de texte standard.

## Expérience utilisateur·rice

Dans l'optique de publier le plugin, j'ai prêté une attention toute particulière ) l'expérience utilisateur·rice d'Obsidian Replace Commands.  
Le système d'expressions régulières est connu pour sa complexité, et nécessite un ensemble d'éléments de contextualisation pour faire sens.

### Prévisualiser les résultats

J'ai inclus une zone qui permet de rédiger un texte de vérification qui est transformé à chaque étape de la commande afin d'illustrer comment chaque étape fonctionne. Ceci permet à la fois de vérifier le bon fonctionnement de l'ensemble de la commande séquentielle, mais également de débusquer les étapes qui présentent des erreurs.

### Transformer en toute sécurité

Comme les actions de remplacement peuvent être destructrices, il était impératif de pouvoir sécuriser l'ensemble en permettant d'annuler instantanément chaque commande `Ctrl+Z`.
