import { Lang } from './lang.js';

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
 * @property {'category'|'content'} type
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
 * @returns {ContentNode} A standardized content node object.
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
 * @param {Array} children
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
				content('architecture', 'ENSA-V & ENSP-V', 'architecture/architecture.md'),
				category(
					'3Dgallery',
					'3D Works Gallery',
					() => import('../../maps/architecture/3Dgallery.config.js'),
					[
						content(
							'3Dgallery',
							'About my 3D work',
							'architecture/3Dgallery/3Dgallery.md'
						),
					]
				),
				category(
					'projects',
					'Selection of Architecture Projects',
					() => import('../../maps/architecture/projects.config.js'),
					[
						content('projects', 'Overview', 'architecture/projects/projects.md'),
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
				content('coaching-business', 'Overview', 'coaching-business/coaching-business.md'),
				content('medium', 'Medium Editing', 'coaching-business/medium.md'),
				content('podcast', 'Podcast Editing', 'coaching-business/podcast.md'),
			]
		),

		// GAMING
		category('gaming', 'Video Games', () => import('../../maps/gaming.config.js'), [
			content('gaming', 'Overview', 'gaming/gaming.md'),
			content('InputLayers', 'InputLayers', 'gaming/InputLayers.md'),
			content('Unstant', 'Unstant', 'gaming/Unstant.md'),
			category(
				'CinQ',
				'CinQ – corporate team training video game',
				() => import('../../maps/gaming/CinQ.config.js'),
				[
					content('CinQ', 'About CinQ', 'gaming/CinQ/CinQ.md'),
					content('gallery', 'CinQ Footage', 'gaming/CinQ/gallery.md'),
					content('website', 'CinQ Website', 'gaming/CinQ/website.md'),
				]
			),
		]),

		// OpenSource
		category('osd', 'Open Source Development', () => import('../../maps/osd.config.js'), [
			content('osd', 'Open Source Projects', 'osd/osd.md'),
			content('InputLayers', 'InputLayers', 'gaming/InputLayers.md'),
			content('winget-updater', 'WinGet Updater', 'osd/winget-updater.md'),
			content(
				'marked-responsive-images',
				'Marked Responsive Images',
				'osd/marked-responsive-images.md'
			),
			content('StadiaIcons', 'StadiaIcons', 'osd/StadiaIcons.md'),
		]),

		// Websites
		category(
			'websites',
			'Web Development & Design',
			() => import('../../maps/websites.config.js'),
			[
				content('websites', 'Web Development & Design', 'websites/websites.md'),
				content(
					'CinQ',
					'CinQ – corporate team training video game',
					'gaming/CinQ/website.md'
				),
				content('thenextmind', 'The Next Mind', 'websites/thenextmind.md'),
				content('luzech', 'Luzech', 'websites/luzech.md'),
				content('koalakrash', 'Koala Krash', 'websites/koalakrash.md'),
				content('archive', 'Archive of Defunct Websites', 'websites/archive.md'),
			]
		),
	]
);

/**
 * ContentController provides utility methods for navigating and manipulating the `ContentTree`.
 */
class ContentController {
	constructor() {
		/** @type {ContentNode} The root of the content hierarchical tree. */
		this.tree = ContentTree;
		/** @type {boolean} True if the content tree has been fully processed. */
		this.isReady = false;
		/** @type {Map<string, string[]>} Internal mapping of markdown files to their tree paths. */
		this.#fileToPaths = new Map();
	}

	/** @type {Map<string, string[]>} */
	#fileToPaths;

	/**
	 * Walks the tree and loads all map configurations.
	 */
	async init() {
		const promises = [];
		const nodesToHydrate = [];

		const traverse = (node, pathSegments = []) => {
			const currentId = node.id === 'root' ? '' : node.id;
			const newPathSegments = currentId ? [...pathSegments, currentId] : pathSegments;
			const currentPath = newPathSegments.join('/');

			if (node.file) {
				if (!this.#fileToPaths.has(node.file)) {
					this.#fileToPaths.set(node.file, []);
				}
				this.#fileToPaths.get(node.file).push(currentPath);
			}

			if (node.mapLoader) {
				const mapToLoad = node.mapLoader();
				promises.push(mapToLoad);
				nodesToHydrate.push(node);
			}

			node.children?.forEach((child) => {
				traverse(child, newPathSegments);
			});
		};

		traverse(this.tree);

		try {
			const results = await Promise.all(promises);

			results.forEach((module, index) => {
				// Handle both default exports (ESM) and direct exports
				nodesToHydrate[index].mapData = module.default || module;
				// Clear the loader to free memory
				delete nodesToHydrate[index].mapLoader;
			});

			this.isReady = true;
		} catch (err) {
			console.error('Failed to load map configurations:', err);
		}
	}

