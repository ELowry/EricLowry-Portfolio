import { Engine } from '../js/modules/core/engineContext.js';

/**
 * Architecture sprite definitions.
 * @type {import('../js/modules/game/propManager.js').SpriteConfig}
 */
export default {
	local: {
		templeOpeningLight: {
			isAnimated: false,
			resolution: Engine.LJS.vec2(31, 38),
			offset: Engine.LJS.vec2(363, 181),
			shadowType: 'none',
		},
		// Doors
		templeDoorBack: {
			isAnimated: false,
			resolution: Engine.LJS.vec2(31, 38),
			offset: Engine.LJS.vec2(307, 181),
			shadowType: 'none',
			highlightConfig: {
				resolution: Engine.LJS.vec2(21, 38),
				offset: Engine.LJS.vec2(340, 181),
				renderOffset: Engine.LJS.vec2(0, 0),
			},
		},
	},
};
