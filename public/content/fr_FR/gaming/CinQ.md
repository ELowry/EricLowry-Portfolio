# CinQ

## Un terrain d'expérimentation multijoueur pour la formation aux soft skills en entreprise

> [!RÉSUMÉ]
>
> |                     |                                                                             |
> | ------------------- | --------------------------------------------------------------------------- |
> | **Plateforme**      | Windows, macOS, Android, Cloud Gaming                                       |
> | **Stack Technique** | Unity3D, C#, Netcode for GameObjects, CI/CD                                 |
> | **Compétences**     | Game Design, UI/UX, Dev de jeux, Outils de l'éditeur Unity, Dev multijoueur |
>
> 🌐 [playcinq.com](https://playcinq.com)

### Contexte

CinQ est la technologie centrale d'une décennie de recherche et de développement visant à exploiter la capacité inhérente des jeux vidéo à favoriser le travail d'équipe, le leadership et la collaboration, pour les appliquer directement au monde de la formation en entreprise.

<!-- prettier-ignore -->
| Galerie |  |
| -- | -- |
| ![Capture d'écran du design d'environnement de CinQ](/assets/images/gaming/cinq/environment__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran de CinQ avec un drone cherchant un personnage en combinaison rouge avec un masque de renard](/assets/images/gaming/cinq/hacker-drone__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

Quand j'ai rejoint l'équipe DLS vers 2014, le projet (qui s'appelait alors "The Heist") était une expérience pensée pour la formation présentielle uniquement. The Heist avait été assemblé à partir d'assets de l'Unity Asset Store, et était conçu pour fonctionner sur du matériel dédié, en réseau local. L'équipe s'est vite rendu compte qu'il faudrait changer d'approche afin d'atteindre un plus large public. Plutôt que de continuer à développer des projets sur mesure, nous avons imaginé un unique jeu vidéo qui pourrait servir de "bac à sable" (_sandbox_) polyvalent pour la formation au travail en équipe, que ce soit à distance ou en formation hybride.

![Photos d'événements The Heist en présentiel avec des personnes utilisant des cartes physiques pour naviguer ](/assets/images/gaming/cinq/heist__240-190-webp_240-190_400-317-webp_400-317_600-476-webp_600-476.jpg)

Ce changement d'approche a nécessité de transformer le prototype conçu pour un environnement spécifique en un jeu multijoueur en ligne ultra-fiable, utilisable de manière fluide sur des ordinateurs d'entreprise peu performants et des appareils mobiles derrière des pare-feux d'entreprise parfois très restrictifs.

### Game design et pédagogie

Mon rôle initial dans l'équipe était centré sur le marketing et la direction du game design. J'ai eu pour mission d'adapter les cadres pédagogiques établis par mes collègues portant sur la psychologie d'équipe, la cognition partagée et le modèle de leadership de Sloan, afin de les traduire en mécaniques de jeu tangibles.

En m'inspirant de jeux collaboratifs tels que _Keep Talking and Nobody Explodes_, _PayDay_ et la série _Rainbow Six_, j'ai conçu les mécaniques fondamentales de CinQ pour mettre à l'épreuve les principales compétences collaboratives (communication, agilité et leadership). Il était également impératif de garantir la non-violence de l'expérience afin de garantir une expérience accessible, professionnelle et adaptée au monde de l'entreprise.

Dans sa version finale, CinQ se présente comme une vaste mission nécessitant 5 participant⋅e⋅s. Le jeu est construit autour de dizaines de mécaniques et de puzzles qui en font un terrain d'expérimentation collaboratif exigeant une forte coopération synchrone et en temps réel. Pour répondre aux besoins des clients, nous y avons ajouté un⋅e assistant⋅e IA basé⋅e sur un modèle de LLM personnalisé, afin d'inclure la collaboration augmentée par l'IA dans notre catalogue de formations.

<!-- prettier-ignore -->
| Galerie: |  |  |  |  |  |
| -- | -- | -- | -- | -- | -- |
| ![Capture d'écran des personnages de CinQ planifiant leur mission dans une camionnette](/assets/images/gaming/cinq/van__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran de la carte en direct de CinQ avec des indicateurs de position des personnages](/assets/images/gaming/cinq/map__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran du système de ventilation de CinQ avec des lasers bloquant le passage](/assets/images/gaming/cinq/ventilation__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran de l'interface de planification de mission de CinQ avec un document montrant les spécifications des drones](/assets/images/gaming/cinq/documents__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Capture d'écran d'un personnage CinQ dans un laboratoire futuriste](/assets/images/gaming/cinq/lab__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Montage montrant comment les cartes du système d'égouts et de ventilation sont générées à partir d'un petit fichier png avec des nœuds codés par couleur et des assets uniques](/assets/images/gaming/cinq/sewers__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

### Construction et déploiement

Transformer The Heist en CinQ avec une petite équipe comprenant seulement deux développeurs et un expert en infrastructure serveurs a été un défi massif qui a duré plusieurs années. En m'appuyant sur les compétences préexistantes en modélisation 3D et en conception d'environnement acquises lors de la création d'[Unstant](/content/fr_FR/gaming/Unstant.md), mon rôle au sein de l'équipe a évolué de développeur UI inexpérimenté à celui de designer et développeur full-stack et gestionnaire de projet.

Au fil de l'évolution du projet, j'ai directement travaillé sur la quasi-totalité des éléments frontend du jeu, l'UX et de l'architecture du client:

- **Systèmes UI et UX:**  
  J'ai designé et codé l'ensemble de l'interface utilisateur⋅rice du jeu, en veillant à ce qu'elle réponde aux besoins des clients du milieu de l'entreprise et pour les personnes non initiées au jeu vidéo.
- **Gestion des inputs:**  
  J'ai conçu un système de gestion des inputs par "calques" qui aide à structurer efficacement l'ensemble des interfaces et systèmes du jeu.  
  J'ai par la suite publié gratuitement ce système sur l'Unity Asset Store sous le nom [InputLayers](/content/fr_FR/gaming/InputLayers.md).
- **Graphismes et environnements:**  
  J'ai travaillé avec un collègue sur la conception des environnements, y compris la modification, l'optimisation et la construction d'une grande partie des assets 3D, textures et matériaux pour que le jeu soit optimisé pour les ordinateurs d'entreprises typiques, qui ne sont que très rarement conçus pour la 3D en temps réel.
- **Audio et localisation:**  
  J'ai implémenté l'ensemble du système son et des bruitages du jeu. J'ai aussi conçu un système de traduction robuste et facilement extensible pour pouvoir déployer CinQ à l'international.

### Défis techniques et architecture système

Passer CinQ à la vitesse supérieure pour gérer un plus grand nombre de participant·e·s a nécessité une refonte du réseau multijoueur et d'un grand nombre d'éléments techniques. Ce processus a eu un grand impact sur mon approche actuelle du dévelopement:

- **Migration vers le multijoueur:**  
  Nous avions initialement utilisé le framework _UNET_ d'Unity (maintenant obsolète) pour The Heist. Afin de transiter vers un système multijoueur en ligne, nous avons entrepris une réécriture massive du code pour migrer l'ensemble vers le nouveau protocole _Netcode for GameObjects_. J'ai participé à cette transition en déboguant la logique réseau et en actualisant l'ensemble des interfaces utilisateur⋅rice et les mécaniques de puzzle multijoueurs.
- **Réseaux d'entreprise et fiabilité:**  
  Déployer un jeu sur des réseaux d'entreprise oblige à combattre les déconnexions fréquentes, les temps de ping excessifs et les pare-feu très stricts qui bloquent régulièrement le trafic UDP/TCP. Nous avons donc développé un ensemble de mécanismes de fiabilisation au-delà des systèmes intégrés au framework Unity pour éviter la perte de données, fluidifier les animations et reconnecter les joueur·euse·ss de manière transparente. Nous avons mis en place un processus de test et de validation strict pour garantir des déploiements fluides lors de nos échanges avec les clients et leurs départements de sécurité informatique.
- **Déploiement et automatisation:**  
  Au-delà de la création du jeu lui-même, j'ai dû établir un pipeline de déploiement pour qu'il soit accessible sur un maximum d'appareils compatibles. Pour automatiser ce processus, j'ai codé une multitude de scripts _bash_ et _PowerShell_ pour compiler, signer et packager automatiquement CinQ sous huit formats différents. Ceci était nécessaire pour pouvoir distribuer l'application sur le Microsoft Store, le Google Play Store et le macOS App Store tout en proposant des installateurs autonomes aux clients. J'ai aussi mis en place le processus de déploiement des builds serveur de jeu sur notre propre infrastructure réseau.

> [!NOTE]
>
> Au-delà de l'application CinQ elle-même, j'ai aussi dirigé les stratégies marketing de la plateforme, l'enregistrement et la publication de podcasts vidéo, et j'ai activement facilité les formations professionnelles coachées. Il est possible d'explorer ces sujets dans la section [Coaching, entrepreneuriat et opérations](/content/fr_FR/coaching-business/coaching-business.md) de ce portfolio.
