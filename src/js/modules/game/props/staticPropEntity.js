import { Engine } from '../../core/engineContext.js';
import { WithShadows } from '../mixins/withShadows.js';

/**
 * An environmental static prop that supports dynamic shadow rendering.
 */
export class StaticPropEntity extends WithShadows(Engine.LJS.EngineObject) {
	/**
	 * @param {Object} pos - The world position.
	 * @param {Object} size - The physical size.
	 * @param {Object} tileInfo - The sprite data.
	 * @param {number} angle - The rotation angle.
	 * @param {Object} color - The applied color.
	 * @param {number} renderOrder - Z-index sorting.
	 */
	constructor(pos, size, tileInfo, angle, color, renderOrder) {
		super(pos, size, tileInfo, angle, color, renderOrder);
		this.shadowType = 'floor';
	}

	/**
	 * Renders the entity, drawing its shadow first if applicable.
	 * @returns {void}
	 */
	render() {
		this.renderShadow(this.tileInfo);
		super.render();
	}
}
