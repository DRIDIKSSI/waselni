import requests
import sys
import json
from datetime import datetime, timedelta

class LogiMatchAPITester:
    def __init__(self, base_url="https://waselni-preview.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.carrier_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_seed_data(self):
        """Initialize test data"""
        print("\n🌱 Testing seed data initialization...")
        result = self.run_test(
            "Seed data initialization",
            "POST",
            "seed",
            200
        )
        return result is not None

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing authentication endpoints...")
        
        # Test admin login
        admin_result = self.run_test(
            "Admin login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@logimatch.com", "password": "admin123"}
        )
        
        if admin_result and 'access_token' in admin_result:
            self.admin_token = admin_result['access_token']
        
        # Test shipper login
        shipper_result = self.run_test(
            "Shipper login",
            "POST",
            "auth/login",
            200,
            data={"email": "marie@example.com", "password": "password123"}
        )
        
        if shipper_result and 'access_token' in shipper_result:
            self.token = shipper_result['access_token']
        
        # Test carrier login
        carrier_result = self.run_test(
            "Carrier login",
            "POST",
            "auth/login",
            200,
            data={"email": "transport.pro@example.com", "password": "password123"}
        )
        
        if carrier_result and 'access_token' in carrier_result:
            self.carrier_token = carrier_result['access_token']
        
        # Test invalid login
        self.run_test(
            "Invalid login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@example.com", "password": "wrongpassword"}
        )
        
        # Test registration
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        self.run_test(
            "User registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "role": "SHIPPER",
                "first_name": "Test",
                "last_name": "User",
                "phone": "+33123456789",
                "country": "France",
                "city": "Paris"
            }
        )

    def test_user_endpoints(self):
        """Test user-related endpoints"""
        print("\n👤 Testing user endpoints...")
        
        if not self.token:
            print("❌ No token available for user tests")
            return
        
        # Test get current user
        self.run_test(
            "Get current user",
            "GET",
            "users/me",
            200
        )
        
        # Test update user profile
        self.run_test(
            "Update user profile",
            "PATCH",
            "users/me",
            200,
            data={"bio": "Updated bio for testing"}
        )

    def test_requests_endpoints(self):
        """Test shipping requests endpoints"""
        print("\n📦 Testing requests endpoints...")
        
        if not self.token:
            print("❌ No token available for requests tests")
            return
        
        # Test list requests
        requests_result = self.run_test(
            "List requests",
            "GET",
            "requests",
            200
        )
        
        # Test create request
        create_result = self.run_test(
            "Create request",
            "POST",
            "requests",
            200,
            data={
                "origin_country": "France",
                "origin_city": "Paris",
                "destination_country": "Tunisie",
                "destination_city": "Tunis",
                "weight": 3.5,
                "width": 25,
                "height": 15,
                "length": 30,
                "package_type": "Documents",
                "mode": "AIR",
                "deadline": (datetime.now() + timedelta(days=10)).isoformat(),
                "description": "Test package for API testing"
            }
        )
        
        if create_result and 'id' in create_result:
            request_id = create_result['id']
            
            # Test get specific request
            self.run_test(
                "Get specific request",
                "GET",
                f"requests/{request_id}",
                200
            )
            
            # Test update request
            self.run_test(
                "Update request",
                "PATCH",
                f"requests/{request_id}",
                200,
                data={"description": "Updated description"}
            )
        
        # Test get my requests
        self.run_test(
            "Get my requests",
            "GET",
            "requests/mine",
            200
        )

    def test_offers_endpoints(self):
        """Test transport offers endpoints"""
        print("\n🚛 Testing offers endpoints...")
        
        if not self.carrier_token:
            print("❌ No carrier token available for offers tests")
            return
        
        # Switch to carrier token
        original_token = self.token
        self.token = self.carrier_token
        
        # Test list offers
        self.run_test(
            "List offers",
            "GET",
            "offers",
            200
        )
        
        # Test create offer
        create_result = self.run_test(
            "Create offer",
            "POST",
            "offers",
            200,
            data={
                "origin_country": "France",
                "origin_city": "Marseille",
                "destination_country": "Tunisie",
                "destination_city": "Tunis",
                "departure_date": (datetime.now() + timedelta(days=5)).isoformat(),
                "arrival_date": (datetime.now() + timedelta(days=7)).isoformat(),
                "capacity_kg": 50,
                "mode": "TERRESTRIAL",
                "price_per_kg": 10.0,
                "conditions": "Test offer for API testing"
            }
        )
        
        if create_result and 'id' in create_result:
            offer_id = create_result['id']
            
            # Test get specific offer
            self.run_test(
                "Get specific offer",
                "GET",
                f"offers/{offer_id}",
                200
            )
            
            # Test update offer
            self.run_test(
                "Update offer",
                "PATCH",
                f"offers/{offer_id}",
                200,
                data={"price_per_kg": 12.0}
            )
        
        # Test get my offers
        self.run_test(
            "Get my offers",
            "GET",
            "offers/mine",
            200
        )
        
        # Restore original token
        self.token = original_token

    def test_matching_endpoints(self):
        """Test matching endpoints"""
        print("\n🔍 Testing matching endpoints...")
        
        # Get a request ID for matching test
        requests_result = self.run_test(
            "Get requests for matching",
            "GET",
            "requests?limit=1",
            200
        )
        
        if requests_result and requests_result.get('items'):
            request_id = requests_result['items'][0]['id']
            
            self.run_test(
                "Get matching offers for request",
                "GET",
                f"matching/requests/{request_id}/offers",
                200
            )
        
        # Get an offer ID for matching test
        offers_result = self.run_test(
            "Get offers for matching",
            "GET",
            "offers?limit=1",
            200
        )
        
        if offers_result and offers_result.get('items'):
            offer_id = offers_result['items'][0]['id']
            
            self.run_test(
                "Get matching requests for offer",
                "GET",
                f"matching/offers/{offer_id}/requests",
                200
            )

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n👑 Testing admin endpoints...")
        
        if not self.admin_token:
            print("❌ No admin token available for admin tests")
            return
        
        # Switch to admin token
        original_token = self.token
        self.token = self.admin_token
        
        # Test admin stats
        self.run_test(
            "Admin stats",
            "GET",
            "admin/stats",
            200
        )
        
        # Test admin list users
        self.run_test(
            "Admin list users",
            "GET",
            "admin/users",
            200
        )
        
        # Test admin list requests
        self.run_test(
            "Admin list requests",
            "GET",
            "admin/requests",
            200
        )
        
        # Test admin list offers
        self.run_test(
            "Admin list offers",
            "GET",
            "admin/offers",
            200
        )
        
        # Restore original token
        self.token = original_token

    def test_conversations_endpoints(self):
        """Test messaging endpoints"""
        print("\n💬 Testing conversations endpoints...")
        
        if not self.token:
            print("❌ No token available for conversations tests")
            return
        
        # Test list conversations
        self.run_test(
            "List conversations",
            "GET",
            "conversations",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting LogiMatch API Tests")
        print("=" * 50)
        
        # Initialize test data first
        if not self.test_seed_data():
            print("❌ Failed to initialize seed data, continuing with existing data...")
        
        # Run all test suites
        self.test_auth_endpoints()
        self.test_user_endpoints()
        self.test_requests_endpoints()
        self.test_offers_endpoints()
        self.test_matching_endpoints()
        self.test_conversations_endpoints()
        self.test_admin_endpoints()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = LogiMatchAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())