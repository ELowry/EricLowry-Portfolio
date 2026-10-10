import { ListenTogetherClient } from './listen-client.js';

/**
 * Controller managing data parsing, presentation, and user actions on the Listen page.
 */
class ListenPageController {
	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#playerCard;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#emptyCard;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#pageFooter;

	/**
	 * @private
	 * @type {HTMLImageElement|null}
	 */
	#albumArt;

	/**
	 * @private
	 * @type {HTMLAnchorElement|null}
	 */
	#linkAlbumArt;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#ambientBackdrop;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#trackTitle;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#trackArtist;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#trackAlbum;

	/**
	 * @private
	 * @type {HTMLAnchorElement|null}
	 */
	#btnMetrolist;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#progressFill;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#playbackStatusText;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#playbackIcon;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#emptyHeading;

	/**
	 * @private
	 * @type {HTMLElement|null}
	 */
	#emptyText;

	/**
	 * @private
	 * @type {ListenTogetherClient|null}
	 */
	#listenClient = null;

	/**
	 * @private
	 * @type {boolean|null}
	 */
	#wasPlaying = null;

	/**
	 * @private
	 * @type {number|null}
	 */
	#animationFrame = null;

	constructor() {
		this.#playerCard = document.getElementById('player-card');
		this.#emptyCard = document.getElementById('empty-card');
		this.#pageFooter = document.getElementById('page-footer');
		this.#albumArt = document.getElementById('album-art');
		this.#linkAlbumArt = document.getElementById('link-album-art');
		this.#ambientBackdrop = document.getElementById('ambient-backdrop');
		this.#trackTitle = document.getElementById('track-title');
		this.#trackArtist = document.getElementById('track-artist');
		this.#trackAlbum = document.getElementById('track-album');
		this.#btnMetrolist = document.getElementById('btn-metrolist');
		this.#progressFill = document.getElementById('progress-fill');
		this.#playbackStatusText = document.getElementById('playback-status-text');
		this.#playbackIcon = document.getElementById('playback-icon');
		this.#emptyHeading = document.getElementById('empty-heading');
		this.#emptyText = document.getElementById('empty-text');
	}

	/**
	 * @returns {string} the HTML for the play icon.
	 * @constant
	 */
	static get ICON_PLAY() {
		return '<polygon points="8,5 19,12 8,19" />';
	}

	/**
	 * @returns {string} the HTML for the pause icon.
	 * @constant
	 */
	static get ICON_PAUSE() {
		return '<rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" />';
	}

