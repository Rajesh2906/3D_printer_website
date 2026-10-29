export default function Modal({ modal, onClose }) {
  if (!modal) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl transform ${modal.closing ? 'scale-95' : 'scale-100'} transition-transform duration-300`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 id="modal-title" className="text-2xl font-extrabold text-gray-900 mb-2">{modal.title}</h3>
        <p id="modal-message" className="text-gray-500 mb-8 font-light">{modal.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition shadow-lg"
        >
          Awesome
        </button>
      </div>
    </div>
  )
}