	/**
	 * Finds a node in the ContentTree by its path.
	 * @param {string} path - Path segments joined by `/` (e.g., `about/bio`)
	 * @returns {Object|null} The matching node or null if not found
	 */
	findNodeByPath(path) {
		if (!path) {
			return this.tree;
		}

		const parts = path.split('/').filter((p) => p);
		let current = this.tree;

		for (const part of parts) {
			if (!current.children) {
				return null;
			}

			const partLower = part.toLowerCase();
			const found = current.children.find((c) => c.id.toLowerCase() === partLower);
			if (!found) {
				return null;
			}

			current = found;
		}

		return current;
	}

	/**
	 * Returns all tree paths associated with a specific markdown file.
	 * @param {string} file - The markdown file path (e.g., `gaming/Unstant.md`)
	 * @returns {string[]} Array of tree paths (e.g., `['gaming/Unstant', 'architecture/projects/Unstant']`)
	 */
	findPathsByFile(file) {
		if (!file) {
			return [];
		}

		// Normalize file path to remove leading/trailing slashes if any
		const cleanFile = file.replace(/^\/|\/$/g, '');
		return this.#fileToPaths.get(cleanFile) || [];
	}

	/**
	 * Gets the parent map node (category) for a given path.  
	 * If the path points to content, returns the parent category.  
	 * If the path points to a category, returns that category.
	 * @param {string} path - Path of the content or category
	 * @returns {Object} The parent category node or the node itself
	 */
	getParentMapNode(path) {
		if (!path) {
			return this.tree;
		}

		const parts = path.split('/').filter((p) => p);
		const node = this.findNodeByPath(path);

		if (!node) {
			return this.tree;
		}

		if (node.type === 'content') {
			parts.pop();
			return this.findNodeByPath(parts.join('/'));
		}

		return node;
	}

	/**
	 * Builds interactive objects array for a map by combining children data with position data.  
	 * This is the bridge between content structure and game world layout.
	 * @param {Object} mapNode - Category node with `mapData` and `children`
	 * @param {string} currentPath - Current path in content tree
	 * @returns {Array} Array of interactive objects with `pos`, `radius`, `file`, `label`, `path`, `id`
	 */
	buildMapObjects(mapNode, currentPath) {
		if (!mapNode || !mapNode.mapData || !mapNode.children) {
			return [];
		}

		const objects = [];
		const positions = mapNode.mapData.positions || {};

		for (const child of mapNode.children) {
			const posData = positions[child.id];
			if (!posData) {
				continue;
			}

			const keyBase = currentPath ? `${currentPath}.${child.id}` : child.id;
			const translatedTitle = Lang.getString(`content.${keyBase}.title`);
			const fallbackTitle = child.title || '';
			const title = translatedTitle !== 'notFound' ? translatedTitle : fallbackTitle;

			let label = title;
			if (posData.label) {
				const translatedLabelAttempt = Lang.getString(posData.label);
				label =
					translatedLabelAttempt !== 'notFound' ? translatedLabelAttempt : posData.label;
			} else {
				const translatedPosLabel = Lang.getString(`content.${keyBase}.label`);
				if (translatedPosLabel !== 'notFound') {
					label = translatedPosLabel;
				}
			}

			const obj = {
				id: child.id,
				pos: { x: posData.x, y: posData.y },
				radius: posData.radius || 1.5,
				label,
				below: posData.below === true,
				path: currentPath ? `${currentPath}/${child.id}` : child.id,
				type: child.type,
			};

			if (child.type === 'content' && child.file) {
				obj.file = child.file;
			}

			objects.push(obj);
		}

		return objects;
	}
}

export const Content = new ContentController();
