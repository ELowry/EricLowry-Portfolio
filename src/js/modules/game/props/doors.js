import { Engine } from '../../core/engineContext.js';
import { AnimatedEntity } from '../animatedEntity.js';

/**
 * @typedef {Object} DoorHighlightConfig
 * @property {Object} resolution - The pixel dimensions of the highlight frame.
 * @property {Object} [offset=null] - The pixel offset in the spritesheet.
 * @property {Object} [renderSize=null] - The physical size in world units. Defaults to resolution / 10.
 * @property {Object} [renderOffset=null] - The physical offset relative to the door's base position.
 */

/**
 * @typedef {Object} DoorConfig
 * @property {Object} resolution - Pixel dimensions of a single frame.
 * @property {Object} [size=null] - Physical size in world units. Defaults to resolution / 10.
 * @property {number} [textureIndex=0] - Sprite sheet index.
 * @property {Object} [offset=null] - Pixel offset in the spritesheet.
 * @property {number} [cols=1] - Number of columns in the spritesheet grid.
 * @property {number} [animDelayOpen=0] - Frames to wait before starting the opening animation.
 * @property {number} [animSpeedOpen=0] - Frames per second for the opening animation.
 * @property {number} [yOffset=0] - Physical Y offset in world units applied upon instantiation.
 * @property {Array<number>} [framesClosed=[0]] - The frames to use for the closed state.
 * @property {Array<number>} [framesOpening=[0]] - The frames to use for the opening animation sequence.
 * @property {Array<number>} [framesOpen=[0]] - The frames to use for the open state.
 * @property {DoorHighlightConfig} [highlightConfig=null] - Configuration for the door's highlight frame.
 */

/**
 * Interactive door entity representing map nodes.
 */
export class Door extends AnimatedEntity {
	/** @type {boolean} */
	isHighlighted;

	/** @type {boolean} */
	isFrontInteract;

	/** @type {number} */
	animDelayOpen;

	/** @type {number} */
	yOffset;

	/** @type {DoorHighlightConfig} */
	highlightConfig;

	/** @type {Object} */
	highlightRenderSize;

	/** @type {Object} */
	highlightRenderOffset;

	/** @type {Object|null} */
	#highlightTileInfo;

