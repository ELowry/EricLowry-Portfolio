# Marked Responsive Images

> [!SUMMARY]
>
> |               |                                                      |
> | ------------- | ---------------------------------------------------- |
> | **Languages** | JavaScript, Markdown                                 |
> | **Tools**     | [Marked.js](https://github.com/markedjs/marked), NPM |
> | **Skillset**  | Web Dev, Packaging                                   |
>
> - 📦 [NPM package for easy installation](https://www.npmjs.com/package/marked-responsive-images)
> - 🗎 [Source code on GitHuib](https://github.com/ELowry/MarkedResponsiveImages)
>
> **License:** GNU AGPL 3.0

## Responsive HTML Images from Markdown

When I began building this very portfolio, I chose [Marked.js](https://github.com/markedjs/marked) to keep my authoring experience clean and straightforward. I wanted to write my content in "pure" Markdown so it could be parsed by any standard viewer, but did not want to abandon modern web development best practices: I needed my site to serve responsive images using `<picture>` tags to support multiple resolutions and format fallbacks for each image.

So I built an extension for Marked, and decided it could be worth sharing. I took this as a learning opportunity, and tried my hand at publishing [Marked Responsive Images](https://github.com/ELowry/MarkedResponsiveImages) to [NPM](https://www.npmjs.com/package/marked-responsive-images) to make it easy for others to use.

## The Core Concept

The extension acts as a custom renderer for Marked. When the parser encounters a standard Markdown image token, the extension intercepts it and analyzes the image's filename.

Using a custom pattern, the script extracts embedded metadata about the available image sizes. From this parsed data, it automatically builds either a robust `<picture>` element populated with `<source>` tags, or a streamlined `<img>` tag with a `srcset` attribute.

### Keeping Things Compatible

The "magic" of this approach is that though it will mean having files with overly complicated names (e.g., `image__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-546-webp_820-546_1400-933-webp_1400-933_1920-1279-webp_1920-1279_1951-1300-webp_1951-1300.png`), it gets all the information necessary to build out a full set of HTML tags from this single, valid file name, effectively building capability on top of fully functional Markdown code without any messy tricks.

## Balancing Simplicity and Reliability

Since my goal rapidly evolved making this available to the broader development community, I put quite a bit of thought into how to keep this extension as simple to use as possible, while ensuring it was adaptable, stable, and compliant with modern standards.

From following coding standards set by Marked existing extensions, to automating MIME type handling, I wanted to make sure that this project would require as little maintenance as possible while remaining straightforward and secure.

## Conclusion

Marked Responsive Images is a lightweight utility that solves a very specific structural friction point. It allows developers to maintain the clean, readable nature of "pure" Markdown while strictly adhering to modern web performance and responsive design standards.
