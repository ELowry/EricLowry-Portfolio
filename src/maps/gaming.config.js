/**
 * Map configuration for Gaming.
 * @type {import('../js/modules/content/contentTree.js').MapConfig}
 */
export default {
	startPos: { x: 10, y: 10 },
	positions: {
		parent_exit: { 
			x: 10, y: 11,
			doorSpriteType: 'slidingDoubleBack'
		},
		gaming: { x: 12, y: 10 },
		CinQ: { x: 8, y: 10 },
		InputLayers: { x: 14, y: 10 },
		Unstant: { x: 6, y: 10 },
	},
};
