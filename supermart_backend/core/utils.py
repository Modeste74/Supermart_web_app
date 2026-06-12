import random
import string
from datetime import datetime

import redis
from django.conf import settings


def generate_order_number():
    year = datetime.now().year
    random_digits = ''.join(random.choices(string.digits, k=5))
    return f'SM-{year}-{random_digits}'


def generate_sku(product_name, variant_label):
    name_part = ''.join(product_name.upper().split())[:6]
    variant_part = ''.join(variant_label.upper().split())[:4]
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=3))
    return f'{name_part}-{variant_part}-{random_suffix}'


# --- Redis stock locking ---

STOCK_LOCK_TTL = 600  # 10 minutes

_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        redis_url = getattr(settings, 'REDIS_URL',
                            settings.CACHES['default']['LOCATION'])
        _redis_client = redis.StrictRedis.from_url(redis_url, decode_responses=True)
    return _redis_client


def _lock_key(variant_id):
    return f'stock_lock:{variant_id}'


def lock_order_stock(items):
    """
    Reserve stock for a set of order items in Redis.
    items = list of (variant_id, quantity) tuples.
    Each variant's locked counter is incremented and given a fresh TTL.
    """
    r = _get_redis()
    pipe = r.pipeline()
    for variant_id, qty in items:
        key = _lock_key(variant_id)
        pipe.incrby(key, qty)
        pipe.expire(key, STOCK_LOCK_TTL)
    pipe.execute()


def release_order_stock(items):
    """
    Decrement (release) stock locks after payment confirmation or cancellation.
    items = list of (variant_id, quantity) tuples.
    """
    r = _get_redis()
    pipe = r.pipeline()
    for variant_id, qty in items:
        key = _lock_key(variant_id)
        pipe.decrby(key, qty)
    pipe.execute()


def get_locked_qty(variant_id):
    """Return how many units of a variant are currently locked by in-flight orders."""
    r = _get_redis()
    val = r.get(_lock_key(variant_id))
    return max(0, int(val)) if val else 0


def get_available_qty(variant):
    """Effective available stock = stock_qty minus Redis-locked units."""
    locked = get_locked_qty(variant.id)
    return max(0, variant.stock_qty - locked)
