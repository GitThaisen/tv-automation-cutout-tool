import {
	tagName as thumbnailTagName,
	attributeNames as thumbnailAttributeNames
} from './source-thumbnail.js'
import { get as getConfigValue } from '../../lib/config.js'
import { EventNames } from '../../shared/events.js'

const html = String.raw

export { tagName, classNames, eventNames, attributeNames }

const tagName = 'source-selector'

const classNames = {
	SOURCES_LIST: 'input-source-list',
	SOURCES_LIST_ITEM: 'input-source-list--item',
	SOURCES_LIST_ITEM_OVERLAY: 'input-source-list--item--overlay',
	SRC_THUMB: 'input-source-list--item--thumbnail',
	SRC_TITLE: 'input-source-list--item--title',
	PREVIEW_SOURCE: 'input-source-list--current-preview',
	PROGRAM_SOURCE: 'input-source-list--current-program'
}

const attributeNames = {
	SOURCE_ID: 'data-source-id',
	PREVIEW_ID: 'data-preview-id',
	PROGRAM_ID: 'data-program-id'
}

const eventNames = {
	SOURCE_SELECTED: 'source-selected'
}

const template = html`
	<link rel="stylesheet" href="./components/video/source-selector.css" />
	<ul class="${classNames.SOURCES_LIST}"></ul>
`

class SourceSelector extends HTMLElement {
	static get observedAttributes() {
		return [attributeNames.PREVIEW_ID, attributeNames.PROGRAM_ID]
	}

	constructor() {
		super()

		this.sources = {}

		const shadowRoot = this.attachShadow({ mode: 'open' })
		shadowRoot.innerHTML = template
		this.sourceListElement = shadowRoot.querySelector(`.${classNames.SOURCES_LIST}`)
	}

	connectedCallback() {
		document.addEventListener(EventNames.UPDATE_CONFIG, () => {
			this.updateSources()
		})

		this.shadowRoot.addEventListener('click', ({ target }) => {
			const id = target.getAttribute(attributeNames.SOURCE_ID)
			if (!id) {
				return
			}

			if (id === this.previewId || id === this.programId) {
				// block current preview and program for preview
				return
			}

			const event = new CustomEvent(eventNames.SOURCE_SELECTED, {
				bubbles: true,
				composed: true,
				detail: { id }
			})
			this.dispatchEvent(event)
		})

		this.updateSources()
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case attributeNames.PREVIEW_ID:
				this.previewId = newValue
				this.highlightSource(classNames.PREVIEW_SOURCE)
				break
			case attributeNames.PROGRAM_ID:
				this.programId = newValue
				this.highlightSource(classNames.PROGRAM_SOURCE)
				break
		}
	}

	updateSources() {
		const sources = getConfigValue('sources')
		if (sources) {
			this.sources = sources
			this.renderSourceSelectors()
		}
	}

	highlightSource(className) {
		const oldHighlighted = this.sourceListElement.querySelector(`.${className}`)
		if (oldHighlighted) {
			const overlay = oldHighlighted.querySelector(`.${classNames.SOURCES_LIST_ITEM_OVERLAY}`)
			oldHighlighted.removeChild(overlay)
			oldHighlighted.classList.remove(className)
		}

		let idToHighlight
		switch (className) {
			case classNames.PREVIEW_SOURCE:
				idToHighlight = this.previewId
				break
			case classNames.PROGRAM_SOURCE:
				idToHighlight = this.programId
				break
		}

		if (idToHighlight) {
			const listItem = this.sourceListElement.querySelector(
				`.${classNames.SOURCES_LIST_ITEM}[${attributeNames.SOURCE_ID}=${idToHighlight}]`
			)
			if (listItem) {
				listItem.appendChild(createOverlayElement())
				listItem.classList.add(className)
			}
		}
	}

	renderSourceSelectors() {
		const ids = Object.keys(this.sources)
		const listItems = ids
			.map((id) => {
				const source = this.sources[id]
				try {
					const listItem = createListItem(source, id)
					if (id === this.previewId) {
						listItem.classList.add(classNames.PREVIEW_SOURCE)
						listItem.appendChild(createOverlayElement())
					}
					if (id === this.programId) {
						listItem.classList.add(classNames.PROGRAM_SOURCE)
						listItem.appendChild(createOverlayElement())
					}
					return listItem
				} catch (error) {
					console.warn(`Unable to create source preview for ${id}`, error)
					return null
				}
			})
			.filter((item) => item !== null)

		this.sourceListElement.innerHTML = ''
		this.sourceListElement.append(...listItems)
	}
}

customElements.define(tagName, SourceSelector)

function createListItem(source, sourceId) {
	const listItem = document.createElement('li')
	listItem.classList.add(classNames.SOURCES_LIST_ITEM)
	listItem.setAttribute(attributeNames.SOURCE_ID, sourceId)

	const thumbnail = document.createElement(thumbnailTagName)
	thumbnail.setAttribute(thumbnailAttributeNames.SOURCE_ID, sourceId)
	thumbnail.classList.add(classNames.SRC_THUMB)
	listItem.appendChild(thumbnail)

	const link = document.createElement('a')
	link.classList.add(classNames.SRC_TITLE)
	link.setAttribute(attributeNames.SOURCE_ID, sourceId)
	link.href = '#'
	link.title = source.title
	link.textContent = source.title
	listItem.appendChild(link)

	return listItem
}

function createOverlayElement() {
	const overlay = document.createElement('div')
	overlay.classList.add(classNames.SOURCES_LIST_ITEM_OVERLAY)

	return overlay
}
