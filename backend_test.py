#!/usr/bin/env python3
"""
Backend API Testing for Carrier Identity Verification System
Tests all carrier verification endpoints and admin approval/rejection workflow
"""

import requests
import json
import sys
import io
from datetime import datetime, timedelta
from pathlib import Path

class CarrierVerificationTester:
    def __init__(self, base_url="https://exec-loader.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.carrier_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.verification_id = None
        
        print(f"🔧 Testing Carrier Identity Verification System")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if files:
            # Remove Content-Type for file uploads
            if 'Content-Type' in test_headers:
                del test_headers['Content-Type']

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        print(f"   {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            else:
                response = requests.request(method, url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASSED - Status: {response.status_code}")
                try:
                    return response.json() if response.content else {}
                except:
                    return {"message": "No JSON response"}
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return {}

        except Exception as e:
            print(f"   ❌ FAILED - Error: {str(e)}")
            return {}

    def login_carrier(self):
        """Login as carrier to get auth token"""
        print("\n🔑 Logging in as carrier...")
        response = self.run_test(
            "Carrier Login",
            "POST", 
            "auth/login",
            200,
            data={"email": "transport.pro@example.com", "password": "password123"}
        )
        
        if response.get('access_token'):
            self.carrier_token = response['access_token']
            print(f"   🎟️ Carrier token obtained")
            return True
        else:
            print(f"   ❌ Failed to get carrier token")
            return False

    def login_admin(self):
        """Login as admin to get auth token"""  
        print("\n🔑 Logging in as admin...")
        response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login", 
            200,
            data={"email": "admin@logimatch.com", "password": "admin123"}
        )
        
        if response.get('access_token'):
            self.admin_token = response['access_token']
            print(f"   🎟️ Admin token obtained")
            return True
        else:
            print(f"   ❌ Failed to get admin token")
            return False

    def test_verification_status_initial(self):
        """Test getting initial verification status"""
        response = self.run_test(
            "Get Verification Status (Initial)",
            "GET",
            "carriers/verification/status",
            200,
            headers={'Authorization': f'Bearer {self.carrier_token}'}
        )
        
        print(f"   📊 Current status: {response.get('status', 'Unknown')}")
        return response

    def test_submit_verification_info(self):
        """Test submitting carrier verification information"""
        verification_data = {
            "identity_doc_type": "PASSPORT",
            "identity_first_name": "John",
            "identity_last_name": "Doe", 
            "identity_birth_date": "1985-06-15",
            "identity_doc_number": "12AB34567",
            "address_street": "123 Rue de la Paix",
            "address_city": "Paris",
            "address_postal_code": "75001", 
            "address_country": "France"
        }
        
        response = self.run_test(
            "Submit Verification Info",
            "POST",
            "carriers/verification/submit",
            200,
            data=verification_data,
            headers={'Authorization': f'Bearer {self.carrier_token}'}
        )
        
        if response.get('id'):
            self.verification_id = response['id']
            print(f"   📝 Verification ID: {self.verification_id}")
        
        return response

    def test_upload_identity_document(self):
        """Test uploading identity document"""
        # Create a dummy file for testing
        dummy_file = io.BytesIO(b"This is a dummy identity document content for testing")
        dummy_file.name = "passport.jpg"
        
        response = self.run_test(
            "Upload Identity Document",
            "POST",
            "carriers/verification/identity-document",
            200,
            files={'file': dummy_file},
            headers={'Authorization': f'Bearer {self.carrier_token}'}
        )
        
        if response.get('identity_doc_url'):
            print(f"   📄 Document URL: {response['identity_doc_url']}")
        
        return response

    def test_upload_address_proof(self):
        """Test uploading address proof with date validation"""
        # Create a dummy file for testing
        dummy_file = io.BytesIO(b"This is a dummy address proof document for testing")
        dummy_file.name = "electricity_bill.pdf"
        
        # Use a date within the last 3 months
        recent_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        response = self.run_test(
            "Upload Address Proof (Valid Date)",
            "POST",
            f"carriers/verification/address-proof?document_date={recent_date}",
            200,
            files={'file': dummy_file},
            headers={'Authorization': f'Bearer {self.carrier_token}'}
        )
        
        if response.get('address_proof_url'):
            print(f"   📄 Address proof URL: {response['address_proof_url']}")
        
        return response

    def test_upload_address_proof_invalid_date(self):
        """Test uploading address proof with invalid date (> 3 months)"""
        dummy_file = io.BytesIO(b"This is an old address proof document")
        dummy_file.name = "old_bill.pdf"
        
        # Use a date older than 3 months
        old_date = (datetime.now() - timedelta(days=120)).strftime('%Y-%m-%d')
        
        self.run_test(
            "Upload Address Proof (Invalid Date)",
            "POST",
            f"carriers/verification/address-proof?document_date={old_date}",
            400,  # Should fail with 400
            files={'file': dummy_file},
            headers={'Authorization': f'Bearer {self.carrier_token}'}
        )

    def test_verification_status_complete(self):
        """Test getting verification status after all documents uploaded"""
        response = self.run_test(
            "Get Verification Status (Complete)",
            "GET",
            "carriers/verification/status",
            200,
            headers={'Authorization': f'Bearer {self.carrier_token}'}
        )
        
        print(f"   📊 Status: {response.get('status', 'Unknown')}")
        print(f"   📋 Documents complete: {response.get('documents_complete', False)}")
        print(f"   ✅ Is verified: {response.get('is_verified', False)}")
        
        return response

    def test_admin_list_verifications(self):
        """Test admin listing carrier verifications"""
        response = self.run_test(
            "Admin List Verifications",
            "GET",
            "admin/carrier-verifications",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        items = response.get('items', [])
        print(f"   📋 Found {len(items)} verification requests")
        
        # Find our test verification
        for item in items:
            if item.get('user', {}).get('email') == 'transport.pro@example.com':
                self.verification_id = item['id']
                print(f"   🎯 Found test verification: {self.verification_id}")
                print(f"   📊 Status: {item.get('status', 'Unknown')}")
                break
        
        return response

    def test_admin_get_verification_details(self):
        """Test admin getting specific verification details"""
        if not self.verification_id:
            print("   ⚠️ No verification ID available, skipping...")
            return {}
            
        response = self.run_test(
            "Admin Get Verification Details",
            "GET",
            f"admin/carrier-verifications/{self.verification_id}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if response:
            print(f"   👤 User: {response.get('user', {}).get('first_name')} {response.get('user', {}).get('last_name')}")
            print(f"   🪪 Doc type: {response.get('identity_doc_type', 'Unknown')}")
            print(f"   📄 Has identity doc: {bool(response.get('identity_doc_url'))}")
            print(f"   🏠 Has address proof: {bool(response.get('address_proof_url'))}")
            print(f"   📊 Name match: {response.get('name_match', 'Unknown')}")
        
        return response

    def test_admin_approve_verification(self):
        """Test admin approving a carrier verification"""
        if not self.verification_id:
            print("   ⚠️ No verification ID available, skipping...")
            return {}
            
        response = self.run_test(
            "Admin Approve Verification", 
            "PATCH",
            f"admin/carrier-verifications/{self.verification_id}/approve",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        print(f"   ✅ Approval response: {response.get('message', 'Unknown')}")
        return response

    def test_admin_reject_verification(self):
        """Test admin rejecting a carrier verification"""
        if not self.verification_id:
            print("   ⚠️ No verification ID available, skipping...")
            return {}
            
        rejection_reason = "Document quality is insufficient for verification"
        
        response = self.run_test(
            "Admin Reject Verification",
            "PATCH", 
            f"admin/carrier-verifications/{self.verification_id}/reject?reason={rejection_reason}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        print(f"   ❌ Rejection response: {response.get('message', 'Unknown')}")
        print(f"   📝 Reason: {response.get('reason', 'Unknown')}")
        return response

    def test_verification_status_after_admin_action(self):
        """Test verification status after admin approval/rejection"""
        response = self.run_test(
            "Get Status After Admin Action",
            "GET",
            "carriers/verification/status",
            200,
            headers={'Authorization': f'Bearer {self.carrier_token}'}
        )
        
        print(f"   📊 Final status: {response.get('status', 'Unknown')}")
        if response.get('status') == 'REJECTED':
            print(f"   📝 Rejection reason: {response.get('rejection_reason', 'Unknown')}")
        elif response.get('status') == 'VERIFIED':
            print(f"   ✅ Verified at: {response.get('verified_at', 'Unknown')}")
            
        return response

    def run_complete_workflow_test(self):
        """Run the complete carrier verification workflow"""
        print("\n🚀 Starting Complete Carrier Verification Workflow Test")
        print("=" * 60)
        
        # Step 1: Login as carrier
        if not self.login_carrier():
            return False
            
        # Step 2: Check initial verification status
        self.test_verification_status_initial()
        
        # Step 3: Submit verification information
        self.test_submit_verification_info()
        
        # Step 4: Upload identity document
        self.test_upload_identity_document()
        
        # Step 5: Try uploading invalid address proof (should fail)
        self.test_upload_address_proof_invalid_date()
        
        # Step 6: Upload valid address proof
        self.test_upload_address_proof()
        
        # Step 7: Check verification status after uploads
        self.test_verification_status_complete()
        
        # Step 8: Login as admin
        if not self.login_admin():
            return False
            
        # Step 9: Admin list all verifications
        self.test_admin_list_verifications()
        
        # Step 10: Admin get verification details
        self.test_admin_get_verification_details()
        
        # Step 11: Test rejection flow first
        self.test_admin_reject_verification()
        
        # Step 12: Check status after rejection
        self.test_verification_status_after_admin_action()
        
        # Step 13: Re-submit for approval (since we rejected it)
        if self.login_carrier():
            self.test_submit_verification_info()  # Re-submit
            self.test_upload_identity_document()  # Re-upload docs
            self.test_upload_address_proof()
            
        # Step 14: Admin approve this time
        if self.login_admin():
            self.test_admin_list_verifications()  # Get updated ID
            self.test_admin_approve_verification()
            
        # Step 15: Final status check
        if self.login_carrier():
            self.test_verification_status_after_admin_action()
        
        return True

    def print_summary(self):
        """Print test execution summary"""
        print("\n" + "=" * 60)
        print("🏁 TEST EXECUTION SUMMARY")
        print("=" * 60)
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! Carrier verification system is working correctly.")
            return True
        else:
            print("⚠️ Some tests failed. Please check the API implementation.")
            return False

def main():
    """Main test execution"""
    try:
        tester = CarrierVerificationTester()
        success = tester.run_complete_workflow_test()
        result = tester.print_summary()
        
        return 0 if result else 1
        
    except KeyboardInterrupt:
        print("\n\n⏹️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())