import { Router } from './router.js';
import { Lang } from './lang.js';
import { Content as AppContent } from './content.js';
import { Events } from './events.js';
import { Blog } from './blog.js';
import { Projects } from './projects.js';

/**
 * Responsible for composing and injecting the text-mode UI (breadcrumbs and navigation) into the App's text view.
 *
 * @param {AppController} app - Reference to the App instance.
 */
export class TextRenderer {
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

		const createCrumb = (label, targetPath, isCurrent) => {
			const clone = this.breadcrumbTemplate.content.cloneNode(true);
			const listItem = clone.querySelector('li');

			if (isCurrent) {
				listItem.setAttribute('aria-current', 'page');
				listItem.textContent = label;
			} else {
				const link = clone.querySelector('a');
				link.textContent = label;

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

		const isCached = this.#isRouteCached(path, node);

		const executeFinalDOMUpdate = async (suppressLoading) => {
			this.render(path, node);

			if (path === 'blog') {
				await this.#renderBlogIndex(suppressLoading);
			} else if (path === 'projects') {
				await this.#renderProjectsIndex(suppressLoading);
			} else if (node && node.type === 'content' && node.file) {
				await this.app.loadContentIntoText(node.file, null, suppressLoading);
			} else if (node && node.type === 'category') {
				let mainChild;
				if (node.id === 'root') {
					mainChild = node.children?.find((c) => c.id === 'index');
				} else {
					mainChild = node.children?.find((c) => c.id === node.id);
				}

				if (mainChild && mainChild.file) {
					await this.app.loadContentIntoText(mainChild.file, null, suppressLoading);
				} else {
					this.app.uiManager.elements.textContent.innerHTML = '';
				}
			} else if (path.startsWith('blog/')) {
				const date = path.substring(5);
				await this.app.loadContentIntoText(`blog/${date}.md`, 'article', suppressLoading);

				const entries = await Blog.getIndex();
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
					suppressLoading
				);
			} else {
				this.app.uiManager.elements.textContent.innerHTML = '';
			}
		};

		if (isTextToText && !isCached) {
			// Timeout vs Fetch race
			const timeoutId = setTimeout(() => {
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

			await this.#prefetchRouteData(path, node);
			clearTimeout(timeoutId);

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
	 * @returns {Promise<void>}
	 * @private
	 */
	async #prefetchRouteData(path, node) {
		const promises = [];
		if (path === 'blog') {
			promises.push(Blog.getIndex());
		} else if (path === 'projects') {
			promises.push(Projects.getIndex());
		} else if (node && node.type === 'content' && node.file) {
			promises.push(this.app.preloadContent(node.file));
		} else if (node && node.type === 'category') {
			let mainChild;
			if (node.id === 'root') {
				mainChild = node.children?.find((c) => c.id === 'index');
			} else {
				mainChild = node.children?.find((c) => c.id === node.id);
			}
			if (mainChild && mainChild.file) {
				promises.push(this.app.preloadContent(mainChild.file));
			}
		} else if (path.startsWith('blog/')) {
			promises.push(this.app.preloadContent(`blog/${path.substring(5)}.md`));
			promises.push(Blog.getIndex());
		} else if (path.startsWith('projects/')) {
			promises.push(this.app.preloadContent(`projects/${path.substring(9)}.md`));
			promises.push(Projects.getIndex());
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
	 * @private
	 */
	async #renderBlogIndex(suppressLoading = false) {
		const needsLoading = !Blog.isCached;
		try {
			if (needsLoading && !suppressLoading) {
				this.app.uiManager.showLoading(true);
			}

			const blogEntries = await Blog.getIndex();
			const currentLang = Lang.langCode || 'en_US';

			const renderListItems = (entries) => {
				let html = '';
				entries.forEach((entry) => {
					html += `<li><a href="/blog/${entry.date}" data-route="blog/${entry.date}"><span class="blog-list-title" style="--content-length: ${entry.title.length};">${entry.title}</span><time class="blog-list-date" datetime="${entry.date}">${entry.date}</time></a></li>`;
				});
				return html;
			};

			let finalHtml = '<div class="blog-index">';

			if (currentLang === 'en_US') {
				const enEntries = blogEntries.filter((e) => e.language === 'en_US');
				if (enEntries.length > 0) {
					finalHtml += '<ul class="blog-list">';
					finalHtml += renderListItems(enEntries);
					finalHtml += '</ul>';
				} else {
					const noArticlesText = Lang.getHtmlString(
						'blog.empty',
						null,
						'No articles found.'
					);
					finalHtml += `<p class="blog-empty">${noArticlesText}</p>`;
				}
			} else {
				const localEntries = blogEntries.filter((e) => e.language === currentLang);
				const enEntries = blogEntries.filter((e) => e.language === 'en_US');

				if (localEntries.length > 0) {
					finalHtml += '<ul class="blog-list">';
					finalHtml += renderListItems(localEntries);
					finalHtml += '</ul>';
				}

				if (enEntries.length > 0) {
					let separatorText;
					if (localEntries.length > 0) {
						separatorText = Lang.getHtmlString(
							'blog.englishArticles',
							null,
							'Articles in English'
						);
					} else {
						separatorText = Lang.getHtmlString(
							'blog.englishArticlesOnly',
							null,
							'Articles only available in English'
						);
					}
					finalHtml += `<hr class="blog-separator" /><h3 class="blog-separator-title">${separatorText}</h3>`;
					finalHtml += '<ul class="blog-list">';
					finalHtml += renderListItems(enEntries);
					finalHtml += '</ul>';
				}

				if (localEntries.length === 0 && enEntries.length === 0) {
					const noArticlesText = Lang.getHtmlString(
						'blog.empty',
						null,
						'No articles found.'
					);
					finalHtml += `<p class="blog-empty">${noArticlesText}</p>`;
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
	 * @private
	 */
	async #renderProjectsIndex(suppressLoading = false) {
		const needsLoading = !Projects.isCached;
		try {
			if (needsLoading && !suppressLoading) {
				this.app.uiManager.showLoading(true);
			}

			const projects = await Projects.getIndex();

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
					finalHtml += `
						<li>
							<a href="/projects/${project.id}" data-route="projects/${project.id}">
								<div class="project-header">
									<span class="project-title">${project.title}</span>
									<span class="project-stars">★ ${project.stars}</span>
								</div>
								<p class="project-desc">${project.description}</p>
								<span class="project-tech">${project.tech}</span>
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
}
