from datetime import datetime, timedelta

from django.db.models import Count, F, Sum
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import ProductVariant
from apps.orders.models import Order
from apps.orders.serializers import AdminOrderListSerializer
from core.permissions import IsAdminOrSuperAdmin, IsSuperAdmin

from .models import Promotion, StoreSettings
from .serializers import PromotionSerializer


class DashboardView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)

        paid = Order.objects.filter(payment_status='paid')

        revenue = {
            'today': float(paid.filter(created_at__gte=today_start).aggregate(t=Sum('total'))['t'] or 0),
            'last_7_days': float(paid.filter(created_at__gte=week_start).aggregate(t=Sum('total'))['t'] or 0),
            'last_30_days': float(paid.filter(created_at__gte=month_start).aggregate(t=Sum('total'))['t'] or 0),
            'all_time': float(paid.aggregate(t=Sum('total'))['t'] or 0),
        }

        all_orders = Order.objects.all()
        order_counts = {'total': all_orders.count()}
        for s, _ in Order._meta.get_field('status').choices:
            order_counts[s] = all_orders.filter(status=s).count()

        low_stock_qs = ProductVariant.objects.filter(
            is_active=True,
            stock_qty__lte=F('low_stock_threshold'),
            stock_qty__gt=0,
        ).select_related('product')

        out_of_stock_qs = ProductVariant.objects.filter(is_active=True, stock_qty=0)

        low_stock_items = [
            {
                'id': v.id,
                'sku': v.sku,
                'product_name': v.product.name,
                'variant_label': v.variant_label,
                'stock_qty': v.stock_qty,
                'low_stock_threshold': v.low_stock_threshold,
            }
            for v in low_stock_qs[:10]
        ]

        recent_orders = (
            Order.objects.select_related('user')
            .prefetch_related('items')
            .order_by('-created_at')[:10]
        )

        return Response({
            'revenue': revenue,
            'orders': order_counts,
            'inventory': {
                'low_stock_count': low_stock_qs.count(),
                'out_of_stock_count': out_of_stock_qs.count(),
                'low_stock_items': low_stock_items,
            },
            'recent_orders': AdminOrderListSerializer(recent_orders, many=True).data,
        })


class SalesReportView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = Order.objects.filter(payment_status='paid')
        if date_from:
            try:
                dt_from = timezone.make_aware(datetime.strptime(date_from, '%Y-%m-%d'))
                qs = qs.filter(created_at__gte=dt_from)
            except ValueError:
                pass
        if date_to:
            try:
                dt_to = timezone.make_aware(
                    datetime.strptime(date_to, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
                )
                qs = qs.filter(created_at__lte=dt_to)
            except ValueError:
                pass

        totals = qs.aggregate(total_revenue=Sum('total'), total_orders=Count('id'))

        # Group by local date in Python to avoid MySQL CONVERT_TZ dependency
        from collections import defaultdict
        daily_map = defaultdict(lambda: {'revenue': 0.0, 'orders': 0})
        for order in qs.values('created_at', 'total'):
            date_key = timezone.localtime(order['created_at']).date().isoformat()
            daily_map[date_key]['revenue'] += float(order['total'] or 0)
            daily_map[date_key]['orders'] += 1
        daily = [
            {'date': d, 'revenue': v['revenue'], 'orders': v['orders']}
            for d, v in sorted(daily_map.items())
        ]

        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'total_revenue': float(totals['total_revenue'] or 0),
            'total_orders': totals['total_orders'] or 0,
            'daily': daily,
        })


class PromotionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = PromotionSerializer
    queryset = Promotion.objects.all()
    pagination_class = None


class PromotionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = PromotionSerializer
    queryset = Promotion.objects.all()


# --- Super admin views ---

class SuperAdminAnalyticsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        from apps.users.models import User
        from apps.orders.models import OrderItem

        now = timezone.now()
        month_ago = now - timedelta(days=30)

        all_users = User.objects.all()
        user_stats = {
            'total': all_users.count(),
            'by_role': {role: all_users.filter(role=role).count() for role, _ in User.ROLE_CHOICES},
            'new_last_30_days': all_users.filter(created_at__gte=month_ago).count(),
        }

        paid = Order.objects.filter(payment_status='paid')
        order_stats = {
            'total': Order.objects.count(),
            'revenue_all_time': float(paid.aggregate(t=Sum('total'))['t'] or 0),
            'revenue_last_30_days': float(
                paid.filter(created_at__gte=month_ago).aggregate(t=Sum('total'))['t'] or 0
            ),
        }

        top_products = list(
            OrderItem.objects.values('product_name_snapshot')
            .annotate(total_sold=Sum('quantity'), revenue=Sum('line_total'))
            .order_by('-total_sold')[:10]
        )
        for row in top_products:
            row['revenue'] = float(row['revenue'] or 0)

        return Response({
            'users': user_stats,
            'orders': order_stats,
            'top_products': top_products,
        })


_DEFAULT_SETTINGS = {
    'store_name': 'Supermart',
    'delivery_enabled': 'true',
    'min_order_amount': '0',
    'store_phone': '',
    'store_email': '',
}


class SuperAdminSettingsView(APIView):
    permission_classes = [IsSuperAdmin]

    def _current(self):
        result = dict(_DEFAULT_SETTINGS)
        for s in StoreSettings.objects.all():
            result[s.key] = s.value
        return result

    def get(self, request):
        return Response(self._current())

    def put(self, request):
        for key, value in request.data.items():
            StoreSettings.objects.update_or_create(
                key=key,
                defaults={'value': str(value)},
            )
        return Response(self._current())
