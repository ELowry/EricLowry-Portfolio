import fs from 'fs';
import path from 'path';
import protobuf from 'protobufjs';

import { Log } from './logger.mjs';

const protoPath = path.resolve('listen/listentogether.proto');
const outPath = path.resolve('listen/listen-proto.json');

try {
	const root = protobuf.loadSync(protoPath);
	fs.writeFileSync(outPath, JSON.stringify(root.toJSON(), null, '\t'), 'utf-8');
	Log.success('Compiled listentogether.proto to JSON descriptor.');
} catch (err) {
	Log.error(`Failed to compile proto: ${err.message}`);
	process.exit(1);
}
