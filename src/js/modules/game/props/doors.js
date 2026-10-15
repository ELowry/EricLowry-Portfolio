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
 * @property {string} [variant='front'] - The visual and interactive variant ('front', 'behind', 'sign').
 * @property {Object} [resolution] - Pixel dimensions of a single frame.
 * @property {Object} [size=null] - Physical size in world units. Defaults to resolution / 10.
 * @property {number} [radius=1.5] - The interactive detection radius.
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
 * @property {string} [shadowType='wall-floor'] - Shadow rendering type.
 * @property {number} [shadowDistance=null] - Shadow projection distance override.
 * @property {number} [shadowBaselineOffset=0] - Vertical baseline offset for shadow clipping/anchoring.
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

	/** @type {Object} */
	interactPos;

	/**
	 * @param {Object} pos - World space coordinates.
	 * @param {DoorConfig} config - The configuration object for the door sprite and physics.
	 */
	constructor(pos, config) {
		const texIndex = config.textureIndex || 0;
		const variant = config.variant || 'front';
		const zIndex = variant === 'behind' ? 1 : -1;

		const resolution = config.resolution || Engine.LJS.vec2(16, 35);
		const calculatedSize = config.size || Engine.LJS.vec2(resolution.x / 10, resolution.y / 10);

		super(pos, calculatedSize, texIndex, resolution, zIndex);

		this.shadowType = config.shadowType !== undefined ? config.shadowType : 'wall-floor';
		if (config.shadowDistance !== undefined) {
			this.shadowDistance = config.shadowDistance;
		}
		this.shadowBaselineOffset =
			config.shadowBaselineOffset !== undefined ? config.shadowBaselineOffset : 0;

		this.isHighlighted = false;
		this.isFrontInteract = variant !== 'behind';
		this.animDelayOpen = config.animDelayOpen || 0;
		this.yOffset = config.yOffset || 0;
		this.highlightConfig = config.highlightConfig;

		this.gridOffset = config.offset || Engine.LJS.vec2(0, 0);
		this.gridCols = config.cols || 1;

		this.interactPos = Engine.LJS.vec2(pos.x, pos.y);

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
				dummyTile.textureInfo,
				padding
			);
		}
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
