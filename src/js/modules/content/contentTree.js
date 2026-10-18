/**
 * @typedef {Object} PositionData
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} [radius] - Collision/radius for interactions (overrides sprite default)
 * @property {boolean} [below=false] - If `true`, this position is 'below' the camera (affects animation)
 * @property {string} [label=null] - Optional translation key or fallback label
 * @property {string} [doorSpriteType=null] - Optional override key for the door/sign sprite configuration.
 * @property {import('../game/props/doors.js').DoorHighlightConfig} [highlightConfig=null] - Optional override for door highlighting.
 */

/**
 * @typedef {Object} PropPlacement
 * @property {string} type - The registered name of the prop (e.g., 'ServerRack').
 * @property {Object} pos - The world coordinates `{x, y}` to spawn the prop.
 * @property {number} pos.x - X coordinate.
 * @property {number} pos.y - Y coordinate.
 * @property {number} [scale=1] - Scaling factor for the prop.
 * @property {number} [renderOrder=0] - Z-index sorting order.
 * @property {string} [logicalKey] - Explicit key mapping for input prompts (e.g., 'A', 'D').
 */

/**
 * @typedef {Object} MapGroup
 * @property {{x: number, y: number}} pos - The world origin coordinate for this group.
 * @property {Object<string, PositionData>} [positions] - Interactive elements relative to the group origin.
 * @property {Array<PropPlacement>} [props] - Props relative to the group origin.
 */

/**
 * @typedef {Object} MapConfig
 * @property {Vec2} startPos - Default player entry point
 * @property {Object<string, PositionData>} positions - Keyed by child node ID
 * @property {{minX: number, maxX: number}} [bounds=null] - Optional horizontal boundaries for the map
 * @property {number} [horizonY=1] - The Y coordinate of the horizon line for this map.
 * @property {number} [textureIndex=0] - The spritesheet index to use for this map's player, doors, and props.
 * @property {import('../game/propManager.js').SpriteConfig} [sprites=null] - The imported `.sprites.js` configuration object containing regional prop definitions.
 * @property {Array<PropPlacement>} [props=null] - Declarative list of environmental props to spawn.
 * @property {Array<MapGroup>} [groups=null] - Optional nested groups of elements to be flattened at runtime.
 */

/**
 * @typedef {Object} ContentNode
 * @property {'category'|'content'|'separator'} type - Whether the node is a category, content, or visual separator.
 * @property {string} [id=null] - Unique identifier within current level
 * @property {string} [title=null] - Fallback literal title
 * @property {string} [file=null] - Markdown file path (used if `type === 'content'`)
 * @property {boolean} [hidden=false] - Hides the node from text-mode navigation menus if `true`.
 * @property {string|null} [image=null] - Path to the header image inside the `assets/images/` directory.
 * @property {string} [mapId=null] - The file path identifier for the map config and sprites (used if `type === 'category'`)
 * @property {MapConfig} [mapData=null] - Game map settings populated during initialization.
 * @property {Array<ContentNode>} [children=null] - Child nodes (used if `type === 'category'`)
 */

/**
 * Factory helper to create a content node (markdown file).
 * @param {Object} options - The content configuration properties.
 * @param {string} options.id - Unique identifier for the node (URL segment).
 * @param {string} options.title - Fallback human-readable title.
 * @param {string} options.file - Path to the markdown file relative to the content root.
 * @param {boolean} [options.hidden=false] - Hides the node from text-mode navigation menus if `true`.
 * @param {string|null} [options.image=null] - Path to the header image inside the `assets/images/` directory.
 * @returns {ContentNode} a standardized content node object.
 */
const content = ({ id, title, file, hidden = false, image = null }) => ({
	id,
	title,
	type: 'content',
	file,
	hidden,
	image,
});

/**
 * Factory helper to create a category node.
 * @param {Object} options - The category configuration properties.
 * @param {string} options.id - Unique identifier for the node (URL segment).
 * @param {string} options.title - Fallback human-readable title.
 * @param {string} options.mapId - The file path identifier for the map config and sprites.
 * @param {Array<ContentNode>} [options.children=[]] - Child nodes (used if `type === category`)
 * @returns {ContentNode} a standardized content node object.
 */
const category = ({ id, title, mapId, children = [] }) => ({
	id,
	title,
	type: 'category',
	mapId,
	mapData: null, // Will be filled by init()
	children,
});

/**
 * Factory helper to create a visual separator node.
 * @returns {ContentNode} a standardized separator node object.
 */
const separator = () => ({
	type: 'separator',
});

