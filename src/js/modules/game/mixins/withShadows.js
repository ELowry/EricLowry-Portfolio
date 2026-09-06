import { Engine } from '../../core/engineContext.js';

/** @type {WeakMap<Object, Array<Object>>} Cache for floor shadow slice TileInfos to avoid per-frame allocations. */
const floorSliceCache = new WeakMap();

/**
 * Mixin that adds shadow rendering capabilities to a game entity.
 * Handles drop shadows, perspective floor shadows, and wall-floor clipping.
 * @param {typeof Engine.LJS.EngineObject} Base - The base class to extend.
 * @returns {typeof Engine.LJS.EngineObject} A new class augmented with shadow rendering logic.
 */
export const WithShadows = (Base) => {
	/**
	 * The base class to extend.
	 * @returns {typeof Engine.LJS.EngineObject} A new class augmented with shadow rendering logic.
	 */
	return class extends Base {
		/** @type {'none'|'floor'|'wall'|'wall-floor'|null} The style of shadow to project. */
		shadowType;

		/** @type {number|null} Local override for the wall shadow projection distance (thickness). */
		shadowDistance;

		/** @type {number} Vertical offset added to the entity bottom to define the baseline (floor line). */
		shadowBaselineOffset;

		/**
		 * @param {...any} args - Arguments to pass to the base class.
		 */
		constructor(...args) {
			super(...args);
			this.shadowType = 'none';
			this.shadowDistance = null;
			this.shadowBaselineOffset = 0;
		}

		/**
		 * @returns {number} the default global distance for wall shadows.
		 * @constant
		 */
		static get DEFAULT_WALL_DISTANCE() {
			return 0.066;
		}

		/**
		 * @returns {number} the vertical squash multiplier for projected floor shadows.
		 * @constant
		 */
		static get FLOOR_HEIGHT_FACTOR() {
			return -0.1;
		}

		/**
		 * @returns {number} the horizontal offset multiplier based on object height for floor shadows.
		 * @constant
		 */
		static get FLOOR_SKEW_FACTOR() {
			return 0.4;
		}

		/**
		 * @returns {number} the opacity alpha value for the shadow color.
		 * @constant
		 */
		static get SHADOW_OPACITY() {
			return 0.3;
		}

		/**
		 * Retrieves or generates cached horizontal slice TileInfo objects for skewing a floor shadow.
		 * @param {Object} currentTileInfo - The active sprite TileInfo.
		 * @returns {Array<Object>} The array of slice TileInfo objects.
		 * @private
		 */
		#getFloorSlices(currentTileInfo) {
			let slices = floorSliceCache.get(currentTileInfo);
			if (slices) {
				return slices;
			}

			slices = [];
			const numSlices = Math.max(1, Math.round(currentTileInfo.size.y));
			const sliceHeight = currentTileInfo.size.y / numSlices;
			const padding = currentTileInfo.padding !== undefined ? currentTileInfo.padding : 0;
			const bleed = currentTileInfo.bleed !== undefined ? currentTileInfo.bleed : 0;

			for (let k = 0; k < numSlices; k++) {
				const slicePos = Engine.LJS.vec2(
					currentTileInfo.pos.x,
					currentTileInfo.pos.y + k * sliceHeight
				);
				const sliceSize = Engine.LJS.vec2(currentTileInfo.size.x, sliceHeight);
				slices.push(
					new Engine.LJS.TileInfo(
						slicePos,
						sliceSize,
						currentTileInfo.textureInfo,
						padding,
						bleed
					)
				);
			}

			floorSliceCache.set(currentTileInfo, slices);
			return slices;
		}

		/**
		 * Renders the entity's shadow using the currently active tile sprite as a silhouette mask.
		 * @param {Object} currentTileInfo - The active TileInfo object representing the sprite frame.
		 * @returns {void}
		 */
		renderShadow(currentTileInfo) {
			if (!this.shadowType || this.shadowType === 'none' || !currentTileInfo) {
				return;
			}

			const shadowColor = new Engine.LJS.Color(0, 0, 0, this.constructor.SHADOW_OPACITY);

			const objHeight = this.drawSize ? this.drawSize.y : this.size.y;
			const objWidth = this.drawSize ? this.drawSize.x : this.size.x;
			const baseOffset = this.shadowBaselineOffset || 0;
			const objBottomY = this.pos.y - objHeight / 2 + baseOffset;

			if (this.shadowType === 'floor') {
				const slices = this.#getFloorSlices(currentTileInfo);
				const numSlices = slices.length;
				const sliceWorldHeight =
					(objHeight / numSlices) * this.constructor.FLOOR_HEIGHT_FACTOR;
				const sliceWorldSize = Engine.LJS.vec2(objWidth, sliceWorldHeight);

				for (let k = 0; k < numSlices; k++) {
					const t = (numSlices - 1 - k + 0.5) / numSlices;
					const sliceX = this.pos.x + t * objHeight * this.constructor.FLOOR_SKEW_FACTOR;
					const sliceY = objBottomY - (numSlices - 1 - k + 0.5) * sliceWorldHeight;
					const slicePos = Engine.LJS.vec2(sliceX, sliceY);

					Engine.LJS.drawTile(
						slicePos,
						sliceWorldSize,
						slices[k],
						shadowColor,
						this.angle,
						this.mirror
					);
				}
			} else if (this.shadowType === 'wall' || this.shadowType === 'wall-floor') {
				const dist =
					this.shadowDistance !== null
						? this.shadowDistance
						: this.constructor.DEFAULT_WALL_DISTANCE;

				let shadowPos = Engine.LJS.vec2(this.pos.x + dist, this.pos.y - dist);
				let shadowSize = Engine.LJS.vec2(objWidth, objHeight);
				let renderTileInfo = currentTileInfo;

				if (this.shadowType === 'wall-floor') {
					const shadowBottomY = shadowPos.y - shadowSize.y / 2;
					const overflow = objBottomY - shadowBottomY;

					if (overflow >= shadowSize.y) {
						return;
					}

					if (overflow > 0) {
						const clippedWorldHeight = shadowSize.y - overflow;
						const keepRatio = clippedWorldHeight / shadowSize.y;

						shadowSize.y = clippedWorldHeight;
						shadowPos.y += overflow / 2;

						const clippedPixelHeight = currentTileInfo.size.y * keepRatio;
						const padding =
							currentTileInfo.padding !== undefined ? currentTileInfo.padding : 0;
						const bleed =
							currentTileInfo.bleed !== undefined ? currentTileInfo.bleed : 0;

						renderTileInfo = new Engine.LJS.TileInfo(
							currentTileInfo.pos,
							Engine.LJS.vec2(currentTileInfo.size.x, clippedPixelHeight),
							currentTileInfo.textureInfo,
							padding,
							bleed
						);
					}
				}

				Engine.LJS.drawTile(
					shadowPos,
					shadowSize,
					renderTileInfo,
					shadowColor,
					this.angle,
					this.mirror
				);
			}
		}
	};
};
