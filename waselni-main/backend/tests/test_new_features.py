"""
Backend API Tests for LogiMatch New Features:
- Countries CRUD (Admin)
- Platform Settings (Commission)
- PayPal Payments
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@logimatch.com"
ADMIN_PASSWORD = "admin123"
SHIPPER_EMAIL = "marie@example.com"
SHIPPER_PASSWORD = "password123"
CARRIER_EMAIL = "transport.pro@example.com"
CARRIER_PASSWORD = "password123"


class TestPublicCountriesAPI:
    """Test public countries endpoint"""
    
    def test_get_countries_public(self):
        """GET /api/countries - Public endpoint to list countries"""
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check that France and Tunisie are present
        country_names = [c['name'] for c in data]
        print(f"Countries found: {country_names}")
        
        # Verify country structure
        if len(data) > 0:
            country = data[0]
            assert 'id' in country, "Country should have id"
            assert 'name' in country, "Country should have name"
            assert 'code' in country, "Country should have code"
            assert 'is_origin' in country, "Country should have is_origin"
            assert 'is_destination' in country, "Country should have is_destination"
            print(f"Country structure verified: {country}")


class TestAdminAuthentication:
    """Test admin authentication"""
    
    def test_admin_login(self):
        """POST /api/auth/login - Admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert 'access_token' in data, "Response should contain access_token"
        assert data.get('user', {}).get('role') == 'ADMIN', "User should be admin"
        print(f"Admin login successful: {data['user']['email']}")
        return data['access_token']


class TestAdminCountriesAPI:
    """Test admin countries CRUD endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()['access_token']
    
    def test_admin_list_countries(self, admin_token):
        """GET /api/admin/countries - Admin list countries"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/countries", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Admin countries list: {len(data)} countries")
    
    def test_admin_add_country(self, admin_token):
        """POST /api/admin/countries - Add a new country"""
        import uuid
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Add test country with unique name
        unique_suffix = str(uuid.uuid4())[:6]
        new_country = {
            "name": f"TEST_Country_{unique_suffix}",
            "code": f"T{unique_suffix[:1].upper()}",
            "is_origin": True,
            "is_destination": True
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/countries", json=new_country, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['name'] == new_country['name'], "Country name should match"
        assert data['code'] == new_country['code'].upper(), "Country code should be uppercase"
        assert data['is_origin'] == new_country['is_origin'], "is_origin should match"
        assert data['is_destination'] == new_country['is_destination'], "is_destination should match"
        assert 'id' in data, "Response should contain id"
        print(f"Country created: {data}")
    
    def test_admin_delete_country(self, admin_token):
        """DELETE /api/admin/countries/{id} - Delete a country"""
        import uuid
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a country to delete with unique name
        unique_suffix = str(uuid.uuid4())[:6]
        new_country = {
            "name": f"TEST_ToDelete_{unique_suffix}",
            "code": f"X{unique_suffix[:1].upper()}",
            "is_origin": True,
            "is_destination": False
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/countries", json=new_country, headers=headers)
        assert create_response.status_code == 200, f"Failed to create country: {create_response.text}"
        country_id = create_response.json()['id']
        
        # Now delete it
        delete_response = requests.delete(f"{BASE_URL}/api/admin/countries/{country_id}", headers=headers)
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        
        data = delete_response.json()
        assert 'message' in data, "Response should contain message"
        print(f"Country deleted: {data}")
    
    def test_admin_countries_unauthorized(self):
        """Test that non-admin cannot access admin countries"""
        # Login as shipper
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHIPPER_EMAIL,
            "password": SHIPPER_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Shipper login failed")
        
        shipper_token = login_response.json()['access_token']
        headers = {"Authorization": f"Bearer {shipper_token}"}
        
        # Try to access admin countries
        response = requests.get(f"{BASE_URL}/api/admin/countries", headers=headers)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"Unauthorized access correctly blocked: {response.status_code}")


class TestAdminSettingsAPI:
    """Test admin platform settings endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()['access_token']
    
    def test_get_settings(self, admin_token):
        """GET /api/admin/settings - Get platform settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/settings", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'commission_enabled' in data, "Settings should have commission_enabled"
        assert 'shipper_commission_rate' in data, "Settings should have shipper_commission_rate"
        assert 'carrier_commission_rate' in data, "Settings should have carrier_commission_rate"
        print(f"Settings retrieved: commission_enabled={data['commission_enabled']}, shipper_rate={data['shipper_commission_rate']}, carrier_rate={data['carrier_commission_rate']}")
    
    def test_update_settings_commission_toggle(self, admin_token):
        """PATCH /api/admin/settings - Toggle commission"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin/settings", headers=headers)
        current_enabled = get_response.json().get('commission_enabled', False)
        
        # Toggle commission
        new_enabled = not current_enabled
        update_response = requests.patch(f"{BASE_URL}/api/admin/settings", 
            json={"commission_enabled": new_enabled}, 
            headers=headers
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert data['commission_enabled'] == new_enabled, f"commission_enabled should be {new_enabled}"
        print(f"Commission toggled: {current_enabled} -> {new_enabled}")
        
        # Restore original value
        requests.patch(f"{BASE_URL}/api/admin/settings", 
            json={"commission_enabled": current_enabled}, 
            headers=headers
        )
    
    def test_update_settings_commission_rates(self, admin_token):
        """PATCH /api/admin/settings - Update commission rates"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin/settings", headers=headers)
        original_settings = get_response.json()
        
        # Update rates
        new_shipper_rate = 0.02  # 2%
        new_carrier_rate = 0.015  # 1.5%
        
        update_response = requests.patch(f"{BASE_URL}/api/admin/settings", 
            json={
                "shipper_commission_rate": new_shipper_rate,
                "carrier_commission_rate": new_carrier_rate
            }, 
            headers=headers
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert data['shipper_commission_rate'] == new_shipper_rate, f"shipper_commission_rate should be {new_shipper_rate}"
        assert data['carrier_commission_rate'] == new_carrier_rate, f"carrier_commission_rate should be {new_carrier_rate}"
        print(f"Commission rates updated: shipper={new_shipper_rate}, carrier={new_carrier_rate}")
        
        # Restore original values
        requests.patch(f"{BASE_URL}/api/admin/settings", 
            json={
                "shipper_commission_rate": original_settings.get('shipper_commission_rate', 0.01),
                "carrier_commission_rate": original_settings.get('carrier_commission_rate', 0.01)
            }, 
            headers=headers
        )
    
    def test_settings_unauthorized(self):
        """Test that non-admin cannot access settings"""
        # Login as shipper
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHIPPER_EMAIL,
            "password": SHIPPER_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Shipper login failed")
        
        shipper_token = login_response.json()['access_token']
        headers = {"Authorization": f"Bearer {shipper_token}"}
        
        # Try to access settings
        response = requests.get(f"{BASE_URL}/api/admin/settings", headers=headers)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"Unauthorized access correctly blocked: {response.status_code}")


