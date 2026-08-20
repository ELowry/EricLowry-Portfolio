/**
 * @typedef {Object} PositionData
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} [radius=1.5] - Collision/radius for interactions
 * @property {boolean} [below=false] - If `true`, this position is 'below' the camera (affects animation)
 * @property {string} [label] - Optional translation key or fallback label
 */

/**
 * @typedef {Object} MapConfig
 * @property {Vec2} startPos - Default player entry point
 * @property {Object<string, PositionData>} positions - Keyed by child node ID
 */

/**
 * @typedef {Object} ContentNode
 * @property {string} [id] - Unique identifier within current level
 * @property {string} [title] - Fallback literal title
 * @property {'category'|'content'|'separator'} type - Whether the node is a category, content, or visual separator.
 * @property {string} [file] - Markdown file path (used if `type === 'content'`)
 * @property {boolean} [hidden] - Hides the node from text-mode navigation menus if `true`.
 * @property {string|null} [image] - Path to the header image inside the `assets/images/` directory.
 * @property {() => Promise<any>} [mapLoader] - Function that imports the map's configuration (used if `type === 'category'`)
 * @property {MapConfig} [mapData] - Game map settings populated during initialization.
 * @property {Array<ContentNode>} [children] - Child nodes (used if `type === 'category'`)
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
 * @param {() => Promise<any>} options.mapLoader - Function that imports the map's configuration.
 * @param {Array<ContentNode>} [options.children=[]] - Child nodes (used if `type === category`)
 * @returns {ContentNode} a standardized content node object.
 */
