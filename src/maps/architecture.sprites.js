import { Engine } from '../js/modules/core/engineContext.js';

/**
 * Architecture sprite definitions.
 * @type {import('../js/modules/game/propManager.js').SpriteConfig}
 */
export default {
	local: {
		templeOpeningLight: {
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(31, 38);
			},
			get offset() {
				return Engine.LJS.vec2(363, 181);
			},
		},
		// Doors
		templeDoorBack: {
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(31, 38);
			},
			get offset() {
				return Engine.LJS.vec2(307, 181);
			},
			shadowType: 'none',
			highlightConfig: {
				get resolution() {
					return Engine.LJS.vec2(21, 38);
				},
				get offset() {
					return Engine.LJS.vec2(340, 181);
				},
				get renderOffset() {
					return Engine.LJS.vec2(0, 0);
				},
			},
		},
	},
};
