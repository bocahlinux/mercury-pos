import os
import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from products.models import Category, Product
from customers.models import Customer
from transactions.models import Transaction, TransactionItem
from invoices.models import Invoice
from core.models import StoreSettings
from transactions.utils import generate_invoice_number


class Command(BaseCommand):
    help = 'Seed database with sample data for development'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=3, help='Number of users to create')
        parser.add_argument('--products', type=int, default=20, help='Number of products to create')
        parser.add_argument('--customers', type=int, default=10, help='Number of customers to create')
        parser.add_argument('--transactions', type=int, default=15, help='Number of transactions to create')

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding database...'))

        self.create_store_settings()
        self.create_users(options['users'])
        categories = self.create_categories()
        products = self.create_products(options['products'], categories)
        customers = self.create_customers(options['customers'])
        self.create_transactions(options['transactions'], products, customers)

        self.stdout.write(self.style.SUCCESS('✅ Seed data complete!'))

    def create_store_settings(self):
        settings, created = StoreSettings.objects.get_or_create(
            pk=1,
            defaults={
                'name': 'Mercury POS Store',
                'address': 'Jl. Contoh No. 123, Jakarta',
                'phone': '021-12345678',
                'email': 'store@mercurypos.id',
                'tax_percent': Decimal('11.00'),
                'currency': 'IDR',
                'receipt_header': 'Terima kasih telah berbelanja!',
                'receipt_footer': 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
            }
        )
        status = 'Created' if created else 'Already exists'
        self.stdout.write(f'  Store Settings: {status}')

    def create_users(self, count):
        roles = ['owner', 'admin', 'kasir']
        for i in range(count):
            email = f'{roles[i % 3]}@mercury.pos'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'role': roles[i % 3],
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  User {email}: {status}')

    def create_categories(self):
        categories_data = [
            {'name': 'Makanan', 'slug': 'makanan', 'description': 'Produk makanan'},
            {'name': 'Minuman', 'slug': 'minuman', 'description': 'Produk minuman'},
            {'name': 'Snack', 'slug': 'snack', 'description': 'Camilan dan snack'},
            {'name': 'Elektronik', 'slug': 'elektronik', 'description': 'Peralatan elektronik'},
            {'name': 'Peralatan Rumah', 'slug': 'peralatan-rumah', 'description': 'Peralatan rumah tangga'},
            {'name': 'Kesehatan', 'slug': 'kesehatan', 'description': 'Produk kesehatan'},
        ]
        categories = []
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            categories.append(cat)
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  Category {cat.name}: {status}')
        return categories

    def create_products(self, count, categories):
        products_data = [
            {'name': 'Indomie Goreng', 'buy_price': 2500, 'sell_price': 3500, 'stock': 100},
            {'name': 'Indomie Kuah', 'buy_price': 2500, 'sell_price': 3500, 'stock': 80},
            {'name': 'Aqua 600ml', 'buy_price': 2000, 'sell_price': 3000, 'stock': 200},
            {'name': 'Teh Botol Sosro', 'buy_price': 3000, 'sell_price': 4500, 'stock': 50},
            {'name': 'Kopi Kapal Api', 'buy_price': 1500, 'sell_price': 2500, 'stock': 150},
            {'name': 'Chitato 68g', 'buy_price': 7000, 'sell_price': 10000, 'stock': 60},
            {'name': 'Taro Net 60g', 'buy_price': 5000, 'sell_price': 7500, 'stock': 45},
            {'name': 'Oreo 12x36g', 'buy_price': 10000, 'sell_price': 15000, 'stock': 30},
            {'name': 'Lampu LED 12W', 'buy_price': 15000, 'sell_price': 25000, 'stock': 40},
            {'name': 'Kabel USB Type-C', 'buy_price': 12000, 'sell_price': 25000, 'stock': 55},
            {'name': 'Mouse Wireless', 'buy_price': 45000, 'sell_price': 75000, 'stock': 25},
            {'name': 'Keyboard USB', 'buy_price': 35000, 'sell_price': 60000, 'stock': 20},
            {'name': 'Sabun Detol', 'buy_price': 8000, 'sell_price': 12000, 'stock': 70},
            {'name': 'Paracetamol 4x6', 'buy_price': 2000, 'sell_price': 5000, 'stock': 100},
            {'name': 'Vitamin C 10x5', 'buy_price': 5000, 'sell_price': 12000, 'stock': 85},
            {'name': 'Minyak Goreng 1L', 'buy_price': 14000, 'sell_price': 18000, 'stock': 40},
            {'name': 'Beras Premium 5kg', 'buy_price': 55000, 'sell_price': 70000, 'stock': 30},
            {'name': 'Gula Pasir 1kg', 'buy_price': 12000, 'sell_price': 15000, 'stock': 50},
            {'name': 'Tepung Terigu 1kg', 'buy_price': 10000, 'sell_price': 14000, 'stock': 35},
            {'name': 'Telur Ayam 1kg', 'buy_price': 23000, 'sell_price': 28000, 'stock': 25},
        ]

        products = []
        for i, pdata in enumerate(products_data[:count]):
            cat = categories[i % len(categories)]
            product, created = Product.objects.get_or_create(
                slug=f"product-{i+1}",
                defaults={
                    'name': pdata['name'],
                    'sku': f'SKU-{i+1:04d}',
                    'barcode': f'89900{i+1:06d}',
                    'description': f'Produk {pdata["name"]} berkualitas',
                    'category': cat,
                    'buy_price': Decimal(str(pdata['buy_price'])),
                    'sell_price': Decimal(str(pdata['sell_price'])),
                    'stock': pdata['stock'],
                    'min_stock_alert': 10,
                    'unit': 'pcs',
                    'is_active': True,
                }
            )
            products.append(product)
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  Product {product.name}: {status}')
        return products

    def create_customers(self, count):
        customers_data = [
            {'name': 'Budi Santoso', 'phone': '081234567001', 'email': 'budi@email.com'},
            {'name': 'Siti Aminah', 'phone': '081234567002', 'email': 'siti@email.com'},
            {'name': 'Ahmad Wijaya', 'phone': '081234567003', 'email': 'ahmad@email.com'},
            {'name': 'Dewi Lestari', 'phone': '081234567004', 'email': 'dewi@email.com'},
            {'name': 'Rudi Hermawan', 'phone': '081234567005', 'email': 'rudi@email.com'},
            {'name': 'Nur Halimah', 'phone': '081234567006', 'email': 'nur@email.com'},
            {'name': 'Joko Susilo', 'phone': '081234567007', 'email': 'joko@email.com'},
            {'name': 'Rina Widodo', 'phone': '081234567008', 'email': 'rina@email.com'},
            {'name': 'Hendra Gunawan', 'phone': '081234567009', 'email': 'hendra@email.com'},
            {'name': 'Maya Putri', 'phone': '081234567010', 'email': 'maya@email.com'},
        ]
        customers = []
        for i, cdata in enumerate(customers_data[:count]):
            customer, created = Customer.objects.get_or_create(
                phone=cdata['phone'],
                defaults={
                    'name': cdata['name'],
                    'email': cdata['email'],
                    'address': f'Jl. Contoh No. {i+1}, Jakarta',
                    'loyalty_points': random.randint(0, 500),
                    'is_active': True,
                }
            )
            customers.append(customer)
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  Customer {customer.name}: {status}')
        return customers

    def create_transactions(self, count, products, customers):
        if not products or not customers:
            self.stdout.write(self.style.WARNING('  Skipping transactions: no products or customers'))
            return

        cashier = User.objects.filter(role='kasir').first()
        if not cashier:
            cashier = User.objects.first()

        payment_methods = ['cash', 'transfer', 'ewallet']
        statuses = ['completed', 'completed', 'completed', 'hold', 'cancelled']

        for i in range(count):
            customer = random.choice(customers)
            num_items = random.randint(1, 4)
            tx_products = random.sample(products, min(num_items, len(products)))

            tx = Transaction.objects.create(
                invoice_number=generate_invoice_number(),
                customer=customer,
                cashier=cashier,
                subtotal=Decimal('0'),
                discount_value=Decimal(str(random.choice([0, 0, 0, 5000, 10000]))),
                tax_percent=Decimal('11.00'),
                tax_amount=Decimal('0'),
                total=Decimal('0'),
                payment_method=random.choice(payment_methods),
                status=random.choice(statuses),
                created_at=timezone.now() - timedelta(days=random.randint(0, 30)),
            )

            subtotal = Decimal('0')
            for p in tx_products:
                qty = random.randint(1, 5)
                disc = Decimal('0')
                item_sub = p.sell_price * qty - disc
                TransactionItem.objects.create(
                    transaction=tx,
                    product=p,
                    quantity=qty,
                    unit_price=p.sell_price,
                    discount=disc,
                    subtotal=item_sub,
                )
                subtotal += item_sub

            tx.subtotal = subtotal
            after_disc = subtotal - tx.discount_value
            tx.tax_amount = after_disc * tx.tax_percent / Decimal('100')
            tx.total = after_disc + tx.tax_amount
            tx.payment_amount = tx.total if tx.payment_method == 'cash' else tx.total
            tx.save()

            Invoice.objects.get_or_create(
                transaction=tx,
                defaults={
                    'invoice_number': f'INV-{tx.invoice_number}',
                    'status': 'paid' if tx.status == 'completed' else 'pending',
                }
            )

            self.stdout.write(f'  Transaction {tx.invoice_number}: Created (Rp {tx.total:,.0f})')