	/**
	 * Scales Google User Content / YouTube thumbnail URLs to custom dimensions if applicable.
	 * @private
	 * @param {string} url The image URL to scale.
	 * @param {number} [size=800] The target square dimension in pixels.
	 * @returns {string} The updated thumbnail URL with requested size.
	 */
	static #scaleThumbnailUrl(url, size = 800) {
		if (!url) {
			return '';
		}
		if (url.includes('googleusercontent.com') || url.includes('yt3.ggpht.com')) {
			return url.replace(/=(s|w)\d+.*$/, `=s${size}`);
		}
		return url;
	}

	/**
	 * Generates a YouTube Music watch URL for a specific video/track ID.
	 * @private
	 * @param {string} youtubeId The unique YouTube video identifier.
	 * @returns {string} The full YouTube Music URL.
	 */
	static #buildYouTubeMusicUrl(youtubeId) {
		return `https://music.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`;
	}

	/**
	 * Generates a YouTube Music search URL for a track title and artist.
	 * @private
	 * @param {string} title The song title.
	 * @param {string} artist The artist name.
	 * @returns {string} The full YouTube Music search URL.
	 */
	static #buildYouTubeSearchUrl(title, artist) {
		const query = `${title} ${artist}`.trim();
		return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
	}

	/**
	 * Generates a Metrolist room join URL for a given room code.
	 * @private
	 * @param {string} code The Metrolist room code.
	 * @returns {string} The full Metrolist URL.
	 */
	static #buildMetrolistUrl(code) {
		return `https://metrolist.cc/listen?code=${encodeURIComponent(code)}`;
	}

	/**
	 * Updates the content attribute of an existing HTML meta tag.
	 * @private
	 * @param {string} selector The CSS selector matching the meta element.
	 * @param {string} content The value to apply to the content attribute.
	 */
	static #setMetaContent(selector, content) {
		const meta = document.querySelector(selector);
		if (meta && content) {
			meta.setAttribute('content', content);
		}
	}

	/**
	 * Extracts room code and optional server URL from parameters.
	 * @private
	 * @returns {{code: string, server: string}} The parsed URL parameters containing room code and server URL.
	 */
	#parseUrlParams() {
		const searchParams = new URLSearchParams(window.location.search);
		let code =
			searchParams.get('code')
			|| searchParams.get('c')
			|| searchParams.get('listenCode')
			|| '';
		let server = searchParams.get('server') || searchParams.get('s') || '';

		if (!code && window.location.hash) {
			const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
			code = hashParams.get('code') || hashParams.get('c') || '';
			server = hashParams.get('server') || hashParams.get('s') || server;
		}

		return { code, server };
	}

	/**
	 * Animation loop for updating the playback progress bar and paused UI state.
	 * @private
	 */
	#animateProgress() {
		if (this.#listenClient) {
			const progress = this.#listenClient.playbackProgress;

			if (progress && progress.duration > 0) {
				this.#progressFill.style.width = `${progress.percent * 100}%`;

				if (progress.isPlaying !== this.#wasPlaying) {
					this.#wasPlaying = progress.isPlaying;
					this.#playerCard?.classList.toggle('is-paused', !progress.isPlaying);

					if (this.#playbackStatusText) {
						this.#playbackStatusText.textContent = progress.isPlaying
							? 'Now Listening'
							: 'Paused';
					}
					if (this.#playbackIcon) {
						this.#playbackIcon.innerHTML = progress.isPlaying
							? ListenPageController.ICON_PLAY
							: ListenPageController.ICON_PAUSE;
					}
				}
			} else {
				this.#progressFill.style.width = '0%';

				if (this.#wasPlaying !== false) {
					this.#wasPlaying = false;
					this.#playerCard?.classList.remove('is-paused');
					if (this.#playbackStatusText) {
						this.#playbackStatusText.textContent = 'Now Listening';
					}
					if (this.#playbackIcon) {
						this.#playbackIcon.innerHTML = ListenPageController.ICON_PLAY;
					}
				}
			}
		}

		if (this.#animationFrame !== null) {
			cancelAnimationFrame(this.#animationFrame);
		}
		this.#animationFrame = requestAnimationFrame(() => this.#animateProgress());
	}

	/**
	 * Updates document title, description, and Open Graph / Twitter tags.
	 * @private
	 * @param {string} [title=''] The song title to display in metadata.
	 * @param {string} [artist=''] The artist name to display in metadata.
	 * @param {string} [imageUrl=''] The album artwork URL for social share cards.
	 */
	#updateMetadata(title = '', artist = '', imageUrl = '') {
		const defaultTitle = 'Listen With Me – Eric Lowry';
		const defaultDesc = 'Listen along to music with Eric Lowry.';
		const defaultImage = `${window.location.origin}/assets/images/touch-icon.png`;

		const pageTitle = title && artist ? `${title} – ${artist} | Listen With Me` : defaultTitle;
		const pageDesc =
			title && artist ? `Listen to "${title}" by ${artist} with Eric Lowry.` : defaultDesc;
		const pageImage = imageUrl || defaultImage;

		document.title = pageTitle;

		ListenPageController.#setMetaContent('meta[name="description"]', pageDesc);
		ListenPageController.#setMetaContent('meta[property="og:title"]', pageTitle);
		ListenPageController.#setMetaContent('meta[property="og:description"]', pageDesc);
		ListenPageController.#setMetaContent('meta[property="og:image"]', pageImage);
		ListenPageController.#setMetaContent('meta[name="twitter:title"]', pageTitle);
		ListenPageController.#setMetaContent('meta[name="twitter:description"]', pageDesc);
		ListenPageController.#setMetaContent('meta[name="twitter:image"]', pageImage);
	}

	/**
	 * Populates UI components with extracted song details and fades in presentation.
	 * @private
	 * @param {Object} trackData The metadata object representing the currently playing track.
	 * @param {string} [roomCode=''] The active room code to link with Metrolist.
	 */
	#renderSong(trackData, roomCode = '') {
		const title = trackData.title || 'Unknown Track';
		const artist = trackData.artist || 'Unknown Artist';
		const album = trackData.album || '';
		const youtubeId = trackData.id || '';
		const artUrl = trackData.thumbnail || '';

		const scaledArtUrl = ListenPageController.#scaleThumbnailUrl(artUrl, 800);
		const backdropUrl = ListenPageController.#scaleThumbnailUrl(artUrl, 200);

		this.#trackTitle.textContent = title;
		this.#trackArtist.textContent = artist;

		if (album) {
			this.#trackAlbum.textContent = album;
			this.#trackAlbum.removeAttribute('hidden');
		} else {
			this.#trackAlbum.setAttribute('hidden', '');
		}

		if (backdropUrl) {
			this.#ambientBackdrop.style.backgroundImage = `url("${backdropUrl}")`;
			const backdropImg = new Image();
			backdropImg.src = backdropUrl;
			if (backdropImg.complete) {
				this.#ambientBackdrop.classList.add('is-visible');
			} else {
				backdropImg.addEventListener(
					'load',
					() => {
						this.#ambientBackdrop.classList.add('is-visible');
					},
					{ once: true }
				);
			}
		}

		if (scaledArtUrl) {
			this.#albumArt.classList.remove('fallback-crop');
			this.#albumArt.src = scaledArtUrl;
			this.#albumArt.alt = `${title} by ${artist}`;
		}

		if (youtubeId) {
			this.#linkAlbumArt.href = ListenPageController.#buildYouTubeMusicUrl(youtubeId);
			this.#linkAlbumArt.removeAttribute('aria-disabled');
			this.#linkAlbumArt.style.pointerEvents = 'auto';
		} else if (title && artist) {
			this.#linkAlbumArt.href = ListenPageController.#buildYouTubeSearchUrl(title, artist);
			this.#linkAlbumArt.removeAttribute('aria-disabled');
			this.#linkAlbumArt.style.pointerEvents = 'auto';
		} else {
			this.#linkAlbumArt.removeAttribute('href');
			this.#linkAlbumArt.setAttribute('aria-disabled', 'true');
			this.#linkAlbumArt.style.pointerEvents = 'none';
		}

		if (roomCode) {
			this.#btnMetrolist.href = ListenPageController.#buildMetrolistUrl(roomCode);
			this.#btnMetrolist.removeAttribute('hidden');
		} else {
			this.#btnMetrolist.setAttribute('hidden', '');
		}

		this.#updateMetadata(title, artist, scaledArtUrl);

		this.#emptyCard.setAttribute('hidden', '');
		this.#emptyCard.classList.remove('is-visible');

		this.#playerCard.removeAttribute('hidden');
		this.#playerCard.classList.add('is-visible');
		if (this.#pageFooter) {
			this.#pageFooter.classList.add('is-visible');
		}
	}

	/**
	 * Displays the fallback state when no track payload is available or the room has ended.
	 * @private
	 * @param {string} [reason='default'] Indicates whether the room was not specified or ended.
	 */
	#renderEmpty(reason = 'default') {
		this.#playerCard.setAttribute('hidden', '');
		this.#playerCard.classList.remove('is-visible');
		this.#ambientBackdrop.classList.remove('is-visible');

		if (this.#emptyHeading && this.#emptyText) {
			if (reason === 'ended') {
				this.#emptyHeading.textContent = 'Stream Ended';
				this.#emptyText.textContent = 'This listen together session is no longer active.';
			} else {
				this.#emptyHeading.textContent = 'No Track Specified';
				this.#emptyText.textContent =
					'Scan the QR code from the stream overlay or open a shared listen link to tune in together.';
			}
		}

		this.#emptyCard.removeAttribute('hidden');
		this.#emptyCard.classList.add('is-visible');
		if (this.#pageFooter) {
			this.#pageFooter.classList.add('is-visible');
		}

		if (this.#animationFrame !== null) {
			cancelAnimationFrame(this.#animationFrame);
			this.#animationFrame = null;
		}

		this.#updateMetadata();
	}

	/**
	 * Initializes the page state and connects via ListenTogetherClient if a room code exists.
	 * @returns {Promise<void>}
	 */
	async init() {
		const params = this.#parseUrlParams();

		if (!params.code) {
			this.#renderEmpty();
			return;
		}

		const options = {};
		if (params.server) {
			options.serverUrl = params.server;
		}

		this.#listenClient = new ListenTogetherClient(params.code, options);

		this.#listenClient.addEventListener('track-changed', (e) => {
			if (e.detail) {
				this.#renderSong(e.detail, params.code);
			} else {
				this.#renderEmpty();
			}
		});

		this.#listenClient.addEventListener('error-payload', (e) => {
			if (e.detail?.code === 'room_not_found' || e.detail?.code === 'room_invalid') {
				this.#listenClient.disconnect();
				this.#renderEmpty('ended');
			}
		});

		this.#listenClient.addEventListener('kicked', () => {
			this.#listenClient.disconnect();
			this.#renderEmpty('ended');
		});

		try {
			await this.#listenClient.init();
			this.#animateProgress();
		} catch (error) {
			console.error('Failed to initialize ListenTogetherClient:', error);
			this.#renderEmpty();
		}
	}
}

export const App = new ListenPageController();
App.init();
