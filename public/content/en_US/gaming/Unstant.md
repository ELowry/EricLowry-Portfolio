# Unstant

> [!SUMMARY]
>
> |            |                                                                                                                                                    |
> | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
> | **Engine** | Unreal Engine 4                                                                                                                                    |
> | **Skills** | Architecture, Technical Drawing, Game Design, Game Dev, 3D Modeling, Texturing, Shaders, Sound Design, Video Editing, Graphic Design, Print Design |
>
> - 🎮 [Download Unstant](https://drive.google.com/file/d/0B7AmgjkhtydVRE5WREJLdUJCZTA/view?resourcekey=0-lW3gwxkJgPlf_Q5aSntzpA) (late development version).

![Artistically rendered view of a yellow desert with a red buoy](/assets/images/gaming/unstant/header__240-135-webp_240-135_400-225-webp_400-225_600-337-webp_600-337_820-461-webp_820-461_1400-787-webp_1400-787_1875-1054-webp_1875-1054.jpg)

To this day, I am convinced that the creative aspects of game design and architecture share significantly more than is usually acknowledged; both are about wrestling with a somewhat rigid set of rules and constraints to create spaces and environments, that will be experienced, explored, lived-in.

This idea was the central thesis of my master’s thesis about what video games bring to the table for architecture and architects. So naturally, for my final Master’s degree project, I joined forces with a fellow student to try and put theory into practice: we built a video game from scratch.

Half architecture essay, half game design/dev exercise, Unstant was our attempt at taking the methods and design concepts we had studied for architecture, and applying them to the virtual world.

[Watch The Trailer](https://spectra.video/videos/embed/dk7DvpkYYMWMMrbJNgo1f8?p2p=0&aspect=56.25%)

## The Concept

In 2015 the societal shift towards social media and the hyper-connected camera-in-hand perception of spaces and everyday life (Instagram, Vine, vlogging, etc.) was well under way. Unstant was meant as a visceral exploration of how our minds set aside mundane routines and liminal spaces, and instead compress time into unreal and hyper-condensed highlights of memorable places and experiences. How can we create spaces and experiences that bring attention to the missed "Unstants" (the moments in life that will not be kept in memory)?

So we made a first person "walking simulator" that explored incredibly banal, everyday spaces (a bedroom, a basement, a train station) and transformed them into exceptional, surreal virtual experiences. By toying with the flow of time, and the contiguousness of space, the game forces you to confront how our minds stitch together isolated memories to make sense of reality.

<!-- prettier-ignore -->
| Gallery: |  |  |  |  |
| -- | -- | -- | -- | -- |
| ![A screenshot of the desert level](/assets/images/gaming/unstant/desert__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![A screenshot of the bedroom level](/assets/images/gaming/unstant/room__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![A screenshot of the living room level](/assets/images/gaming/unstant/livingroom__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![A screenshot of the basement level](/assets/images/gaming/unstant/basement__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) | ![A screenshot of the cemetery level](/assets/images/gaming/unstant/cemetary__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg) |

<!-- prettier-ignore end -->

## The Work

Building a full video game from the ground up, with barely any experience of game development, was a true exercise in multidisciplinarity, and gave me valuable experience in nearly all fields of game production pipeline:

> [!INFO]
> Other than the default tools and utilities shipped with Unreal Engine 4, no external tools or assets were used for this project.

### Game development / programming

As the duo's developer I handled building Unstant in Unreal Engine 4, using the blueprint visual scripting system to code:

![Screenshot of a section of the shader code blueprint  ](/assets/images/gaming/unstant/code__240-123-webp_240-123_400-205-webp_400-205.jpg)

- player movement and environmental interactions
- the UI, including time-synced subtitles
- a dynamic audio system (spatial sound effects, multi-track music score)
- parametric 3D assets (walls/gates generated along a path, tree and foliage generation, bookshelf generation, random tombstone model and texture generation)

### 3D modeling & environment design

Starting from extensive physical measurements and architectural surveys, I built and optimized 3D meshes for the game's environments and props.

![Preview of various steps of the 3D modeling process for the game](/assets/images/gaming/unstant/3Dprocess__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg)

### Texture work and shaders

Taking inspiration from the look of architectural diagrams and sketches, we decided to use a mix of hand-painted textures (digitized paint and pen drawings) with various shader tricks (Sobel and depth-based edge detection, and fading between textures' r/g/b/a channels based on depth/lighting) to create the somewhat unique style of the game.

![Examples of the materials and shader work, including hand-painted textures, hatch texture maps, and hatched lighting effects](/assets/images/gaming/unstant/materials__240-73-webp_240-73_400-121-webp_400-121_600-181-webp_600-181_820-248-webp_820-248_1400-423-webp_1400-423_1920-580-webp_1920-580.jpg)

Particular effort was put into blending the screen-space "sketch" shading and per-object sketch materials to recreate a usually two-dimentional style in a fully explorable 3D space.

### Sound design & voice acting

While my project partner was in charge of composing and recording the game's music, I recorded, mastered, and implemented all the sound design, foley and sound effects into the game. I also recorded, edited, and implemented the English voiceover monologues (with French subtitles) that help the environmental storytelling and narrative come together throughout the game.

### Architectural diagrams and models

As a project for a master's thesis in Architecture, a significant portion of the work on this project went into producing multiple architectural plans and diagrams and a massive physical scale model of all the virtual spaces.

<!-- prettier-ignore -->
| Gallery: |  |  |  |  |  |
| -- | -- | -- | -- | -- | -- |
| ![Architectural presentation of the introductory desert level](/assets/images/gaming/unstant/intro___240-339-webp_240-339_400-565-webp_400-565_600-848-webp_600-848_820-1159-webp_820-1159_1400-1978-webp_1400-1978_1600-2261-webp_1600-2261.jpg) | ![Architectural presentation of the bedroom level](/assets/images/gaming/unstant/bedroom___240-339-webp_240-339_400-566-webp_400-566_600-848-webp_600-848_820-1159-webp_820-1159_1400-1979-webp_1400-1979_1600-2262-webp_1600-2262.jpg) | ![Architectural presentation of the livingroom level](/assets/images/gaming/unstant/livingroom___240-339-webp_240-339_400-566-webp_400-566_600-849-webp_600-849_820-1160-webp_820-1160_1400-1980-webp_1400-1980_1600-2263-webp_1600-2263.jpg) | ![Architectural presentation of the basement level](/assets/images/gaming/unstant/basement___240-339-webp_240-339_400-566-webp_400-566_600-848-webp_600-848_820-1159-webp_820-1159_1400-1979-webp_1400-1979_1600-2262-webp_1600-2262.jpg) | ![Architectural presentation of the cemetary level](/assets/images/gaming/unstant/cemetary___240-339-webp_240-339_400-566-webp_400-566_600-848-webp_600-848_820-1159-webp_820-1159_1400-1979-webp_1400-1979_1600-2262-webp_1600-2262.jpg) | ![Architectural presentation of the train station level](/assets/images/gaming/unstant/station___240-339-webp_240-339_400-566-webp_400-566_600-848-webp_600-848_820-1159-webp_820-1159_1400-1979-webp_1400-1979_1600-2262-webp_1600-2262.jpg) |

<!-- prettier-ignore end -->

Specific effort was needed in order to adapt the language of architectural diagrams to the quirks of 3D environment design, such as overlapping spaces, player teleportation, etc.

<!-- prettier-ignore -->
| Gallery: |  |  |  |  |
| -- | -- | -- | -- | -- |
| ![Top view of the architectural plans for Unstant, printed on transparent sheets to account for overlapping spaces](/assets/images/gaming/unstant/plans1__240-239-webp_240-239_400-398-webp_400-398_600-596-webp_600-596_820-815-webp_820-815_1023-1017-webp_1023-1017.jpg) | ![Detailed photograph of the overlapping transparent plans for Unstant](/assets/images/gaming/unstant/plans2__240-238-webp_240-238_400-397-webp_400-397_600-595-webp_600-595_820-814-webp_820-814_1032-1024-webp_1032-1024.jpg) | ![Photo of the cylindrical section of Unstant levels, accounting for looping space](/assets/images/gaming/unstant/section__240-136-webp_240-136_400-226-webp_400-226_600-339-webp_600-339_820-464-webp_820-464_1400-792-webp_1400-792_1582-895-webp_1582-895.jpg) | ![Photo of the scale model of Unstant](/assets/images/gaming/unstant/model1__240-107-webp_240-107_400-179-webp_400-179_600-268-webp_600-268_820-366-webp_820-366_1400-626-webp_1400-626_1600-715-webp_1600-715.jpg) | ![Detailed of the scale model of Unstant, with transparent tubing representing player teleportation](/assets/images/gaming/unstant/model2__240-241-webp_240-241_400-402-webp_400-402_600-604-webp_600-604_682-686-webp_682-686.jpg) |

<!-- prettier-ignore end -->
