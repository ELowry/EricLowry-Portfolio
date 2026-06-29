# CinQ Website

## A complete marketing platform and custom PHP application portal

> [!SUMMARY]
>
> |                |                                                      |
> | -------------- | ---------------------------------------------------- |
> | **Languages**  | PHP, JavaScript, Bash, HTML, CSS                     |
> | **Tech stack** | Statamic, Laravel, Tailwind, Alpine.js, Vite, Guzzle |
> | **Skillset**   | Systems Architecture, Backend Dev, UI/UX             |
>
> 🌐 [playcinq.com](https://playcinq.com)  
> 👤 [account.playcinq.com](https://account.playcinq.com)

### Context

The web presence for CinQ operates as a two-sided ecosystem.

1. **The Marketing Platform ([playcinq.com](https://playcinq.com)):**  
   A dynamic, multilingual storefront and content hub built on [Statamic](https://statamic.com).
2. **The Application Portal ([account.playcinq.com](https://account.playcinq.com)):**  
   A fully custom, hand-written PHP backend where users manage their game clients, accounts, and performance scorecards.

Over the years, I have built over a dozen sites and dedicated landing pages for Disruptive Learning Solutions. All have since been replaced by one central site at [playcinq.com](https://playcinq.com). Early versions were built using a mix of static HTML and WordPress, but I have since transitioned it over to a stable and highly automated infrastructure built using Statamic and modern PHP. This shift has granted me absolute control over the codebase, resulting in exponential improvements in page speed, security, and developer experience.  
While I recognize the value of WordPress; I think I have fallen in love with de the development freedom that Statamic affords me.

### UX & Visual Design: Bridging Two Worlds

The primary design challenge around CinQ has always been creating a visual identity that fits within the comfort zone of HR professionals and L&D executives, while still reflecting the modern, interactive nature of our gaming technology.

- **The Marketing Front-End:**  
  Since this is the main online presence for CinQ, I aimed for a blend between standard "tech-corporate" aesthetics (minimal responsive design, flat illustrations, familiar layouts) and something more "crunchy" that could subtly draw from the world of gaming and new technologies.  
  This meant avoiding the traditional navy-and-white of corporate services, opting for a dark-mode purple background with off-white text, accented by raspberry accents, grainy gradients, clean sans-serif typography, and rounded containers.  
  I put particular care into creating a strong brand identity, including the color palette, recurring shapes and textures, and strict typography (such as how all titles are lowercased across the whole site). This has since been extended to all our marketing material, slide decks, and various visual elements across all the team's activity.

<!-- prettier-ignore -->
| Gallery |  |
| -- | -- |
| ![Screenshot of the CinQ website's home page](/assets/images/websites/CinQ/home-page__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Screenshot of the main user account dashboard](/assets/images/websites/CinQ/account-home__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

- **The Application Dashboard:**  
  Aiming for familiarity and ease-of-use, the user portal was constructed to function as typical a minimalist, mobile-friendly corporate backend. However, to prevent it from being just another rigid backend, I made its visuals lean more into the design language of CinQ itself, and picked a striking red-pink-and-orange background with dark gray content boxes. This contrast makes it visually exciting and intriguing while prioritizing obvious controls and direct information hierarchies in its UX to ensure it would be a good fit for non-technical users.

### The Marketing Workflow (Statamic & automation)

Transitioning to Statamic (powered by Laravel) allowed me to move past a simple static corporate site and instead create a highly automated digital storefront.

<!-- prettier-ignore -->
| Gallery: |  |  |  |
| -- | -- | -- | -- |
| ![Screenshot of the CinQ workshops catalog](/assets/images/websites/CinQ/programs__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Screenshot of a CinQ workshop listing](/assets/images/websites/CinQ/workshop__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Screenshot of a CinQ workshop sign-up calendar](/assets/images/websites/CinQ/sign-up__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Screenshot of the CinQ articles and podcast listing](/assets/images/websites/CinQ/content__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

- **Data Scraping & Live Workshops Catalog:**  
  Instead of manually updating workshops or relying on heavy client-side JavaScript, I made use of Laravel's capabilities and task scheduling to have the server routinely scrapes the Eventbrite API, Medium RSS feeds, YouTube, etc., automatically parsing relevant data into native Statamic collections.  
  This enables the whole site to serve as a central repository for all of our marketing content, articles, podcast, and workshops calendar, without needing to build dedicated systems where we already had existing workflows and platforms in use.
- **Discord Integration:**  
  Our team used Discord as our internal communication tool; which was a great opportunity to integrate webhooks deeply into the site's logic:  
  The team receives automated Discord alerts for contact form submissions, new workshop sign-ups, and whenever content is updated in the CMS. All sorted and set up to specifically target the right team member(s).  
  This has also been a great tool for monitoring the site's git flow, overall health, and sending myself alerts regarding outstanding actions that result from the automated content updates.

### CI/CD Multilingual Architecture

To manage a fully bilingual site (English/French) without relying on paid multi-site plugins, I engineered a decoupled multi-repository Git architecture that best fit the site's specific needs.

Effectively, I have split the site into a shared "core" repository (framework, config, theme), and dedicated content repositories for each language. This is then automated and managed by a custom suite of automated tools I developed from scratch:

![Screenshot of the CinQ website local development tool ](/assets/images/websites/CinQ/script__240-186-webp_240-186_400-311-webp_400-311_600-466-webp_600-466_637-495-webp_637-495.jpg)

- **Local CLI Management:**  
  A custom Windows interactive CLI script manages local Vite dev servers, syncs language contexts, and pipes package updates through an AI generator to draft automated commit summaries.
- **Zero-Downtime Deployments:**  
  Server cron jobs actively monitor remote branches for new semantic version tags. When an update is detected, the server locks the file system, drops into maintenance mode, executes a snapshot database backup, pulls the updated core and content repos, compiles production assets via NPM/Composer, and actively crawls the site to warm the static cache before reopening it to the public.  
  In practice this means I can push updates to the site without any need for manual intervention; any errors or warnings are automatically sent to the team Discord.
- **Automated Syncing:**  
  Content modifications made directly in the live Statamic control panel by colleagues are automatically committed and pushed back to the Git repositories on a dedicated branch, ensuring the remote repos and live database never fall out of sync, and letting me validate any changes to ensure the site never gets broken.

### The Custom PHP Application Portal

I built [account.playcinq.com](https://account.playcinq.com) as a fully custom PHP application to handle all user accounts, workshop groups, and scorecard generation.

<!-- prettier-ignore -->
| Gallery |  |
| -- | -- |
| ![Screenshot of the CinQ scorecard system](/assets/images/websites/CinQ/scorecard__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![Screenshot of a CinQ account page](/assets/images/websites/CinQ/account__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

Because the portal interfaces directly with the Unity3D game, the major architectural constraint was ensuring web data and game data synced flawlessly via a REST API. For strict security, user credentials and gameplay data are isolated in separate databases. To handle this, I engineered a system utilizing Guzzle to intelligently chain API requests, often splitting a single frontend action into 3 or 4 secure, progressive backend requests to compile the correct dataset.

I opted to write this site by hand both to re-train my PHP backend coding skills, and to maximize control over the portal's systems and security. I actively avoided heavy third-party libraries, opting to build the authentication, session management, and routing structures from scratch.

### Outcomes & The Bigger Picture

Ultimately, building these two sites was an invaluable learning experience. It allowed me to explore the use of Statamic, flex my front-end design muscles, work on backend PHP and Laravel automation, and become deeply familiar with web server automation and management.
