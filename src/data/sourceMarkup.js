import sourceHtml from '../../final.html?raw'

const sourceDocument = new DOMParser().parseFromString(sourceHtml, 'text/html')

const sourceSelectors = {
  'site-footer': 'footer',
}

export function getSourceMarkup(id) {
  const element = sourceDocument.querySelector(sourceSelectors[id] ?? `#${id}`)
  if (!element) {
    throw new Error(`Could not find source markup for "${id}" in final.html`)
  }
  return element.outerHTML
}
