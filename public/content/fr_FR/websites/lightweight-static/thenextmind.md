# The Next Mind

## Une page web interactive et rétrofuturiste pour un cabinet de conseil stratégique

> [!RÉSUMÉ]
>
> |                     |                                             |
> | ------------------- | ------------------------------------------- |
> | **Langages**        | JavaScript, HTML, CSS                       |
> | **Stack technique** | HTML et JavaScript sur mesure, Firebase     |
> | **Compétences**     | Design d'interaction, Design UI/UX, Dev Web |
>
> 🌐 [stephane-next-mind.web.app](https://stephane-next-mind.web.app/) _(Version archivée de thenextmind.ai)_

![Capture d'écran du message de bienvenue sur la page d'accueil](/assets/images/websites/thenextmind/intro__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg)

### Contexte

J'ai développé ce site pour Stéphane Amarsy quand il a lancé son activité de conseil en intelligence artificielle et transformation organisationnelle.

Vu que les offres de l'entreprise sont conçues comme des expériences immersives qui forcent les dirigeant·e·s à affronter les transformations futures auxquelles iels devront faire face, nous avons décidé que le site devait avoir un aspect unique et futuriste. J'ai donc créé ce qui s'apparente plus à une expérience numérique intrigante et excitante qu'à un site web d'entreprise traditionnel.

### UX et design

![Un collage d'images d'inspiration  ](/assets/images/websites/thenextmind/inspiration__240-270-webp~_400-450-webp~_480-540-webp~.jpg)

Pour capter l'identité de marque du cabinet, j'ai conçu l'interface par un subtil mélange de graphismes inspirés du terminal informatique et de design d'interfaces moderne, épuré et coloré. Pour ce faire, je me suis fortement inspiré d'œuvres de science-fiction et des esthétiques rétrofuturistes qu'on y retrouve.

Le parcours utilisateur·rice commence par une simulation de chat dans un terminal interactif qui demande à l'utilisateur·ice si iel est "prêt·e pour le futur", puis lui demande son prénom. Ce prénom est ensuite injecté dynamiquement dans les textes tout au long du site pour créer un ton très personnalisé et conversationnel.

Pour ajouter une touche visuelle sans surcharger le contenu, j'ai mis en place un log de terminal semi-transparent qui fait office de fond de page, et j'ai disséminé des décorations colorées et animées le long du site, le tout en utilisant de l'art "ASCII" animé via JavaScript.

<!-- prettier-ignore -->
| Galerie |  |
| -- | -- |
| ![Capture d'écran d'une page d'atelier avec la décoration ASCII animée visible](/assets/images/websites/thenextmind/design__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![Capture d'écran de la page de contact, avec Google Forms intégré et un portrait de Stéphane Amarsy dynamiquement traité en dither (tramage)](/assets/images/websites/thenextmind/info__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) |

<!-- prettier-ignore end -->

### Architecture du site

Ce site a été construit sur mon [framework statique léger](/content/fr_FR/websites/lightweight-static/lightweight-static.md) afin de garantir un site rapide et facile à maintenir. J'ai ensuite enrichi cette base avec du JavaScript supplémentaire pour piloter les interactions uniques du site, notamment la séquence d'ouverture du terminal, l'injection du nom d'utilisateur·rice et l'animation des animations ASCII capables de suivre le curseur.
