import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'
import { getDeliveryZones } from '../../api/orders'
import { formatPrice } from '../../utils/formatters'

export default function AddressStep({ data, onChange, onNext }) {
  const [addingNew, setAddingNew] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: 'Home', street: '', city: '', region: '', is_default: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const { data: addressRes, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/account/addresses/'),
  })

  const { data: zonesRes } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: getDeliveryZones,
  })

  const addresses = addressRes?.data?.results || addressRes?.data || []
  const zones = zonesRes?.data?.results || zonesRes?.data || []

  const handleSaveAddress = async () => {
    setSaveError('')
    setSaving(true)
    try {
      await api.post('/account/addresses/', newAddress)
      await refetchAddresses()
      setAddingNew(false)
      setNewAddress({ label: 'Home', street: '', city: '', region: '', is_default: false })
    } catch (e) {
      setSaveError('Could not save address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const canProceed =
    data.fulfilment_type === 'pickup' ||
    (data.delivery_address_id && data.delivery_zone_id)

  return (
    <div className="space-y-6">
      {/* Fulfilment type */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">How would you like to receive your order?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'delivery', label: 'Home Delivery', icon: '🚚' },
            { value: 'pickup', label: 'Pickup In-Store', icon: '🏪' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ fulfilment_type: opt.value, delivery_address_id: null, delivery_zone_id: null })}
              className={`p-4 rounded-xl border-2 text-left transition ${
                data.fulfilment_type === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-1">{opt.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {data.fulfilment_type === 'delivery' && (
        <>
          {/* Address selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Delivery Address</h3>
              <button
                onClick={() => setAddingNew(!addingNew)}
                className="text-xs text-primary hover:underline"
              >
                {addingNew ? 'Cancel' : '+ Add new address'}
              </button>
            </div>

            {addingNew && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
                  >
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>
                  <input
                    placeholder="Street / building"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
                  />
                  <input
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Region"
                    value={newAddress.region}
                    onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                <button
                  onClick={handleSaveAddress}
                  disabled={saving || !newAddress.street || !newAddress.city}
                  className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
              </div>
            )}

            {addresses.length === 0 && !addingNew ? (
              <p className="text-sm text-gray-400">No saved addresses. Add one above.</p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => onChange({ delivery_address_id: addr.id })}
                    className={`w-full text-left p-3 rounded-xl border-2 transition ${
                      data.delivery_address_id === addr.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-accent">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{addr.street}, {addr.city}</p>
                    <p className="text-xs text-gray-400">{addr.region}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delivery zone */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Delivery Zone</h3>
            {zones.length === 0 ? (
              <p className="text-sm text-gray-400">No delivery zones available.</p>
            ) : (
              <div className="space-y-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => onChange({ delivery_zone_id: zone.id })}
                    className={`w-full text-left p-3 rounded-xl border-2 transition ${
                      data.delivery_zone_id === zone.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{zone.name}</span>
                      <span className="text-sm font-bold text-primary">{formatPrice(zone.delivery_fee)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {zone.covered_areas?.join(', ')} · {zone.estimated_days}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Payment
      </button>
    </div>
  )
}