const category = ({ id, title, mapLoader, children = [] }) => ({
	id,
	title,
	type: 'category',
	mapLoader,
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
	mapLoader: () => import('../../../maps/root.config.js'),
	children: [
		// Hidden
		content({ id: 'privacy', title: 'Privacy Policy', file: 'info/privacy.md', hidden: true }),

		// ROOT
		content({ id: 'index', title: 'Welcome', file: 'index.md' }),
		content({ id: 'cv', title: 'Curriculum Vitae', file: 'cv.md' }),
		content({ id: 'about', title: 'About Me', file: 'about.md' }),

		// COACHING & BUSINESS
		category({
			id: 'coaching-business',
			title: 'Coaching & Business',
			mapLoader: () => import('../../../maps/coaching-business.config.js'),
			children: [
				content({
					id: 'coaching-business',
					title: 'Overview',
					file: 'coaching-business/coaching-business.md',
					hidden: true,
					image: 'gaming/cinq/heist__240-190-webp_240-190_400-317-webp_400-317_600-476-webp_600-476.jpg',
				}),
				category({
					id: 'CinQ',
					title: 'CinQ – Operations & Coaching',
					mapLoader: () => import('../../../maps/coaching-business/CinQ.config.js'),
					children: [
						content({
							id: 'CinQ',
							title: 'About CinQ',
							file: 'coaching-business/CinQ.md',
							hidden: true,
							image: 'gaming/cinq/heist__240-190-webp_240-190_400-317-webp_400-317_600-476-webp_600-476.jpg',
						}),
						content({
							id: 'CinQ-game',
							title: 'CinQ Game Development',
							file: 'gaming/CinQ.md',
							image: 'gaming/cinq/van__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
						content({
							id: 'website',
							title: 'CinQ Website',
							file: 'websites/CinQ.md',
							image: 'websites/CinQ/home-page__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
					],
				}),
				content({
					id: 'multimedia',
					title: 'Content & Multimedia',
					file: 'coaching-business/multimedia.md',
					image: 'websites/CinQ/content__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
			],
		}),

		// GAMING
		category({
			id: 'gaming',
			title: 'Video Games',
			mapLoader: () => import('../../../maps/gaming.config.js'),
			children: [
				content({
					id: 'gaming',
					title: 'Overview',
					file: 'gaming/gaming.md',
					hidden: true,
					image: 'gaming/unstant/basement__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				content({
					id: 'CinQ',
					title: 'CinQ – corporate team training video game',
					file: 'gaming/CinQ.md',
					image: 'gaming/cinq/van__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				content({
					id: 'InputLayers',
					title: 'InputLayers',
					file: 'gaming/InputLayers.md',
					image: 'osd/inputlayers/cover__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				content({
					id: 'Unstant',
					title: 'Unstant',
					file: 'gaming/Unstant.md',
					image: 'gaming/unstant/header__240-135-webp_240-135_400-225-webp_400-225_600-337-webp_600-337_820-461-webp_820-461_1400-787-webp_1400-787_1875-1054-webp_1875-1054.jpg',
				}),
			],
		}),

		// OPEN SOURCE
		category({
			id: 'osd',
			title: 'Open Source Development',
			mapLoader: () => import('../../../maps/osd.config.js'),
			children: [
				content({
					id: 'osd',
					title: 'Open Source Projects',
					file: 'osd/osd.md',
					hidden: true,
					image: 'osd/osd/github__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				content({
					id: 'dns-toggle',
					title: 'DNS Toggle',
					file: 'osd/dns-toggle.md',
					image: 'osd/dns-toggle/logo__240-117-webp_240-117_400-196-webp_400-196_600-294-webp_600-294_820-401-webp_820-401_1024-501-webp_1024-501.png',
				}),
				content({
					id: 'InputLayers',
					title: 'InputLayers',
					file: 'gaming/InputLayers.md',
					image: 'osd/inputlayers/cover__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				content({
					id: 'winget-updater',
					title: 'WinGet Updater',
					file: 'osd/winget-updater.md',
					image: 'osd/winget-updater/winget-updater__240-120-webp_240-120_400-200-webp_400-200_600-300-webp_600-300_820-410-webp_820-410_1280-640-webp_1280-640.jpg',
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
					image: 'osd/obsidian-replace-commands/cover__240-160-webp_240-160_400-267-webp_400-267_600-400-webp_600-400_820-547-webp_820-547_1200-800-webp_1200-800.jpg',
				}),
				content({
					id: 'StadiaIcons',
					title: 'StadiaIcons',
					file: 'osd/StadiaIcons.md',
					image: 'osd/StadiaIcons/banner__240-126-webp_240-126_400-210-webp_400-210_600-315-webp_600-315_800-420-webp_800-420.jpg',
				}),
			],
		}),

		// WEBSITES
		category({
			id: 'websites',
			title: 'Web Development & Design',
			mapLoader: () => import('../../../maps/websites.config.js'),
			children: [
				content({
					id: 'websites',
					title: 'Web Development & Design',
					file: 'websites/websites.md',
					hidden: true,
					image: 'websites/luzech/intro__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				content({
					id: 'CinQ',
					title: 'CinQ – corporate team training video game',
					file: 'websites/CinQ.md',
					image: 'websites/CinQ/home-page__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				content({
					id: 'altoe',
					title: 'Alto´e',
					file: 'websites/altoe.md',
					image: 'websites/altoe/home-page__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				category({
					id: 'lightweight-static',
					title: 'Lightweight Static Sites',
					mapLoader: () => import('../../../maps/websites/lightweight-static.config.js'),
					children: [
						content({
							id: 'lightweight-static',
							title: 'Lightweight Static Framework',
							file: 'websites/lightweight-static/lightweight-static.md',
							hidden: true,
							image: 'websites/luzech/intro__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
						content({
							id: 'thenextmind',
							title: 'The Next Mind',
							file: 'websites/lightweight-static/thenextmind.md',
							image: 'websites/thenextmind/intro__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
						content({
							id: 'luzech',
							title: 'Luzech',
							file: 'websites/lightweight-static/luzech.md',
							image: 'websites/luzech/intro__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
						content({
							id: 'koalakrash',
							title: 'Koala Krash',
							file: 'websites/lightweight-static/koalakrash.md',
							image: 'websites/koalakrash/home-page__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
					],
				}),
				content({
					id: 'StadiaIcons',
					title: 'StadiaIcons',
					file: 'osd/StadiaIcons.md',
					image: 'osd/StadiaIcons/banner__240-126-webp_240-126_400-210-webp_400-210_600-315-webp_600-315_800-420-webp_800-420.jpg',
				}),
				content({
					id: 'archive',
					title: 'Archive of Defunct Websites',
					file: 'websites/archive.md',
					image: 'websites/archive/maia__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
			],
		}),

		// ARCHITECTURE
		category({
			id: 'architecture',
			title: 'Architecture Studies',
			mapLoader: () => import('../../../maps/architecture.config.js'),
			children: [
				content({
					id: 'architecture',
					title: 'ENSA-V & ENSP-V',
					file: 'architecture/architecture.md',
					hidden: true,
					image: '/architecture/station/3D2__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
				category({
					id: 'projects',
					title: 'Architecture Projects',
					mapLoader: () => import('../../../maps/architecture/projects.config.js'),
					children: [
						content({
							id: 'projects',
							title: 'Architecture Projects',
							file: 'architecture/projects/projects.md',
							hidden: true,
							image: '/architecture/station/3D2__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
						content({ id: 'Unstant', title: 'Unstant', file: 'gaming/Unstant.md' }),
						content({
							id: 'BASELAND',
							title: 'BASELAND – Virtual Lanscape',
							file: 'architecture/projects/BASELAND.md',
							image: '/architecture/BASELAND/plaza__240-180-webp_240-180_400-300-webp_400-300_600-450-webp_600-450_800-600-webp_800-600.jpg',
						}),
						content({
							id: 'student-housing',
							title: 'Student Housing',
							file: 'architecture/projects/student-housing.md',
							image: '/architecture/student-housing/3D2__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
						content({
							id: 'pavilion',
							title: 'Expo Pavilion',
							file: 'architecture/projects/pavilion.md',
							image: '/architecture/pavilion/above__240-166-webp_240-166_400-277-webp_400-277_600-416-webp_600-416_820-568-webp_820-568_1400-971-webp_1400-971_1731-1200-webp_1731-1200.png',
						}),
						content({
							id: 'station',
							title: 'Train Station',
							file: 'architecture/projects/station.md',
							image: '/architecture/station/3D2__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
						}),
					],
				}),
				content({
					id: '3Dgallery',
					title: 'About my 3D work',
					file: 'architecture/3Dgallery.md',
					image: '/architecture/3Dgallery/park-3D1__240-135-webp_240-135_400-225-webp_400-225_600-338-webp_600-338_820-461-webp_820-461_1400-788-webp_1400-788_1920-1080-webp_1920-1080.jpg',
				}),
			],
		}),

		separator(),

		// BLOG
		content({ id: 'blog', title: 'Blog', file: 'blog-index.json' }),
		content({ id: 'projects', title: 'Projects', file: 'projects-index.json' }),
	],
});
