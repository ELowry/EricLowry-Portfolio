# Le site web CinQ

## Une plateforme de vente complète et un portail utilisateur·rice PHP sur mesure

> [!RÉSUMÉ]
>
> |                     |                                                      |
> | ------------------- | ---------------------------------------------------- |
> | **Langages**        | PHP, JavaScript, Bash, HTML, CSS                     |
> | **Stack technique** | Statamic, Laravel, Tailwind, Alpine.js, Vite, Guzzle |
> | **Compétences**     | Architecture système, Dev backend, UI/UX             |
>
> 🌐 [fr.playcinq.com](https://fr.playcinq.com)  
> 👤 [account.playcinq.com](https://account.playcinq.com)

### Contexte

La présence web de CinQ fonctionne sur deux niveaux:

1. **La plateforme de vente ([fr.playcinq.com](https://fr.playcinq.com)):**  
   Une vitrine commerciale dynamique multilingue et un système de publication de contenu construits sur [Statamic](https://statamic.com).
2. **Le portail utilisateur·rice ([account.playcinq.com](https://account.playcinq.com)):**  
   Un backend PHP entièrement sur mesure et codé à la main où les utilisateur·rice·s accèdent au client du jeu CinQ, gèrent et administrent leurs comptes ainsi que leurs fiches d'évaluation de performance.

Depuis que j'ai participé à fonder Disruptive Learning Solutions, j'ai créé plus d'une douzaine de sites et de landing pages dédiées pour les divers produits et services que nous avons développés. Tous ont ensuite été remplacés par un site centralisé sur [fr.playcinq.com](https://fr.playcinq.com). Les premières versions étaient construites avec en HTML statique ou avec WordPress. Depuis, j'ai reconstruit l'écosystème web de CinQ en utilisant infrastructure stable et hautement automatisée construite avec Statamic et des éléments de PHP moderne codé à la main. Ce changement m'a permis de contrôler l'ensemble du code, et d'augmenter drastiquement la vitesse de chargement des pages, la sécurité des sites, et d'améliorer massivement l'expérience de développement.  
Même si je reconnais la valeur de WordPress, je suis maintenant totalement convaincu par la liberté de développement que m'offre Statamic.

### Design et expérience utilisateur·rice: joindre deux univers

Le principal défi de conception autour de CinQ a toujours été de créer une identité visuelle qui reste dans la zone de confort du monde professionnel, tout en reflétant la nature moderne et interactive de notre technologie basée sur le jeu vidéo.

- **Le marketing:**  
  Pour designer la principale vitrine en ligne de CinQ, j'ai visé un mélange entre l'esthétique utilisée par les sites web de technologies d'entreprise (design responsive minimaliste, illustrations _flat_, mises en page familières), tout en y ajoutant des éléments plus "piquants" en empruntant subtilement à l'univers visuel du jeu vidéo et des nouvelles technologies.
  Pour ce faire, j'ai délaissé le traditionnel _bleu sur fond blanc_ des sites professionnels, pour opter pour un fond violet sombre avec du texte blanc cassé, rehaussé de touches framboise, des dégradés "_grainy gradient_", une police de caractères sans-serif très propre, et des formes douces et arrondies.
  Un soin tout particulier a été apporté pour créer une identité de marque nette et cohérente; notamment dans le choix de palette de couleurs, de formes et de textures récurrentes, ainsi qu'en adoptant un style typographique unique (comme avec l'utilisation de titres en minuscules).  
  Ce style a été étendu au-delà du site sur l'ensemble des éléments de marketing, des présentations (_slides_), et sur divers éléments visuels couvrant l'ensemble des activités de l'entreprise.

<!-- prettier-ignore -->
| Galerie |  |
| -- | -- |
| ![Capture d'écran de la page d'accueil du site web de CinQ](/assets/images/websites/CinQ/home-page__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran du tableau de bord principal du compte utilisateur](/assets/images/websites/CinQ/account-home__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

- **Le tableau de bord:**  
  Visant une certaine familiarité et la facilité d'utilisation, j'ai conçu le portail utilisateur·rice en me basant sur les interfaces modernes de gestion de services pour entreprise. Cependant, pour éviter de créer un système backend rigide et peu engageant, j'ai utilisé des éléments d'identité visuelle inspirés davantage du langage du jeu vidéo, avec un fond rouge, rose et orange assez percutant et des boîtes de contenu gris foncé. Ce contraste vise à rendre l'ensemble visuellement percutant et intriguant, sans perdre la familiarité d'utilisation et la hiérarchie d'informations nécessaire au bon fonctionnement des interfaces de gestion en ligne.

### Le process de vente et de publication

Passer sur Statamic (qui utilise la technologie [Laravel](https://laravel.com/)) m'a permis d'aller au-delà d'une simple vitrine en ligne statique pour créer une plateforme de vente numérique hautement automatisée.

<!-- prettier-ignore -->
| Galerie: |  |  |  |
| -- | -- | -- | -- |
| ![Capture d'écran du catalogue d'ateliers de CinQ](/assets/images/websites/CinQ/programs__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran d'une fiche d'atelier CinQ](/assets/images/websites/CinQ/workshop__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran d'un calendrier d'inscription aux ateliers CinQ](/assets/images/websites/CinQ/sign-up__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran de la liste des articles et podcasts de CinQ](/assets/images/websites/CinQ/content__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

- **Scraping de données et catalogue d'ateliers dynamique:**  
  Plutôt que d'actualiser manuellement le catalogue d'ateliers de formation ou de m'appuyer sur du JavaScript lourd côté client, j'ai utilisé les capacités et la planification des tâches de Laravel pour que le backend du site puisse scraper régulièrement l'API d'Eventbrite, les flux RSS de Medium, YouTube, etc., afin de stocker automatiquement les données pertinentes dans le système de _collections_ de données de Statamic.  
  Ceci permet à l'ensemble du site de servir de référentiel central pour tout le contenu marketing de CinQ: les articles, le podcast et le calendrier d'ateliers, sans avoir besoin de construire des systèmes dédiés pour remplacer les divers systèmes qui étaient déjà utilisés.
- **Intégration Discord:**  
  Notre équipe utilisait Discord comme outil de communication interne; ce qui était une excellente occasion d'intégrer des webhooks en profondeur dans la logique du site:  
  L'équipe reçoit des alertes Discord automatiques pour les soumissions de formulaires de contact, les nouvelles inscriptions aux formations, et dès que du contenu est mis à jour dans le CMS. Le tout est trié et configuré pour cibler spécifiquement le(s) bon(s) membre(s) de l'équipe.
  Cette intégration s'est aussi avérée très pratique pour surveiller les actions git sur le site, son état de santé (serveur, statistiques d'utilisation, etc.), et pour m'envoyer des alertes concernant les actions à effectuer suite à des mises à jour automatiques de contenu.

### Architecture multilingue et CI/CD

Pour pûblier un site entièrement bilingue (anglais/français) sans dépendre de plugins multisites payants, j'ai construit une série de systèmes articulés autour d'une architecture Git scindée en plusieurs dépôts.

J'ai divisé le site en un dépôt "_core_" commun (framework, configuration, thème) et des dépôts de contenu dédiés pour chaque langue. J'ai ensuite automatisé le tout avec une série de scripts Bash et PowerShell codés pour l'occasion:

![Capture d'écran de l'outil de développement local du site web de CinQ ](/assets/images/websites/CinQ/script__240-186-webp_240-186_400-311-webp_400-311_600-466-webp_600-466_637-495-webp_637-495.jpg)

- **Gestion de CLI en local:**  
  Un script interactif personnalisé PowerShell et Command Prompt Windows permet de gérer un environnement de test local utilisant Vite, de synchroniser les branches traduites, et de passer les mises à jour de packages par un LLM en charge de rédiger les messages de commit.
- **Déploiements sans interruption:**  
  Des tâches cron sur le serveur surveillent activement les branches distantes pour repérer de nouveaux tags de version. Lorsqu'une mise à jour est détectée, le serveur verrouille le système de fichiers, passe le site en mode maintenance, exécute une sauvegarde instantanée de la base de données, récupère les mises à jour des dépôts core et contenu, compile les assets de production via NPM/Composer, et parcourt activement le site pour préchauffer le cache statique avant de réactiver le site entièrement mis à jour.  
  En pratique, ce système permet de pousser des mises à jour sur le site sans aucune intervention manuelle; les éventuelles erreurs ou les avertissements sont automatiquement pris en compte et envoyés sur le Discord de l'équipe.
- **Synchronisation automatisée:**  
  Les modifications de contenu faites directement dans le panneau de contrôle Statamic en direct par des collègues sont automatiquement commitées et poussées vers les dépôts Git sur une branche dédiée. Ça garantit que les dépôts distants et la base de données vivante ne soient jamais désynchronisés, mais également de valider chaque changement pour m'assurer que le site reste toujours pleinement fonctionnel.

### Le portail utilisateur·rice PHP

J'ai codé le site [account.playcinq.com](https://account.playcinq.com) entièrement à la main en PHP pour la gestion des comptes utilisateur·rice·s, des groupes de formation, et des fiches d'évaluation.

<!-- prettier-ignore -->
| Galerie |  |
| -- | -- |
| ![Capture d'écran du système d'évaluation CinQ](/assets/images/websites/CinQ/scorecard__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran d'une page de compte CinQ](/assets/images/websites/CinQ/account__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

Comme le portail doit refléter directement ce qui se déroule dans le jeu codé sous Unity3D, la principale contrainte architecturale était d'assurer la bonne synchronisation entre les données du site et celles du jeu à l'aide d'une API REST. Pour des raisons de sécurité, les identifiants utilisateur·rice·s et les données de jeu ont été isolés dans des bases de données séparées. J'ai conçu une structure d'échange entre le site et la base de données avec Guzzle pour enchaîner intelligemment les requêtes API, en divisant souvent une simple action frontend en 3 ou 4 requêtes backend sécurisées et progressives pouvant compiler les données nécessaires à l'affichage et la modification des données.

J'ai choisi de coder ce site à la main à la fois pour me remettre à niveau en développement backend PHP, et pour garder au maximum le contrôle sur le fonctionnement et la sécurité du portail. J'ai activement évité les lourdes bibliothèques tierces, préférant construire le système d'authentification, de gestion de session et les structures de routage à partir de zéro.

### Conclusion

La construction de ces deux sites a été une expérience d'apprentissage inestimable. Cela m'a permis d'explorer l'utilisation de Statamic, d'expérimenter avec le design front-end, de travailler sur l'automatisation backend en PHP et avec Laravel, et d'explorer l'automatisation et la gestion de serveurs web.
