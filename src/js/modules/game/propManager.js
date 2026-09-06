import { Content } from '../content/content.js';
import { Engine } from '../core/engineContext.js';
import { Events } from '../core/events.js';
import { AnimatedEntity } from './animatedEntity.js';
import { InputPromptEntity } from './props/inputPromptEntity.js';
import { StaticPropEntity } from './props/staticPropEntity.js';

/**
 * @typedef {Object} PropAnimationData
 * @property {Array<number>} frames - The ordered array of grid indexes.
 * @property {number} speed - Playback speed in frames per second.
 * @property {boolean} [loop=true] - Whether the animation loops.
 */

/**
 * @typedef {Object} PropDefinition
 * @property {string} [entityType='static'] - The specific class behavior to instantiate ('static', 'animated', 'inputPrompt').
 * @property {boolean} [isAnimated] - Legacy boolean for AnimatedEntity (superseded by entityType).
 * @property {Object} resolution - The pixel dimensions of a single frame (`vec2`).
 * @property {Object} [size=null] - The physical size in world units (`vec2`). Defaults to resolution / 10.
 * @property {Object} [offset=null] - The pixel offset in the spritesheet (`vec2`).
 * @property {number} [cols=1] - The number of columns in the spritesheet grid.
 * @property {Object<string, PropAnimationData>} [animations=null] - Dictionary of animations.
 * @property {string} [defaultState='idle'] - The default animation state to play.
 */

/**
 * @typedef {Object} SpriteConfig
 * @property {Object<string, PropDefinition>} [shared=null] - Prop definitions that cascade to child maps.
 * @property {Object<string, PropDefinition>} [local=null] - Prop definitions specific only to the current map.
 */

/**
 * Manages cascading sprite definitions and prop instantiation for map regions.
 */
class PropManagerController {
	/** @type {Map<string, Object>} */
	#activeDefinitions;

	/** @type {Array<Object>} */
	#activeProps;

	/** @type {Object<string, Function>} */
	#entityMap;

	/**
	 * Creates a new PropManagerController.
	 */
	constructor() {
		this.#activeDefinitions = new Map();
		this.#activeProps = [];

		this.#entityMap = {
			static: StaticPropEntity,
			animated: AnimatedEntity,
			inputPrompt: InputPromptEntity,
		};

