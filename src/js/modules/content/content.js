import { Lang } from '../ui/lang.js';
import { ContentTree } from './contentTree.js';

/**
 * ContentController provides utility methods for navigating and manipulating the `ContentTree`.
 */
class ContentController {
	/** @type {Map<string, string[]>} Internal mapping of markdown files to their tree paths. */
	#fileToPaths = new Map();

	/**
	 * @property {import('./contentTree.js').ContentNode} tree - The root of the content hierarchical tree.
	 * @property {boolean} isReady - True if the content tree has been fully processed.
	 */
	constructor() {
		this.tree = ContentTree;
		this.isReady = false;
	}

	/**
	 * @returns {number} the default padding added to the furthest objects when auto-calculating map bounds.
	 * @constant
	 */
	static get DEFAULT_BOUNDS_MARGIN() {
		return 5;
	}

	/**
	 * @returns {Record<string, () => Promise<any>>} Glob mapping for dynamic map configurations.
	 * @constant
	 */
	static get MAP_CONFIGS() {
		return import.meta.glob('../../../maps/**/*.config.js');
	}

	/**
	 * @returns {Record<string, () => Promise<any>>} Glob mapping for dynamic map sprites.
	 * @constant
	 */
	static get SPRITE_CONFIGS() {
		return import.meta.glob('../../../maps/**/*.sprites.js');
	}

	/**
	 * Walks the tree and loads all map configurations, auto-calculating bounds where missing.
	 * @returns {Promise<void>}
	 */
	async init() {
		const promises = [];
		const nodesToHydrate = [];
		const mapConfigs = ContentController.MAP_CONFIGS;
		const spriteConfigs = ContentController.SPRITE_CONFIGS;

		const traverse = (node, pathSegments = []) => {
			if (node.type === 'separator') {
				return;
			}

			const currentId = node.id === 'root' ? '' : node.id;
			const newPathSegments = currentId ? [...pathSegments, currentId] : pathSegments;
			const currentPath = newPathSegments.join('/');

			if (node.file) {
				if (!this.#fileToPaths.has(node.file)) {
					this.#fileToPaths.set(node.file, []);
				}
				this.#fileToPaths.get(node.file).push(currentPath);
			}

			if (node.mapId) {
				const loadMapData = async () => {
					const configKey = `../../../maps/${node.mapId}.config.js`;
					const configImporter = mapConfigs[configKey];

					if (!configImporter) {
						throw new Error(`Map config not found for mapId: ${node.mapId}`);
					}

					const configModule = await configImporter();
					const mapData = configModule.default || configModule;

					const spriteKey = `../../../maps/${node.mapId}.sprites.js`;
					const spriteImporter = spriteConfigs[spriteKey];

					if (spriteImporter) {
						try {
							const spriteModule = await spriteImporter();
							mapData.sprites = spriteModule.default || spriteModule;
						} catch {
							// No custom sprites exist for this map
						}
					}

					return mapData;
				};

				promises.push(loadMapData());
				nodesToHydrate.push(node);
			}

			if (node.children) {
				node.children.forEach((child) => {
					traverse(child, newPathSegments);
				});
			}
		};

		traverse(this.tree);

		try {
			const results = await Promise.all(promises);

			results.forEach((module, index) => {
				const mapData = module.default || module;

				if (!mapData.bounds) {
					let minX = mapData.startPos ? mapData.startPos.x : 0;
					let maxX = mapData.startPos ? mapData.startPos.x : 0;

					if (mapData.positions) {
						for (const key in mapData.positions) {
							const posX = mapData.positions[key].x;
							if (typeof posX === 'number') {
								if (posX < minX) {
									minX = posX;
								}
								if (posX > maxX) {
									maxX = posX;
								}
							}
						}
					}

					mapData.bounds = {
						minX: minX - ContentController.DEFAULT_BOUNDS_MARGIN,
						maxX: maxX + ContentController.DEFAULT_BOUNDS_MARGIN,
					};
				}

				nodesToHydrate[index].mapData = mapData;
			});

			this.isReady = true;
		} catch (err) {
			console.error('Failed to load map configurations:', err);
		}
	}

	/**
	 * Finds a node in the ContentTree by its path.
	 * @param {string} path - Path segments joined by `/` (e.g., `about/bio`)
	 * @returns {Object|null} the matching node or null if not found
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
			const found = current.children.find((c) => c.id && c.id.toLowerCase() === partLower);
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
	 * @returns {string[]} an array of tree paths (e.g., `['gaming/Unstant', 'architecture/projects/Unstant']`)
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
	 * @returns {Object} the parent category node or the node itself
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

		if (node.type === 'content' && (!node.children || node.children.length === 0)) {
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
	 * @returns {Array} an array of interactive objects with `pos`, `radius`, `file`, `label`, `path`, `id`
	 */
	buildMapObjects(mapNode, currentPath) {
		if (!mapNode || !mapNode.mapData || !mapNode.children) {
			return [];
		}

		const objects = [];
		const positions = mapNode.mapData.positions || {};

		for (const child of mapNode.children) {
			if (child.type === 'separator') {
				continue;
			}

			const posData = positions[child.id];
			if (!posData) {
				continue;
			}

			const keyBase = currentPath ? `${currentPath.replace('/', '.')}.${child.id}` : child.id;
			const title = Lang.getString(`content.${keyBase}.title`, null, child.title || '');

			let label;
			if (posData.label) {
				label = Lang.getString(posData.label, null, posData.label);
			} else {
				label = Lang.getString(`content.${keyBase}.label`, null, title);
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
