# CinQ

## A multiplayer sandbox for corporate soft-skills training

> [!SUMMARY]
>
> |                |                                                               |
> | -------------- | ------------------------------------------------------------- |
> | **Platform**   | Windows, macOS, Android, Games Streaming                      |
> | **Tech Stack** | Unity3D, C#, Netcode for GameObjects, CI/CD                   |
> | **Skillset**   | Game Design, UI/UX, Game Development, Multiplayer Development |
>
> 🌐 [playcinq.com](https://playcinq.com)

### Context

CinQ is the core technology behind a decade-long applied R&D effort to bring the inherent capacity of video games to foster teamwork, leadership, and collaboration into the world of corporate training.

<!-- prettier-ignore -->
| Gallery |  |
| -- | -- |
| ![A screenshot of CinQ environment design](/assets/images/gaming/cinq//environment__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![A screenshot of CinQ with a drone looking for a character in a red jumpsuit with a fox mask](/assets/images/gaming/cinq//hacker-drone__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

When I first joined the team around 2014, the project (then known as "The Heist") was a conference-room experience built largely from Unity Asset Store components, designed to run locally on dedicated hardware. We quickly realized that to scale effectively, we needed to pivot. Instead of building bespoke projects, we envisioned a single, leaner game that could act as a versatile sandbox for remote and hybrid teamwork training.

This pivot required transforming a controlled local multiplayer prototype into a highly reliable, online multiplayer title capable of running flawlessly on low-end corporate computers, mobile devices, and behind restrictive corporate firewalls.

### Game & Pedagogical Design

My initial role on the team was focused on marketing and effectively game design lead. I was tasked with adapting the pedagogical frameworks established by my colleagues around team psychology, shared cognition, and the Sloan Leadership Model, and translating them into tangible game mechanics.

Drawing from collaborative games like _Keep Talking and Nobody Explodes_, _PayDay_, and the _Rainbow Six_ series, I designed the fundamental gameplay systems around challenging team skills (communication, agility, and leadership). We also needed to ensure the game remained non-violent, ensuring the experience remained accessible, professional, and adapted to the corporate business world.

The resulting game is a large 5-player structured mission that brings together dozens of game mechanics and puzzles to effectively form a collaborative sandbox thar requires strong real-time, synchronous collaboration. Following customer demand, we later included an in-game AI assistant built using a custom LLM to include AI-enhanced teamwork into our training portfolio.

### Engineering & The Development Journey

Executing this pivot as a tight-knit team of just two developers and one infrastructure engineer was a massive, multi-year learning curve. Building upon the foundational 3D modeling and environment design skills I first developed while building [Unstant](/content/en_US/gaming/Unstant.md), I transitioned from an inexperienced UI developer into a full-stack technical designer.

As the project evolved, I took hands-on ownership of nearly every facet of the game's frontend, UX, and client-side architecture:

- **UI & UX Systems:**  
  I built the game’s entire user interface from scratch, ensuring clarity for non-gamer corporate audiences.
- **Input Architecture:**  
  I engineered a custom, layer-based input stack to elegantly handle complex UI states (which I later published as the open-source package [InputLayers](/content/en_US/gaming/InputLayers.md)).
- **Tech Art & Environments:**  
  I collaborated heavily on environment design, actively modifying, optimizing, and building a significant portion of the 3D assets, textures, and materials to ensure they ran smoothly on low-end integrated graphics.
- **Audio & Localization:**  
  I implemented the audio stack and engineered a robust, scalable translation system to support international clients across English, French, and German.

### Technical Hurdles & Systems Architecture

Scaling CinQ for the enterprise required overcoming significant technical and networking hurdles, ultimately shaping my current systems-driven approach to development:

- **The Multiplayer Migration:**  
  We initially built the game on the legacy UNET framework. As the project matured, we undertook a massive rewrite to migrate our entire stack to Unity's newer Netcode for GameObjects. I assisted heavily in this transition, debugging network logic and updating UI and puzzle mechanics to function within the new framework.
- **Corporate IT & Network Reliability:**  
  Deploying games on enterprise networks requires combating frequent drops, excessive ping, and strict firewalls blocking UDP/TCP traffic. We engineered numerous layers of safeguards over the networking defaults to prevent data loss, smooth out animations, and seamlessly reconnect players. We also set up a strict IT testing and validation workflow to ensure smooth deployments across entire companies.
- **Deployment & Automation:**  
  Building the game was only half the battle; packaging it for enterprise deployment required an extensive suite of automated tooling. I wrote custom bash and PowerShell scripts to automatically compile, code-sign, and package CinQ into the 8+ formats required for distribution across the Microsoft Store, Google Play Store, macOS App Store, and standalone installers, as well as deploying game server builds to our custom network infrastructure.

> [!NOTE]
>
> Beyond the game client itself, I also directed the platform's marketing strategies, podcast editing, and actively facilitated corporate coaching workshops. You can read more about those specific roles in the [Coaching & Business](/content/en_US/coaching/index.md) section of this portfolio.