	/**
	 * @param {Object} pos - World space coordinates.
	 * @param {string} [variant='front'] - The visual variant of the door ('front', 'behind', 'sign').
	 * @param {DoorConfig} [customConfig={}] - Overrides for the default door configuration.
	 */
	constructor(pos, variant = 'front', customConfig = {}) {
		let baseConfig;
		if (variant === 'sign') {
			baseConfig = Door.CONFIG_SIGN;
		} else if (variant === 'behind') {
			baseConfig = Door.CONFIG_BEHIND;
		} else {
			baseConfig = Door.CONFIG_FRONT;
		}

		const config = { ...baseConfig, ...customConfig };

		const texIndex = config.textureIndex || 0;
		const zIndex = variant === 'behind' ? 1 : -1;

		const calculatedSize =
			config.size || Engine.LJS.vec2(config.resolution.x / 10, config.resolution.y / 10);

		super(pos, calculatedSize, texIndex, config.resolution, zIndex);

		this.isHighlighted = false;
		this.isFrontInteract = variant !== 'behind';
		this.animDelayOpen = config.animDelayOpen || 0;
		this.yOffset = config.yOffset || 0;
		this.highlightConfig = config.highlightConfig;

		this.gridOffset = config.offset || Engine.LJS.vec2(0, 0);
		this.gridCols = config.cols || 1;

		this.pos.y += this.isFrontInteract ? this.yOffset : -this.yOffset;
		this.setCollision(false, false);

		this.addAnimation('closed', config.framesClosed || [0], 0, false);
		this.addAnimation('opening', config.framesOpening || [0], config.animSpeedOpen || 0, false);
		this.addAnimation('open', config.framesOpen || [0], 0, false);

		this.setState('closed');

		this.highlightRenderSize = this.size;
		this.highlightRenderOffset = Engine.LJS.vec2(0, 0);
		this.#highlightTileInfo = null;

		if (this.highlightConfig) {
			const hc = this.highlightConfig;
			const padding = AnimatedEntity.SPRITE_PADDING;
			const hcOffset = hc.offset || Engine.LJS.vec2(0, 0);
			const pixelX = hcOffset.x + padding;
			const pixelY = hcOffset.y + padding;

			this.highlightRenderSize =
				hc.renderSize || Engine.LJS.vec2(hc.resolution.x / 10, hc.resolution.y / 10);
			this.highlightRenderOffset = hc.renderOffset || Engine.LJS.vec2(0, 0);

			const dummyTile = Engine.LJS.tile(0, hc.resolution, texIndex);
			this.#highlightTileInfo = new Engine.LJS.TileInfo(
				Engine.LJS.vec2(pixelX, pixelY),
				hc.resolution,
				dummyTile.textureInfo
			);
		}
	}

	/**
	 * @returns {DoorConfig} The configuration object for doors that are in front of the player.
	 * @constant
	 */
	static get CONFIG_FRONT() {
		return {
			resolution: Engine.LJS.vec2(16, 35),
			offset: Engine.LJS.vec2(0, 36),
			cols: 5,
			animDelayOpen: 24,
			animSpeedOpen: 12,
			yOffset: 1,
			framesOpening: [1, 2, 3],
			framesOpen: [3],
			highlightConfig: {
				resolution: Engine.LJS.vec2(20, 35),
				offset: Engine.LJS.vec2(72, 36),
				renderOffset: Engine.LJS.vec2(0, 0.1),
			},
		};
	}

	/**
	 * @returns {DoorConfig} The configuration object for doors that are behind the player.
	 * @constant
	 */
	static get CONFIG_BEHIND() {
		return {
			resolution: Engine.LJS.vec2(21, 35),
			offset: Engine.LJS.vec2(94, 36),
			cols: 4,
			animDelayOpen: 20,
			animSpeedOpen: 10,
			yOffset: 0.4,
			framesOpening: [1, 2, 3],
			framesOpen: [3],
			highlightConfig: {
				resolution: Engine.LJS.vec2(20, 35),
				offset: Engine.LJS.vec2(186, 36),
				renderOffset: Engine.LJS.vec2(-0.2, -0.2),
			},
		};
	}

	/**
	 * @returns {DoorConfig} The configuration object for static text-content signs.
	 * @constant
	 */
	static get CONFIG_SIGN() {
		return {
			resolution: Engine.LJS.vec2(20, 19),
			offset: Engine.LJS.vec2(230, 52),
			yOffset: 0.2,
			highlightConfig: {
				resolution: Engine.LJS.vec2(22, 11),
				offset: Engine.LJS.vec2(252, 52),
				renderOffset: Engine.LJS.vec2(0, 0.5),
			},
		};
	}

	/**
	 * Renders the door and its highlight overlay.
	 * @returns {void}
	 */
	render() {
		super.render();

		if (this.isHighlighted && this.#highlightTileInfo) {
			const highlightPos = Engine.LJS.vec2(
				this.pos.x + this.highlightRenderOffset.x,
				this.pos.y + this.highlightRenderOffset.y
			);

			Engine.LJS.drawTile(
				highlightPos,
				this.highlightRenderSize,
				this.#highlightTileInfo,
				this.color,
				this.angle,
				this.mirror
			);
		}
	}

	/**
	 * Triggers the opening animation sequence.
	 * @returns {void}
	 */
	open() {
		if (this.currentState === 'closed') {
			this.setState('opening', this.animDelayOpen / 60);
		}
	}

	/**
	 * Sets the visual highlight state of the door.
	 * @param {boolean} highlighted - Whether the door should be highlighted.
	 * @returns {void}
	 */
	setHighlight(highlighted) {
		this.isHighlighted = highlighted;
	}
}
