# InputLayers

## Gestion des inputs simplifiée pour Unity3D

> [!RÉSUMÉ]
>
> |                 |                                   |
> | --------------- | --------------------------------- |
> | **Langages**    | C#, USS                           |
> | **Outils**      | Unity3D, UI Toolkit, Input System |
> | **Compétences** | Dev de jeux, UI, UX               |
>
> - 📦 [Télécharger sur l'Unity Asset Store](https://assetstore.unity.com/packages/slug/259582)
> - 🗎 [Documentation sur GitHub](https://github.com/ELowry/Unity_InputLayers_Documentation)
>
> **Licence:** Extension Unity Asset Store (code source disponible)

Pendant plus de dix ans passés à créer des interfaces dans Unity3D, j'ai régulièrement été frustré par les divers systèmes de gestion des contrôles proposés, surtout lorsque je travaillais sur les interfaces utilisateur⋅rice⋅s. Le nouveau système de contrôles et les Action Maps ont marqué une amélioration nette, mais il manquait quelque chose.

Dans le cadre de plusieurs projets Unity3D sur lesquels je travaillais, j'ai décidé d'ajouter l'élément manquant, à savoir un moyen simple et direct de déterminer quelle interface, quel modal ou quel contrôleur de personnage doit recevoir les inputs à tout moment. J'ai commencé à coder cet outil pour mes propres jeux, mais j'ai vite réalisé qu'il pourrait être utile à de nombreuses personnes. J'en ai donc profité pour tester le processus de publication sur l'Unity Asset Store.

[Une courte vidéo de présentation d'InputLayers en Anglais](https://spectra.video/videos/embed/6jCbpjPbEnjos8prnqi93Z?p2p=0&aspect=56.25%)

## L'architecture

InputLayers est un système de filtrage par calques qui s'ajoute à l'_Input System_ d'Unity. Il évite de devoir activer ou désactiver manuellement la prise en compte des inputs par divers modules à chaque fois qu'un nouveau menu ou une nouvelle mécanique est activée ou ajoutée.

![Conception graphique représentant comment InputLayers filtre les inputs pour que seuls les systèmes et les interfaces que vous voulez réagissent aux commandes entrantes](/assets/images/osd/inputlayers/concept__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-546-webp_820-546_1400-933-webp_1400-933_1920-1279-webp_1920-1279_1951-1300-webp_1951-1300.png)

Pour ce faire, je remplace les `InputActions` par défaut par des `LayeredActions`. Ces actions font toujours appel au système d'inputs standards d'Unity, mais filtrent chaque appel: elles n'enregistrent un input que si le calque qui est spécifiquement assigné est actuellement actif.Le système repose sur une hiérarchie en pile (stack):

### La pile

Quand un élément d'interface ou un système de jeu passe au premier plan, son calque peut être "activé" et poussé au sommet de la pile, récupérant instantanément l'exclusivité des inputs. Une fois fermé, le calque est désactivé (retiré de la pile) et le calque précédent reprend le contrôle en toute transparence.

### Priorités

Afin de servir aux jeux plus complexes, les calques sont organisés en niveaux de Priorité. Ceci garantit que les systèmes critiques prennent toujours le pas sur ceux de moindre priorité, quel que soit l'ordre dans lequel leurs calques sont activés.

## Un outil pour les dévelopeur·euse·s

Pour qu'InputLayers soit utilisable par autrui, j'ai voulu soigner l'expérience utilisateur·rice dans Unity. Ainsi, l'asset offre une expérience sans friction construite par-dessus un système sous-jacent robuste.

![Capture d'écran d'une fenêtre de l'éditeur Unity avec le menu de configuration d'InputLayers ouvert](/assets/images/osd/inputlayers/menu__240-130-webp_240-130_400-216-webp_400-216_600-324-webp_600-324_820-443-webp_820-443_1400-756-webp_1400-756_1920-1037-webp_1920-1037.jpg)

L'utilisation d'un modèle `SingletonScriptableObject` comme colonne vertébrale pour toute la gestion d'états, la validation de la hiérarchie et la diffusion des événements permet d'utiliser l'asset facilement et simultanément avec deux métodes:

![Conception graphique indiquant qu'InputLayers est entièrement fonctionnel via l'éditeur Unity ou via le code](/assets/images/osd/inputlayers/usability__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-546-webp_820-546_1400-933-webp_1400-933_1920-1279-webp_1920-1279_1951-1300-webp_1951-1300.png)

### Via l'_inspecteur_

Pour les game designers, les concepteurs d'interfaces, et le prototypage rapide, j'ai développé des fenêtres d'éditeur Unity personnalisées, des _property drawers_ et des _components_ qui permettent de configurer l'ensemble du système sans la moindre ligne de code. Avec le _component_ `IL_LayeredAction`, il est possible de lier les `InputActions` Unity à un calque (`InputLayer`) spécifique et de déclencher des `UnityEvents` standards directement depuis l'_inspecteur_.

### En codant

Pour une architecture plus optimisée, il suffit d'utiliser la structure sérialisée `LayeredAction` dans un script. Ceci expose un _property drawer_ personnalisé dans l'_inspecteur_ qui permet facilement de choisir un calque et un input auquel réagir, tout en permettant au code de réagir programmatiquement aux _delegates_ C# (comme `onPerformedEvent` par exemple).

### Robustesse

Bien que le cœur d'InputLayers soit sa pile et son système d'événements, garantir un code stable et fiable a nécessité de développer quelques utilitaires spécialisés. J'ai codé des structures de données sur mesure, comme un `PseudoSerializableDictionary` pour étendre les caprices de sérialisation d'Unity, et une `StackableList` qui encadre l'ajout ou le retrait des calques sur la pile. J'ai aussi intégré un système de log étendu qui injecte des en-têtes colorés et formate les objets en JSON de manière lisible, ce qui simplifie grandement le débogage.

## Prise en main

Pour assurer une prise en main facile d'InputLayers, j'ai mis à disposition une [documentation en ligne](https://github.com/ELowry/Unity_InputLayers_Documentation/wiki) complète. J'ai ainsi ajouté que deux scènes d'exemple dans le package pour démontrer le fonctionnement et les cas d'usage de l'asset.
