# StadiaIcons

## Raccourcis dynamiques pour le Cloud Gaming

> [!RÉSUMÉ]
>
> |                 |                                           |
> | --------------- | ----------------------------------------- |
> | **Langages**    | JavaScript, HTML, CSS                     |
> | **Outils**      | Firebase Hosting, Firebase Functions, PWA |
> | **Compétences** | Design graphique, Dev web, Webdesign      |
>
> - 🗄 [Archive du site disponible](https://elowry.github.io/StadiaIcons/)
> - 🗎 [Code source sur GitHub](https://github.com/ELowry/StadiaIcons)
>
> **Licence:** MIT

![Bannière StadiaIcons de 2022 avec le logo StadiaIcons et les icônes de divers jeux ](/assets/images/osd/StadiaIcons/banner__240-126-webp_240-126_400-210-webp_400-210_600-315-webp_600-315_800-420-webp_800-420.jpg)

Le lancement de Google Stadia en 2019 m'a intrigué, et je me suis pris d'un grand intérêt pour la technologie du cloud gaming et la flexibilité d'usage qu'elle propose. Malgré quelques petits défauts au lancement, la plateforme était parfaitement adaptée à mon usage. Comme j'utilise Firefox comme navigateur principal et que Stadia nécessitait un navigateur basé sur Chromium pour fonctionner sur Windows, le lancement des jeux était toujours un peu plus complexe que nécessaire. Il était possible de créer des raccourcis spécifiques pour lancer un navigateur Chromium sur une adresse donnée, mais il fallait que je fournisse moi-même l'icône pour que le raccourci soit facilement identifiable. De plus, pour certains jeux, aucune icône n'était trouvable en ligne, et j'ai parfois dû contacter directement les développeurs pour obtenir des assets officiels.

Une communauté de développeur·euse·s assez soudée s'est formée autour de Stadia et du fait de créer des extensions pour le navigateur afin d'améliorer l'interface et l'expérience de jeu sur la plateforme. C'est en participant à ces projets que j'ai décidé de transformer ma frustration quant au manque de raccourcis natifs à Stadia pour en faire un projet open source. C'était ma première vraie expérience avec le JavaScript côté serveur sous Firebase, et les Progressive Web Apps (PWA).

## Design des icônes

![Aperçu des designs StadiaIcons pour Disco Elysium](/assets/images/osd/StadiaIcons/disco__240-145-webp_240-145_400-241-webp_400-241_600-361-webp_600-361_820-494-webp_820-494_1400-843-webp_1400-843_1411-850-webp_1411-850.jpg)

La majeure partie du travail fourni sur ce projet se trouvait dans la création et la publication d'une vaste bibliothèque d'icônes dans un style unifié. Je souhaitais m'assurer que toutes les icônes aient une cohérence visuelle et soient immédiatement reconnaissables sans avoir à redessiner moi-même les visuels des jeux. J'ai donc repris le logo de la plateforme Stadia et sa palette de couleurs comme structure de base pour transformer les artworks existants en icônes fonctionnelles. En tout, j'ai créé des icônes pour la quasi-totalité des jeux disponibles sur Stadia, soit plus de 280 jeux. Avec les variantes de couleurs et de formes, le projet a fini par compter plus de 1 120 images uniques.

La principale difficulté de cette tâche a été de trouver des images avec une résolution suffisante et une mise en page adaptée à ce format spécifique. Je voulais m'assurer que chaque jeu puisse immédiatement être reconnaissable, tout en créant des icônes visuellement attrayantes sur l'ensemble du catalogue.

## PWA dynamiques et architecture firebase

Pour garder l'UX aussi propre et simple que possible, j'ai mis en place un système relativement complexe pour générer dynamiquement des Progressive Web Apps. Ainsi, les utilisateur·rice·s pouvaient "installer" une PWA hébergée sur Firebase capable de lancer immédiatement un jeu Stadia de manière totalement invisible.

![Capture d'écran de nombreuses icônes de la page web StadiaIcons Shortcuts](/assets/images/osd/StadiaIcons/gallery__240-65-webp_240-65_400-108-webp_400-108_600-162-webp_600-162_820-221-webp_820-221_1400-377-webp_1400-377_1419-382-webp_1419-382.jpg)

Quand un·e utilisateur·rice demandait un raccourci, une fonction cloud Firebase générait dynamiquement une page web unique et un fichier `manifest.json` à la volée, en parsant des paramètres d'URL spécifiques et en les mappant à une base de données `refs.json` centrale. Pour ce faire, j'ai dû exploiter une multitude de fonctionnements spécifiques aux PWA et aux _service workers_ à une époque où les ressources en ligne sur ces sujets étaient encore assez rares.

### Intégration middleware

La communauté a rapidement adopté cet outil, et j'ai eu l'occasion de collaborer avec d'autres projets comme [Stadia Enhanced](https://github.com/ChristopherKlay/StadiaEnhanced) (l'extension de navigateur Stadia la plus utilisée) pour permettre aux joueur·euse·s de générer et télécharger les raccourcis StadiaIcons directement depuis l'interface web Stadia.

## Postérité

Stadia a fermé ses portes en 2023, mais j'ai conservé l'ensemble du système StadiaIcons sur GitHub afin de préserver les 1 120 images, et parce que Stadia, malgré ses défauts, représente un moment fascinant dans l'histoire des technologies du jeu vidéo. Je pense qu'il est important de conserver une trace des outils, des communautés et des expérimentations qui en ont résulté.
