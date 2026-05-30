import { Lang } from './lang.js';
import { Content as AppContent } from './content.js';
import { Events } from './events.js';

/**
 * Responsible for composing and injecting the text-mode UI (breadcrumbs and navigation) into the App's text view.
 *
 * @param {AppController} app - Reference to the App instance.
 */
export class TextRenderer {
	/**
	 * @param {AppController} app - Main application instance.
	 * @param {HTMLTemplateElement|null} breadcrumbTemplate - Template for breadcrumb list items.
	 * @param {HTMLTemplateElement|null} navLinkTemplate - Template for navigation links.
	 */
	constructor(app, breadcrumbTemplate, navLinkTemplate) {
		this.app = app;
		this.breadcrumbTemplate =
			breadcrumbTemplate || document.getElementById('template-breadcrumb-item');
		this.navLinkTemplate = navLinkTemplate || document.getElementById('template-nav-link');

		Events.on('route:changed', (payload) => this.#handleTextContent(payload));
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
		breadcrumbList.setAttribute('aria-label', 'Breadcrumb');

		const createCrumb = (label, targetPath, isCurrent) => {
			const clone = this.breadcrumbTemplate.content.cloneNode(true);
			const listItem = clone.querySelector('li');

			if (isCurrent) {
				listItem.setAttribute('aria-current', 'page');
				listItem.textContent = label;
			} else {
				const link = clone.querySelector('a');
				link.textContent = label;

				link.href = targetPath.startsWith('blog')
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
		const rootLabel = Lang.getString('portfolio.rootTitle', null, 'Welcome');
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
				label = Lang.getString(langKey, null, currNode.title);
			} else if (part === 'blog') {
				label = Lang.getString('blog.title', null, 'Blog');
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
		navContainer.setAttribute('aria-label', 'Category Options');

		visibleChildren.forEach((child, index) => {
			const childPath = path ? `${path}/${child.id}` : child.id;

			// Label Logic
			const langKey = `content.${childPath.replace(/\//g, '.')}.title`;
			const label = Lang.getString(langKey, null, child.title);

			// Clone Template
			const clone = this.navLinkTemplate.content.cloneNode(true);
			const link = clone.querySelector('a');

			link.textContent = label;

			if (child.type === 'category') {
				link.classList.add('category');
			}

			link.setAttribute('tabindex', index === 0 ? '0' : '-1');
			link.href = `/${this.app.mode}/${childPath}`;
			link.addEventListener('click', (e) => {
				e.preventDefault();
				this.app.navigate(childPath);
			});

			navContainer.appendChild(clone);
		});

		this.app.uiManager.elements.textNav.appendChild(navContainer);
	}

	/**
	 * Handles text rendering and content loading based on the current route.
	 * @param {Object} payload - The route:changed event payload.
	 * @param {string} payload.mode - The content display mode.
	 * @param {string} payload.path - The route's path.
	 * @param {Object} payload.node - The route's node.
	 * @private
	 */
	async #handleTextContent({ mode, path, node }) {
		if (mode !== 'text') {
			return;
		}

		this.render(path, node);

		// If we are at a specific content node, show it
		if (node && node.type === 'content' && node.file) {
			await this.app.loadContentIntoText(node.file);
		} else if (node && node.type === 'category') {
			// Check if the category has a main file
			let mainChild;
			if (node.id === 'root') {
				mainChild = node.children.find((c) => c.id === 'index');
			} else {
				mainChild = node.children.find((c) => c.id === node.id);
			}

			if (mainChild && mainChild.file) {
				await this.app.loadContentIntoText(mainChild.file);
			} else {
				this.app.uiManager.elements.textContent.innerHTML = '';
			}
		} else if (path === 'blog') {
			await this.#renderBlogIndex();
		} else if (path.startsWith('blog/')) {
			const date = path.substring(5);
			await this.app.loadContentIntoText(`blog/${date}.md`);
		} else {
			this.app.uiManager.elements.textContent.innerHTML = '';
		}
	}

	/**
	 * Fetches the blog index JSON, generates HTML, and renders the list of articles.
	 * Includes a fallback to English if the current language has no entries.
	 * @private
	 */
	async #renderBlogIndex() {
		try {
			this.app.uiManager.showLoading(true);

			const cacheBuster = window.__CACHE_BUSTER__ || Date.now();
			const response = await fetch(`/content/blog-index.json?v=${cacheBuster}`);

			if (!response.ok) {
				throw new Error('Could not load blog index.');
			}

			const blogEntries = await response.json();
			let currentLanguage = Lang.langCode;
			let entries = blogEntries.filter((entry) => entry.language === currentLanguage);
			let fallbackWarningHtml = '';

			if (entries.length === 0) {
				currentLanguage = 'en_US';
				entries = blogEntries.filter((entry) => entry.language === currentLanguage);

				const languageName = Lang.getString(
					`languages.${Lang.langCode}`,
					null,
					'your language'
				);
				const rawWarningText = Lang.getString(
					'blog.languageFallback',
					null,
					`No articles were found in ${languageName}. Here are the articles currently available in English:`
				);
				const warningText = rawWarningText.replace('{0}', languageName);
				fallbackWarningHtml = `<p class="blog-warning alert">${warningText}</p>`;
			}

			let finalHtml = '<div class="blog-index">';
			finalHtml += fallbackWarningHtml;
			finalHtml += '<ul class="blog-list">';

			entries.forEach((entry) => {
				finalHtml += `<li><a href="/blog/${entry.date}" data-route="blog/${entry.date}">${entry.date} | ${entry.title}</a></li>`;
			});

			finalHtml += '</ul></div>';

			this.app.uiManager.displayContentInTextView(finalHtml);
			this.#hydrateBlogLinks(this.app.uiManager.elements.textContent);
		} catch (error) {
			console.error('Failed to load blog index:', error);

			const errorText = Lang.getString(
				'blog.errorLoading',
				null,
				'Failed to load blog index.'
			);

			this.app.uiManager.displayContentInTextView(`<p class="error">${errorText}</p>`);
		} finally {
			this.app.uiManager.hideLoading(true);
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
				const route = e.target.getAttribute('data-route');
				this.app.navigate(route);
			});
		});
	}
}
