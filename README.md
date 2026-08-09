# EricLowry's Online Portfolio Codebase

This project contains the source code for my online portfolio, which you can visit at [eric-lowry.com](https://eric-lowry.com).

The website itself is meant as a showcase of some of my work, which is why I decided to publish the source code for anyone who may be interested. As described in the [LICENSE](LICENSE) file, the contents of the website are proprietary, but I would be happy to let individuals and small teams take inspiration from it for non-commercial purposes; just post a request in the [GitHub Discussions](https://github.com/ELowry/EricLowry-Portfolio/discussions).

## General Concept

I designed this website as a 2D side-scroller video game using the [LittleJS Engine](https://killedbyapixel.github.io/LittleJS/); however, in order to make it fully accessible to anyone, I built a separate "_text mode_" that displays all the same information using standard web design principles.  
Behind the scenes, the site is mainly coded in JavaScript and uses Markdown files for its content.

### Game Mode

> [!WARNING]  
> Game mode is currently disabled wile I finish transliting the actual contents and begin work on the art assets. Feel free to look through the code if you are interested in the basic implementation that is currently in place.

I built the portfolio's game mode as a small side-scroller in which each "_section_" of the site is represented by its own "_room_" (or _area_) you can explore. Interacting with various objects and elements within these rooms will open a modal that displays the markdown pages I have written about my various projects and work experience.

I wanted this to be a fully functional video game, so I built a full input system to handle mouse & keyboard, controller, and touch inputs throughout game mode. This was a fun challenge, especially trying to make the virtual cursor I use to allow for controller navigation when displaying markdown pages feel natural and responsive.

Though I had made a few bits of pixel "art" in the past, this is the first time I am making full 2D graphics for a project. I'll be live streaming the process on YouTube shortly.

### Text Mode

I've been trying to make sure that all my web projects are fully accessible to anyone who visits for a while; so I felt it was important to guarantee that the site could be navigated using standard web design principles. I also understood that navigating a 2D side-scroller is not nearly as efficient for anyone actually looking to get information about me and my projects.  
So I set up a second fully functional version of the site that displays the exact same content, but is designed around readability and accessibility.

I had fun implementing a ton of small details that make even this version of the site fully functional and enjoyable to navigate.  
If you're interested in built more accessible websites, feel free to look through the code base; there's a ton of small things that follow the best practices I know of as of writing this.

### Closing Thoughts

I put a lot of heart into this project, and feel it represents me well. If you're interesting in how I set it up, and want to learn more, I've started posting short articles on the [blog section of the site](https://eric-lowry.com/blog/).