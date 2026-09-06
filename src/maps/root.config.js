/**
 * Map configuration for the Root level.
 * @type {MapData}
 */
export default {
	startPos: { x: 10, y: 10 },
	positions: {
		index: { x: 12, y: 10 },
		about: { x: 14, y: 10 },
		cv: { x: 8, y: 10 },
		gaming: { x: 16, y: 10 },
		websites: { x: 4, y: 10 },
		osd: { x: 2, y: 10 },
		'coaching-business': { x: 6, y: 10 },
		architecture: { x: 18, y: 10 },
		blog: { x: 20, y: 10 },
		projects: { x: 22, y: 10 },
	},
	textureIndex: 0,
	props: [
		{ type: 'boxWarning', pos: { x: 13.8, y: 6.7 }, renderOrder: -1 },
		{ type: 'boxes', pos: { x: 23.2, y: 9.6 }, renderOrder: -1 },
		{ type: 'signWarning', pos: { x: 0, y: 9.2 }, renderOrder: -1 },
		{ type: 'dirtPiles', pos: { x: 6, y: 8.7 }, renderOrder: 1 },
	],
};
