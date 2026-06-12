export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount)

export const truncate = (text, length = 80) =>
  text?.length > length ? text.slice(0, length) + '…' : text
