const PAYMENT_OPTIONS = [
  {
    value: 'mobile_money',
    label: 'Mobile Money',
    description: 'Pay via M-Pesa, Airtel Money, etc.',
    icon: '📱',
  },
  {
    value: 'card',
    label: 'Card',
    description: 'Visa, Mastercard — secure 3D checkout.',
    icon: '💳',
  },
  {
    value: 'cash_on_delivery',
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives.',
    icon: '💵',
  },
  {
    value: 'pay_in_store',
    label: 'Pay in Store',
    description: 'Collect and pay at the till.',
    icon: '🏪',
  },
]

export default function PaymentStep({ selected, onSelect, onNext, onBack }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Choose Payment Method</h3>

      <div className="space-y-2">
        {PAYMENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${
              selected === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{opt.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.description}</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selected === opt.value ? 'border-primary' : 'border-gray-300'
            }`}>
              {selected === opt.value && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:border-gray-300 transition"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review Order
        </button>
      </div>
    </div>
  )
}
