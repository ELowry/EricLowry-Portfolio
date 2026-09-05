import { Engine } from '../../core/engineContext.js';
import { AnimatedEntity } from '../animatedEntity.js';

/**
 * @typedef {Object} DoorHighlightConfig
 * @property {number} [textureIndex] - The sprite sheet index.
 * @property {Object} [resolution] - The pixel dimensions of the highlight frame.
 * @property {Object} [offset] - The pixel offset in the spritesheet.
 * @property {number} [padding] - The padding in pixels.
 * @property {Object} [renderSize] - The physical size in world units.
 * @property {Object} [renderOffset] - The physical offset relative to the door's base position.
 */

/**
 * @typedef {Object} DoorConfig
 * @property {Object} [size] - Physical size in world units.
 * @property {number} [textureIndex] - Sprite sheet index.
 * @property {Object} [resolution] - Pixel dimensions of a single frame.
 * @property {Object} [offset] - Pixel offset in the spritesheet.
 * @property {number} [cols] - Number of columns in the spritesheet grid.
 * @property {number} [padding] - Padding between frames in pixels.
 * @property {number} [animDelayOpen] - Frames to wait before starting the opening animation.
 * @property {number} [animSpeedOpen] - Frames per second for the opening animation.
 * @property {number} [yOffset] - Physical Y offset in world units applied upon instantiation.
 * @property {DoorHighlightConfig} [highlightConfig] - Configuration for the door's highlight frame.
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
	 * @param {boolean} [isFrontInteract=false] - Whether the interaction triggers a front-facing animation.
	 * @param {DoorConfig} [customConfig={}] - Overrides for the default door configuration.
	 */
	constructor(pos, isFrontInteract = false, customConfig = {}) {
		const baseConfig = isFrontInteract ? Door.CONFIG_FRONT : Door.CONFIG_BEHIND;
		const config = { ...baseConfig, ...customConfig };

		const texIndex = config.textureIndex !== undefined ? config.textureIndex : 0;

		super(pos, config.size, texIndex, config.resolution, isFrontInteract ? -1 : 1);

		this.isHighlighted = false;
		this.isFrontInteract = isFrontInteract;
		this.animDelayOpen = config.animDelayOpen;
		this.yOffset = config.yOffset;
		this.highlightConfig = config.highlightConfig;

		this.spritePadding = config.padding;
		this.gridOffset = config.offset;
		this.gridCols = config.cols;

		this.pos.y += this.isFrontInteract ? this.yOffset : -this.yOffset;
		this.setCollision(false, false);

		this.addAnimation('closed', [0], 0, false);
		this.addAnimation('opening', [1, 2, 3], config.animSpeedOpen, false);
		this.addAnimation('open', [3], 0, false);

		this.setState('closed');

		this.highlightRenderSize = this.size;
		this.highlightRenderOffset = Engine.LJS.vec2(0, 0);
		this.#highlightTileInfo = null;

		if (this.highlightConfig) {
			const hc = this.highlightConfig;
			const pixelX = hc.offset.x + hc.padding;
			const pixelY = hc.offset.y + hc.padding;

			this.highlightRenderSize = hc.renderSize || this.size;
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
			size: Engine.LJS.vec2(1.6, 3.5),
			textureIndex: 0,
			resolution: Engine.LJS.vec2(16, 35),
			offset: Engine.LJS.vec2(0, 36),
			cols: 5,
			padding: 1,
			animDelayOpen: 24,
			animSpeedOpen: 12,
			yOffset: 1,
			highlightConfig: {
				textureIndex: 0,
				resolution: Engine.LJS.vec2(20, 35),
				offset: Engine.LJS.vec2(72, 36),
				padding: 1,
				renderSize: Engine.LJS.vec2(2.0, 3.5),
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
			size: Engine.LJS.vec2(2.1, 3.5),
			textureIndex: 0,
			resolution: Engine.LJS.vec2(21, 35),
			offset: Engine.LJS.vec2(94, 36),
			cols: 5,
			padding: 1,
			animDelayOpen: 20,
			animSpeedOpen: 10,
			yOffset: 0.4,
			highlightConfig: {
				textureIndex: 0,
				resolution: Engine.LJS.vec2(20, 35),
				offset: Engine.LJS.vec2(186, 36),
				padding: 1,
				renderSize: Engine.LJS.vec2(2.0, 3.5),
				renderOffset: Engine.LJS.vec2(-0.2, -0.2),
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
	// fallow-ignore-next-line unused-class-member
	open() {
		if (this.currentState === 'closed') {
			this.setState('opening', this.animDelayOpen / 60);
		}
	}

	/**
	 * Resets the door to its closed state.
	 * @returns {void}
	 */
	// fallow-ignore-next-line unused-class-member
	close() {
		this.setState('closed');
	}

	/**
	 * Sets the visual highlight state of the door.
	 * @param {boolean} highlighted - Whether the door should be highlighted.
	 * @returns {void}
	 */
	// fallow-ignore-next-line unused-class-member
	setHighlight(highlighted) {
		this.isHighlighted = highlighted;
	}
}
