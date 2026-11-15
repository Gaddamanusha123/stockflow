from decimal import Decimal
from django.core.management.base import BaseCommand
from inventory.models import Organization, User, Product

class Command(BaseCommand):
    help = 'Seeds database with realistic demo organizations and products for technical assessment review.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding StockFlow demo dataset...'))

        # -------------------------------------------------------------
        # Organization 1: Apex Electronics Hub
        # -------------------------------------------------------------
        org1, _ = Organization.objects.get_or_create(
            name='Apex Electronics Hub',
            defaults={'default_low_stock_threshold': 10}
        )
        user1, created1 = User.objects.get_or_create(
            email='admin@apex.com',
            defaults={
                'organization': org1,
                'is_staff': True
            }
        )
        if created1 or not user1.has_usable_password():
            user1.set_password('ApexPass123!')
            user1.save()

        # Products for Org 1
        org1_products = [
            {
                'name': 'Logitech MX Master 3S Wireless Mouse',
                'sku': 'LOGI-MXM-3S',
                'description': 'Ergonomic silent-click performance mouse with MagSpeed scroll',
                'quantity_on_hand': 28,
                'cost_price': Decimal('65.00'),
                'selling_price': Decimal('99.99'),
                'low_stock_threshold': 8,
            },
            {
                'name': 'Keychron Q1 Pro Mechanical Keyboard',
                'sku': 'KEY-Q1-PRO',
                'description': '75% layout custom wireless QMK/VIA mechanical keyboard with knob',
                'quantity_on_hand': 14,
                'cost_price': Decimal('130.00'),
                'selling_price': Decimal('199.00'),
                'low_stock_threshold': 5,
            },
            {
                'name': 'Dell UltraSharp 27" 4K USB-C Hub Monitor',
                'sku': 'DELL-U27-4K',
                'description': 'IPS Black technology display with 90W power delivery hub',
                'quantity_on_hand': 4, # Low stock (org threshold 10)
                'cost_price': Decimal('380.00'),
                'selling_price': Decimal('549.99'),
                'low_stock_threshold': None, # uses org default 10
            },
            {
                'name': 'Anker Prime 100W GaN Wall Charger',
                'sku': 'ANK-100W-GAN',
                'description': '3-port fast compact charger with PowerIQ 4.0 architecture',
                'quantity_on_hand': 6, # Low stock (threshold 10)
                'cost_price': Decimal('42.00'),
                'selling_price': Decimal('79.99'),
                'low_stock_threshold': 10,
            },
            {
                'name': 'Sony WH-1000XM5 Wireless Headphones',
                'sku': 'SONY-WHXM5-BLK',
                'description': 'Industry-leading noise cancelling Bluetooth headphones',
                'quantity_on_hand': 0, # Out of stock!
                'cost_price': Decimal('260.00'),
                'selling_price': Decimal('399.99'),
                'low_stock_threshold': 6,
            },
        ]

        for p_data in org1_products:
            Product.objects.update_or_create(
                organization=org1,
                sku=p_data['sku'],
                defaults={
                    **p_data,
                    'last_updated_by': user1
                }
            )

        # -------------------------------------------------------------
        # Organization 2: Metro Organic Provisions (Tenant Isolation Demo)
        # -------------------------------------------------------------
        org2, _ = Organization.objects.get_or_create(
            name='Metro Organic Provisions',
            defaults={'default_low_stock_threshold': 15}
        )
        user2, created2 = User.objects.get_or_create(
            email='owner@metro.com',
            defaults={
                'organization': org2,
                'is_staff': False
            }
        )
        if created2 or not user2.has_usable_password():
            user2.set_password('MetroPass123!')
            user2.save()

        # Products for Org 2
        org2_products = [
            {
                'name': 'Cold-Pressed Extra Virgin Olive Oil (1L)',
                'sku': 'OIL-EVOO-1L',
                'description': 'Single-origin Greek estate harvested unrefined olive oil',
                'quantity_on_hand': 45,
                'cost_price': Decimal('11.50'),
                'selling_price': Decimal('22.99'),
                'low_stock_threshold': 12,
            },
            {
                'name': 'Organic Himalayan Pink Rock Salt (500g)',
                'sku': 'SALT-HIM-500G',
                'description': 'Pure unrefined mineral-rich coarse food-grade cooking salt',
                'quantity_on_hand': 8, # Low stock (org threshold 15)
                'cost_price': Decimal('2.40'),
                'selling_price': Decimal('6.50'),
                'low_stock_threshold': None,
            },
            {
                'name': 'Organic Raw Fairtrade Honey (1kg)',
                'sku': 'HNY-RAW-1KG',
                'description': 'Wildflower unfiltered pure artisan honey jar',
                'quantity_on_hand': 0, # Out of stock!
                'cost_price': Decimal('8.00'),
                'selling_price': Decimal('16.99'),
                'low_stock_threshold': 10,
            }
        ]

        for p_data in org2_products:
            Product.objects.update_or_create(
                organization=org2,
                sku=p_data['sku'],
                defaults={
                    **p_data,
                    'last_updated_by': user2
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo organizations and products!'))
        self.stdout.write(self.style.SUCCESS('--------------------------------------------------'))
        self.stdout.write(self.style.SUCCESS('Tenant 1: admin@apex.com / ApexPass123!'))
        self.stdout.write(self.style.SUCCESS('Tenant 2: owner@metro.com / MetroPass123!'))
        self.stdout.write(self.style.SUCCESS('--------------------------------------------------'))
