"""
End-to-End Verification Script for StockFlow SaaS Inventory System.
Executes all 20 scenarios required in technical assessment.
"""
import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import django
# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stockflow.settings')
django.setup()

from decimal import Decimal
from rest_framework.test import APIClient
from inventory.models import Organization, User, Product

def run_all_20_scenarios():
    print("=" * 65)
    print(" STOCKFLOW - END-TO-END VERIFICATION: ALL 20 SCENARIOS")
    print("=" * 65)

    client = APIClient()

    # Scenario 1: Register a new user
    print("\n[Scenario 1 & 2] Register a new user and verify automatic organization creation...")
    signup_payload = {
        'organization_name': 'Alpha Distribution Inc',
        'email': 'admin@alphadist.com',
        'password': 'SecurePassword123!',
        'confirm_password': 'SecurePassword123!'
    }
    res = client.post('/api/auth/signup/', signup_payload, format='json')
    assert res.status_code == 201, f"Failed signup: {res.data}"
    user_data = res.data['user']
    tokens_org1 = res.data['tokens']
    print(f" -> User registered: {user_data['email']}")
    print(f" -> Organization created automatically: {user_data['organization']['name']} (ID: {user_data['organization']['id']})")
    org1_id = user_data['organization']['id']
    token_org1 = tokens_org1['access']

    # Scenario 3: Login successfully
    print("\n[Scenario 3] Login successfully using registered database credentials...")
    login_res = client.post('/api/auth/login/', {
        'email': 'admin@alphadist.com',
        'password': 'SecurePassword123!'
    }, format='json')
    assert login_res.status_code == 200, f"Failed login: {login_res.data}"
    assert 'tokens' in login_res.data
    print(f" -> Login successful, JWT received: {login_res.data['tokens']['access'][:20]}...")

    # Attach token for subsequent requests
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_org1}")

    # Scenario 4: Access the dashboard
    print("\n[Scenario 4] Access the dashboard via GET /api/dashboard/...")
    dash_res = client.get('/api/dashboard/')
    assert dash_res.status_code == 200, f"Failed dashboard: {dash_res.data}"
    summary = dash_res.data['summary']
    assert summary['total_products'] == 0
    assert summary['total_stock_quantity'] == 0
    print(f" -> Dashboard accessed: total_products={summary['total_products']}, total_stock={summary['total_stock_quantity']}")

    # Scenario 5: Create a product
    print("\n[Scenario 5] Create a product via POST /api/products/...")
    prod1_payload = {
        'name': 'Logitech MX Master 3S Mouse',
        'sku': 'LOGI-MXM-3S',
        'description': 'Ergonomic performance wireless mouse',
        'quantity_on_hand': 25,
        'cost_price': '65.00',
        'selling_price': '99.99',
        'low_stock_threshold': 10
    }
    p1_res = client.post('/api/products/', prod1_payload, format='json')
    assert p1_res.status_code == 201, f"Failed create product: {p1_res.data}"
    product1 = p1_res.data
    prod1_id = product1['id']
    print(f" -> Product created: ID={prod1_id}, Name='{product1['name']}', SKU='{product1['sku']}'")

    # Scenario 6: View the product
    print("\n[Scenario 6] View the created product via GET /api/products/{id}/...")
    get_res = client.get(f'/api/products/{prod1_id}/')
    assert get_res.status_code == 200
    assert get_res.data['sku'] == 'LOGI-MXM-3S'
    print(f" -> Product details retrieved: '{get_res.data['name']}', Stock: {get_res.data['quantity_on_hand']}")

    # Scenario 7: Search products
    print("\n[Scenario 7] Search products by product name and SKU...")
    # Add a second product
    client.post('/api/products/', {
        'name': 'Keychron Q1 Mechanical Keyboard',
        'sku': 'KEY-Q1-PRO',
        'description': 'Custom mechanical keyboard',
        'quantity_on_hand': 12,
        'cost_price': '120.00',
        'selling_price': '199.99'
    }, format='json')

    search_name = client.get('/api/products/?search=Keyboard')
    assert len(search_name.data) == 1
    assert search_name.data[0]['sku'] == 'KEY-Q1-PRO'

    search_sku = client.get('/api/products/?search=LOGI')
    assert len(search_sku.data) == 1
    assert search_sku.data[0]['name'] == 'Logitech MX Master 3S Mouse'
    print(" -> Search by name ('Keyboard') and SKU ('LOGI') verified successfully.")

    # Scenario 8: Edit product details
    print("\n[Scenario 8] Edit product details via PUT / PATCH...")
    patch_res = client.patch(f'/api/products/{prod1_id}/', {
        'selling_price': '109.99',
        'description': 'Updated description with USB-C bolt receiver'
    }, format='json')
    assert patch_res.status_code == 200
    assert patch_res.data['selling_price'] == '109.99'
    print(f" -> Product updated: Selling price changed to ${patch_res.data['selling_price']}")

    # Scenario 9: Update stock quantity
    print("\n[Scenario 9] Update stock quantity via adjust-stock endpoint...")
    adjust_res = client.post(f'/api/products/{prod1_id}/adjust-stock/', {
        'adjustment': -20  # 25 - 20 = 5 (which is <= threshold 10 -> Low stock!)
    }, format='json')
    assert adjust_res.status_code == 200
    assert adjust_res.data['current_quantity'] == 5
    assert adjust_res.data['product']['stock_status'] == 'LOW_STOCK'
    print(f" -> Stock adjusted by -20: New quantity={adjust_res.data['current_quantity']}, Status={adjust_res.data['product']['stock_status']}")

    # Scenario 10: Delete a product
    print("\n[Scenario 10] Delete a product via DELETE /api/products/{id}/...")
    del_target = client.post('/api/products/', {
        'name': 'Temporary Discarded Item',
        'sku': 'TEMP-001',
        'quantity_on_hand': 3,
        'cost_price': '1.00',
        'selling_price': '2.00'
    }, format='json')
    del_id = del_target.data['id']
    del_res = client.delete(f'/api/products/{del_id}/')
    assert del_res.status_code == 204
    assert not Product.objects.filter(id=del_id).exists()
    print(" -> Product successfully deleted and confirmed absent in database.")

    # Scenario 11, 12, 13: Verify total product, stock, and low-stock calculations
    print("\n[Scenario 11, 12, 13] Verify dynamic dashboard calculations...")
    # Add an out of stock product:
    client.post('/api/products/', {
        'name': 'Dell UltraSharp 27 Monitor',
        'sku': 'DELL-U27-4K',
        'quantity_on_hand': 0,
        'cost_price': '300.00',
        'selling_price': '499.00'
    }, format='json')

    dash2 = client.get('/api/dashboard/').data['summary']
    # Total products: Logitech (5 qty), Keychron (12 qty), Dell (0 qty) = 3 products
    assert dash2['total_products'] == 3, f"Expected 3, got {dash2['total_products']}"
    # Total stock: 5 + 12 + 0 = 17 units
    assert dash2['total_stock_quantity'] == 17, f"Expected 17, got {dash2['total_stock_quantity']}"
    # Low stock: Logitech has 5 units <= custom threshold 10 = 1
    assert dash2['low_stock_products_count'] == 1, f"Expected 1, got {dash2['low_stock_products_count']}"
    # Out of stock: Dell has 0 units = 1
    assert dash2['out_of_stock_products_count'] == 1, f"Expected 1, got {dash2['out_of_stock_products_count']}"
    print(f" -> Dashboard Totals Verified:")
    print(f"    - Total Products: {dash2['total_products']}")
    print(f"    - Total Stock Units: {dash2['total_stock_quantity']}")
    print(f"    - Low Stock Count: {dash2['low_stock_products_count']}")
    print(f"    - Out of Stock Count: {dash2['out_of_stock_products_count']}")

    # Scenario 14 & 15: Update default threshold & verify threshold changes
    print("\n[Scenario 14 & 15] Update default threshold and verify dynamic recalculation...")
    # Currently Keychron has 12 qty, no custom threshold (org default was 10, so 12 > 10 = In Stock)
    # Increase org default threshold to 15:
    patch_settings = client.patch('/api/settings/', {'default_low_stock_threshold': 15}, format='json')
    assert patch_settings.status_code == 200
    assert patch_settings.data['settings']['default_low_stock_threshold'] == 15

    # Check dashboard now: Keychron (12 units <= 15) must now trigger as Low Stock!
    dash3 = client.get('/api/dashboard/').data['summary']
    assert dash3['low_stock_products_count'] == 2, f"Expected 2 low stock items, got {dash3['low_stock_products_count']}"
    print(f" -> Setting updated to 15. Low stock count dynamically updated from 1 to {dash3['low_stock_products_count']}.")

    # Scenario 16: Register a second organization
    print("\n[Scenario 16] Register a second organization...")
    org2_signup = client.post('/api/auth/signup/', {
        'organization_name': 'Omega Retailers Global',
        'email': 'admin@omega.com',
        'password': 'OmegaPassword999!',
        'confirm_password': 'OmegaPassword999!'
    }, format='json')
    assert org2_signup.status_code == 201
    token_org2 = org2_signup.data['tokens']['access']
    org2_id = org2_signup.data['user']['organization']['id']
    print(f" -> Second organization registered: Omega Retailers Global (ID: {org2_id})")

    # Scenario 17: Verify complete data isolation
    print("\n[Scenario 17] Verify complete tenant data isolation...")
    # Switch client credentials to Org 2
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_org2}")

    # Org 2 dashboard should have 0 products
    dash_org2 = client.get('/api/dashboard/').data['summary']
    assert dash_org2['total_products'] == 0, f"Expected 0 for Org 2, got {dash_org2['total_products']}"
    assert dash_org2['total_stock_quantity'] == 0

    # Org 2 products list should be empty
    prods_org2 = client.get('/api/products/').data
    assert len(prods_org2) == 0
    print(" -> Org 2 sees 0 products and empty dashboard (complete isolation confirmed).")

    # Scenario 18: Try accessing another organization's product ID
    print("\n[Scenario 18] Try accessing Org 1's product ID from Org 2...")
    cross_access_res = client.get(f'/api/products/{prod1_id}/')
    assert cross_access_res.status_code == 404, f"Expected 404, got {cross_access_res.status_code}"
    cross_patch_res = client.patch(f'/api/products/{prod1_id}/', {'name': 'Hijacked Name'}, format='json')
    assert cross_patch_res.status_code == 404
    cross_del_res = client.delete(f'/api/products/{prod1_id}/')
    assert cross_del_res.status_code == 404
    print(" -> Cross-organization access attempts strictly blocked with 404 Not Found.")

    # Scenario 19: Verify unauthorized requests are rejected
    print("\n[Scenario 19] Verify unauthorized requests without token are rejected...")
    client.credentials()  # Remove authentication
    unauth_dash = client.get('/api/dashboard/')
    assert unauth_dash.status_code == 401
    unauth_prods = client.get('/api/products/')
    assert unauth_prods.status_code == 401
    print(" -> Unauthorized requests without JWT properly rejected with 401 Unauthorized.")

    # Scenario 20: Verify that all data persists after logout and login
    print("\n[Scenario 20] Verify that all data persists after logout and login...")
    relogin_res = client.post('/api/auth/login/', {
        'email': 'admin@alphadist.com',
        'password': 'SecurePassword123!'
    }, format='json')
    assert relogin_res.status_code == 200
    new_token = relogin_res.data['tokens']['access']

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_token}")
    persisted_dash = client.get('/api/dashboard/').data['summary']
    assert persisted_dash['total_products'] == 3
    assert persisted_dash['total_stock_quantity'] == 17
    print(f" -> Data persisted intact after re-login: total_products={persisted_dash['total_products']}, total_stock={persisted_dash['total_stock_quantity']}")

    print("\n" + "=" * 65)
    print(" ALL 20 SCENARIOS VERIFIED SUCCESSFULLY AND FULLY FUNCTIONAL!")
    print("=" * 65)

if __name__ == '__main__':
    run_all_20_scenarios()
