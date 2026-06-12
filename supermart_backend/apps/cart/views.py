from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import (
    AddToCartSerializer,
    CartSerializer,
    UpdateCartItemSerializer,
)


def get_or_create_cart(request):
    """Resolve the cart for the current request — user cart or guest session cart."""
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
    else:
        session_id = request.headers.get('X-Cart-Session-ID', '').strip()
        if not session_id:
            raise PermissionError('X-Cart-Session-ID header is required for guest carts.')
        cart, _ = Cart.objects.get_or_create(session_id=session_id, user=None)
    return cart


class CartView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart = get_or_create_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)


class CartItemCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request)
        variant = serializer.validated_data['variant']
        quantity = serializer.validated_data['quantity']

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_variant=variant,
            defaults={'quantity': quantity},
        )

        if not created:
            new_qty = item.quantity + quantity
            if variant.stock_qty < new_qty:
                return Response(
                    {'quantity': f'Only {variant.stock_qty} unit(s) available.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.quantity = new_qty
            item.save()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def _get_item(self, request, pk):
        cart = get_or_create_cart(request)
        return generics.get_object_or_404(CartItem, pk=pk, cart=cart)

    def patch(self, request, pk):
        item = self._get_item(request, pk)
        serializer = UpdateCartItemSerializer(data=request.data, context={'cart_item': item})
        serializer.is_valid(raise_exception=True)
        item.quantity = serializer.validated_data['quantity']
        item.save()
        return Response(CartSerializer(item.cart).data)

    def delete(self, request, pk):
        item = self._get_item(request, pk)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart).data)


class MergeCartView(APIView):
    """Merge a guest cart into the logged-in user's cart after login."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id', '').strip()
        if not session_id:
            return Response({'detail': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            guest_cart = Cart.objects.prefetch_related('items__product_variant').get(
                session_id=session_id, user=None
            )
        except Cart.DoesNotExist:
            return Response({'detail': 'No guest cart found.'}, status=status.HTTP_200_OK)

        user_cart, _ = Cart.objects.get_or_create(user=request.user)

        for guest_item in guest_cart.items.all():
            variant = guest_item.product_variant
            item, created = CartItem.objects.get_or_create(
                cart=user_cart,
                product_variant=variant,
                defaults={'quantity': guest_item.quantity},
            )
            if not created:
                new_qty = min(item.quantity + guest_item.quantity, variant.stock_qty)
                item.quantity = new_qty
                item.save()

        guest_cart.delete()
        return Response(CartSerializer(user_cart).data)


class ApplyCouponView(APIView):
    """Stub — coupon engine is implemented in Phase 10."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(
            {'detail': 'Coupon system not available yet.'},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
