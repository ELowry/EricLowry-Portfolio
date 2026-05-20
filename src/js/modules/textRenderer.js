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
		this.breadcrumbTemplate = breadcrumbTemplate;
		this.navLinkTemplate = navLinkTemplate;

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
		let currentNode = node || Content.findNodeByPath(path);

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
				link.href = `/${this.app.mode}/${targetPath}`;
				link.addEventListener('click', (e) => {
					e.preventDefault();
					this.app.navigate(targetPath);
				});
			}
			breadcrumbList.appendChild(clone);
		};

		// Root Crumb
		const rootLabel = Lang.getString('portfolio.rootTitle', null, 'Welcome');
		createCrumb(rootLabel, '', currentNode.id === 'root');

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
			}

			createCrumb(label, currentPath, index === pathParts.length - 1);
		});

		this.app.uiManager.elements.textNav.appendChild(breadcrumbList);

		// NAVIGATION
		if (!currentNode || !currentNode.children) {
			return;
		}
		const visibleChildren = currentNode.children.filter((child) => {
			return currentNode.id === 'root' ? child.id !== 'index' : true;
		});

		if (visibleChildren.length <= 0) {
			return;
		}

		const navContainer = document.createElement('div');
		navContainer.className = 'nav-list';
		navContainer.setAttribute('role', 'menu');
		navContainer.setAttribute('aria-label', 'Category Options');

		visibleChildren.forEach((child, idx) => {
			if (child.hidden === true) {
				return;
			}

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
			link.setAttribute('tabindex', idx === 0 ? '0' : '-1');
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
		} else {
			this.app.uiManager.elements.textContent.innerHTML = '';
		}
	}
}
