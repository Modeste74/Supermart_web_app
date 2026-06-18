from django.core.management.base import BaseCommand
from apps.catalog.models import Category


class Command(BaseCommand):
    help = 'Seed default product categories'

    def handle(self, *args, **kwargs):
        categories = [
            {"name": "Fresh Produce",          "slug": "fresh-produce"},
            {"name": "Dairy & Eggs",           "slug": "dairy-eggs"},
            {"name": "Meat & Seafood",         "slug": "meat-seafood"},
            {"name": "Bakery & Bread",         "slug": "bakery-bread"},
            {"name": "Beverages",              "slug": "beverages"},
            {"name": "Snacks & Confectionery", "slug": "snacks-confectionery"},
            {"name": "Frozen Foods",           "slug": "frozen-foods"},
            {"name": "Household & Cleaning",   "slug": "household-cleaning"},
            {"name": "Personal Care",          "slug": "personal-care"},
            {"name": "Baby & Kids",            "slug": "baby-kids"},
        ]
        for c in categories:
            obj, created = Category.objects.get_or_create(
                slug=c['slug'],
                defaults={"name": c['name'], "is_active": True},
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"{status}: {obj.name}")
