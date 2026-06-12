import stripe
from django.conf import settings


def _client():
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_checkout_session(order, success_url, cancel_url):
    """
    Create a Stripe Checkout session.
    Returns (session_url, session_id).
    """
    s = _client()
    session = s.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[
            {
                'price_data': {
                    'currency': settings.STRIPE_CURRENCY,
                    'product_data': {'name': f'Order {order.order_number}'},
                    # Stripe amounts are in the smallest currency unit (cents / fils)
                    'unit_amount': int(order.total * 100),
                },
                'quantity': 1,
            }
        ],
        mode='payment',
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={'order_number': order.order_number},
        customer_email=order.user.email,
    )
    return session.url, session.id


def construct_webhook_event(payload, sig_header):
    """
    Verify and parse a Stripe webhook event.
    Raises stripe.error.SignatureVerificationError on invalid signature.
    """
    s = _client()
    return s.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
