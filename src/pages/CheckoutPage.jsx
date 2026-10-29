import SourceMarkup from '../components/SourceMarkup.jsx'

export default function CheckoutPage({ actions }) {
  return (
    <form className="checkout-form" onSubmit={actions.placeOrder}>
      <SourceMarkup id="checkout-page" actions={actions} />
    </form>
  )
}
