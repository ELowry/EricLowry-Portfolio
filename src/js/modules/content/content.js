import { Lang } from '../ui/lang.js';
import { ContentTree } from './contentTree.js';

/** @typedef {import('./contentTree.js').ContentNode} ContentNode */

/**
 * @typedef {Object} InteractiveMapObject - Runtime representation of an interactive map object.
 * @property {string} id - Unique ID (matches the destination child node ID).
 * @property {{ x: number, y: number }} pos - Coordinates at which to spawn the object.
 * @property {number} radius - The object's collision radius for interactions.
 * @property {string} label - The localized label text.
 * @property {boolean} below - Whether this object is 'below' the camera.
 * @property {string} path - Slash-separated path in the content tree.
 * @property {'category'|'content'|'separator'} type - Whether the node is a category, content, or visual separator.
 * @property {string} [file=undefined] - Path to the markdown file relative to the content root.
 */

/**
 * Utility methods for navigating and manipulating the `ContentTree`.
 */
class ContentController {
	/**
	 * The content hierarchy tree's root node.
	 * @type {ContentNode}
	 */
	tree;

	/**
	 * Whether the content tree has been fully processed.
	 * @type {boolean}
	 */
	isReady;

	/**
	 * Map of markdown files to their tree paths.
	 * @type {Map<string, string[]>}
	 * @private
	 */
	#fileToPaths = new Map();

	constructor() {
		this.tree = ContentTree;
		this.isReady = false;
	}

	/**
	 * @returns {number} the default map bounds padding added beyond the furthers objects at either end.
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
	 * Walks the tree and loads all map configurations.
	 * @returns {Promise<void>} the compiled map data.
	 */
	async init() {
		const promises = [];
		const nodesToHydrate = [];
		const mapConfigs = ContentController.MAP_CONFIGS;
		const spriteConfigs = ContentController.SPRITE_CONFIGS;

		/**
		 * @param {ContentNode} node - The node to traverse.
		 * @param {Array<string>} [pathSegments=[]] - The current path segments.
		 * @returns {void}
		 */
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
					const expectedConfigPath = `${node.mapId}.config.js`;
					const configKey = Object.keys(mapConfigs).find((x) =>
						x.endsWith(expectedConfigPath)
					);

					if (!configKey) {
						throw new Error(`Map config not found for mapId: ${node.mapId}`);
					}

					const configModule = await mapConfigs[configKey]();
					const mapData = configModule.default || configModule;

					const expectedSpritePath = `${node.mapId}.sprites.js`;
					const spriteKey = Object.keys(spriteConfigs).find((x) =>
						x.endsWith(expectedSpritePath)
					);

					if (spriteKey) {
						try {
							const spriteModule = await spriteConfigs[spriteKey]();
							mapData.sprites = spriteModule.default || spriteModule;
						} catch (error) {
							console.error(
								`ContentController: Failed to load sprites for ${node.mapId}`,
								error
							);
						}
					}

					return mapData;
				};

				promises.push(loadMapData());
				nodesToHydrate.push(node);
			}

			if (node.children) {
				node.children.forEach((child) => traverse(child, newPathSegments));
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
		} catch (error) {
			console.error('Failed to load map configurations:', error);
		}
	}

	/**
	 * Finds a node in the `ContentTree` based on its path.
	 * @param {string} path - Path segments joined by `/`.
	 * @returns {ContentNode|null} the matching node, null if not found, or the full tree if no path is given.
	 */
	findNodeByPath(path) {
		if (!path) {
			return this.tree;
		}

		const parts = path.split('/').filter((x) => x);
		let currentNode = this.tree;

		for (const part of parts) {
			if (!currentNode.children) {
				return null;
			}

			const partLower = part.toLowerCase();
			const found = currentNode.children.find(
				(x) => x.id && x.id.toLowerCase() === partLower
			);
			if (!found) {
				return null;
			}

			currentNode = found;
		}

		return currentNode;
	}

	/**
	 * Find all tree paths associated with a specific markdown file.
	 * @param {string} filePath - The markdown file path relative to the contents folder.
	 * @returns {Arrray<string>} an array of tree paths.
	 */
	findPathsByFile(filePath) {
		if (!filePath) {
			return [];
		}

		const cleanFile = filePath.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes

		return this.#fileToPaths.get(cleanFile) || [];
	}

	/**
	 * Get the nearest parent map category node for a given path.
	 * If the node is content, returns the parent category.
	 * If the node is a category, returns it directly.
	 * @param {string} contentPath - Content or category path.
	 * @returns {ContentNode} the parent category node or the node itself.
	 */
	getParentCategoryMapNode(contentPath) {
		if (!contentPath) {
			return this.tree;
		}

		const parts = contentPath.split('/').filter((p) => p);
		const node = this.findNodeByPath(contentPath);

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
	 * Get the interactive objects from given map node.
	 * @param {ContentNode} mapNode - The category map node.
	 * @param {string} currentPath - Current path in content tree
	 * @returns {Array<InteractiveMapObject>} an array of interactive objects.
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

			const currentPosition = positions[child.id];
			if (!currentPosition) {
				continue;
			}

			const keyBase = currentPath ? `${currentPath.replace('/', '.')}.${child.id}` : child.id;
			const title = Lang.getString(`content.${keyBase}.title`, { fallback: child.title });

			let label = Lang.getString(`content.${keyBase}.label`, { fallback: title });
			if (currentPosition.label) {
				label = Lang.getString(currentPosition.label, { fallback: currentPosition.label });
			}

			const newObject = {
				id: child.id,
				pos: { x: currentPosition.x, y: currentPosition.y },
				radius: currentPosition.radius || 1.5,
				label,
				below: currentPosition.below === true,
				path: currentPath ? `${currentPath}/${child.id}` : child.id,
				type: child.type,
			};

			if (child.type === 'content' && child.file) {
				newObject.file = child.file;
			}

			objects.push(newObject);
		}

		return objects;
	}
}

export const Content = new ContentController();
