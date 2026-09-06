# DNS Toggle

## Un raccourcis pratique pour l'option DNS privé sur Android

> [!RÉSUMÉ]
>
> |                 |                                   |
> | --------------- | --------------------------------- |
> | **Plateforme**  | Android                           |
> | **Langages**    | Kotlin                            |
> | **Compétences** | Développement d'app, Design UI/UX |
>
> - 📥 [Télécharger sur F-Droid](https://f-droid.org/packages/com.ericlowry.dnstoggle/)
> - 📥 [Téléchargez sur IzzyOnDroid](https://apt.izzysoft.de/fdroid/index/apk/com.ericlowry.dnstoggle)
> - 📦 [Télécharger sur GitHub](https://github.com/ELowry/DNSToggle/releases/latest)
> - 🗎 [Code source sur GitHub](https://github.com/ELowry/DNSToggle)
>
> **Licence:** MIT

Depuis Android 9, il est possible d'utiliser le paramètre de _DNS privé_ des appareils pour configurer un serveur DNS personnalisé; associé à des services comme [NextDNS](https://nextdns.io/), c'est l'un des moyens les plus simples d'activer une protection contre le pistage et un blocage des malwares/contenus à l'échelle du système.  
Ce système de sécurité indispensable peut malheureusement interférer avec certains réseaux (points d'accès publics ou Wi-Fi d'hôtels). La fonction devient alors peu pratique à utiliser au quotidien puisqu'elle est enfouie dans les paramètres du système.

![Logo de lapplication DNS Toggle](/assets/images/osd/dns-toggle/logo__240-117-webp_240-117_400-196-webp_400-196_600-294-webp_600-294_820-401-webp_820-401_1024-501-webp_1024-501.png)

Même si ce n'est pas la première tentative pour rendre cette option plus accessible, mon but était de créer mon propre raccourci facile d'accès pour activer et désactiver le _DNS privé_ directement dans le menu des paramètres rapides d'Android. Lais avant tout, c'était un prétexte pour apprendre les bases du développement d'applications Android.

<!-- prettier-ignore -->
| Galerie |  |  |  |
| -- | -- | -- | -- |
| ![Capture d'écran de la pop-up de choix d'addresse et de mode DNS privé](/assets/images/osd/dns-toggle/screen1__240-539-webp_240-539_400-898-webp_400-898_600-1347-webp_600-1347_820-1840-webp_820-1840_855-1919-webp_855-1919.jpg) | ![Capture d'écran de la tuide DNS Toggle dans les paramètres rapides et des notifications de fonctionnalités optionnelles](/assets/images/osd/dns-toggle/screen2__240-539-webp_240-539_400-898-webp_400-898_600-1347-webp_600-1347_820-1840-webp_820-1840_855-1919-webp_855-1919.jpg) | ![Capture d'écran du menu de configuration de DNS Toggle](/assets/images/osd/dns-toggle/screen3__240-539-webp_240-539_400-898-webp_400-898_600-1347-webp_600-1347_820-1840-webp_820-1840_855-1919-webp_855-1919.jpg) | ![Capture d'écran de la moitié inférieure du menu de configuration de DNS Toggle](/assets/images/osd/dns-toggle/screen4__240-539-webp_240-539_400-898-webp_400-898_600-1347-webp_600-1347_820-1840-webp_820-1840_855-1919-webp_855-1919.jpg) |

<!-- prettier-ignore end -->

En l'espace de quelques jours, j'ai codé la première version de l'application, j'ai conçu son logo et je l'ai enregistrée sur F-Droid pour la rendre facilement accessible. Depuis, elle a évolué pour devenir un outil plus complet permettant d'automatiser entièrement votre _DNS privé_ directement depuis le panneau des paramètres rapides.

### Expérience utilisateur·rice et prérequis

Pour que l'expérience utilisateur·rice soit la plus fluide et sim possible, j'ai voulu inclure la possibilité de masquer son icône dans le tiroir d'applications afin de pouvoir gérer son fonctionnement directement depuis le panneau des paramètres rapides: un simple appui active ou désactive le _DNS privé_, et un appui long ouvre le menu de configuration.  
Depuis ce menu, les utilisateur·rice·s peuvent enregistrer plusieurs fournisseurs DNS personnalisés, renommer le libellé de la tuile, ou configurer des règles d'automatisation pour désactiver ou forcer le DNS sur des réseaux Wi-Fi spécifiques (filtrage par SSID) ou lors de la détection d'un VPN. L'application permet également de sauvegarder et de restaurer sa configuration via des fichiers chiffrés par mot de passe.

Comme son fonctionnement implique de modifier un paramètre système protégé, l'application requiert l'autorisation `WRITE_SECURE_SETTINGS` pour fonctionner. Celle-ci doit être accordée via un appareil rooté, l'outil Shizuku, ou manuellement via une commande ADB.
