import requests
from django.conf import settings

FLW_BASE = 'https://api.flutterwave.com/v3'


def _headers():
    return {
        'Authorization': f'Bearer {settings.FLW_SECRET_KEY}',
        'Content-Type': 'application/json',
    }


def create_payment_link(order, redirect_url):
    """
    Create a Flutterwave standard checkout link.
    Returns the hosted payment URL to redirect the customer to.
    """
    payload = {
        'tx_ref': order.order_number,
        'amount': str(order.total),
        'currency': settings.FLW_CURRENCY,
        'redirect_url': redirect_url,
        'customer': {
            'email': order.user.email,
            'name': order.user.full_name,
            'phonenumber': order.user.phone or '',
        },
        'customizations': {
            'title': 'Supermart',
            'description': f'Order {order.order_number}',
        },
    }
    response = requests.post(f'{FLW_BASE}/payments', json=payload, headers=_headers(), timeout=15)
    response.raise_for_status()
    return response.json()['data']['link']


def verify_transaction(transaction_id):
    """
    Verify a completed transaction by its Flutterwave transaction ID.
    Returns the transaction data dict, or raises on error.
    """
    response = requests.get(
        f'{FLW_BASE}/transactions/{transaction_id}/verify',
        headers=_headers(),
        timeout=15,
    )
    response.raise_for_status()
    return response.json().get('data', {})


def verify_webhook_signature(request):
    """Return True if the request's verif-hash matches our configured secret."""
    return request.headers.get('verif-hash') == settings.FLW_SECRET_HASH
