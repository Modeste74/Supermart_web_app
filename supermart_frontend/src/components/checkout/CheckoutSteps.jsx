export default function CheckoutSteps({ steps, current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < current
        const active = stepNum === current

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done
                    ? 'bg-primary text-white'
                    : active
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {done ? '✓' : stepNum}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  active ? 'text-primary' : done ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  done ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
