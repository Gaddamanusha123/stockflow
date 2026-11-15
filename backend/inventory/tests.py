from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import Organization, User, Product


class StockFlowBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Organization 1 and User 1
        self.org1 = Organization.objects.create(name="Acme Corp", default_low_stock_threshold=10)
        self.user1 = User.objects.create_user(
            email="owner@acme.com",
            password="password123",
            organization=self.org1
        )

        # Create Organization 2 and User 2
        self.org2 = Organization.objects.create(name="Beta Industries", default_low_stock_threshold=5)
        self.user2 = User.objects.create_user(
            email="owner@beta.com",
            password="password123",
            organization=self.org2
        )

    def test_signup_creates_org_and_user_and_returns_jwt(self):
        url = reverse('auth-signup')
        payload = {
            'email': 'newuser@gamma.com',
            'password': 'securepass123',
            'confirm_password': 'securepass123',
            'organization_name': 'Gamma Supply Co'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['organization']['name'], 'Gamma Supply Co')

        # Check database records
        user = User.objects.get(email='newuser@gamma.com')
        self.assertIsNotNone(user.organization)
        self.assertEqual(user.organization.name, 'Gamma Supply Co')

    def test_signup_prevents_duplicate_email(self):
        url = reverse('auth-signup')
        payload = {
            'email': 'owner@acme.com', # already exists
            'password': 'securepass123',
            'confirm_password': 'securepass123',
            'organization_name': 'Duplicate Org'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)

    def test_login_success_and_failure(self):
        login_url = reverse('auth-login')

        # Correct credentials
        res_ok = self.client.post(login_url, {'email': 'owner@acme.com', 'password': 'password123'}, format='json')
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', res_ok.data)
        self.assertEqual(res_ok.data['user']['organization']['name'], 'Acme Corp')

        # Invalid password
        res_bad = self.client.post(login_url, {'email': 'owner@acme.com', 'password': 'wrongpassword'}, format='json')
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_product_crud_and_tenant_isolation(self):
        # Authenticate as User 1 (Acme Corp)
        self.client.force_authenticate(user=self.user1)

        # 1. Create Product in Org 1
        create_res = self.client.post(
            reverse('product-list'),
            {
                'name': 'Wireless Mouse',
                'sku': 'TECH-WM-01',
                'description': 'Ergonomic mouse',
                'quantity_on_hand': 20,
                'cost_price': '15.50',
                'selling_price': '29.99',
                'low_stock_threshold': 8
            },
            format='json'
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        product1_id = create_res.data['id']

        # 2. Prevent duplicate SKU in same organization
        dup_sku_res = self.client.post(
            reverse('product-list'),
            {
                'name': 'Gaming Mouse',
                'sku': 'TECH-WM-01', # Same SKU
                'quantity_on_hand': 5,
                'cost_price': '20.00',
                'selling_price': '45.00'
            },
            format='json'
        )
        self.assertEqual(dup_sku_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Authenticate as User 2 (Beta Industries)
        self.client.force_authenticate(user=self.user2)

        # User 2 CAN use the same SKU 'TECH-WM-01' because they are in a different organization!
        user2_create = self.client.post(
            reverse('product-list'),
            {
                'name': 'Beta Wireless Mouse',
                'sku': 'TECH-WM-01',
                'quantity_on_hand': 12,
                'cost_price': '12.00',
                'selling_price': '25.00'
            },
            format='json'
        )
        self.assertEqual(user2_create.status_code, status.HTTP_201_CREATED)

        # User 2 CANNOT view User 1's product
        user2_view_res = self.client.get(reverse('product-detail', kwargs={'pk': product1_id}))
        self.assertEqual(user2_view_res.status_code, status.HTTP_404_NOT_FOUND)

        # User 2 CANNOT edit User 1's product
        user2_edit_res = self.client.patch(
            reverse('product-detail', kwargs={'pk': product1_id}),
            {'name': 'Hacked Name'},
            format='json'
        )
        self.assertEqual(user2_edit_res.status_code, status.HTTP_404_NOT_FOUND)

        # User 2 CANNOT delete User 1's product
        user2_del_res = self.client.delete(reverse('product-detail', kwargs={'pk': product1_id}))
        self.assertEqual(user2_del_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_stock_adjustment_and_negative_stock_prevention(self):
        self.client.force_authenticate(user=self.user1)

        product = Product.objects.create(
            organization=self.org1,
            name='Mechanical Keyboard',
            sku='TECH-KB-01',
            quantity_on_hand=15,
            cost_price=Decimal('40.00'),
            selling_price=Decimal('89.99')
        )

        adjust_url = reverse('product-adjust-stock', kwargs={'pk': product.id})

        # Add 10 -> 25
        res_plus = self.client.post(adjust_url, {'adjustment': 10}, format='json')
        self.assertEqual(res_plus.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.quantity_on_hand, 25)

        # Subtract 5 -> 20
        res_minus = self.client.post(adjust_url, {'adjustment': -5}, format='json')
        self.assertEqual(res_minus.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.quantity_on_hand, 20)

        # Try to subtract 30 (would make it -10) -> Should fail
        res_negative = self.client.post(adjust_url, {'adjustment': -30}, format='json')
        self.assertEqual(res_negative.status_code, status.HTTP_400_BAD_REQUEST)
        product.refresh_from_db()
        self.assertEqual(product.quantity_on_hand, 20) # unchanged

    def test_dashboard_calculations_and_settings(self):
        self.client.force_authenticate(user=self.user1)
        # Default org threshold is 10

        # Product 1: In stock (25 > 10)
        Product.objects.create(
            organization=self.org1,
            name='Monitor',
            sku='MON-01',
            quantity_on_hand=25,
            cost_price=Decimal('100.00'),
            selling_price=Decimal('180.00')
        )
        # Product 2: Low stock (5 <= 10)
        Product.objects.create(
            organization=self.org1,
            name='HDMI Cable',
            sku='CAB-01',
            quantity_on_hand=5,
            cost_price=Decimal('3.00'),
            selling_price=Decimal('9.99')
        )
        # Product 3: Out of stock (0)
        Product.objects.create(
            organization=self.org1,
            name='Webcam',
            sku='CAM-01',
            quantity_on_hand=0,
            cost_price=Decimal('25.00'),
            selling_price=Decimal('49.99')
        )

        # Request dashboard
        dash_res = self.client.get(reverse('dashboard-summary'))
        self.assertEqual(dash_res.status_code, status.HTTP_200_OK)
        summary = dash_res.data['summary']
        self.assertEqual(summary['total_products'], 3)
        self.assertEqual(summary['total_stock_quantity'], 30) # 25 + 5 + 0
        self.assertEqual(summary['low_stock_products_count'], 1) # HDMI Cable
        self.assertEqual(summary['out_of_stock_products_count'], 1) # Webcam

        # Update Settings: change default_low_stock_threshold to 30
        settings_url = reverse('organization-settings')
        patch_res = self.client.patch(settings_url, {'default_low_stock_threshold': 30}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.org1.refresh_from_db()
        self.assertEqual(self.org1.default_low_stock_threshold, 30)

        # Now Monitor (25 <= 30) also becomes Low Stock!
        dash_res_updated = self.client.get(reverse('dashboard-summary'))
        self.assertEqual(dash_res_updated.data['summary']['low_stock_products_count'], 2)