		Events.on('route:changed', (payload) => {
			this.#handleRouteChanged(payload);
		});
	}

	/**
	 * Clears and rebuilds the active prop definitions based on the provided cascading configs.
	 * @param {Array<SpriteConfig>} configChain - Array of loaded sprite config objects from root to local node.
	 * @returns {void}
	 */
	buildRegistry(configChain) {
		this.#activeDefinitions.clear();

		for (const config of configChain) {
			if (config.shared) {
				for (const [key, def] of Object.entries(config.shared)) {
					this.#activeDefinitions.set(key, def);
				}
			}
		}

		const localConfig = configChain[configChain.length - 1];
		if (localConfig && localConfig.local) {
			for (const [key, def] of Object.entries(localConfig.local)) {
				this.#activeDefinitions.set(key, def);
			}
		}
	}

	/**
	 * Spawns an array of props based on the active definitions.
	 * @param {import('../content/contentTree.js').PropPlacement[]} propsData - The map's declarative props array.
	 * @param {number} [mapTextureIndex=0] - The spritesheet index of the current map.
	 * @returns {Array<Object>} The instantiated entities.
	 */
	spawnProps(propsData, mapTextureIndex = 0) {
		const spawned = [];

		if (!propsData || propsData.length === 0) {
			return spawned;
		}

		for (const data of propsData) {
			const def = this.#activeDefinitions.get(data.type);

			if (!def) {
				if (import.meta.env.DEV) {
					console.warn(
						`PropManager: Definition for "${data.type}" not found in current region.`
					);
				}
				continue;
			}

			const pos = Engine.LJS.vec2(data.pos.x, data.pos.y);
			const renderOrder = data.renderOrder !== undefined ? data.renderOrder : 0;
			const propSize =
				def.size || Engine.LJS.vec2(def.resolution.x / 10, def.resolution.y / 10);

			let targetType = def.entityType || 'static';
			if (def.isAnimated && !def.entityType) {
				targetType = 'animated';
			}

			const isAnimatedBase = targetType !== 'static';
			const EntityClass = this.#entityMap[targetType] || this.#entityMap['static'];

			if (isAnimatedBase) {
				const entity = new EntityClass(
					pos,
					propSize,
					mapTextureIndex,
					def.resolution,
					renderOrder
				);
				entity.gridOffset = def.offset || Engine.LJS.vec2(0, 0);
				entity.gridCols = def.cols || 1;

				if (targetType === 'inputPrompt' && typeof entity.setLogicalKey === 'function') {
					entity.setLogicalKey(def.logicalKey || 'A');
				}

				if (def.animations) {
					for (const [animName, animData] of Object.entries(def.animations)) {
						entity.addAnimation(
							animName,
							animData.frames || [0],
							animData.speed || 0,
							animData.loop || false
						);

						if (animData.keys) {
							entity.animations[animName].keys = animData.keys;
						}
					}
				}

				const defaultState =
					def.defaultState || (targetType === 'inputPrompt' ? 'mnk' : 'idle');
				entity.setState(defaultState);

				const defaultShadow = targetType === 'inputPrompt' ? 'none' : 'floor';
				entity.shadowType = def.shadowType !== undefined ? def.shadowType : defaultShadow;
				if (def.shadowDistance !== undefined) {
					entity.shadowDistance = def.shadowDistance;
				}
				if (def.shadowBaselineOffset !== undefined) {
					entity.shadowBaselineOffset = def.shadowBaselineOffset;
				}

				spawned.push(entity);
			} else {
				let tileInfo;
				const padding = AnimatedEntity.SPRITE_PADDING;

				if (def.offset) {
					const dummyTile = Engine.LJS.tile(0, def.resolution, mapTextureIndex);
					tileInfo = new Engine.LJS.TileInfo(
						Engine.LJS.vec2(def.offset.x + padding, def.offset.y + padding),
						def.resolution,
						dummyTile.textureInfo,
						padding
					);
				} else {
					tileInfo = Engine.LJS.tile(0, def.resolution, mapTextureIndex, padding);
				}

				const entity = new EntityClass(
					pos,
					propSize,
					tileInfo,
					0,
					new Engine.LJS.Color(1, 1, 1),
					renderOrder
				);

				entity.shadowType = def.shadowType !== undefined ? def.shadowType : 'floor';
				if (def.shadowDistance !== undefined) {
					entity.shadowDistance = def.shadowDistance;
				}
				if (def.shadowBaselineOffset !== undefined) {
					entity.shadowBaselineOffset = def.shadowBaselineOffset;
				}

				spawned.push(entity);
			}
		}

		return spawned;
	}

	/**
	 * Destroys current props, resolves the configuration cascade, and spawns the new map's props.
	 * @param {Object} payload - The route payload.
	 * @param {string} payload.mode - The application mode.
	 * @param {string} payload.path - The active route path.
	 * @private
	 */
	#handleRouteChanged({ mode, path }) {
		if (mode !== 'game') {
			return;
		}

		for (const prop of this.#activeProps) {
			if (typeof prop.destroy === 'function') {
				prop.destroy();
			}
		}
		this.#activeProps = [];

		const mapNode = Content.getParentMapNode(path);
		if (!mapNode) {
			return;
		}

		const configChain = [];
		const pathParts = path.split('/').filter((p) => {
			return p;
		});

		let currentPath = '';

		if (Content.tree && Content.tree.mapData && Content.tree.mapData.sprites) {
			configChain.push(Content.tree.mapData.sprites);
		}

		for (const part of pathParts) {
			currentPath += (currentPath ? '/' : '') + part;
			const n = Content.findNodeByPath(currentPath);
			if (n && n.mapData && n.mapData.sprites) {
				configChain.push(n.mapData.sprites);
			}
			if (n === mapNode) {
				break;
			}
		}

		this.buildRegistry(configChain);

		if (mapNode.mapData && mapNode.mapData.props) {
			const mapTexIndex = mapNode.mapData.textureIndex || 0;
			this.#activeProps = this.spawnProps(mapNode.mapData.props, mapTexIndex);
		}
	}
}

export const PropManager = new PropManagerController();
