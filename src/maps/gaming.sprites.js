import { Engine } from '../js/modules/core/engineContext.js';

/**
 * @type {import('../js/modules/game/propManager.js').SpriteConfig}
 */
export default {
	local: {
		// Doors
		slidingDoubleBack: {
			resolution: Engine.LJS.vec2(49, 55),
			offset: Engine.LJS.vec2(129, 130),
			cols: 4,
			animDelayOpen: 24,
			animSpeedOpen: 12,
			yOffset: 1.74,
			shadowType: 'none',
			framesOpening: [1, 2, 3],
			framesOpen: [3],
			highlightConfig: {
				resolution: Engine.LJS.vec2(50, 19),
				offset: Engine.LJS.vec2(276, 52),
				renderOffset: Engine.LJS.vec2(-0.05, 3.66),
			},
		},
	},
};
