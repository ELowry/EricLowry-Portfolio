import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LayeredInput } from '../core/layeredInputs.js';
import { Navigation } from './navigation.js';
import { VirtualCursor } from './virtualCursor.js';

vi.mock('../core/layeredInputs.js', () => {
	return {
		LayeredInput: {
			isActive: vi.fn().mockReturnValue(false),
			LAYER_GAME: 'game',
		},
	};
});

vi.mock('./virtualCursor.js', () => {
	return {
		VirtualCursor: {
			isActive: false,
		},
	};
});

describe('NavigationController', () => {
	let container;
	let btn1;
	let btn2;

	beforeEach(() => {
		vi.restoreAllMocks();
		if (Navigation._autoFocusTimeout) {
			clearTimeout(Navigation._autoFocusTimeout);
			Navigation._autoFocusTimeout = null;
		}
		document.body.innerHTML = '';
		LayeredInput.isActive.mockReturnValue(false);
		Navigation.activeContainer = null;
		Navigation.contextStack = [];
		Navigation.lastMoveTime = -Infinity;
		VirtualCursor.isActive = false;

		window.HTMLElement.prototype.scrollIntoView = vi.fn();

		container = document.createElement('div');
		btn1 = document.createElement('button');
		btn2 = document.createElement('button');

		Object.defineProperty(btn1, 'offsetParent', {
			get: () => {
				return document.body;
			},
		});
		Object.defineProperty(btn2, 'offsetParent', {
			get: () => {
				return document.body;
			},
		});

		container.appendChild(btn1);
		container.appendChild(btn2);
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (Navigation._autoFocusTimeout) {
			clearTimeout(Navigation._autoFocusTimeout);
			Navigation._autoFocusTimeout = null;
		}
		Navigation.activeContainer = null;
		Navigation.contextStack = [];
		Navigation.lastMoveTime = -Infinity;
		document.body.innerHTML = '';
	});

	describe('Context Management', () => {
		it('should set the active container and default options', () => {
			Navigation.setContext(container, { autoFocus: false });

			expect(Navigation.activeContainer).toBe(container);
			expect(Navigation.options.axis).toBe('y');
			expect(Navigation.options.scroll).toBe(false);
		});

		it('should push current context to stack and set new context', () => {
			const subContainer = document.createElement('div');
			Navigation.setContext(container, { axis: 'x', autoFocus: false });
			Navigation.pushContext(subContainer, { axis: 'y', autoFocus: false });

			expect(Navigation.activeContainer).toBe(subContainer);
			expect(Navigation.options.axis).toBe('y');
			expect(Navigation.contextStack.length).toBe(1);
			expect(Navigation.contextStack[0].container).toBe(container);
		});

		it('should pop context and restore previous state', () => {
			const subContainer = document.createElement('div');
			Navigation.setContext(container, { axis: 'x', autoFocus: false });
			Navigation.pushContext(subContainer, { axis: 'y', autoFocus: false });
			Navigation.popContext();

			expect(Navigation.activeContainer).toBe(container);
			expect(Navigation.options.axis).toBe('x');
			expect(Navigation.contextStack.length).toBe(0);
		});
	});

	describe('Focus Navigation', () => {
		it('should move focus to the next element on positive axis input', () => {
			Navigation.setContext(container, { axis: 'y', autoFocus: false });
			btn1.focus();

			const inputState = {
				lastInputType: 'gamepad',
				navAxis: { x: 0, y: -1 },
				scrollAxis: { x: 0, y: 0 },
				cursorAxis: { x: 0, y: 0 },
				cursorPos: { x: 0, y: 0 },
			};

			Navigation.lastMoveTime = -Infinity;
			Navigation.update(inputState);

			expect(document.activeElement).toBe(btn2);
		});

		it('should loop focus back to the beginning when reaching the end', () => {
			Navigation.setContext(container, { axis: 'y', autoFocus: false });
			btn2.focus();

			const inputState = {
				lastInputType: 'gamepad',
				navAxis: { x: 0, y: -1 },
				scrollAxis: { x: 0, y: 0 },
				cursorAxis: { x: 0, y: 0 },
				cursorPos: { x: 0, y: 0 },
			};

			Navigation.lastMoveTime = -Infinity;
			Navigation.update(inputState);

			expect(document.activeElement).toBe(btn1);
		});

		it('should debounce rapid navigation inputs', () => {
			Navigation.setContext(container, { axis: 'y', autoFocus: false });
			btn1.focus();

			const inputState = {
				lastInputType: 'gamepad',
				navAxis: { x: 0, y: -1 },
				scrollAxis: { x: 0, y: 0 },
				cursorAxis: { x: 0, y: 0 },
				cursorPos: { x: 0, y: 0 },
			};

			Navigation.lastMoveTime = performance.now();
			Navigation.update(inputState);

			expect(document.activeElement).toBe(btn1);
		});

		it('should ignore input if the game layer is active', () => {
			LayeredInput.isActive.mockReturnValue(true);
			Navigation.setContext(container, { axis: 'y', autoFocus: false });
			btn1.focus();

			const inputState = {
				lastInputType: 'gamepad',
				navAxis: { x: 0, y: -1 },
				scrollAxis: { x: 0, y: 0 },
				cursorAxis: { x: 0, y: 0 },
				cursorPos: { x: 0, y: 0 },
			};

			Navigation.lastMoveTime = -Infinity;
			Navigation.update(inputState);

			expect(document.activeElement).toBe(btn1);
		});
	});

	describe('Interaction', () => {
		it('should trigger click on active element when interact is true', () => {
			Navigation.setContext(container, { autoFocus: false });
			btn1.focus();
			const clickSpy = vi.spyOn(btn1, 'click');

			const inputState = {
				lastInputType: 'gamepad',
				interact: true,
				navAxis: { x: 0, y: 0 },
				scrollAxis: { x: 0, y: 0 },
				cursorAxis: { x: 0, y: 0 },
				cursorPos: { x: 0, y: 0 },
			};

			Navigation.update(inputState);

			expect(clickSpy).toHaveBeenCalled();
		});

		it('should not trigger click if virtual cursor is active', () => {
			VirtualCursor.isActive = true;
			Navigation.setContext(container, { autoFocus: false });
			btn1.focus();
			const clickSpy = vi.spyOn(btn1, 'click');

			const inputState = {
				lastInputType: 'gamepad',
				interact: true,
				navAxis: { x: 0, y: 0 },
				scrollAxis: { x: 0, y: 0 },
				cursorAxis: { x: 0, y: 0 },
				cursorPos: { x: 0, y: 0 },
			};

			Navigation.update(inputState);

			expect(clickSpy).not.toHaveBeenCalled();
		});
	});
});
