import { Lang } from './lang.js';
import { Content as AppContent } from './content.js';

/**
 * Responsible for composing and injecting the text-mode UI (breadcrumbs and navigation) into the App's text view.
 * @param {AppController} app - Reference to the App instance.
 */
export class TextRenderer {
	constructor(app) {
		/** @type {AppController} Main application instance. */
		this.app = app;
		/** @type {HTMLTemplateElement|null} Template for breadcrumb list items. */
		this.breadcrumbTemplate = document.getElementById('tmpl-breadcrumb-item');
		/** @type {HTMLTemplateElement|null} Template for navigation links. */
		this.navLinkTemplate = document.getElementById('tmpl-nav-link');
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
		const rootLabel =
			Lang.getString('portfolio.rootTitle') !== 'notFound'
				? Lang.getString('portfolio.rootTitle')
				: 'Welcome';
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
				const labelText = Lang.getString(langKey);
				label = labelText !== 'notFound' ? labelText : currNode.title;
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
			const labelText = Lang.getString(langKey);
			const label = labelText !== 'notFound' ? labelText : child.title;

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
}
