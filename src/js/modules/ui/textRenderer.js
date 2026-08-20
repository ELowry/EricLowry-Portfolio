import { Blog } from '../content/blog.js';
import { Content as AppContent } from '../content/content.js';
import { Projects } from '../content/projects.js';
import { Events } from '../core/events.js';
import { Router } from '../core/router.js';
import { escapeHtml } from '../core/sharedUtils.js';
import { Lang } from './lang.js';

/**
 * Responsible for composing and injecting the text-mode UI (breadcrumbs and navigation) into the App's text view.
 *
 * @param {AppController} app - Reference to the App instance.
 */
export class TextRenderer {
	/** @type {AbortController|null} Tracks the current route's abort signal to prevent overlapping network responses. */
	#currentAbortController = null;

	/**
	 * @param {AppController} app - Main application instance.
	 * @param {HTMLTemplateElement|null} breadcrumbTemplate - Template for breadcrumb list items.
	 */
	constructor(app, breadcrumbTemplate) {
		this.app = app;
		this.breadcrumbTemplate =
			breadcrumbTemplate || document.getElementById('template-breadcrumb-item');
		this.lastMode = null;

		Events.on('route:changed', (payload) => {
			const isTextToText = this.lastMode === 'text' && payload.mode === 'text';
			this.lastMode = payload.mode;
			this.#handleTextContent(payload, isTextToText);
		});
	}

	/**
	 * Handles text rendering and content loading based on the current route.
	 * @param {Object} payload - The route:changed event payload.
	 * @param {string} payload.mode - The content display mode.
	 * @param {string} payload.path - The route's path.
	 * @param {Object} payload.node - The route's node.
	 * @param {boolean} isTextToText - True if navigating between text mode views.
	 * @private
	 */
	async #handleTextContent({ mode, path, node }, isTextToText) {
		if (mode !== 'text') {
			return;
		}

		if (this.#currentAbortController) {
			this.#currentAbortController.abort();
		}
		this.#currentAbortController = new AbortController();
		const abortSignal = this.#currentAbortController.signal;

		const isCached = this.#isRouteCached(path, node);

		const executeFinalDOMUpdate = async (suppressLoading) => {
			if (abortSignal.aborted) {
				return;
			}

			this.render(path, node);

			if (path === 'blog') {
				await this.#renderBlogIndex(suppressLoading, abortSignal);
			} else if (path === 'projects') {
				await this.#renderProjectsIndex(suppressLoading, abortSignal);
			} else if (node && node.type === 'content' && node.file) {
				await this.app.loadContentIntoText(node.file, null, suppressLoading, abortSignal);
			} else if (node && node.type === 'category') {
				let mainChild;
				if (node.id === 'root') {
					mainChild = node.children?.find((c) => c.id === 'index');
				} else {
					mainChild = node.children?.find((c) => c.id === node.id);
				}

				if (mainChild && mainChild.file) {
					await this.app.loadContentIntoText(
						mainChild.file,
						null,
						suppressLoading,
						abortSignal
					);
				} else {
					this.app.uiManager.elements.textContent.innerHTML = '';
				}
			} else if (path.startsWith('blog/')) {
				const date = path.substring(5);
				await this.app.loadContentIntoText(
					`blog/${date}.md`,
					'article',
					suppressLoading,
					abortSignal
				);

				const entries = await Blog.getIndex(abortSignal);
				const entry = entries.find((e) => e.date === date);
				if (entry) {
					const term = `${entry.date} - ${entry.title}`;
					Blog.injectComments(
						this.app.uiManager.elements.textContent,
						term,
						entry.language
					);
				}
			} else if (path.startsWith('projects/')) {
				const projectId = path.substring(9);
				await this.app.loadContentIntoText(
					`projects/${projectId}.md`,
					'article',
					suppressLoading,
					abortSignal
				);
			} else {
				this.app.uiManager.elements.textContent.innerHTML = '';
			}
		};

