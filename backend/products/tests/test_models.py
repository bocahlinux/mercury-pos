import pytest
from django.contrib.auth import get_user_model
from products.models import Category, Product, ProductVariant, StockMovement

User = get_user_model()

@pytest.mark.django_db
def test_create_category():
    cat = Category.objects.create(name='Electronics')
    assert cat.slug == 'electronics'
    assert cat.is_active

@pytest.mark.django_db
def test_create_product_and_variant():
    cat = Category.objects.create(name='Books')
    prod = Product.objects.create(
        name='Django for Beginners',
        sku='DJB001',
        buy_price=10.00,
        sell_price=15.00,
        category=cat
    )
    variant = ProductVariant.objects.create(
        product=prod,
        name='Hardcover',
        sku='DJB001-HC'
    )
    assert variant.product == prod
    assert prod.stock == 0

@pytest.mark.django_db
def test_stock_movement():
    cat = Category.objects.create(name='Stationery')
    prod = Product.objects.create(
        name='Notebook',
        sku='NOTE001',
        buy_price=1.00,
        sell_price=2.00,
        category=cat
    )
    user = User.objects.create_user(username='test')
    move = StockMovement.objects.create(
        product=prod,
        type='in',
        quantity=100,
        created_by=user
    )
    assert move.quantity == 100
    assert move.product == prod
