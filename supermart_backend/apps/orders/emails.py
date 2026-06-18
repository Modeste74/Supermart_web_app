import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

STATUS_LABELS = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'processing': 'Being Packed',
    'ready': 'Ready for Pickup',
    'dispatched': 'Dispatched',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
}

STATUS_MESSAGES = {
    'confirmed': 'Your order has been confirmed and will be processed shortly.',
    'processing': 'Your order is being packed and will be ready for dispatch soon.',
    'ready': 'Your order is ready for pickup at our store.',
    'dispatched': 'Your order has been dispatched and is on its way.',
    'out_for_delivery': 'Your order is out for delivery and will arrive shortly.',
    'delivered': 'Your order has been delivered. Thank you for shopping with us!',
    'cancelled': 'Your order has been cancelled. If you have any questions, please contact us.',
}


def _base_html(title, body_html):
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#faf7f2;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#4a7c59;padding:24px 32px;">
      <span style="color:white;font-size:20px;font-weight:700;">Supermart</span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">{title}</h1>
      {body_html}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f0ebe0;background:#faf7f2;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>"""


def _items_table(items):
    rows = ''.join(
        f'<tr>'
        f'<td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#374151;font-size:14px;">'
        f'{item.product_name_snapshot} — {item.variant_label_snapshot}'
        f'</td>'
        f'<td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#374151;font-size:14px;text-align:right;">'
        f'{item.quantity} × KES {item.unit_price_snapshot:,.0f}'
        f'</td>'
        f'</tr>'
        for item in items
    )
    return f'<table style="width:100%;border-collapse:collapse;margin:16px 0;">{rows}</table>'


def send_order_confirmation(order):
    if not settings.EMAIL_HOST_USER:
        return

    items_html = _items_table(order.items.all())
    fulfilment = 'Pickup' if order.fulfilment_type == 'pickup' else 'Delivery'
    payment_label = order.payment_method.replace('_', ' ').title()

    discount_row = (
        f'<tr><td style="color:#6b7280;padding:4px 0;">Discount</td>'
        f'<td style="text-align:right;color:#e07b39;">-KES {order.discount_amount:,.0f}</td></tr>'
        if order.discount_amount else ''
    )
    delivery_row = (
        f'<tr><td style="color:#6b7280;padding:4px 0;">Delivery fee</td>'
        f'<td style="text-align:right;color:#374151;">KES {order.delivery_fee:,.0f}</td></tr>'
        if order.delivery_fee else ''
    )

    body = f"""
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      Hi {order.user.first_name}, thank you for your order!
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Order number</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#4a7c59;">{order.order_number}</p>
    </div>
    {items_html}
    <table style="width:100%;font-size:14px;margin-bottom:24px;">
      <tr><td style="color:#6b7280;padding:4px 0;">Subtotal</td>
          <td style="text-align:right;color:#374151;">KES {order.subtotal:,.0f}</td></tr>
      {delivery_row}
      {discount_row}
      <tr><td style="font-weight:700;color:#1a1a1a;padding:8px 0 0;border-top:1px solid #f0ebe0;">Total</td>
          <td style="text-align:right;font-weight:700;color:#1a1a1a;padding:8px 0 0;border-top:1px solid #f0ebe0;">
            KES {order.total:,.0f}</td></tr>
    </table>
    <table style="width:100%;font-size:13px;color:#6b7280;">
      <tr><td>Fulfilment</td><td style="text-align:right;color:#374151;">{fulfilment}</td></tr>
      <tr><td>Payment method</td><td style="text-align:right;color:#374151;">{payment_label}</td></tr>
    </table>
    """

    try:
        send_mail(
            subject=f'Your Supermart order {order.order_number} is confirmed',
            message=f'Order {order.order_number} confirmed. Total: KES {order.total:,.0f}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=_base_html(f'Order confirmed — {order.order_number}', body),
            fail_silently=False,
        )
    except Exception:
        logger.exception('Failed to send order confirmation for %s', order.order_number)


def send_order_status_update(order):
    if not settings.EMAIL_HOST_USER:
        return

    label = STATUS_LABELS.get(order.status, order.status.replace('_', ' ').title())
    message = STATUS_MESSAGES.get(order.status, f'Your order status has been updated to {label}.')

    if order.status == 'delivered':
        accent = '#4a7c59'
        bg = '#f0fdf4'
    elif order.status == 'cancelled':
        accent = '#ef4444'
        bg = '#fef2f2'
    else:
        accent = '#3b82f6'
        bg = '#eff6ff'

    body = f"""
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      Hi {order.user.first_name}, your order status has been updated.
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Order number</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#4a7c59;">{order.order_number}</p>
    </div>
    <div style="background:{bg};border-radius:12px;padding:16px;margin-bottom:24px;
                border-left:4px solid {accent};">
      <p style="margin:0 0 4px;font-weight:700;font-size:15px;color:#1a1a1a;">{label}</p>
      <p style="margin:0;font-size:14px;color:#6b7280;">{message}</p>
    </div>
    <p style="font-size:13px;color:#9ca3af;margin:0;">Order total: KES {order.total:,.0f}</p>
    """

    try:
        send_mail(
            subject=f'Update on your Supermart order {order.order_number}',
            message=f'Order {order.order_number} — {label}. {message}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=_base_html(f'Order update — {order.order_number}', body),
            fail_silently=False,
        )
    except Exception:
        logger.exception('Failed to send status update for %s', order.order_number)
