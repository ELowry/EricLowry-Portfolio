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
		content('index', 'Welcome', 'index.md'),

		content('privacy', 'Privacy Policy', 'info/privacy.md', true),

		category('about', 'About Me', () => import('../../maps/about.config.js'), [
			content('cv', 'Curriculum Vitae', 'about/cv.md'),
			content('about', 'About Overview', 'about/about.md'),
			content('bio', 'Biography', 'about/bio.md'),
			content('history', 'Work History', 'about/history.md'),
		]),

		category('projects', 'Projects', () => import('../../maps/projects.config.js'), [
			content('projects', 'Projects Overview', 'projects/projects.md'),
			content('cool-game', 'Cool Game', 'projects/game.md'),
		]),
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
	}

	/**
	 * Walks the tree and loads all map configurations.
	 */
	async init() {
		const promises = [];
		const nodesToHydrate = [];

		const traverse = (node) => {
			if (node.mapLoader) {
				const mapToLoad = node.mapLoader();
				promises.push(mapToLoad);
				nodesToHydrate.push(node);
			}
			node.children?.forEach(traverse);
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

			const found = current.children.find((c) => c.id === part);
			if (!found) {
				return null;
			}

			current = found;
		}

		return current;
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
			};

			if (child.type === 'content' && child.file) {
				obj.file = child.file;
			} else if (child.type === 'category') {
				obj.path = currentPath ? `${currentPath}/${child.id}` : child.id;
			}

			objects.push(obj);
		}

		return objects;
	}
}

export const Content = new ContentController();
