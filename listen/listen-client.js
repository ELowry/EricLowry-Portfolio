import $root from './listen-proto.js';

/**
 * @typedef {Object} TrackData
 * @property {string} id The unique identifier of the track.
 * @property {string} title The title of the song.
 * @property {string} artist The name of the performing artist.
 * @property {string} album The name of the album.
 * @property {number} duration The duration of the song in milliseconds.
 * @property {string} thumbnail The URL pointing to the album artwork or thumbnail.
 */

/**
 * @typedef {Object} PlaybackProgress
 * @property {number} position - Current position in milliseconds.
 * @property {number} duration - Total duration in milliseconds.
 * @property {number} percent - Progress as a normalized float (0.0 to 1.0).
 * @property {boolean} isPlaying - Whether playback is currently active.
 */

/**
 * Client for connecting to the Metrolist Listen Together WebSocket server.  
 * Extends EventTarget to emit `track-changed`, `state-synced`, `error-payload`, and `kicked` events.
 */
export class ListenTogetherClient extends EventTarget {
	/**
	 * @private
	 * @type {WebSocket|null}
	 */
	#ws = null;

	/**
	 * @private
	 * @type {string}
	 */
	#roomCode;

	/**
	 * @private
	 * @type {string}
	 */
	#username;

	/**
	 * @private
	 * @type {string}
	 */
	#serverUrl;

	/**
	 * @private
	 * @type {TrackData|null}
	 */
	#currentTrack = null;

	/**
	 * @private
	 * @type {boolean}
	 */
	#isPlaying = false;

	/**
	 * @private
	 * @type {number}
	 */
	#position = 0;

	/**
	 * @private
	 * @type {number}
	 */
	#lastUpdate = 0;

	/**
	 * @private
	 * @type {number|null}
	 */
	#reconnectTimer = null;

	/**
	 * @private
	 * @type {number|null}
	 */
	#pingInterval = null;

	/**
	 * @private
	 * @type {number}
	 */
	#pingSequence = 0;

	/**
	 * @private
	 * @type {number} Timestamp of the last received message to detect dead sockets.
	 */
	#lastMessageTime = 0;

	/**
	 * @private
	 * @type {number} The maximum number of consecutive reconnection attempts.
	 */
	#maxRetries;

	/**
	 * @private
	 * @type {number} The current count of consecutive reconnection attempts.
	 */
	#retryCount = 0;

	/**
	 * @private
	 * @type {boolean} Flag indicating if the disconnection was explicitly requested.
	 */
	#intentionalDisconnect = false;

	/**
	 * @param {string} roomCode The room code to connect to.
	 * @param {Object} [options={}] Configuration options for the client.
	 * @param {string} [options.username='Widget'] The client username.
	 * @param {string} [options.serverUrl='wss://metroserverx.meowery.eu/ws'] The WebSocket endpoint URL.
	 * @param {number} [options.maxRetries=5] Maximum consecutive reconnection attempts.
	 */
	constructor(
		roomCode,
		{ username = 'Widget', serverUrl = 'wss://metroserverx.meowery.eu/ws', maxRetries = 5 } = {}
	) {
		super();
		this.#roomCode = roomCode;
		this.#username = username;
		this.#serverUrl = serverUrl;
		this.#maxRetries = maxRetries;
	}

	/**
	 * Computes the real-time playback progress and state.
	 * @returns {PlaybackProgress|null} The current playback progress details, or null if no track is active.
	 */
	get playbackProgress() {
		if (!this.#currentTrack) {
			return null;
		}

		let livePosition = this.#position;

		if (this.#isPlaying) {
			livePosition += Date.now() - this.#lastUpdate;
		}

		const clampedPosition = Math.max(0, Math.min(livePosition, this.#currentTrack.duration));

		return {
			position: clampedPosition,
			duration: this.#currentTrack.duration,
			percent: Math.min(clampedPosition / this.#currentTrack.duration, 1),
			isPlaying: this.#isPlaying,
		};
	}

	/**
	 * Establishes the WebSocket connection and registers listeners.
	 * @returns {Promise<void>}
	 */
	async init() {
		if (this.#reconnectTimer) {
			clearTimeout(this.#reconnectTimer);
			this.#reconnectTimer = null;
		}

		this.#intentionalDisconnect = false;

		return new Promise((resolve, reject) => {
			this.#ws = new WebSocket(this.#serverUrl);
			this.#ws.binaryType = 'arraybuffer';

			let hasOpened = false;

			this.#ws.addEventListener('open', () => {
				hasOpened = true;
				this.#retryCount = 0;
				this.#lastMessageTime = Date.now();
				this.#sendHandshake();
				this.#sendJoinRequest();

				this.#pingInterval = setInterval(() => {
					if (Date.now() - this.#lastMessageTime > 45000) {
						console.warn(
							'ListenTogether WebSocket: Connection timed out. Forcing reconnect...'
						);
						if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
							this.#ws.close();
						}
						return;
					}
					this.#sendPing();
				}, 30000);
				resolve();
			});

			this.#ws.addEventListener('message', async (event) => {
				await this.#handleMessage(event.data);
			});