		if (isTextToText && !isCached) {
			let spinnerMinPromise = null;

			// Timeout vs Fetch race
			const timeoutId = setTimeout(() => {
				if (abortSignal.aborted) {
					return;
				}

				spinnerMinPromise = new Promise((resolve) => setTimeout(resolve, 300));

				this.app.executeViewTransition(() => {
					this.render(path, node);
					const loadingText = Lang.getHtmlString('ui.loading', null, 'Loading');
					this.app.uiManager.elements.textContent.innerHTML = `
						<div class="local-loading-indicator" role="status" aria-live="polite">
							<div>
								<span>${loadingText}</span>
								<span aria-hidden="true">...</span>
							</div>
						</div>`;
				}, false);
			}, 150);

			try {
				await this.#prefetchRouteData(path, node, abortSignal);
			} catch (error) {
				if (error.name === 'AbortError') {
					return;
				}
			}

			clearTimeout(timeoutId);

			if (abortSignal.aborted) {
				return;
			}

			if (spinnerMinPromise) {
				await spinnerMinPromise;
			}

			// Transition
			await this.app.executeViewTransition(() => executeFinalDOMUpdate(true), false);
		} else {
			// Game-to-text / initial load / cached content
			const suppressLoading = isTextToText;
			const skipTransition = !isTextToText;
			await this.app.executeViewTransition(
				() => executeFinalDOMUpdate(suppressLoading),
				skipTransition
			);
		}
	}

	/**
	 * Preloads required data for a route to avoid freezing the transition.
	 * @param {string} path - The route's path.
	 * @param {Object} node - The route's node.
	 * @param {AbortSignal} abortSignal - Signal to cancel the prefetch.
	 * @returns {Promise<void>}
	 * @private
	 */
	async #prefetchRouteData(path, node, abortSignal) {
		const promises = [];
		if (path === 'blog') {
			promises.push(Blog.getIndex(abortSignal));
		} else if (path === 'projects') {
			promises.push(Projects.getIndex(abortSignal));
		} else if (node && node.type === 'content' && node.file) {
			promises.push(this.app.preloadContent(node.file, abortSignal));
		} else if (node && node.type === 'category') {
			let mainChild;
			if (node.id === 'root') {
				mainChild = node.children?.find((c) => c.id === 'index');
			} else {
				mainChild = node.children?.find((c) => c.id === node.id);
			}
			if (mainChild && mainChild.file) {
				promises.push(this.app.preloadContent(mainChild.file, abortSignal));
			}
		} else if (path.startsWith('blog/')) {
			promises.push(this.app.preloadContent(`blog/${path.substring(5)}.md`, abortSignal));
			promises.push(Blog.getIndex(abortSignal));
		} else if (path.startsWith('projects/')) {
			promises.push(this.app.preloadContent(`projects/${path.substring(9)}.md`, abortSignal));
			promises.push(Projects.getIndex(abortSignal));
		}

		await Promise.all(promises);
	}

	/**
	 * Checks if the required content for a route is currently cached.
	 * @param {string} path - The route path.
	 * @param {Object} node - The route node.
	 * @returns {boolean} True if the content is cached.
	 * @private
	 */
	#isRouteCached(path, node) {
		if (path === 'blog') {
			return Blog.isCached;
		} else if (path === 'projects') {
			return Projects.isCached;
		} else if (node && node.type === 'content' && node.file) {
			return this.app.isContentCached(node.file);
		} else if (path.startsWith('blog/')) {
			return this.app.isContentCached(`blog/${path.substring(5)}.md`) && Blog.isCached;
		} else if (path.startsWith('projects/')) {
			return (
				this.app.isContentCached(`projects/${path.substring(9)}.md`) && Projects.isCached
			);
		}
		return true;
	}

	/**
	 * Fetches the blog index JSON, generates HTML, and renders the list of articles.
	 * @param {boolean} [suppressLoading=false] - If true, skips showing the loading overlay.
	 * @param {AbortSignal} [abortSignal] - Optional signal to abort the fetch process.
	 * @returns {Promise<void>} Resolves when the blog index has been rendered.
	 * @private
	 */
	async #renderBlogIndex(suppressLoading = false, abortSignal) {
		const needsLoading = !Blog.isCached;
		try {
			if (needsLoading && !suppressLoading) {
				this.app.uiManager.showLoading(true);
			}

			const blogEntries = await Blog.getIndex(abortSignal);
			const currentLang = Lang.langCode || 'en_US';

			const renderListItems = (entries) => {
				return entries
					.map((entry) => {
						const escapedTitle = escapeHtml(entry.title);
						return `
						<li>
							<a href="/blog/${entry.date}" data-route="blog/${entry.date}">
								<span class="blog-list-title" style="--content-length: ${entry.title.length};">${escapedTitle}</span>
								<time class="blog-list-date" datetime="${entry.date}">${entry.date}</time>
							</a>
						</li>`;
					})
					.join('');
			};

			const enEntries = blogEntries.filter((e) => e.language === 'en_US');
			const localEntries =
				currentLang !== 'en_US'
					? blogEntries.filter((e) => e.language === currentLang)
					: [];

			let finalHtml = '<div class="blog-index">';

			if (enEntries.length === 0 && localEntries.length === 0) {
				const noArticlesText = Lang.getHtmlString('blog.empty', null, 'No articles found.');
				finalHtml += `<p class="blog-empty">${noArticlesText}</p>`;
			} else {
				if (currentLang === 'en_US') {
					finalHtml += `<ul class="blog-list">${renderListItems(enEntries)}</ul>`;
				} else {
					if (localEntries.length > 0) {
						finalHtml += `<ul class="blog-list">${renderListItems(localEntries)}</ul>`;
					}

					if (enEntries.length > 0) {
						const hasLocal = localEntries.length > 0;
						const separatorKey = hasLocal
							? 'blog.englishArticles'
							: 'blog.englishArticlesOnly';
						const separatorFallback = hasLocal
							? 'Articles in English'
							: 'Articles only available in English';
						const separatorText = Lang.getHtmlString(
							separatorKey,
							null,
							separatorFallback
						);

						finalHtml += `
							${hasLocal ? '<hr class="blog-separator" />' : ''}
							<h3 class="blog-separator-title">${separatorText}</h3>
							<ul class="blog-list">${renderListItems(enEntries)}</ul>
						`;
					}
				}
			}

			finalHtml += '</div>';

			this.app.uiManager.displayContentInTextView(finalHtml);
			this.#hydrateBlogLinks(this.app.uiManager.elements.textContent);
		} catch (error) {
			console.error('Failed to load blog index:', error);
			const errorText = Lang.getHtmlString(
				'blog.errorLoading',
				null,
				'Failed to load blog index.'
			);
			this.app.uiManager.displayContentInTextView(`<p class="error">${errorText}</p>`);
		} finally {
			if (needsLoading && !suppressLoading) {
				this.app.uiManager.hideLoading(true);
			}
		}
	}

	/**
	 * Attaches router navigation events to the rendered blog links.
	 * @param {HTMLElement} container - The container holding the blog list.
	 * @private
	 */
	#hydrateBlogLinks(container) {
		const links = container.querySelectorAll('.blog-list a[data-route]');
		links.forEach((link) => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				this.app.navigate(link.dataset.route);
			});
		});
	}

	/**
	 * Fetches the projects index JSON, generates HTML, and renders the list of projects.
	 * @param {boolean} [suppressLoading=false] - If true, skips showing the loading overlay.
	 * @param {AbortSignal} [abortSignal] - Optional signal to abort the fetch process.
	 * @private
	 */
	async #renderProjectsIndex(suppressLoading = false, abortSignal) {
		const needsLoading = !Projects.isCached;
		try {
			if (needsLoading && !suppressLoading) {
				this.app.uiManager.showLoading(true);
			}

			const projects = await Projects.getIndex(abortSignal);

			const projectsIntro = Lang.formatString(
				Lang.getHtmlString('projects.intro', null, null),
				[
					'<a href="https://github.com/ELowry" class="md-external-link" target="_blank" rel="noopener noreferrer">',
					'</a>',
				]
			);
			let finalHtml =
				(projectsIntro ? `<p>${projectsIntro}</p>` : '') + '<div class="projects-index">';

			if (projects.length > 0) {
				finalHtml += '<ul class="projects-list">';
				projects.forEach((project) => {
					const escapedTitle = escapeHtml(project.title);
					const escapedDesc = escapeHtml(project.description);
					const escapedTech = escapeHtml(project.tech);

					finalHtml += `
						<li>
							<a href="/projects/${project.id}" data-route="projects/${project.id}">
								<div class="project-header">
									<span class="project-title">${escapedTitle}</span>
									<span class="project-stars">★ ${project.stars}</span>
								</div>
								<p class="project-desc">${escapedDesc}</p>
								<span class="project-tech">${escapedTech}</span>
							</a>
						</li>
					`;
				});
				finalHtml += '</ul>';
			} else {
				const noProjectsText = Lang.getHtmlString(
					'projects.empty',
					null,
					'No projects found.'
				);
				finalHtml += `<p class="projects-empty">${noProjectsText}</p>`;
			}

			finalHtml += '</div>';

			this.app.uiManager.displayContentInTextView(finalHtml);
			this.#hydrateProjectLinks(this.app.uiManager.elements.textContent);
		} catch (error) {
			console.error('Failed to load projects index:', error);
			const errorText = Lang.getHtmlString(
				'projects.errorLoading',
				null,
				'Failed to load projects index.'
			);
			this.app.uiManager.displayContentInTextView(`<p class="error">${errorText}</p>`);
		} finally {
			if (needsLoading && !suppressLoading) {
				this.app.uiManager.hideLoading(true);
			}
		}
	}

	/**
	 * Attaches router navigation events to the rendered project links.
	 * @param {HTMLElement} container - The container holding the project list.
	 * @private
	 */
	#hydrateProjectLinks(container) {
		const links = container.querySelectorAll('.projects-list a[data-route]');
		links.forEach((link) => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				this.app.navigate(link.dataset.route);
			});
		});
	}

	/**
	 * Render and inject text view content for the provided path.
	 * @param {string} path - Content path to render
	 * @param {Object} [node] - Optional node object to use instead of lookup
	 */
	render(path, node) {
		if (!this.app.uiManager.elements.textNav) {
			return;
		}

		const Content = this.app?.Content || AppContent;
		const currentNode = node || Content.findNodeByPath(path);

		// Clear existing content
		this.app.uiManager.elements.textNav.innerHTML = '';

		// BREADCRUMBS
		const breadcrumbList = document.createElement('ol');
		breadcrumbList.className = 'breadcrumbs';
		breadcrumbList.setAttribute(
			'aria-label',
			Lang.getString('ui.breadcrumbsAria', null, 'Breadcrumb')
		);

		let crumbIndex = 0;
		const createCrumb = (label, targetPath, isCurrent) => {
			const clone = this.breadcrumbTemplate.content.cloneNode(true);
			const listItem = clone.querySelector('li');
			const link = clone.querySelector('a');

			link.textContent = label;
			link.setAttribute('tabindex', crumbIndex === 0 ? '0' : '-1');

			if (isCurrent) {
				listItem.setAttribute('aria-current', 'page');
				listItem.textContent = label;
			} else {
				link.href =
					Router.isBlogRoute || Router.isProjectRoute
						? `/${targetPath}`
						: `/${this.app.mode}/${targetPath}`;

				link.addEventListener('click', (e) => {
					e.preventDefault();
					this.app.navigate(targetPath);
				});
			}

			breadcrumbList.appendChild(clone);
			crumbIndex++;
		};

		// Root Crumb
		const rootLabel = Lang.getHtmlString('portfolio.rootTitle', null, 'Welcome');
		createCrumb(rootLabel, '', currentNode ? currentNode.id === 'root' : false);

		// Path Crumbs
		let currentPath = '';
		const pathParts = path.split('/').filter((p) => p);

		pathParts.forEach((part, index) => {
			currentPath += (currentPath ? '/' : '') + part;

			const currNode = Content.findNodeByPath(currentPath);
			let label = part;

			if (currNode) {
				const langKey = `content.${currentPath.replace(/\//g, '.')}.title`;
				label = Lang.getHtmlString(langKey, null, currNode.title);
			} else if (part === 'blog') {
				label = Lang.getHtmlString('blog.title', null, 'Blog');
			} else if (part === 'projects') {
				label = Lang.getHtmlString('projects.title', null, 'Projects');
			}

			createCrumb(label, currentPath, index === pathParts.length - 1);
		});

		this.app.uiManager.elements.textNav.appendChild(breadcrumbList);

		// NAVIGATION
		if (!currentNode || !currentNode.children) {
			return;
		}

		const visibleChildren = currentNode.children.filter((child) => {
			if (child.hidden === true) {
				return false;
			}
			return currentNode.id === 'root' ? child.id !== 'index' : true;
		});

		if (visibleChildren.length <= 0) {
			return;
		}

		const navContainer = document.createElement('div');
		navContainer.className = 'nav-list';
		navContainer.setAttribute('role', 'menu');
		navContainer.setAttribute(
			'aria-label',
			Lang.getString('ui.categoryOptionsAria', null, 'Category options')
		);

		let focusableIndex = 0;
		visibleChildren.forEach((child) => {
			if (child.type === 'separator') {
				const separatorEl = document.createElement('span');
				separatorEl.className = 'nav-separator';
				navContainer.appendChild(separatorEl);
				return;
			}

			const childPath = path ? `${path}/${child.id}` : child.id;

			// Label Logic
			const langKey = `content.${childPath.replace(/\//g, '.')}.title`;
			const label = Lang.getHtmlString(langKey, null, child.title);

			// Create Element
			const link = document.createElement('a');
			link.href = '#';
			link.className = 'nav-btn';
			link.setAttribute('role', 'menuitem');
			link.textContent = label;
			link.setAttribute('data-preview-path', childPath);

			if (child.type === 'category') {
				link.classList.add('category');
			}

			link.setAttribute('tabindex', focusableIndex === 0 ? '0' : '-1');
			focusableIndex++;
			link.href = `/${this.app.mode}/${childPath}`;
			link.addEventListener('click', (e) => {
				e.preventDefault();
				this.app.navigate(childPath);
			});

			navContainer.appendChild(link);
		});

		this.app.uiManager.elements.textNav.appendChild(navContainer);
	}
}
