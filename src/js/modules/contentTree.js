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
 * @property {string} id - Unique identifier within current level
 * @property {string} title - Fallback literal title
 * @property {'category'|'content'} type - Whether the node is a category of content or a content node itself.
 * @property {string} [file] - Markdown file path (required if `type === content`)
 * @property {MapConfig} [mapLoader] - Game map settings (used if `type === category`)
 * @property {Array<ContentNode>} [children] - Child nodes (used if `type === category`)
 */

/**
 * Factory helper to create a content node (markdown file).
 * @param {string} id - Unique identifier for the node (URL segment).
 * @param {string} title - Fallback human-readable title.
 * @param {string} file - Path to the markdown file relative to the content root.
 * @param {boolean} hidden - Hides the node from text-mode navigation menus if `true`.
 * @returns {ContentNode} a standardized content node object.
 */
const content = (id, title, file, hidden = false) => ({
	id,
	title,
	type: 'content',
	file,
	hidden,
});

/**
 * Factory helper to create a category node.
 * @param {string} id - Unique identifier for the node (URL segment).
 * @param {string} title - Fallback human-readable title.
 * @param {() => Promise<any>} mapLoader - Function that imports the map's configuration.
 * @param {Array<ContentNode>} children - Child nodes (used if `type === category`)
 * @returns {ContentNode} a standardized content node object.
 */
const category = (id, title, mapLoader, children = []) => ({
	id,
	title,
	type: 'category',
	mapLoader,
	mapData: null, // Will be filled by init()
	children,
});

/**
 * The static definition of the application's content hierarchy.
 * This constant serves as the single source of truth for routing, game level layout, and navigation menus. It is built using factory functions to ensure structural consistency.
 * @type {ContentNode}
 */
export const ContentTree = category(
	'root',
	'Portfolio',
	() => import('../../maps/root.config.js'),
	[
		// Hidden
		content('privacy', 'Privacy Policy', 'info/privacy.md', true),

		// ROOT
		content('index', 'Welcome', 'index.md'),
		content('cv', 'Curriculum Vitae', 'cv.md'),
		content('about', 'Personal Philosophy', 'about.md'),

		// ARCHITECTURE
		category(
			'architecture',
			'Architecture Studies',
			() => import('../../maps/architecture.config.js'),
			[
				content('architecture', 'ENSA-V & ENSP-V', 'architecture/architecture.md', true),
				category(
					'3Dgallery',
					'3D Works Gallery',
					() => import('../../maps/architecture/3Dgallery.config.js'),
					[
						content(
							'3Dgallery',
							'About my 3D work',
							'architecture/3Dgallery/3Dgallery.md',
							true
						),
					]
				),
				category(
					'projects',
					'Selection of Architecture Projects',
					() => import('../../maps/architecture/projects.config.js'),
					[
						content('projects', 'Overview', 'architecture/projects/projects.md', true),
						content('Unstant', 'Unstant', 'gaming/Unstant.md'),
					]
				),
			]
		),

		// COACHING & BUSINESS
		category(
			'coaching-business',
			'Coaching & Business',
			() => import('../../maps/coaching-business.config.js'),
			[
				content(
					'coaching-business',
					'Overview',
					'coaching-business/coaching-business.md',
					true
				),
				category(
					'CinQ',
					'CinQ – corporate team training video game',
					() => import('../../maps/coaching-business/CinQ.config.js'),
					[
						content('CinQ', 'About CinQ', 'gaming/CinQ.md', true),
						content('website', 'CinQ Website', 'websites/CinQ.md'),
					]
				),
				content('medium', 'Medium Editing', 'coaching-business/medium.md'),
				content('podcast', 'Podcast Editing', 'coaching-business/podcast.md'),
			]
		),

		// GAMING
		category('gaming', 'Video Games', () => import('../../maps/gaming.config.js'), [
			content('gaming', 'Overview', 'gaming/gaming.md', true),
			content('CinQ', 'CinQ – corporate team training video game', 'gaming/CinQ.md'),
			content('InputLayers', 'InputLayers', 'gaming/InputLayers.md'),
			content('Unstant', 'Unstant', 'gaming/Unstant.md'),
		]),

		// OpenSource
		category('osd', 'Open Source Development', () => import('../../maps/osd.config.js'), [
			content('osd', 'Open Source Projects', 'osd/osd.md', true),
			content('InputLayers', 'InputLayers', 'gaming/InputLayers.md'),
			content('winget-updater', 'WinGet Updater', 'osd/winget-updater.md'),
			content(
				'marked-responsive-images',
				'Marked Responsive Images',
				'osd/marked-responsive-images.md'
			),
			content(
				'obsidian-replace-commands',
				'Obsidian Replace Commands',
				'osd/obsidian-replace-commands.md'
			),
			content('dns-toggle', 'DNS Toggle', 'osd/dns-toggle.md'),
			content('StadiaIcons', 'StadiaIcons', 'osd/StadiaIcons.md'),
		]),

		// Websites
		category(
			'websites',
			'Web Development & Design',
			() => import('../../maps/websites.config.js'),
			[
				content('websites', 'Web Development & Design', 'websites/websites.md', true),
				content('CinQ', 'CinQ – corporate team training video game', 'websites/CinQ.md'),
				content('altoe', 'Alto´e', 'websites/altoe.md'),
				category(
					'lightweight-static',
					'Lightweight Static Sites',
					() => import('../../maps/websites/lightweight-static.config.js'),
					[
						content(
							'lightweight-static',
							'Lightweight Static Framework',
							'websites/lightweight-static/lightweight-static.md',
							true
						),
						content(
							'thenextmind',
							'The Next Mind',
							'websites/lightweight-static/thenextmind.md'
						),
						content('luzech', 'Luzech', 'websites/lightweight-static/luzech.md'),
						content(
							'koalakrash',
							'Koala Krash',
							'websites/lightweight-static/koalakrash.md'
						),
					]
				),
				content('StadiaIcons', 'StadiaIcons', 'osd/StadiaIcons.md'),
				content('archive', 'Archive of Defunct Websites', 'websites/archive.md'),
			]
		),
	]
);
