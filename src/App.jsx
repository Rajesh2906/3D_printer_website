import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import SourceMarkup from './components/SourceMarkup.jsx'
import Modal from './components/Modal.jsx'
import HomePage from './pages/HomePage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import './App.css'

const product = {
  id: 'robo-buddy',
  name: 'Robo Buddy 3000',
  price: 24.99,
  image: 'https://images.unsplash.com/photo-1599623560574-39d485900c95?auto=format&fit=crop&q=80&w=150',
}

function Storefront() {
  const navigate = useNavigate()
  const location = useLocation()
  const sectionRefs = useRef({})
  const [theme, setTheme] = useState(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  const [scrolled, setScrolled] = useState(() => window.scrollY > 20)
  const [cart, setCart] = useState([])
  const [modal, setModal] = useState(null)
  const [slide, setSlide] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [mainImage, setMainImage] = useState('https://images.unsplash.com/photo-1599623560574-39d485900c95?auto=format&fit=crop&q=80&w=800')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [badgePopped, setBadgePopped] = useState(false)

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const isHome = location.pathname === '/' || location.pathname === '/home'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('color-theme', theme)
  }, [theme])

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % 3), 5000)
    return () => window.clearInterval(timer)
  }, [slide])

  const showModal = useCallback((title, message, redirect = null) => {
    setModal({ title, message, redirect, closing: false })
  }, [])

  const closeModal = useCallback(() => {
    setModal((current) => current ? { ...current, closing: true } : current)
  }, [])

  useEffect(() => {
    if (!modal) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeModal, modal])

  useEffect(() => {
    if (!modal?.closing) return undefined
    const timer = window.setTimeout(() => {
      setModal(null)
      if (modal.redirect) navigate(modal.redirect)
    }, 200)
    return () => window.clearTimeout(timer)
  }, [modal, navigate])

  const navigateTo = useCallback((pageId) => {
    const routes = {
      'home-page': '/',
      'product-page': '/product',
      'checkout-page': '/checkout',
    }
    navigate(routes[pageId] ?? '/')
  }, [navigate])

  const registerSection = useCallback((id, element) => {
    if (element) sectionRefs.current[id] = element
    else delete sectionRefs.current[id]
  }, [])

  const scrollToSection = useCallback((sectionId) => {
    const scroll = () => sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })

    if (!isHome) {
      navigate('/')
      window.setTimeout(scroll, 120)
      return
    }
    scroll()
  }, [isHome, navigate])

  const addToCart = useCallback(() => {
    const amount = Math.max(1, quantity)
    setCart((items) => {
      const current = items.find((item) => item.id === product.id)
      return current
        ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + amount } : item)
        : [...items, { ...product, quantity: amount }]
    })
    setBadgePopped(true)
    window.setTimeout(() => setBadgePopped(false), 200)
    showModal('Added to Cart', `${amount} item(s) successfully added to your cart.`)
  }, [quantity, showModal])

  const updateCartQuantity = useCallback((id, amount) => {
    setCart((items) => items
      .map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item)
      .filter((item) => item.quantity > 0))
  }, [])

  const removeFromCart = useCallback((id) => {
    setCart((items) => items.filter((item) => item.id !== id))
  }, [])

  const placeOrder = useCallback((event) => {
    event.preventDefault()
    if (cart.length === 0) {
      showModal('Your Cart Is Empty', 'Add a toy to your cart before placing an order.')
      return
    }
    setCart([])
    showModal(
      'Order Confirmed!',
      'This storefront is a demo. No payment was collected and no order was sent to a backend.',
      '/',
    )
  }, [cart.length, showModal])

  const submitCustomRequest = useCallback((event) => {
    event.preventDefault()
    if (selectedFile && selectedFile.size > 50 * 1024 * 1024) {
      setUploadError('Please choose a file smaller than 50MB.')
      return
    }
    setUploadError('')
    const attachmentMessage = selectedFile ? ` The selected file (${selectedFile.name}) is not uploaded.` : ''
    showModal(
      'Request Ready',
      `This demo has no request service, so your quote was not sent.${attachmentMessage}`,
    )
  }, [selectedFile, showModal])

  const submitContact = useCallback((event) => {
    event.preventDefault()
    showModal('Message Ready', 'This demo has no contact service, so your message was not sent.')
  }, [showModal])

  const submitNewsletter = useCallback((event) => {
    event.preventDefault()
    showModal('Subscription Ready', 'This demo has no mailing-list service, so your email was not subscribed.')
  }, [showModal])

  const handleFileChange = useCallback((event) => {
    const file = event.currentTarget.files?.[0] ?? null
    setSelectedFile(file)
    setUploadError(file && file.size > 50 * 1024 * 1024 ? 'Please choose a file smaller than 50MB.' : '')
  }, [])

  const actions = useMemo(() => ({
    navigateTo,
    registerSection,
    scrollToSection,
    showModal,
    closeModal,
    setTheme,
    theme,
    scrolled,
    cartCount,
    badgePopped,
    slide,
    setSlide,
    quantity,
    setQuantity,
    addToCart,
    mainImage,
    setMainImage,
    selectedFile,
    uploadError,
    handleFileChange,
    submitCustomRequest,
    submitContact,
    submitNewsletter,
    cart,
    updateCartQuantity,
    removeFromCart,
    placeOrder,
  }), [
    navigateTo, registerSection, scrollToSection, showModal, closeModal, theme, scrolled, cartCount,
    badgePopped, slide, quantity, addToCart, mainImage, selectedFile, uploadError,
    handleFileChange, submitCustomRequest, submitContact, submitNewsletter, cart,
    updateCartQuantity, removeFromCart, placeOrder,
  ])

  return (
    <>
      <SourceMarkup id="navbar" actions={actions} />
      <main className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<HomePage actions={actions} />}/>
          <Route path="/home" element={<Navigate to="/" replace />}/>
          <Route path="/home-page" element={<Navigate to="/" replace />}/>
          <Route path="/product" element={<ProductPage actions={actions} />}/>
          <Route path="/product-page" element={<ProductPage actions={actions} />}/>
          <Route path="/checkout" element={<CheckoutPage actions={actions} />}/>
          <Route path="/checkout-page" element={<CheckoutPage actions={actions} />}/>
          <Route path="*" element={<Navigate to="/" replace />}/>
        </Routes>
      </main>
      <SourceMarkup id="site-footer" actions={actions} />
      <Modal modal={modal} onClose={closeModal} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Storefront />
    </BrowserRouter>
  )
}