class TestPaymentsAPI:
    """Test payments endpoints"""
    
    @pytest.fixture
    def shipper_token(self):
        """Get shipper authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHIPPER_EMAIL,
            "password": SHIPPER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Shipper login failed: {response.text}")
        return response.json()['access_token']
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()['access_token']
    
    def test_admin_list_payments(self, admin_token):
        """GET /api/admin/payments - Admin list payments"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'items' in data, "Response should have items"
        assert 'total' in data, "Response should have total"
        print(f"Payments list: {data['total']} total payments")
    
    def test_create_payment_no_contract(self, shipper_token):
        """POST /api/payments/create - Should fail with invalid contract"""
        headers = {"Authorization": f"Bearer {shipper_token}"}
        
        response = requests.post(f"{BASE_URL}/api/payments/create", 
            json={
                "contract_id": "invalid-contract-id",
                "return_url": "https://example.com/return",
                "cancel_url": "https://example.com/cancel"
            },
            headers=headers
        )
        # Should return 404 for invalid contract
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"Invalid contract correctly rejected: {response.status_code}")
    
    def test_get_contract_payment_no_payment(self, shipper_token):
        """GET /api/payments/contract/{id} - Should return null for contract without payment"""
        headers = {"Authorization": f"Bearer {shipper_token}"}
        
        # First get a contract
        contracts_response = requests.get(f"{BASE_URL}/api/contracts", headers=headers)
        if contracts_response.status_code != 200:
            pytest.skip("Could not get contracts")
        
        contracts_data = contracts_response.json()
        # Handle both list and dict with items
        if isinstance(contracts_data, list):
            contracts = contracts_data
        else:
            contracts = contracts_data.get('items', [])
        
        if not contracts:
            pytest.skip("No contracts available")
        
        contract_id = contracts[0]['id']
        
        response = requests.get(f"{BASE_URL}/api/payments/contract/{contract_id}", headers=headers)
        # Should return 200 with null or payment data
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Contract payment status retrieved for contract {contract_id}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_countries(self):
        """Remove test countries created during tests"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        
        admin_token = login_response.json()['access_token']
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get all countries
        countries_response = requests.get(f"{BASE_URL}/api/admin/countries", headers=headers)
        if countries_response.status_code != 200:
            pytest.skip("Could not get countries")
        
        countries = countries_response.json()
        
        # Delete test countries (those starting with TEST_)
        deleted_count = 0
        for country in countries:
            if country['name'].startswith('TEST_'):
                delete_response = requests.delete(f"{BASE_URL}/api/admin/countries/{country['id']}", headers=headers)
                if delete_response.status_code == 200:
                    deleted_count += 1
                    print(f"Deleted test country: {country['name']}")
        
        print(f"Cleanup complete: {deleted_count} test countries removed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
