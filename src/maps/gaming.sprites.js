import { Engine } from '../js/modules/core/engineContext.js';

/**
 * Gaming sprite definitions.
 * @type {import('../js/modules/game/propManager.js').SpriteConfig}
 */
export default {
	local: {
		// Doors
		slidingDoubleBack: {
			get resolution() {
				return Engine.LJS.vec2(49, 49);
			},
			get offset() {
				return Engine.LJS.vec2(129, 130);
			},
			cols: 4,
			animDelayOpen: 24,
			animSpeedOpen: 12,
			shadowType: 'none',
			framesOpening: [1, 2, 3],
			framesOpen: [3],
			highlightConfig: {
				get resolution() {
					return Engine.LJS.vec2(55, 49);
				},
				get offset() {
					return Engine.LJS.vec2(333, 130);
				},
				get renderOffset() {
					return Engine.LJS.vec2(0, 0);
				},
			},
		},
	},
};
