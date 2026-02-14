import requests
import json
import sys
from datetime import datetime

class LogimatchAPITester:
    def __init__(self, base_url="https://exec-loader.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        default_headers = {'Content-Type': 'application/json'}
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            default_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)
            else:
                self.log_result(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            details = f"Status: {response.status_code} (expected {expected_status})"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f" - {error_detail.get('detail', 'No error details')}"
                except:
                    details += f" - Response: {response.text[:100]}"
            
            self.log_result(name, success, details)
            
            try:
                return success, response.json() if success else {}
            except:
                return success, {"raw_response": response.text}

        except requests.exceptions.RequestException as e:
            self.log_result(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_combined_role_registration(self):
        """Test SHIPPER_CARRIER role registration"""
        print("\n=== Testing Combined Role Registration ===")
        
        # Test data for combined role
        test_data = {
            "email": "both@example.com",
            "password": "password123",
            "role": "SHIPPER_CARRIER",
            "first_name": "Test",
            "last_name": "Both",
            "phone": "+33123456789",
            "country": "France",
            "city": "Paris"
        }
        
        success, response = self.run_test(
            "Register SHIPPER_CARRIER user",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success:
            self.token = response.get('access_token')
            user = response.get('user', {})
            
            # Verify user role
            if user.get('role') == 'SHIPPER_CARRIER':
                self.log_result("Verify SHIPPER_CARRIER role", True, "Role correctly set")
            else:
                self.log_result("Verify SHIPPER_CARRIER role", False, f"Expected SHIPPER_CARRIER, got {user.get('role')}")
                
            return True
        
        return False

    def test_login_combined_role(self):
        """Test login with existing combined role user"""
        print("\n=== Testing Combined Role Login ===")
        
        # Try login with the test account
        login_data = {
            "email": "both@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "Login SHIPPER_CARRIER user",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success:
            self.token = response.get('access_token')
            user = response.get('user', {})
            
            # Verify user role and permissions
            if user.get('role') == 'SHIPPER_CARRIER':
                self.log_result("Verify role after login", True, f"Role: {user.get('role')}")
                return True
            else:
                self.log_result("Verify role after login", False, f"Expected SHIPPER_CARRIER, got {user.get('role')}")
        
        return False

    def test_user_profile(self):
        """Test user profile endpoint"""
        print("\n=== Testing User Profile ===")
        
        success, response = self.run_test(
            "Get user profile",
            "GET", 
            "users/me",
            200
        )
        
        if success:
            role = response.get('role')
            if role == 'SHIPPER_CARRIER':
                self.log_result("Profile role check", True, f"Role: {role}")
            else:
                self.log_result("Profile role check", False, f"Expected SHIPPER_CARRIER, got {role}")

    def test_create_request(self):
        """Test creating a shipping request (shipper functionality)"""
        print("\n=== Testing Request Creation (Shipper Role) ===")
        
        request_data = {
            "origin_country": "France",
            "origin_city": "Paris",
            "destination_country": "Tunisie",
            "destination_city": "Tunis",
            "weight": 5.0,
            "width": 30.0,
            "height": 20.0,
            "length": 40.0,
            "package_type": "Electronics",
            "mode": "TERRESTRIAL",
            "deadline": "2024-12-31T23:59:59",
            "description": "Test package for combined role"
        }
        
        success, response = self.run_test(
            "Create shipping request",
            "POST",
            "requests",
            200,
            data=request_data
        )
        
        if success:
            self.created_request_id = response.get('id')
            self.log_result("Request creation success", True, f"Request ID: {self.created_request_id}")
            
            # Verify the request was created by SHIPPER_CARRIER user
            self.run_test(
                "Verify request details",
                "GET",
                f"requests/{self.created_request_id}",
                200
            )
        
        return success

    def test_create_offer(self):
        """Test creating a carrier offer (carrier functionality)"""
        print("\n=== Testing Offer Creation (Carrier Role) ===")
        
        offer_data = {
            "origin_country": "France",
            "origin_city": "Paris", 
            "destination_country": "Tunisie",
            "destination_city": "Tunis",
            "departure_date": "2024-12-20T10:00:00",
            "arrival_date": "2024-12-22T18:00:00",
            "capacity_kg": 50.0,
            "mode": "TERRESTRIAL",
            "price_per_kg": 5.5,
            "conditions": "Test offer from combined role user"
        }
        
        success, response = self.run_test(
            "Create carrier offer",
            "POST",
            "offers",
            200,
            data=offer_data
        )
        
        if success:
            self.created_offer_id = response.get('id')
            self.log_result("Offer creation success", True, f"Offer ID: {self.created_offer_id}")
            
            # Verify the offer was created by SHIPPER_CARRIER user
            self.run_test(
                "Verify offer details",
                "GET",
                f"offers/{self.created_offer_id}",
                200
            )
        
        return success

    def test_get_my_requests(self):
        """Test getting user's requests"""
        print("\n=== Testing My Requests ===")
        
        self.run_test(
            "Get my requests",
            "GET",
            "requests/mine",
            200
        )

    def test_get_my_offers(self):
        """Test getting user's offers"""
        print("\n=== Testing My Offers ===")
        
        self.run_test(
            "Get my offers",
            "GET",
            "offers/mine", 
            200
        )

    def test_contracts(self):
        """Test contracts endpoint"""
        print("\n=== Testing Contracts ===")
        
        self.run_test(
            "Get my contracts",
            "GET",
            "contracts",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting LogiMatch API Tests for SHIPPER_CARRIER role\n")
        
        # First try to login with existing account
        if not self.test_login_combined_role():
            # If login fails, try to register new account
            if not self.test_combined_role_registration():
                print("❌ Failed to authenticate - stopping tests")
                return False
        
        # Test user profile
        self.test_user_profile()
        
        # Test both shipper and carrier functionalities
        self.test_create_request()
        self.test_create_offer()
        self.test_get_my_requests()
        self.test_get_my_offers()
        self.test_contracts()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

    def get_results(self):
        """Get all test results"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "results": self.results
        }

def main():
    """Main test execution"""
    tester = LogimatchAPITester()
    success = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(tester.get_results(), f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())