			this.#ws.addEventListener('error', (err) => {
				console.error('ListenTogether WebSocket Error:', err);
			});

			this.#ws.addEventListener('close', () => {
				if (!hasOpened) {
					reject(new Error('WebSocket connection failed.'));
				}
				this.#handleDisconnect();
			});
		});
	}

	/**
	 * Gracefully closes the underlying WebSocket connection and halts reconnection logic.
	 */
	disconnect() {
		this.#intentionalDisconnect = true;

		if (this.#reconnectTimer) {
			clearTimeout(this.#reconnectTimer);
			this.#reconnectTimer = null;
		}
		if (this.#pingInterval) {
			clearInterval(this.#pingInterval);
			this.#pingInterval = null;
		}

		if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
			this.#ws.close();
		}
	}

	/**
	 * Extracts a JavaScript number safely from a protobuf Long object or native number.
	 * @private
	 * @param {Object|number} value The number or protobuf Long to parse.
	 * @param {number} [fallback=0] The fallback number if value is null or undefined.
	 * @returns {number} The resolved numeric value.
	 */
	#toNumber(value, fallback = 0) {
		if (value === null || value === undefined) {
			return fallback;
		}
		if (typeof value.toNumber === 'function') {
			return value.toNumber();
		}
		return Number(value);
	}

	/**
	 * Safely decompresses Gzip binary payloads using native browser streams.
	 * @private
	 * @param {Uint8Array} compressedBytes The gzipped binary data.
	 * @returns {Promise<Uint8Array>} The uncompressed byte array.
	 */
	async #decompressGzip(compressedBytes) {
		const ds = new DecompressionStream('gzip');
		const writer = ds.writable.getWriter();
		writer.write(compressedBytes).catch(() => {});
		writer.close();

		const response = new Response(ds.readable);
		const buffer = await response.arrayBuffer();
		return new Uint8Array(buffer);
	}

	/**
	 * Packages and transmits a protobuf message within the system Envelope.
	 * @private
	 * @param {string} msgType The envelope message type string.
	 * @param {Object} payloadMessage The payload instance to encode.
	 * @param {string} protoMessageName The name of the protobuf message definition.
	 */
	#sendMessage(msgType, payloadMessage, protoMessageName) {
		if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
			return;
		}

		const PayloadType = $root.listentogether[protoMessageName];
		const payloadBytes = PayloadType.encode(payloadMessage).finish();

		const Envelope = $root.listentogether.Envelope;
		const envelopeMessage = {
			type: msgType,
			payload: payloadBytes,
			compressed: false,
		};
		const envelopeBytes = Envelope.encode(envelopeMessage).finish();

		this.#ws.send(envelopeBytes);
	}

	/**
	 * Broadcasts the initial client capabilities to define the structural boundaries of the session.
	 * @private
	 */
	#sendHandshake() {
		this.#sendMessage(
			'client_capabilities',
			{
				supportsProtobuf: true,
				supportsCompression: true,
				clientVersion: '1',
			},
			'ClientCapabilities'
		);
	}

	/**
	 * Requests access to the specific room code.
	 * @private
	 */
	#sendJoinRequest() {
		this.#sendMessage(
			'join_room',
			{
				roomCode: this.#roomCode,
				username: this.#username,
			},
			'JoinRoomPayload'
		);
	}

	/**
	 * Sends a protocol ping to keep the WebSocket connection alive.
	 * @private
	 */
	#sendPing() {
		this.#sendMessage(
			'ping',
			{
				clientTime: Date.now(),
				sequence: ++this.#pingSequence,
			},
			'PingPayload'
		);
	}

	/**
	 * Decodes incoming WebSocket envelopes, decompresses payloads if necessary, and routes the data to internal state handlers.
	 * @private
	 * @param {ArrayBuffer} buffer The binary buffer received over the WebSocket.
	 * @returns {Promise<void>}
	 */
	async #handleMessage(buffer) {
		this.#lastMessageTime = Date.now();

		const dataBytes = new Uint8Array(buffer);
		const Envelope = $root.listentogether.Envelope;

		let envelope;
		try {
			envelope = Envelope.decode(dataBytes);
		} catch (error) {
			console.error('Failed to decode envelope:', error);
			return;
		}

		let payloadBytes = envelope.payload;
		if (envelope.compressed) {
			try {
				payloadBytes = await this.#decompressGzip(payloadBytes);
			} catch (error) {
				console.error('Failed to decompress gzip payload:', error);
				return;
			}
		}

		switch (envelope.type) {
			case 'error': {
				const errorData = $root.listentogether.ErrorPayload.decode(payloadBytes);
				console.error(`Server Error [${errorData.code}]:`, errorData.message);
				this.dispatchEvent(new CustomEvent('error-payload', { detail: errorData }));
				break;
			}
			case 'join_approved': {
				const joinData = $root.listentogether.JoinApprovedPayload.decode(payloadBytes);
				if (joinData.state) {
					this.#applySyncState(joinData.state);
				}
				break;
			}
			case 'sync_state': {
				const syncData = $root.listentogether.SyncStatePayload.decode(payloadBytes);
				this.#applySyncState(syncData);
				break;
			}
			case 'sync_playback': {
				const actionData = $root.listentogether.PlaybackActionPayload.decode(payloadBytes);
				this.#applyPlaybackAction(actionData);
				break;
			}
			case 'kicked': {
				const kickedData = $root.listentogether.KickedPayload.decode(payloadBytes);
				console.warn(`Kicked from room: ${kickedData.reason}`);
				this.dispatchEvent(new CustomEvent('kicked', { detail: kickedData }));
				break;
			}
		}
	}

	/**
	 * Synchronizes the internal playback tracker with a full state payload.
	 * @private
	 * @param {Object} state The updated room state object from the server.
	 */
	#applySyncState(state) {
		this.#isPlaying = state.isPlaying;

		this.#position = this.#toNumber(state.position);
		this.#lastUpdate = Date.now();

		if (state.currentTrack) {
			this.#currentTrack = {
				id: state.currentTrack.id,
				title: state.currentTrack.title,
				artist: state.currentTrack.artist,
				album: state.currentTrack.album,
				duration: this.#toNumber(state.currentTrack.duration),
				thumbnail: state.currentTrack.thumbnail,
			};
		} else {
			this.#currentTrack = null;
		}

		this.dispatchEvent(new CustomEvent('state-synced', { detail: this.playbackProgress }));
		this.dispatchEvent(new CustomEvent('track-changed', { detail: this.#currentTrack }));
	}

	/**
	 * Updates specific internal variables based on the incremental action type to prevent overriding untargeted state properties.
	 * @private
	 * @param {Object} actionData The playback action event payload from the server.
	 */
	#applyPlaybackAction(actionData) {
		this.#lastUpdate = Date.now();

		switch (actionData.action) {
			case 'play':
				this.#isPlaying = true;
				this.#position = this.#toNumber(actionData.position);
				break;
			case 'pause':
				this.#isPlaying = false;
				this.#position = this.#toNumber(actionData.position);
				break;
			case 'seek':
			case 'change_track':
			case 'sync_queue':
				this.#position = this.#toNumber(actionData.position);
				if (actionData.trackInfo) {
					this.#currentTrack = {
						id: actionData.trackInfo.id,
						title: actionData.trackInfo.title,
						artist: actionData.trackInfo.artist,
						album: actionData.trackInfo.album,
						duration: this.#toNumber(actionData.trackInfo.duration),
						thumbnail: actionData.trackInfo.thumbnail,
					};
					this.dispatchEvent(
						new CustomEvent('track-changed', { detail: this.#currentTrack })
					);
				} else if (actionData.action === 'change_track') {
					this.#currentTrack = null;
					this.dispatchEvent(new CustomEvent('track-changed', { detail: null }));
				}
				break;
		}

		this.dispatchEvent(new CustomEvent('state-synced', { detail: this.playbackProgress }));
	}

	/**
	 * Triggers an automated reconnection sequence when the socket unexpectedly drops.
	 * @private
	 */
	#handleDisconnect() {
		if (this.#pingInterval) {
			clearInterval(this.#pingInterval);
			this.#pingInterval = null;
		}

		if (this.#intentionalDisconnect) {
			return;
		}

		if (this.#retryCount >= this.#maxRetries) {
			console.error('ListenTogether WebSocket: Maximum reconnection attempts reached.');
			this.dispatchEvent(new CustomEvent('reconnect-failed'));
			return;
		}

		this.#retryCount++;
		console.warn(
			`ListenTogether WebSocket closed. Reconnecting in 5s... (Attempt ${this.#retryCount}/${this.#maxRetries})`
		);

		this.#ws = null;
		this.#reconnectTimer = setTimeout(() => {
			this.init().catch(() => {});
		}, 5000);
	}
}