/**
 * The static definition of the application's content hierarchy.
 * This constant serves as the single source of truth for routing, game level layout, and navigation menus. It is built using factory functions to ensure structural consistency.
 * @type {ContentNode}
 */
export const ContentTree = category({
	id: 'root',
	title: 'Portfolio',
	mapId: 'root',
	children: [
		// Hidden
		content({ id: 'privacy', title: 'Privacy Policy', file: 'info/privacy.md', hidden: true }),

		// ROOT
		content({ id: 'index', title: 'Welcome', file: 'index.md' }),
		content({ id: 'cv', title: 'Curriculum Vitae', file: 'cv.md' }),
		content({ id: 'about', title: 'About Me', file: 'about.md' }),

		// COACHING & BUSINESS
		category({
			id: 'coaching-business',
			title: 'Coaching & Business',
			mapId: 'coaching-business',
			children: [
				content({
					id: 'coaching-business',
					title: 'Overview',
					file: 'coaching-business/coaching-business.md',
					hidden: true,
					image: 'gaming/cinq/heist__240-190-webp~_400-317-webp~_600-476-webp~.jpg',
				}),
				category({
					id: 'CinQ',
					title: 'CinQ – Operations & Coaching',
					mapId: 'coaching-business/CinQ',
					children: [
						content({
							id: 'CinQ',
							title: 'About CinQ',
							file: 'coaching-business/CinQ.md',
							hidden: true,
							image: 'gaming/cinq/heist__240-190-webp~_400-317-webp~_600-476-webp~.jpg',
						}),
						content({
							id: 'CinQ-game',
							title: 'CinQ Game Development',
							file: 'gaming/CinQ.md',
							image: 'gaming/cinq/van__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
						content({
							id: 'website',
							title: 'CinQ Website',
							file: 'websites/CinQ.md',
							image: 'websites/CinQ/home-page__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
					],
				}),
				content({
					id: 'multimedia',
					title: 'Content & Multimedia',
					file: 'coaching-business/multimedia.md',
					image: 'websites/CinQ/content__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
			],
		}),

		// GAMING
		category({
			id: 'gaming',
			title: 'Video Games',
			mapId: 'gaming',
			children: [
				content({
					id: 'gaming',
					title: 'Overview',
					file: 'gaming/gaming.md',
					hidden: true,
					image: 'gaming/unstant/basement__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				content({
					id: 'CinQ',
					title: 'CinQ – corporate team training video game',
					file: 'gaming/CinQ.md',
					image: 'gaming/cinq/van__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				content({
					id: 'InputLayers',
					title: 'InputLayers',
					file: 'gaming/InputLayers.md',
					image: 'osd/inputlayers/cover__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				content({
					id: 'Unstant',
					title: 'Unstant',
					file: 'gaming/Unstant.md',
					image: 'gaming/unstant/header__240-135-webp~_400-225-webp~_600-337-webp~_820-461-webp~_1400-787-webp~_1875-1054-webp~.jpg',
				}),
			],
		}),

		// OPEN SOURCE
		category({
			id: 'osd',
			title: 'Open Source Development',
			mapId: 'osd',
			children: [
				content({
					id: 'osd',
					title: 'Open Source Projects',
					file: 'osd/osd.md',
					hidden: true,
					image: 'osd/osd/github__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				content({
					id: 'dns-toggle',
					title: 'DNS Toggle',
					file: 'osd/dns-toggle.md',
					image: 'osd/dns-toggle/logo__240-117-webp~_400-196-webp~_600-294-webp~_820-401-webp~_1024-501-webp~.png',
				}),
				content({
					id: 'InputLayers',
					title: 'InputLayers',
					file: 'gaming/InputLayers.md',
					image: 'osd/inputlayers/cover__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				content({
					id: 'winget-updater',
					title: 'WinGet Updater',
					file: 'osd/winget-updater.md',
					image: 'osd/winget-updater/winget-updater__240-120-webp~_400-200-webp~_600-300-webp~_820-410-webp~_1280-640-webp~.jpg',
				}),
				content({
					id: 'marked-responsive-images',
					title: 'Marked Responsive Images',
					file: 'osd/marked-responsive-images.md',
				}),
				content({
					id: 'obsidian-replace-commands',
					title: 'Obsidian Replace Commands',
					file: 'osd/obsidian-replace-commands.md',
					image: 'osd/obsidian-replace-commands/cover__240-160-webp~_400-267-webp~_600-400-webp~_820-547-webp~_1200-800-webp~.jpg',
				}),
				content({
					id: 'StadiaIcons',
					title: 'StadiaIcons',
					file: 'osd/StadiaIcons.md',
					image: 'osd/StadiaIcons/banner__240-126-webp~_400-210-webp~_600-315-webp~_800-420-webp~.jpg',
				}),
			],
		}),

		// WEBSITES
		category({
			id: 'websites',
			title: 'Web Development & Design',
			mapId: 'websites',
			children: [
				content({
					id: 'websites',
					title: 'Web Development & Design',
					file: 'websites/websites.md',
					hidden: true,
					image: 'websites/luzech/intro__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				content({
					id: 'CinQ',
					title: 'CinQ – corporate team training video game',
					file: 'websites/CinQ.md',
					image: 'websites/CinQ/home-page__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				content({
					id: 'altoe',
					title: 'Alto´e',
					file: 'websites/altoe.md',
					image: 'websites/altoe/home-page__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				category({
					id: 'lightweight-static',
					title: 'Lightweight Static Sites',
					mapId: 'websites/lightweight-static',
					children: [
						content({
							id: 'lightweight-static',
							title: 'Lightweight Static Framework',
							file: 'websites/lightweight-static/lightweight-static.md',
							hidden: true,
							image: 'websites/luzech/intro__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
						content({
							id: 'thenextmind',
							title: 'The Next Mind',
							file: 'websites/lightweight-static/thenextmind.md',
							image: 'websites/thenextmind/intro__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
						content({
							id: 'luzech',
							title: 'Luzech',
							file: 'websites/lightweight-static/luzech.md',
							image: 'websites/luzech/intro__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
						content({
							id: 'koalakrash',
							title: 'Koala Krash',
							file: 'websites/lightweight-static/koalakrash.md',
							image: 'websites/koalakrash/home-page__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
					],
				}),
				content({
					id: 'StadiaIcons',
					title: 'StadiaIcons',
					file: 'osd/StadiaIcons.md',
					image: 'osd/StadiaIcons/banner__240-126-webp~_400-210-webp~_600-315-webp~_800-420-webp~.jpg',
				}),
				content({
					id: 'archive',
					title: 'Archive of Defunct Websites',
					file: 'websites/archive.md',
					image: 'websites/archive/maia__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
			],
		}),

		// ARCHITECTURE
		category({
			id: 'architecture',
			title: 'Architecture Studies',
			mapId: 'architecture',
			children: [
				content({
					id: 'architecture',
					title: 'ENSA-V & ENSP-V',
					file: 'architecture/architecture.md',
					hidden: true,
					image: '/architecture/station/3D2__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
				category({
					id: 'projects',
					title: 'Architecture Projects',
					mapId: 'architecture/projects',
					children: [
						content({
							id: 'projects',
							title: 'Architecture Projects',
							file: 'architecture/projects/projects.md',
							hidden: true,
							image: '/architecture/station/3D2__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
						content({ id: 'Unstant', title: 'Unstant', file: 'gaming/Unstant.md' }),
						content({
							id: 'BASELAND',
							title: 'BASELAND – Virtual Lanscape',
							file: 'architecture/projects/BASELAND.md',
							image: '/architecture/BASELAND/plaza__240-180-webp~_400-300-webp~_600-450-webp~_800-600-webp~.jpg',
						}),
						content({
							id: 'student-housing',
							title: 'Student Housing',
							file: 'architecture/projects/student-housing.md',
							image: '/architecture/student-housing/3D2__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
						content({
							id: 'pavilion',
							title: 'Expo Pavilion',
							file: 'architecture/projects/pavilion.md',
							image: '/architecture/pavilion/above__240-166-webp~_400-277-webp~_600-416-webp~_820-568-webp~_1400-971-webp~_1731-1200-webp~.png',
						}),
						content({
							id: 'station',
							title: 'Train Station',
							file: 'architecture/projects/station.md',
							image: '/architecture/station/3D2__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
						}),
					],
				}),
				content({
					id: '3Dgallery',
					title: 'About my 3D work',
					file: 'architecture/3Dgallery.md',
					image: '/architecture/3Dgallery/park-3D1__240-135-webp~_400-225-webp~_600-338-webp~_820-461-webp~_1400-788-webp~_1920-1080-webp~.jpg',
				}),
			],
		}),

		separator(),

		// BLOG
		content({ id: 'blog', title: 'Blog', file: 'blog-index.json' }),
		content({ id: 'projects', title: 'Projects', file: 'projects-index.json' }),
	],
});
