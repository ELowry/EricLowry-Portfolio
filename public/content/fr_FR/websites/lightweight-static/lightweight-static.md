# Framework statique léger

## Une architecture sur mesure pour des sites web nécessitant peu de maintenance

> [!RÉSUMÉ]
>
> |                     |                                                 |
> | ------------------- | ----------------------------------------------- |
> | **Langages**        | JavaScript, HTML, CSS                           |
> | **Stack technique** | HTML et JavaScript sur mesure, Firebase Hosting |
> | **Compétences**     | Ingénierie web, Architecture système            |

À de nombreuses reprises, des client·e·s m'ont contacté parce qu'ils avaient besoin de pages web extrêmement simples et nécessitant très peu de maintenance. Ce cas de figure ne nécessite pas l'utilisation d'un CMS complexe comme WordPress, et il est important d'éviter que lae client·e air à gérer la maintenance du site, les mises à jour de base de données ou d'encourir des frais d'hébergement élevés.

Au fil des projets, j'ai construit une base de code statique réutilisable et entièrement faite main que j'héberge généralement sur Firebase, qui reste le plus souvent gratuit pour les sites à faible trafic.  
Sans aucune dépendance ni système de gestion de contenu utilisateur·rice, cette architecture privilégie la simplicité et la rapidité, offrant une base ultra-solide qui ne nécessite presque aucun entretien.

### Système de traduction

Même si l'architecture de base est volontairement minimaliste, plusieurs projets ont nécessité de fonctionner en plusieurs langues. Pour éviter d'utiliser des plugins externes lourds et nécessitant de la maintenance, j'ai développé mon propre système de traduction intégré nativement au framework:

- La traduction est gérée en combinant des fichiers de données JSON et des attributs `data` HTML avec du JavaScript pour appliquer dynamiquement les textes à la volée.
- Le script gère automatiquement le remplacement d'iFrames ou de médias externes (comme des formulaires Google ou des vidéos YouTube localisés) et la mise à jour des éléments d'en-tête (headers).
- Les paramètres du navigateur sont utilisés pour détecter la langue préférée de l'utilisateur·rice au chargement de la page. Cette préférence est ensuite sauvegardée dans le stockage local du navigateur, et peut être changée à l'aide d'un simple bouton de choix de la langue.

Ce framework a servi de fondation technique fiable pour plusieurs de mes projets web. J'ai ainsi pu consacrer l'ensemble de mes efforts sur la création de designs visuels intéressants et d'expériences utilisateur·rice·s adaptées aux besoins de chaque client·e:

**[The Next Mind](/content/fr_FR/websites/lightweight-static/thenextmind.md):**  
La vitrine en ligne d'une petite entreprise française de coaching et de conseil spécialisée dans l'IA et la préparation des entreprises pour le futur.

**[Luzech](/content/fr_FR/websites/lightweight-static/luzech.md):**  
Une page personnelle à l'identité graphique unique pour un consultant et expert en _data_ basé au Royaume-Uni.

**[KoalaKrash](/content/fr_FR/websites/lightweight-static/koalakrash.md):**  
Le portfolio en ligne minimaliste et la plateforme de commande d'une artiste indépendante.
