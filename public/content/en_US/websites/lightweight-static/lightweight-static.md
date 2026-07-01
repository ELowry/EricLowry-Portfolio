# Lightweight Static Framework

## A custom architecture for low-maintenance websites

> [!SUMMARY]
>
> |                |                                            |
> | -------------- | ------------------------------------------ |
> | **Languages**  | JavaScript, HTML, CSS                      |
> | **Tech stack** | Custom HTML & JavaScript, Firebase Hosting |
> | **Skillset**   | Web Engineering, Systems Architecture      |

Over the years, I have had several clients approach me needing extremely simple, low-maintenance landing pages or portfolios. They typically do not need the overhead of a complex CMS like WordPress, nor do they want to deal with ongoing backend maintenance, database updates, or high hosting costs.

Over time, I have built a reusable, fully hand-coded static frontend foundation that I typically host on Firebase, which is essentially free for low-traffic sites.  
With no dependencies and no user content handling, this architecture prioritizes simplicity and speed, providing a rock-solid base that requires virtually zero upkeep.

### Custom Translation System

While the base architecture is deliberately minimal, multiple projects have required multilingual websites. To accommodate this without introducing heavy third-party plugins, I engineered a robust, custom-built translation system natively into the framework:

- Localization is handled combining JSON data files and HTML data attributes with JavaScript to dynamically apply localization on the fly.
- The script handles automatically swapping embedded iFrames (such as localized Google Forms or YouTube videos) and updating header elements.
- Browser settings are used to detect the user's browser language preferences upon arrival, which is then saved to their local storage for future sessions, including when using manual language override events.

This framework has served as the reliable technical foundation for several of my web projects, allowing me to focus entirely on custom visual design and user experience for each specific client:

**[The Next Mind](/content/en_US/websites/lightweight-static/thenextmind.md):**  
The front page of a small French coaching and consulting company that focuses on AI and helping companies be future-ready.

**[Luzech](/content/en_US/websites/lightweight-static/luzech.md):**  
A graphically unique personal front page for a professional data expert and consultant based in the UK.

**[KoalaKrash](/content/en_US/websites/lightweight-static/koalakrash.md):**  
The minimalist online portfolio and commissioning platform for an independent artist.
