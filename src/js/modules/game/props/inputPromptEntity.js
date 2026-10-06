import { InputPrompts } from '../../input/inputPrompts.js';
import { AnimatedEntity } from '../animatedEntity.js';

/**
 * An environmental prop that automatically updates its animation state
 * to reflect the current input method and localized keyboard layouts.
 */
export class InputPromptEntity extends AnimatedEntity {
	/** @type {string|null} */
	#logicalKey;

	/**
	 * @param {Object} pos - The world position.
	 * @param {Object} size - The physical size.
	 * @param {number} textureIndex - The sprite sheet index.
	 * @param {Object} spriteResolution - The pixel dimensions of a single frame.
	 * @param {number} [renderOrder=0] - Z-index sorting order.
	 */
	constructor(pos, size, textureIndex, spriteResolution, renderOrder = 0) {
		super(pos, size, textureIndex, spriteResolution, renderOrder);
		this.#logicalKey = null;
	}

	/**
	 * Sets the logical key code to resolve for keyboard layout variations (e.g. 'A', 'W').
	 * @param {string} key - The physical code or default character.
	 */
	setLogicalKey(key) {
		this.#logicalKey = key;
	}

	/**
	 * Updates the entity state each frame, resolving input devices and layout variations.
	 */
	update() {
		super.update();

		const baseType = InputPrompts.currentType || 'mnk';
		let targetState = baseType;

		if (baseType === 'gamepad') {
			const gpType = InputPrompts.gamepadType || 'default';
			targetState = `${baseType}_${gpType}`;

			if (!this.animations[targetState]) {
				targetState = 'gamepad_default';
			}
			if (!this.animations[targetState]) {
				targetState = 'gamepad';
			}
		}

		if (!this.animations[targetState]) {
			if (baseType === 'touch' && this.animations['mnk']) {
				targetState = 'mnk';
			} else if (this.animations['idle']) {
				targetState = 'idle';
			}
		}

		if (this.animations[targetState]) {
			if (this.currentState !== targetState) {
				this.setState(targetState);
			}

			// Resolve key layout frame for MNK
			if (baseType === 'mnk') {
				this.#updateMnkFrame();
			}
		}
	}

	/**
	 * Resolves localized keyboard layout characters to the correct frame index.
	 * @private
	 */
	#updateMnkFrame() {
		const anim = this.animations['mnk'];
		if (!anim || !anim.keys) {
			return;
		}

		const keyToLookup = this.#logicalKey || anim.defaultKey || 'E';

		const rawMapped = InputPrompts.layoutMap.get(keyToLookup) || keyToLookup;
		const char = rawMapped.replace(/[[\]]/g, '').toUpperCase();

		let frameIndex = anim.keys[char];
		if (frameIndex === undefined) {
			frameIndex = anim.keys['default'] !== undefined ? anim.keys['default'] : 0;
		}
		anim.frames = [frameIndex];
	}
}
