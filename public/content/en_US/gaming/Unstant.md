# Unstant

> [!SUMMARY]
>
> |            |                                                                                                                                                    |
> | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
> | **Engine** | Unreal Engine 4                                                                                                                                    |
> | **Skills** | Architecture, Technical Drawing, Game Design, Game Dev, 3D Modeling, Texturing, Shaders, Sound Design, Video Editing, Graphic Design, Print Design |
>
> - 🎮 [Download Unstant](https://drive.google.com/file/d/0B7AmgjkhtydVRE5WREJLdUJCZTA/view?resourcekey=0-lW3gwxkJgPlf_Q5aSntzpA) (late development version).

![Artistically rendered view of a yellow desert with a red buoy](/assets/images/gaming/unstant/header__240-135-webp~_400-225-webp~_600-337-webp~_820-461-webp~_1400-787-webp~_1875-1054-webp~.jpg)

I am convinced that the creative aspects of game design and architecture share significantly more than is usually acknowledged; both are about wrestling with a somewhat rigid set of rules and constraints to create spaces and environments that will be experienced, explored, lived-in.

This idea was the central tenet of my master's thesis, which explored what video games bring to the table for architecture and architects. For my final Master's degree project, I quite naturally joined forces with a fellow student in an effort to put theory into practice: we built a video game from scratch.

Half architecture essay, half game design/dev exercise, Unstant was our attempt to take the methods and design concepts we had studied for architecture and apply them to the virtual world.

[Watch The Trailer](https://spectra.video/videos/embed/dk7DvpkYYMWMMrbJNgo1f8?p2p=0&aspect=56.25%)

## The Concept

In 2015 the societal shift towards social media and the hyper-connected camera-in-hand perception of spaces and everyday life (Instagram, Vine, vlogging, etc.) was well under way. Unstant was meant as a visceral exploration of how our minds set aside mundane routines and liminal spaces, and instead compress time into unreal and hyper-condensed highlights of memorable places and experiences. How can we create spaces and experiences that bring attention to the missed "Unstants" (the moments in life that will not be kept in memory)?

We made a first person "walking simulator" that explored incredibly banal, everyday spaces (a bedroom, a basement, a train station) and transformed them into exceptional, surreal virtual experiences. By toying with the flow of time and the contiguousness of space, the game forces players to confront how their minds stitch together isolated memories to make sense of reality.

<!-- prettier-ignore -->
| Gallery: |  |  |  |  |
| -- | -- | -- | -- | -- |
| ![A screenshot of the desert level](/assets/images/gaming/unstant/desert__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![A screenshot of the bedroom level](/assets/images/gaming/unstant/room__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![A screenshot of the living room level](/assets/images/gaming/unstant/livingroom__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![A screenshot of the basement level](/assets/images/gaming/unstant/basement__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) | ![A screenshot of the cemetery level](/assets/images/gaming/unstant/cemetary__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg) |

<!-- prettier-ignore end -->

## The Work

Building a full video game from the ground up, with barely any experience in game development, was a true exercise in multidisciplinarity and gave me valuable experience in nearly all fields of game production pipeline:

> [!INFO]
> Other than the default tools and utilities shipped with Unreal Engine 4, no external tools or assets were used for this project.

### Game development / programming

As the developer of our project duo, I handled building Unstant in Unreal Engine 4, using the blueprint visual scripting system to code:

![Screenshot of a section of the shader code blueprint  ](/assets/images/gaming/unstant/code__240-123-webp~_400-205-webp~.jpg)

- player movement and environmental interactions
- the UI, including time-synced subtitles
- a dynamic audio system (spatial sound effects, multi-track music score)
- parametric 3D assets (walls/gates generated along a path, tree and foliage generation, bookshelf generation, random tombstone model and texture generation)

### 3D modeling & environment design

Starting from extensive physical measurements and architectural surveys, I built and optimized 3D meshes for the game's environments and props.

![Preview of various steps of the 3D modeling process for the game](/assets/images/gaming/unstant/3Dprocess__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg)

### Texture work and shaders

Taking inspiration from the look of architectural diagrams and sketches, we decided to use a mix of hand-painted textures (digitized paint and pen drawings) with various shader tricks (Sobel and depth-based edge detection, and fading between textures' r/g/b/a channels based on depth/lighting) to create the distinctive style of the game.

![Examples of the materials and shader work, including hand-painted textures, hatch texture maps, and hatched lighting effects](/assets/images/gaming/unstant/materials__240-73-webp~_400-121-webp~_600-181-webp~_820-248-webp~_1400-423-webp~_1920-580-webp~.jpg)

Particular effort was put into blending the screen-space "sketch" shading and per-object sketch materials to recreate a usually two-dimentional style in a fully explorable 3D space.

### Sound design & voice acting

While my project partner was in charge of composing and recording the game's music, I recorded, mastered, and implemented all the sound design, foley, and sound effects into the game. I also recorded, edited, and implemented the English voiceover monologues (with French subtitles) that helped the environmental storytelling and narrative come together throughout the game.

### Architectural diagrams and models

As a project for a master's thesis in Architecture, a significant portion of the work went into producing multiple architectural plans and diagrams along with a massive physical scale model of all the virtual spaces.

<!-- prettier-ignore -->
| Gallery: |  |  |  |  |  |
| -- | -- | -- | -- | -- | -- |
| ![Architectural presentation of the introductory desert level](/assets/images/gaming/unstant/intro___240-339-webp~_400-565-webp~_600-848-webp~_820-1159-webp~_1400-1978-webp~_1600-2261-webp~.jpg) | ![Architectural presentation of the bedroom level](/assets/images/gaming/unstant/bedroom___240-339-webp~_400-566-webp~_600-848-webp~_820-1159-webp~_1400-1979-webp~_1600-2262-webp~.jpg) | ![Architectural presentation of the livingroom level](/assets/images/gaming/unstant/livingroom___240-339-webp~_400-566-webp~_600-849-webp~_820-1160-webp~_1400-1980-webp~_1600-2263-webp~.jpg) | ![Architectural presentation of the basement level](/assets/images/gaming/unstant/basement___240-339-webp~_400-566-webp~_600-848-webp~_820-1159-webp~_1400-1979-webp~_1600-2262-webp~.jpg) | ![Architectural presentation of the cemetary level](/assets/images/gaming/unstant/cemetary___240-339-webp~_400-566-webp~_600-848-webp~_820-1159-webp~_1400-1979-webp~_1600-2262-webp~.jpg) | ![Architectural presentation of the train station level](/assets/images/gaming/unstant/station___240-339-webp~_400-566-webp~_600-848-webp~_820-1159-webp~_1400-1979-webp~_1600-2262-webp~.jpg) |

<!-- prettier-ignore end -->

Special effort was needed in order to adapt the language of architectural diagrams to the quirks of 3D environment design, such as overlapping spaces, player teleportation, etc.

<!-- prettier-ignore -->
| Gallery: |  |  |  |  |
| -- | -- | -- | -- | -- |
| ![Top view of the architectural plans for Unstant, printed on transparent sheets to account for overlapping spaces](/assets/images/gaming/unstant/plans1__240-239-webp~_400-398-webp~_600-596-webp~_820-815-webp~_1023-1017-webp~.jpg) | ![Detailed photograph of the overlapping transparent plans for Unstant](/assets/images/gaming/unstant/plans2__240-238-webp~_400-397-webp~_600-595-webp~_820-814-webp~_1032-1024-webp~.jpg) | ![Photo of the cylindrical section of Unstant levels, accounting for looping space](/assets/images/gaming/unstant/section__240-136-webp~_400-226-webp~_600-339-webp~_820-464-webp~_1400-792-webp~_1582-895-webp~.jpg) | ![Photo of the scale model of Unstant](/assets/images/gaming/unstant/model1__240-107-webp~_400-179-webp~_600-268-webp~_820-366-webp~_1400-626-webp~_1600-715-webp~.jpg) | ![Detailed of the scale model of Unstant, with transparent tubing representing player teleportation](/assets/images/gaming/unstant/model2__240-241-webp~_400-402-webp~_600-604-webp~_682-686-webp~.jpg) |

<!-- prettier-ignore end -->
