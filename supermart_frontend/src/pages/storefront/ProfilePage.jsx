import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  changePassword,
} from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'

const LABEL_OPTIONS = ['Home', 'Work', 'Other']

const emptyAddress = { label: 'Home', street: '', city: '', region: '', is_default: false }

function AddressForm({ initial = emptyAddress, onSave, onCancel, isPending }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex gap-2">
        {LABEL_OPTIONS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => set('label', l)}
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${
              form.label === l
                ? 'bg-primary text-white border-primary'
                : 'border-gray-300 text-gray-600 hover:border-primary'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Street / Building</label>
          <input
            value={form.street}
            onChange={(e) => set('street', e.target.value)}
            placeholder="e.g. Kimathi Street, Nairobi CBD"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">City / Town</label>
          <input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="e.g. Nairobi"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Region / Area</label>
          <input
            value={form.region}
            onChange={(e) => set('region', e.target.value)}
            placeholder="e.g. Westlands"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => set('is_default', e.target.checked)}
          className="accent-primary"
        />
        Set as default address
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={isPending || !form.street || !form.city}
          className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()

  // ── Personal details ──────────────────────────────────────────────────────
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })
  const profile = profileData?.data

  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  const openProfileEdit = () => {
    setProfileForm({
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      phone: profile?.phone ?? '',
    })
    setEditingProfile(true)
    setProfileSuccess(false)
    setProfileError('')
  }

  const profileMutation = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      refreshUser()
      setEditingProfile(false)
      setProfileSuccess(true)
      setProfileError('')
    },
    onError: (err) => {
      const d = err.response?.data
      setProfileError(
        d?.first_name?.[0] ?? d?.last_name?.[0] ?? d?.phone?.[0] ?? d?.detail ?? 'Failed to save.'
      )
    },
  })

  // ── Change password ───────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')
  const setPw = (k, v) => setPwForm((f) => ({ ...f, [k]: v }))

  const passwordMutation = useMutation({
    mutationFn: (data) => changePassword(data),
    onSuccess: () => {
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
      setPwSuccess(true)
      setPwError('')
    },
    onError: (err) => {
      const d = err.response?.data
      setPwSuccess(false)
      setPwError(
        d?.current_password?.[0] ??
        d?.new_password?.[0] ??
        d?.confirm_password?.[0] ??
        d?.non_field_errors?.[0] ??
        d?.detail ??
        'Failed to change password.'
      )
    },
  })

  const handleChangePassword = () => {
    setPwError('')
    setPwSuccess(false)
    passwordMutation.mutate(pwForm)
  }

  // ── Addresses ─────────────────────────────────────────────────────────────
  const { data: addressData } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  })
  const addresses = addressData?.data?.results ?? addressData?.data ?? []

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressError, setAddressError] = useState('')

  const invalidateAddresses = () => queryClient.invalidateQueries(['addresses'])

  const createMutation = useMutation({
    mutationFn: (data) => createAddress(data),
    onSuccess: () => { invalidateAddresses(); setShowAddForm(false); setAddressError('') },
    onError: (err) => setAddressError(err.response?.data?.detail ?? 'Could not save address.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAddress(id, data),
    onSuccess: () => { invalidateAddresses(); setEditingAddress(null); setAddressError('') },
    onError: (err) => setAddressError(err.response?.data?.detail ?? 'Could not save address.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAddress(id),
    onSuccess: () => invalidateAddresses(),
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        {/* Page header with nav */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Account</h1>
          <Link to="/account/orders" className="text-sm text-primary hover:underline">
            My Orders →
          </Link>
        </div>

        {/* ── Personal Details ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Personal Details</h2>
            {!editingProfile && (
              <button
                onClick={openProfileEdit}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {profileSuccess && !editingProfile && (
            <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Profile updated successfully.
            </p>
          )}

          {editingProfile && profileForm ? (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">First name</label>
                  <input
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Last name</label>
                  <input
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 0712345678"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {profileError && (
                <p className="text-xs text-red-500">{profileError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => profileMutation.mutate(profileForm)}
                  disabled={profileMutation.isPending}
                  className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {profileMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setEditingProfile(false); setProfileError('') }}
                  className="text-sm text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="font-medium text-gray-800">
                    {profile ? `${profile.first_name} ${profile.last_name}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-medium text-gray-800">{profile?.phone || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium text-gray-800">{profile?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Account type</p>
                <p className="font-medium text-gray-800 capitalize">{profile?.role}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Member since</p>
                <p className="font-medium text-gray-800">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-KE', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Change Password ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Change Password</h2>

          {pwSuccess && (
            <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Password changed successfully.
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Current password</label>
              <input
                type="password"
                value={pwForm.current_password}
                onChange={(e) => setPw('current_password', e.target.value)}
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">New password</label>
                <input
                  type="password"
                  value={pwForm.new_password}
                  onChange={(e) => setPw('new_password', e.target.value)}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Confirm new password</label>
                <input
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={(e) => setPw('confirm_password', e.target.value)}
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {pwError && <p className="text-xs text-red-500">{pwError}</p>}

            <button
              onClick={handleChangePassword}
              disabled={
                passwordMutation.isPending ||
                !pwForm.current_password ||
                !pwForm.new_password ||
                !pwForm.confirm_password
              }
              className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
            >
              {passwordMutation.isPending ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* ── Saved Addresses ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Saved Addresses</h2>
            {!showAddForm && (
              <button
                onClick={() => { setShowAddForm(true); setEditingAddress(null); setAddressError('') }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                + Add new
              </button>
            )}
          </div>

          {addressError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {addressError}
            </p>
          )}

          {addresses.length === 0 && !showAddForm && (
            <p className="text-sm text-gray-400">No saved addresses yet.</p>
          )}

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="border border-gray-100 rounded-xl p-4">
                {editingAddress?.id === addr.id ? (
                  <AddressForm
                    initial={editingAddress}
                    onSave={(data) => updateMutation.mutate({ id: addr.id, data })}
                    onCancel={() => { setEditingAddress(null); setAddressError('') }}
                    isPending={updateMutation.isPending}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {addr.label}
                        </span>
                        {addr.is_default && (
                          <span className="text-xs text-green-600 font-semibold">Default</span>
                        )}
                      </div>
                      <p className="text-gray-700 font-medium">{addr.street}</p>
                      <p className="text-gray-400">{addr.city}{addr.region ? `, ${addr.region}` : ''}</p>
                    </div>
                    <div className="flex gap-2 text-xs shrink-0">
                      <button
                        onClick={() => { setEditingAddress(addr); setShowAddForm(false); setAddressError('') }}
                        className="text-primary hover:underline font-medium"
                      >
                        Edit
                      </button>
                      {!addr.is_default && (
                        <button
                          onClick={() => updateMutation.mutate({ id: addr.id, data: { is_default: true } })}
                          className="text-gray-500 hover:text-primary hover:underline font-medium"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this address?')) deleteMutation.mutate(addr.id)
                        }}
                        className="text-red-400 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showAddForm && (
            <AddressForm
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => { setShowAddForm(false); setAddressError('') }}
              isPending={createMutation.isPending}
            />
          )}
        </div>
      </main>
    </div>
  )
}
