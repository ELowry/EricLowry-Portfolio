# WinGet Updater

> [!RÉSUMÉ]
>
> |                 |                                                 |
> | --------------- | ----------------------------------------------- |
> | **Langages**    | PowerShell, Inno Setup, Fichier Batch           |
> | **Outils**      | WinGet, Inno Setup                              |
> | **Compétences** | Design graphique, Outils console, UX, Packaging |
>
> - 📦 [Télécharger sur GitHub](https://github.com/ELowry/WinGet-Updater/releases/latest)
> - 🗎 [Code source sur GitHub](https://github.com/ELowry/WinGet-Updater)
>
> **Licence:** MIT

## Automatiser les mises à jour des applications Windows

Comme beaucoup de développeurs sous Windows, mon PC a fini par accumuler pas mal d'applications, de frameworks et de dépendances au fil des années. Ceci n'est pas un problème en soi, mais pour les projets auxquels je ne touche que rarement, leurs dépendances peuvent vite devenir complètement obsolètes. Ajoutez à cela les processus parfois assez catastrophiques où l'application nous informe qu'il faut télécharger la mise à jour fichiers soi-même, ou pire, lorsqu'il n'y a aucune alerte et que c'est à nous de rester au fait des mises à jour.

Il _existe_ bien une solution à ça sous la forme de gestionnaires de paquets. Mais, pour _**certaines**_ choses, il est largement préférable d'automatiser le processus avec des mises à jour en arrière-plan. J'ai donc codé un petit script qui gère les mises à jour automatiques au démarrage de la machine ou de la session avec l'aide du gestionnaire de paquets natif de Windows (WinGet).

Cn simple script PowerShell que j'ai écrit sur mon temps libre est progressivement devenu un outil léger mais assez complet pour l'entretien des machines Windows de mes amis et de ma famille. Même s'il existe des applications similaires avec des interfaces graphiques plus poussées, [WinGet Updater](https://github.com/ELowry/WinGet-Updater) reste volontairement simple, avec une base de code que je maîtrise parfaitement, et que je peux facilement maintenir à jour et étendre ou corriger en quelques minutes.

## Comment ça marche

![Capture d'écran d'une fenêtre de terminal WinGet Updater](/assets/images/osd/winget-updater/winget-updater__240-120-webp_240-120_400-200-webp_400-200_600-300-webp_600-300_820-410-webp_820-410_1280-640-webp_1280-640.jpg)

WinGet Updater est une passerelle qui simplifie l'utilisation de WinGet pour les mises à jour automatiques et manuelles. Le script propose définir quelles applications sont automatiquement mises à jour, totalement ignorées, ou mises à jour manuellement. Il peut être configuré pour fonctionner entièrement en arrière-plan, sans déranger l'utilisateur·rice, ou lancé manuellement à partir du menu démarrer.

WinGet Updater affiche le Terminal Windows uniquement lorsqu'une application non-reconnue ou non-configurée peut être mise à jour. Un mode silencieux est aussi disponible pour empêcher la moindre distraction lorsque le script démarre automatiquement selon des paramètres configurables.

![Capture d'écran de l'écran de configuration de WinGet Updater ](/assets/images/osd/winget-updater/config__240-182-webp_240-182_400-303-webp_400-303_600-454-webp_600-454_754-571-webp_754-571.jpg)

## Simplicité

J'ai voulu garder cet outil aussi simple et direct que possible. J'ai donc choisi de rester sur un applicatif 100% écrit en PowerShell, avec un script dédié pour son installation et sa mise à jour. J'ai donc pu facilement le distribuer avec un installateur Windows standard (généré avec Inno Setup), ainsi qu'une version portable qui peut être lancée avec un simple script `.bat`.

### Arguments de mise à jour des applications

Le menu de configuration du script permet d'attacher des arguments WinGet spécifiques à certaines applications (comme `--interactive`, `--location` ou `--force`) pour les logiciels qui nécessitent des chemins d'installation personnalisés ou une intervention lors de la mise à jour.

### Exécution en ligne de commande

Comme il s'agit d'un script PowerShell, vous pouvez aussi le lancer directement en ligne de commande, sans installation. Des conditions d'exécution sont disponibles sous cette forme, telles que `-Silent` pour outrepasser la fenêtre de contrôle, ou `-Minimal` pour réduire les détails d'exécution dans la console.

### Pratique pour la maintenance à distance

Un de mes objectifs avec cet outil était la gestion des ordinateurs de mes connaissances et des membres de ma famille moins technophiles. Le mode silencieux a été ajouté spécifiquement pour cet usage:  
Lorsqu'il est activé à l'installation, WinGet Updater tourne de manière totalement silencieuse et invisible, en arrière-plan, et met uniquement à jour les applications qui ont été explicitement autorisées pour la mise à jour automatique. En tant qu'administrateur, il me suffit de lancer manuellement le script quand j'interviens sur leurs machines pour approuver ou bloquer les mises à jour en attente et les ajouter à la liste de mise à jour automatique si je le souhaite.
