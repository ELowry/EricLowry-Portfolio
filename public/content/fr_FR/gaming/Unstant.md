# Unstant

> [!RÉSUMÉ]
>
> |                 |                                                                                                                                                            |
> | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | **Moteur**      | Unreal Engine 4                                                                                                                                            |
> | **Compétences** | Architecture, Dessin technique, Game Design, Dev de jeux, Modélisation 3D, Texturing, Shaders, Sound Design, Montage vidéo, Design graphique, Design print |
>
> - 🎮 [Télécharger Unstant](https://drive.google.com/file/d/0B7AmgjkhtydVRE5WREJLdUJCZTA/view?resourcekey=0-lW3gwxkJgPlf_Q5aSntzpA) (dernière version développement en date).

![Vue artistique d'un désert jaune avec une bouée rouge](/assets/images/gaming/unstant/header__240-135-webp~_400-225-webp~_600-337-webp~_820-461-webp~_1400-787-webp~_1875-1054-webp~.jpg)

Aujourd'hui encore, je suis convaincu que les aspects créatifs de la conception de jeux vidéo (_game design_) et de l'architecture ont bien plus en commun qu'on ne l'admet généralement. Les deux nécessitent de composer avec un ensemble de règles et de contraintes relativement rigides, dans le but de créer des espaces et des environnements destinés à être expérimentés, explorés et habités.

C'était d'ailleurs le sujet central de mon [mémoire de fin d'études](https://drive.google.com/file/d/1iyW6xYoxgSkLgeKn_l_UCIZwow0XkGu6/view?usp=sharing), qui portait sur ce que le jeu vidéo peut apporter à l'architecture et aux architectes. Tout naturellement, pour ce projet de fin d'études (PFE) en architecture, je me suis associé à un camarade de promotion avec un intérêt partagé pour ces thématiques et, afin de mettre la théorie en pratique, nous avons créé un jeu vidéo de A à Z.

À mi-chemin entre l'essai architectural et l'exercice de développement et de _game design_, Unstant était notre tentative d'appliquer les méthodes et les concepts de la conception spatiale au monde virtuel.

[Voir la bande-annonce](https://spectra.video/videos/embed/dk7DvpkYYMWMMrbJNgo1f8?p2p=0&aspect=56.25%)

## Le concept

L'année 2015 était déjà fortement marquée par la transition de la société due aux réseaux sociaux et par une perception hyper-connectée, "caméra au poing", de l'espace et du quotidien (Instagram, Vine, vlogs, etc.). Unstant se voulait être une exploration viscérale de la façon dont notre esprit occulte les routines banales et les espaces de transition, pour plutôt compresser le temps autour de grands moments hypercondensés et irréels, liés à des lieux ou à des expériences mémorables. Comment créer des espaces et des expériences qui attirent l'attention sur ces "Unstants" (instants de la vie quotidienne perdus ou oubliés qui ne resteront pas gravés dans notre mémoire)?

Nous avons donc créé un _walking simulator_ à la première personne qui explore des espaces banals du quotidien (une chambre, un salon, une cave, une gare…) pour les transformer en expériences virtuelles surréalistes et exceptionnelles. En jouant sur l'écoulement du temps et la contiguïté des espaces, le jeu pousse le joueur à questionner la manière dont notre esprit recoud des souvenirs isolés pour donner du sens à la réalité.

<!-- prettier-ignore -->
| Galerie: |  |  |  |  |
| -- | -- | -- | -- | -- |
| ![Capture d'écran du niveau du désert](/assets/images/gaming/unstant/desert__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![Capture d'écran du niveau de la chambre](/assets/images/gaming/unstant/room__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![Capture d'écran du niveau du salon](/assets/images/gaming/unstant/livingroom__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![Capture d'écran du niveau de la cave](/assets/images/gaming/unstant/basement__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![Capture d'écran du niveau du cimetière](/assets/images/gaming/unstant/cemetary__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) |

<!-- prettier-ignore end -->

## Le travail

Créer un jeu vidéo complet en partant de zéro, avec très peu d'expérience préalable en développement, a été un formidable exercice de multidisciplinarité. Cela m'a permis d'acquérir une expérience précieuse dans presque tous les domaines de la chaîne de production d'un jeu:

> [!INFO]
>
> À l'exception des outils et utilitaires par défaut fournis avec Unreal Engine 4, aucun outil ou asset externe n'a été utilisé pour ce projet.

### Développement et programmation

Étant le développeur du duo, je me suis chargé de construire Unstant dans Unreal Engine 4, en utilisant le système de programmation visuelle Blueprint pour coder:

![Capture d'écran d'une section du blueprint de code des shaders  ](/assets/images/gaming/unstant/code__240-123-webp~_400-205-webp~.jpg)

- les mouvements du joueur et les interactions avec l'environnement
- l'interface utilisateur·rice (UI), y compris des sous-titres synchronisés avec l'audio
- un système audio dynamique (effets sonores spatialisés, bande-son multipiste)
- des assets 3D paramétriques (murs/portes générés le long d'un chemin, génération d'arbres et de végétation, génération de bibliothèques, modèles et textures de pierres tombales générés aléatoirement)

### Modélisation 3D et conception des environnements

À partir de relevés architecturaux et de mesures physiques précises, j'ai modélisé et optimisé les maillages 3D pour les environnements et les objets (_props_) du jeu.

![Aperçu de plusieurs étapes du processus de modélisation 3D pour le jeu](/assets/images/gaming/unstant/3Dprocess__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg)

### Textures et shaders

Inspirés par l'esthétique des diagrammes et des croquis d'architecture, nous avons décidé d'utiliser un mélange de textures peintes à la main (aquarelles et dessins au stylo numérisés) associées à diverses astuces de shaders (filtre de Sobel, détection des contours basée sur la profondeur, et fondu entre les canaux r/v/b/a des textures en fonction de la profondeur et de la luminosité) pour créer le style graphique si particulier du jeu.

![Exemples du travail sur les matériaux et les shaders, incluant des textures peintes à la main, des cartes de textures hachurées et des effets d'éclairage hachurés](/assets/images/gaming/unstant/materials__240-73-webp~_400-121-webp~_600-181-webp~_820-248-webp~_1400-423-webp~_1920-580-webp~.jpg)

Nous avons accordé un soin tout particulier au mélange de l'ombrage "croquis" en espace écran (_screen-space_) et des matériaux de croquis appliqués aux objets, afin de recréer un rendu visuel 2D au sein d'un espace 3D entièrement explorable.

### Sound design et doublage

Tandis que mon partenaire de projet composait et enregistrait la musique du jeu, j'ai enregistré, masterisé et implémenté toute la conception sonore (_sound design_), les bruitages et les effets sonores. J'ai également enregistré, monté et intégré les monologues vocaux en anglais (avec des sous-titres en français) qui accompagnent la narration environnementale tout au long du jeu.

### Diagrammes et maquettes d'architecture

S'agissant d'un projet de fin d'études (PFE) en architecture, une part importante du travail a été consacrée à la production de multiples plans et diagrammes architecturaux, ainsi qu'à la réalisation d'une immense maquette physique à l'échelle rassemblant l'ensemble des espaces virtuels.

<!-- prettier-ignore -->
| Galerie: |  |  |  |  |  |
| -- | -- | -- | -- | -- | -- |
| ![Présentation architecturale du niveau d'introduction du désert](/assets/images/gaming/unstant/intro___240-339-webp~_400-565-webp~_600-848-webp~_820-1159-webp~_1400-1978-webp~_1600-2261-webp~.jpg) | ![Présentation architecturale du niveau de la chambre](/assets/images/gaming/unstant/bedroom___240-339-webp~_400-566-webp~_600-848-webp~_820-1159-webp~_1400-1979-webp~_1600-2262-webp~.jpg) | ![Présentation architecturale du niveau du salon](/assets/images/gaming/unstant/livingroom___240-339-webp~_400-566-webp~_600-849-webp~_820-1160-webp~_1400-1980-webp~_1600-2263-webp~.jpg) | ![Présentation architecturale du niveau de la cave](/assets/images/gaming/unstant/basement___240-339-webp~_400-566-webp~_600-848-webp~_820-1159-webp~_1400-1979-webp~_1600-2262-webp~.jpg) | ![Présentation architecturale du niveau du cimetière](/assets/images/gaming/unstant/cemetary___240-339-webp~_400-566-webp~_600-848-webp~_820-1159-webp~_1400-1979-webp~_1600-2262-webp~.jpg) | ![Présentation architecturale du niveau de la gare](/assets/images/gaming/unstant/station___240-339-webp~_400-566-webp~_600-848-webp~_820-1159-webp~_1400-1979-webp~_1600-2262-webp~.jpg) |

<!-- prettier-ignore end -->

Ces documents ont exigé un effort particulier pour adapter le langage traditionnel du dessin d'architecture aux spécificités de la conception d'environnements 3D pour le jeu vidéo, telles que le chevauchement d'espaces, la téléportation du joueur ou les boucles spatiales.

<!-- prettier-ignore -->
| Galerie: |  |  |  |  |
| -- | -- | -- | -- | -- |
| ![Vue de dessus des plans architecturaux d'Unstant, imprimés sur des feuilles transparentes pour rendre compte du chevauchement des espaces](/assets/images/gaming/unstant/plans1__240-239-webp~_400-398-webp~_600-596-webp~_820-815-webp~_1023-1017-webp~.jpg) | ![Photographie détaillée du chevauchement des plans transparents pour Unstant](/assets/images/gaming/unstant/plans2__240-238-webp~_400-397-webp~_600-595-webp~_820-814-webp~_1032-1024-webp~.jpg) | ![Photo de la section cylindrique des niveaux d'Unstant, rendant compte de l'espace en boucle](/assets/images/gaming/unstant/section__240-136-webp~_400-226-webp~_600-339-webp~_820-464-webp~_1400-792-webp~_1582-895-webp~.jpg) | ![Photo de la maquette d'Unstant](/assets/images/gaming/unstant/model1__240-107-webp~_400-179-webp~_600-268-webp~_820-366-webp~_1400-626-webp~_1600-715-webp~.jpg) | ![Détail de la maquette d'Unstant, avec des tubes transparents représentant la téléportation du joueur](/assets/images/gaming/unstant/model2__240-241-webp~_400-402-webp~_600-604-webp~_682-686-webp~.jpg) |

<!-- prettier-ignore end -->
