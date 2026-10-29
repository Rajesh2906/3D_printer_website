import { createElement, useMemo } from 'react'
import parse, { attributesToProps, domToReact } from 'html-react-parser'
import { getSourceMarkup } from '../data/sourceMarkup.js'

const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

function isElement(node) {
  return node.type === 'tag' || node.type === 'script' || node.type === 'style'
}

function renderProps(attributes, name) {
  const safeAttributes = { ...attributes }
  delete safeAttributes.onclick
  delete safeAttributes.onsubmit
  const props = attributesToProps(safeAttributes)

  if ('value' in props && ['input', 'textarea'].includes(name)) {
    props.defaultValue = props.value
    delete props.value
  }
  if ('checked' in props) {
    props.defaultChecked = props.checked
    delete props.checked
  }
  return props
}

function renderElement(name, props, children) {
  return voidElements.has(name)
    ? createElement(name, props)
    : createElement(name, props, children)
}

function SourceMarkup({ id, actions }) {
  const markup = useMemo(() => getSourceMarkup(id), [id])
  const content = useMemo(() => {
    let options
    options = {
      replace(node) {
        if (!isElement(node)) return undefined

        const { attribs, name } = node
        const props = renderProps(attribs, name)
        const children = domToReact(node.children, options)
        let changed = false

        if (id === 'checkout-page' && name === 'span') {
          const label = node.children.map((child) => child.data ?? '').join('')
          const subtotal = actions.cart.reduce((total, item) => total + item.price * item.quantity, 0)
          const amounts = {
            '$39.98': `$${subtotal.toFixed(2)}`,
            '$5.00': actions.cart.length ? '$5.00' : '$0.00',
            '$3.20': `$${(subtotal * 0.08).toFixed(2)}`,
            '$48.18': `$${(subtotal + (actions.cart.length ? 5 : 0) + subtotal * 0.08).toFixed(2)}`,
          }
          if (amounts[label]) return createElement(name, props, amounts[label])
        }

        if (id === 'checkout-page' && name === 'p'
          && node.children.map((child) => child.data ?? '').join('').includes('Complete your order securely below.')) {
          return createElement(name, props, 'Demo checkout. No card details are processed or payment collected.')
        }

        if (attribs.onclick) {
          changed = true
          const route = attribs.onclick.match(/navigateTo\('([^']+)'\)/)?.[1]
          const section = attribs.onclick.match(/scrollToSection\('([^']+)'\)/)?.[1]
          const quantityDelta = attribs.onclick.match(/updateQuantity\((-?\d+)\)/)?.[1]

          if (route) {
            props.onClick = () => actions.navigateTo(route)
            if (name === 'button') props['aria-label'] = route === 'checkout-page' ? 'Open checkout cart' : undefined
          }
          else if (section) props.onClick = () => actions.scrollToSection(section)
          else if (attribs.onclick.includes('nextSlide')) {
            props.onClick = () => actions.setSlide((actions.slide + 1) % 3)
            props['aria-label'] = 'Next slide'
          } else if (attribs.onclick.includes('prevSlide')) {
            props.onClick = () => actions.setSlide((actions.slide + 2) % 3)
            props['aria-label'] = 'Previous slide'
          }
          else if (attribs.onclick.includes('updateMainImage')) props.onClick = (event) => actions.setMainImage(event.currentTarget.src)
          else if (quantityDelta) props.onClick = () => actions.setQuantity((value) => Math.max(1, value + Number(quantityDelta)))
          else if (attribs.onclick.includes('addToCart')) props.onClick = actions.addToCart
          else if (attribs.onclick.includes('placeOrder')) {
            props.type = 'submit'
            delete props.onClick
          } else if (attribs.onclick.includes('closeModal')) props.onClick = actions.closeModal
          else props.onClick = undefined

          if (['div', 'img'].includes(name)) {
            props.role = 'button'
            props.tabIndex = 0
            props.onKeyDown = (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                props.onClick?.(event)
              }
            }
            if (name === 'img' && !props['aria-label']) {
              const imageIndex = node.parent?.children?.filter((child) => child.attribs?.class?.includes('thumbnail-img')).indexOf(node) ?? 0
              props['aria-label'] = `Select product image ${imageIndex + 1}`
            }
          }
        }

        if (attribs.onsubmit) {
          changed = true
          if (attribs.onsubmit.includes('Your custom print request')) props.onSubmit = actions.submitCustomRequest
          else if (attribs.onsubmit.includes('Message Sent')) props.onSubmit = actions.submitContact
          else if (attribs.onsubmit.includes('Subscribed!')) props.onSubmit = actions.submitNewsletter
        }

        if (attribs.id === 'theme-toggle') {
          changed = true
          props.onClick = () => actions.setTheme(actions.theme === 'dark' ? 'light' : 'dark')
          props['aria-label'] = actions.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
        }

        if (attribs.id === 'theme-toggle-dark-icon' || attribs.id === 'theme-toggle-light-icon') {
          changed = true
          const isVisible = attribs.id === 'theme-toggle-dark-icon'
            ? actions.theme === 'light'
            : actions.theme === 'dark'
          props.className = `${(props.className ?? '').replace(/\bhidden\b/g, '').trim()} ${isVisible ? '' : 'hidden'}`.trim()
        }

        if (attribs.id === 'navbar') {
          changed = true
          props.className = (props.className ?? '')
            .replace(/bg-white\/(?:80|95)/, actions.scrolled ? 'bg-white/95' : 'bg-white/80')
          if (actions.scrolled) props.className = `${props.className} shadow-md`.trim()
          else props.className = props.className.replace(/\bshadow-md\b/g, '').trim()
        }

        if (attribs.id === 'cart-badge') {
          changed = true
          props.className = `${props.className ?? ''} ${actions.badgePopped ? 'scale-150' : ''}`.trim()
          return createElement(name, props, String(actions.cartCount))
        }

        if (id === 'home-page' && props.className?.includes('carousel-slide')) {
          changed = true
          props.className = props.className.replace(/\sactive\b/g, '')
          const slideIndex = node.parent?.children
            ?.filter((child) => child.attribs?.class?.includes('carousel-slide'))
            .indexOf(node) ?? 0
          if (slideIndex === actions.slide) {
            props.className = `${props.className} active`.trim()
          }
        }

        if (id === 'home-page' && props.className?.includes('dot-indicator')) {
          changed = true
          const dotIndex = node.parent?.children?.filter((child) => child.attribs?.class?.includes('dot-indicator')).indexOf(node) ?? 0
          props.className = dotIndex === actions.slide
            ? 'w-10 h-1.5 bg-teal-500 rounded-full transition-all duration-300 dot-indicator'
            : 'w-4 h-1.5 bg-white/50 hover:bg-white/80 rounded-full transition-all duration-300 dot-indicator'
          props.onClick = () => actions.setSlide(dotIndex)
          props['aria-label'] = `Go to slide ${dotIndex + 1}`
          props['aria-current'] = dotIndex === actions.slide ? 'true' : undefined
        }

        if (id === 'product-page' && attribs.id === 'main-product-img') {
          changed = true
          props.src = actions.mainImage
        }

        if (id === 'product-page' && props.className?.includes('thumbnail-img')) {
          changed = true
          const selected = attribs.src === actions.mainImage.replace(/w=800$/, 'w=600')
            || attribs.src === actions.mainImage
          props.className = props.className
            .replace(/border-teal-500/g, selected ? 'border-teal-500' : 'border-transparent')
            .replace(/border-transparent/g, selected ? 'border-teal-500' : 'border-transparent')
        }

        if (id === 'product-page' && attribs.id === 'qty') {
          changed = true
          delete props.defaultValue
          props.value = actions.quantity
          props.readOnly = true
        }

        if (id === 'checkout-page' && attribs.id === 'checkout-cart-items') {
          changed = true
          return createElement(
            name,
            props,
            actions.cart.length
              ? actions.cart.map((item) => createElement('div', {
                className: 'flex items-center space-x-4',
                key: item.id,
              },
              createElement('img', {
                src: item.image,
                alt: item.name,
                className: 'w-20 h-20 rounded-2xl object-contain bg-gray-50 border border-gray-100 p-1',
              }),
              createElement('div', { className: 'flex-grow' },
                createElement('h4', { className: 'font-bold text-gray-900' }, item.name),
                createElement('p', { className: 'text-gray-500 text-sm' }, `Qty: ${item.quantity}`),
                createElement('div', { className: 'mt-2 flex gap-2' },
                  createElement('button', {
                    type: 'button',
                    className: 'text-sm text-teal-600 hover:text-teal-800',
                    onClick: () => actions.updateCartQuantity(item.id, -1),
                    'aria-label': `Remove one ${item.name}`,
                  }, '−'),
                  createElement('button', {
                    type: 'button',
                    className: 'text-sm text-teal-600 hover:text-teal-800',
                    onClick: () => actions.updateCartQuantity(item.id, 1),
                    'aria-label': `Add one ${item.name}`,
                  }, '+'),
                  createElement('button', {
                    type: 'button',
                    className: 'text-sm text-orange-600 hover:text-orange-800',
                    onClick: () => actions.removeFromCart(item.id),
                    'aria-label': `Remove ${item.name} from cart`,
                  }, 'Remove'),
                ),
              ),
              createElement('span', { className: 'font-bold text-gray-900 text-lg' }, `$${(item.price * item.quantity).toFixed(2)}`),
              ))
              : createElement('p', { className: 'text-gray-500 text-sm' }, 'Your cart is empty. Add a toy to get started.'),
          )
        }

        if (id === 'checkout-page' && name === 'input' && attribs.type !== 'radio'
          && !['Card number', 'MM / YY', 'CVC'].includes(attribs.placeholder)) {
          changed = true
          props.required = true
          props.name = attribs.placeholder?.toLowerCase().replace(/[^a-z]+/g, '-') || `checkout-field-${attribs.type}`
        }

        if (id === 'home-page' && attribs.type === 'file') {
          changed = true
          props.accept = '.stl,.obj'
          props.onChange = actions.handleFileChange
        }

        if (name === 'section' && id === 'home-page') {
          if (props.className?.includes('bg-teal-50')) props.id = 'policy'
          if (['best-sellers', 'gallery', 'custom-print', 'contact', 'policy'].includes(props.id)) {
            changed = true
            props.ref = (element) => actions.registerSection(props.id, element)
          }
        }

        if (name === 'a' && attribs.href === '#') {
          changed = true
          const label = node.children.map((child) => child.data ?? '').join('').trim()
          const target = /terms|privacy/i.test(label) ? 'policy' : 'contact'
          props.href = `#${target}`
          props.onClick = (event) => {
            event.preventDefault()
            actions.scrollToSection(target)
          }
        }

        if (!changed) return undefined
        return renderElement(name, props, children)
      },
    }

    return parse(markup, options)
  }, [actions, id, markup])

  return content
}

export default SourceMarkup
