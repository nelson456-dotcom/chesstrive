import requests
import sys
from datetime import datetime

class ChessRepsAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response.json() if 'application/json' in response.headers.get('Content-Type', '') else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

def main():
    # Get backend URL from environment
    backend_url = "https://ce2a2f2b-9f87-436c-858b-ba672605a0d8.preview.emergentagent.com"
    
    print(f"Testing ChessReps.com backend API at: {backend_url}")
    print("Note: This is a frontend-only implementation with mocked data.")
    print("Backend API testing is minimal as most functionality is client-side.")
    
    # Setup tester
    tester = ChessRepsAPITester(backend_url)
    
    # Test health endpoint if it exists
    tester.run_test("API Health Check", "GET", "api/health", 200)
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("Most functionality is client-side with mocked data.")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())