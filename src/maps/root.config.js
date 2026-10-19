/**
 * Map configuration for the Root level.
 * @type {import('../js/modules/content/contentTree.js').MapConfig}
 */
export default {
	startPos: { x: 10, y: 0 },
	positions: {
		about: { x: 16, y: 0.5 },
		cv: { x: 14, y: 0.5 },
		websites: { x: 4, y: 1 },
		osd: { x: 2, y: 1 },
		'coaching-business': { x: 6, y: 1 },
		blog: { x: 18, y: 0.5 },
		projects: { x: 20, y: 0.5 },
	},
	textureIndex: 0,
	props: [
		{ type: 'boxWarning', pos: { x: 13.8, y: -3.3 }, renderOrder: -1 },
		{ type: 'boxes', pos: { x: 23.2, y: -1.4 }, renderOrder: -1 },
		{ type: 'signWarning', pos: { x: 0, y: -0.8 }, renderOrder: 1 },
		{ type: 'dirtPiles', pos: { x: 6, y: -1.3 }, renderOrder: 1 },
		{ type: 'promptFrame', pos: { x: 12.5, y: 5.05 }, renderOrder: -1 },
		{ type: 'promptHorizontalLeft', pos: { x: 11.95, y: 5 }, renderOrder: -1 },
		{ type: 'promptHorizontalRight', pos: { x: 13.05, y: 5 }, renderOrder: -1 },
	],
	groups: [
		{
			name: 'Gaming',
			pos: { x: 30, y: 1 },
			positions: {
				gaming: { x: 0, y: 0, doorSpriteType: 'slidingDouble' },
			},
			props: [{ type: 'gameCenter', pos: { x: 0, y: 0 }, renderOrder: -2 }],
		},
		{
			name: 'Architecture',
			pos: { x: -10, y: 1 },
			positions: {
				architecture: { x: 0, y: 0, doorSpriteType: 'templeDoor' },
			},
			props: [{ type: 'architecture', pos: { x: 0, y: 0 }, renderOrder: -2 }],
		},
	],
};
