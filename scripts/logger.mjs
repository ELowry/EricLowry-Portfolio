/**
 * Simple logger using native ANSI color codes.
 */
export const Log = {
	info: (...args) => console.log(`\x1b[36m${args.join(' ')}\x1b[0m`),
	success: (...args) => console.log(`\x1b[32m${args.join(' ')}\x1b[0m`),
	warn: (...args) => console.warn(`\x1b[33m${args.join(' ')}\x1b[0m`),
	error: (...args) => console.error(`\x1b[31m${args.join(' ')}\x1b[0m`),
};
