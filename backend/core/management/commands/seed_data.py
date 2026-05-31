import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from accounts.models import User
from products.models import Category, Product
from customers.models import Customer
from transactions.models import Transaction, TransactionItem
from transactions.utils import generate_invoice_number


class Command(BaseCommand):
    help = 'Seed database with sample data for development'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=3, help='Number of users to create')
        parser.add_argument('--categories', type=int, default=5, help='Number of categories')
        parser.add_argument('--products', type=int, default=20, help='Number of products')
        parser.add_argument('--customers', type=int, default=10, help='Number of customers')
        parser.add_argument('--transactions', type=int, default=15, help='Number of transactions')

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🌱 Seeding database...'))

        # Create users
        users = []
        for i in range(options['users']):
            email = f'user{i+1}@mercury.pos'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'role': ['owner', 'admin', 'kasir'][i % 3],
                    'phone': f'08123456789{i}',
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'  ✅ User: {email} / password123')
            users.append(user)

        # Create categories
        cat_names = ['Makanan', 'Minuman', 'Snack', 'Elektronik', 'Alat Tulis', 'Kesehatan', 'Kecantikan', 'Lainnya']
        categories = []
        for i in range(min(options['categories'], len(cat_names))):
            cat, created = Category.objects.get_or_create(
                name=cat_names[i],
                defaults={'slug': slugify(cat_names[i]), 'is_active': True}
            )
            categories.append(cat)
            if created:
                self.stdout.write(f'  ✅ Category: {cat.name}')

        # Create products
        product_templates = [
            ('Indomie Goreng', 3000, 4000, 'Makanan'),
            ('Indomie Kuah', 3000, 4000, 'Makanan'),
            ('Aqua 600ml', 2500, 3500, 'Minuman'),
            ('Teh Botol', 3500, 5000, 'Minuman'),
            ('Kopi Susu', 5000, 8000, 'Minuman'),
            ('Chitato 75g', 8000, 12000, 'Snack'),
            ('Oreo 133g', 7000, 10000, 'Snack'),
            ('Tango 125g', 6000, 9000, 'Snack'),
            ('Pulpen Standard', 2000, 3500, 'Alat Tulis'),
            ('Pensil 2B', 1500, 2500, 'Alat Tulis'),
            ('Buku Tulis 40lbr', 3000, 5000, 'Alat Tulis'),
            ('Penghapus', 1000, 2000, 'Alat Tulis'),
            ('Masker 5pcs', 15000, 25000, 'Kesehatan'),
            ('Hand Sanitizer', 8000, 15000, 'Kesehatan'),
            ('Vitamin C 10tablet', 12000, 20000, 'Kesehatan'),
            ('Lip Balm', 15000, 25000, 'Kecantikan'),
            ('Hand Cream', 18000, 30000, 'Kecantikan'),
            ('USB Cable Type-C', 25000, 40000, 'Elektronik'),
            ('Earphone', 35000, 60000, 'Elektronik'),
            ('Power Bank 10000mAh', 80000, 150000, 'Elektronik'),
        ]
        products = []
        for i in range(min(options['products'], len(product_templates))):
            name, buy, sell, cat_name = product_templates[i]
            cat = next((c for c in categories if c.name == cat_name), categories[0] if categories else None)
            sku = f'SKU{i+1:04d}'
            prod, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'slug': slugify(name),
                    'buy_price': Decimal(str(buy)),
                    'sell_price': Decimal(str(sell)),
                    'stock': random.randint(10, 200),
                    'min_stock_alert': 5,
                    'unit': 'pcs',
                    'category': cat,
                    'is_active': True,
                }
            )
            products.append(prod)
            if created:
                self.stdout.write(f'  ✅ Product: {name} (Rp {sell})')

        # Create customers
        customer_names = [
            ('Budi Santoso', '081234567891', 'budi@email.com'),
            ('Siti Aminah', '081234567892', 'siti@email.com'),
            ('Ahmad Hidayat', '081234567893', 'ahmad@email.com'),
            ('Dewi Lestari', '081234567894', 'dewi@email.com'),
            ('Eko Prasetyo', '081234567895', 'eko@email.com'),
            ('Fitri Handayani', '081234567896', 'fitri@email.com'),
            ('Gunawan Wibowo', '081234567897', 'gunawan@email.com'),
            ('Hana Pertiwi', '081234567898', 'hana@email.com'),
            ('Irfan Maulana', '081234567899', 'irfan@email.com'),
            ('Joko Susilo', '081234567890', 'joko@email.com'),
        ]
        customers = []
        for i in range(min(options['customers'], len(customer_names))):
            name, phone, email = customer_names[i]
            cust, created = Customer.objects.get_or_create(
                name=name,
                defaults={
                    'phone': phone,
                    'email': email,
                    'loyalty_points': random.randint(0, 500),
                    'is_active': True,
                }
            )
            customers.append(cust)
            if created:
                self.stdout.write(f'  ✅ Customer: {name}')

        # Create transactions
        if products and users:
            for i in range(options['transactions']):
                cashier = random.choice(users)
                customer = random.choice(customers) if customers and random.random() > 0.3 else None
                num_items = random.randint(1, 4)
                tx_products = random.sample(products, min(num_items, len(products)))

                items_data = []
                subtotal = Decimal('0')
                for p in tx_products:
                    qty = random.randint(1, 5)
                    item_subtotal = p.sell_price * qty
                    items_data.append({
                        'product': p,
                        'quantity': qty,
                        'unit_price': p.sell_price,
                        'discount': Decimal('0'),
                        'subtotal': item_subtotal,
                    })
                    subtotal += item_subtotal

                tax = (subtotal * Decimal('0.11')).quantize(Decimal('0.01'))
                total = subtotal + tax

                tx = Transaction.objects.create(
                    invoice_number=generate_invoice_number(),
                    cashier=cashier,
                    customer=customer,
                    subtotal=subtotal,
                    tax_amount=tax,
                    total=total,
                    payment_method=random.choice(['cash', 'transfer', 'ewallet']),
                    payment_amount=total + Decimal(str(random.choice([0, 5000, 10000]))),
                    change_amount=Decimal(str(random.choice([0, 5000, 10000]))),
                    status=random.choice(['completed'] * 8 + ['hold'] * 2),
                )

                for item in items_data:
                    TransactionItem.objects.create(
                        transaction=tx,
                        product=item['product'],
                        quantity=item['quantity'],
                        unit_price=item['unit_price'],
                        discount=item['discount'],
                        subtotal=item['subtotal'],
                    )

                self.stdout.write(f'  ✅ Transaction: {tx.invoice_number} (Rp {total})')

        self.stdout.write(self.style.SUCCESS('🎉 Seeding complete!'))
        self.stdout.write(self.style.SUCCESS(f'   Users: {User.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'   Categories: {Category.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'   Products: {Product.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'   Customers: {Customer.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'   Transactions: {Transaction.objects.count()}'))
