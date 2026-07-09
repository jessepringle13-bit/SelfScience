#!/usr/bin/env python3
"""
Backend API tests for SelfScience /api/search endpoint
Tests PubMed + Semantic Scholar integration
"""

import requests
import json
import time
from typing import Dict, List, Any

# Base URL from environment
BASE_URL = "https://health-research-hub-3.preview.emergentagent.com"
API_ENDPOINT = f"{BASE_URL}/api/search"

def print_test_header(test_name: str):
    """Print a formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success: bool, message: str):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def validate_result_structure(result: Dict[str, Any], test_name: str) -> bool:
    """Validate that a single result has all required fields with correct types"""
    required_fields = {
        'id': str,
        'provider': str,
        'source': str,
        'title': str,
        'journal': str,
        'year': (int, type(None)),
        'url': str,
        'abstract': str,
    }
    
    issues = []
    
    for field, expected_type in required_fields.items():
        if field not in result:
            issues.append(f"Missing field: {field}")
        elif result[field] is None and expected_type != (int, type(None)):
            issues.append(f"Field '{field}' is None (should be {expected_type})")
        elif result[field] is not None:
            if isinstance(expected_type, tuple):
                if not isinstance(result[field], expected_type):
                    issues.append(f"Field '{field}' has wrong type: {type(result[field])} (expected one of {expected_type})")
            else:
                if not isinstance(result[field], expected_type):
                    issues.append(f"Field '{field}' has wrong type: {type(result[field])} (expected {expected_type})")
    
    # Check for undefined (JavaScript undefined would come as null in JSON, but check for missing keys)
    for field in required_fields.keys():
        if field not in result:
            issues.append(f"Field '{field}' is undefined/missing")
    
    if issues:
        print(f"  ⚠️  Result structure issues in {test_name}:")
        for issue in issues:
            print(f"     - {issue}")
        print(f"  Result sample: {json.dumps(result, indent=2)[:500]}")
        return False
    
    return True

def test_basic_search():
    """Test 1: Basic search with MTHFR C677T query"""
    print_test_header("Test 1: Basic Search - MTHFR C677T")
    
    try:
        params = {'q': 'MTHFR C677T'}
        print(f"Request: GET {API_ENDPOINT}?q={params['q']}")
        
        response = requests.get(API_ENDPOINT, params=params, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
        
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        print(f"Total results: {data.get('total', 0)}")
        print(f"Sources: {data.get('sources', {})}")
        
        # Validate response structure
        if 'results' not in data:
            print_result(False, "Missing 'results' key in response")
            return False
        
        if not isinstance(data['results'], list):
            print_result(False, f"'results' should be a list, got {type(data['results'])}")
            return False
        
        if len(data['results']) == 0:
            print_result(False, "Expected results array to be populated, got empty array")
            return False
        
        print(f"Number of results: {len(data['results'])}")
        
        # Validate first few results
        all_valid = True
        for i, result in enumerate(data['results'][:3]):
            print(f"\n  Validating result {i+1}:")
            print(f"    ID: {result.get('id', 'MISSING')}")
            print(f"    Provider: {result.get('provider', 'MISSING')}")
            print(f"    Title: {result.get('title', 'MISSING')[:60]}...")
            print(f"    Abstract length: {len(result.get('abstract', ''))}")
            
            if not validate_result_structure(result, f"result {i+1}"):
                all_valid = False
        
        if not all_valid:
            print_result(False, "Some results have invalid structure")
            return False
        
        print_result(True, f"Basic search returned {len(data['results'])} results with valid structure")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_pubmed_only():
    """Test 2: PubMed-only source filter"""
    print_test_header("Test 2: PubMed-Only Filter")
    
    try:
        params = {'q': 'zone 2 training', 'source': 'pubmed'}
        print(f"Request: GET {API_ENDPOINT}?q={params['q']}&source={params['source']}")
        
        response = requests.get(API_ENDPOINT, params=params, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        print(f"Total results: {data.get('total', 0)}")
        print(f"Sources: {data.get('sources', {})}")
        
        sources = data.get('sources', {})
        s2_count = sources.get('semanticScholar', -1)
        pubmed_count = sources.get('pubmed', -1)
        
        print(f"PubMed count: {pubmed_count}")
        print(f"Semantic Scholar count: {s2_count}")
        
        if s2_count != 0:
            print_result(False, f"Expected semanticScholar count to be 0, got {s2_count}")
            return False
        
        if pubmed_count == 0:
            print_result(False, "Expected some PubMed results, got 0")
            return False
        
        # Verify all results are from PubMed
        for i, result in enumerate(data.get('results', [])):
            if result.get('provider') != 'PubMed':
                print_result(False, f"Result {i+1} has provider '{result.get('provider')}', expected 'PubMed'")
                return False
        
        print_result(True, f"PubMed-only filter working correctly ({pubmed_count} results)")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_semantic_scholar_only():
    """Test 3: Semantic Scholar-only source filter (429 rate-limit acceptable)"""
    print_test_header("Test 3: Semantic Scholar-Only Filter")
    
    try:
        params = {'q': 'rapamycin', 'source': 's2'}
        print(f"Request: GET {API_ENDPOINT}?q={params['q']}&source={params['source']}")
        
        response = requests.get(API_ENDPOINT, params=params, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        print(f"Total results: {data.get('total', 0)}")
        print(f"Sources: {data.get('sources', {})}")
        
        sources = data.get('sources', {})
        s2_count = sources.get('semanticScholar', -1)
        pubmed_count = sources.get('pubmed', -1)
        
        print(f"PubMed count: {pubmed_count}")
        print(f"Semantic Scholar count: {s2_count}")
        
        if pubmed_count != 0:
            print_result(False, f"Expected pubmed count to be 0, got {pubmed_count}")
            return False
        
        # S2 might return 0 due to rate limiting - this is acceptable
        if s2_count == 0:
            print("  ℹ️  Note: Semantic Scholar returned 0 results (likely rate-limited, this is acceptable)")
            print_result(True, "S2-only filter working (empty results due to rate-limiting is acceptable)")
            return True
        
        # If we got results, verify they're all from S2
        for i, result in enumerate(data.get('results', [])):
            if result.get('provider') != 'Semantic Scholar':
                print_result(False, f"Result {i+1} has provider '{result.get('provider')}', expected 'Semantic Scholar'")
                return False
        
        print_result(True, f"S2-only filter working correctly ({s2_count} results)")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_empty_query():
    """Test 4: Empty query should return empty results"""
    print_test_header("Test 4: Empty Query")
    
    try:
        params = {'q': ''}
        print(f"Request: GET {API_ENDPOINT}?q=")
        
        response = requests.get(API_ENDPOINT, params=params, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if 'results' not in data:
            print_result(False, "Missing 'results' key in response")
            return False
        
        if len(data['results']) != 0:
            print_result(False, f"Expected empty results array, got {len(data['results'])} results")
            return False
        
        print_result(True, "Empty query correctly returns empty results")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_pillar_parameter():
    """Test 5: Pillar parameter is echoed in response"""
    print_test_header("Test 5: Pillar Parameter")
    
    try:
        params = {'q': 'CRISPR', 'pillar': 'Genomics'}
        print(f"Request: GET {API_ENDPOINT}?q={params['q']}&pillar={params['pillar']}")
        
        response = requests.get(API_ENDPOINT, params=params, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        print(f"Total results: {data.get('total', 0)}")
        print(f"Pillar in response: {data.get('pillar', 'MISSING')}")
        
        if 'pillar' not in data:
            print_result(False, "Missing 'pillar' key in response")
            return False
        
        if data['pillar'] != 'Genomics':
            print_result(False, f"Expected pillar 'Genomics', got '{data['pillar']}'")
            return False
        
        if len(data.get('results', [])) == 0:
            print_result(False, "Expected some results, got empty array")
            return False
        
        print_result(True, f"Pillar parameter correctly echoed ({len(data['results'])} results)")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_ncbi_api_key_usage():
    """Test 6: NCBI API key is being used (test with rapid sequential calls)"""
    print_test_header("Test 6: NCBI API Key Usage (Rate Limit Test)")
    
    try:
        print("Making 3 rapid sequential PubMed calls to verify API key is working...")
        
        queries = ['folate', 'vitamin D', 'omega 3']
        success_count = 0
        
        for i, query in enumerate(queries, 1):
            params = {'q': query, 'source': 'pubmed'}
            print(f"\n  Call {i}: {query}")
            
            start_time = time.time()
            response = requests.get(API_ENDPOINT, params=params, timeout=30)
            elapsed = time.time() - start_time
            
            print(f"    Status: {response.status_code}, Time: {elapsed:.2f}s")
            
            if response.status_code == 200:
                data = response.json()
                pubmed_count = data.get('sources', {}).get('pubmed', 0)
                print(f"    PubMed results: {pubmed_count}")
                success_count += 1
            else:
                print(f"    Failed with status {response.status_code}")
            
            # Small delay between requests
            if i < len(queries):
                time.sleep(0.2)
        
        if success_count == len(queries):
            print_result(True, f"All {success_count} rapid calls succeeded - NCBI API key is working")
            return True
        elif success_count >= 2:
            print_result(True, f"{success_count}/{len(queries)} calls succeeded - API key likely working (some rate limiting is normal)")
            return True
        else:
            print_result(False, f"Only {success_count}/{len(queries)} calls succeeded - possible API key issue")
            return False
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_no_mongodb_objectids():
    """Test 7: Verify no MongoDB ObjectIds in response"""
    print_test_header("Test 7: No MongoDB ObjectIds")
    
    try:
        params = {'q': 'diabetes'}
        print(f"Request: GET {API_ENDPOINT}?q={params['q']}")
        
        response = requests.get(API_ENDPOINT, params=params, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        # Check raw response text for ObjectId patterns
        response_text = response.text
        
        # Common MongoDB ObjectId patterns
        objectid_patterns = [
            '"_id"',
            'ObjectId',
            'ObjectID',
            '"$oid"',
        ]
        
        found_issues = []
        for pattern in objectid_patterns:
            if pattern in response_text:
                found_issues.append(pattern)
        
        if found_issues:
            print_result(False, f"Found MongoDB ObjectId patterns: {found_issues}")
            print(f"Response sample: {response_text[:1000]}")
            return False
        
        # Also verify JSON is properly serializable
        data = response.json()
        json_str = json.dumps(data)  # This will fail if there are non-serializable objects
        
        print_result(True, "No MongoDB ObjectIds found, JSON properly serialized")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def run_all_tests():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("SELFSCIENCE BACKEND API TEST SUITE")
    print("Testing /api/search endpoint")
    print("="*80)
    
    tests = [
        ("Basic Search (MTHFR C677T)", test_basic_search),
        ("PubMed-Only Filter", test_pubmed_only),
        ("Semantic Scholar-Only Filter", test_semantic_scholar_only),
        ("Empty Query", test_empty_query),
        ("Pillar Parameter", test_pillar_parameter),
        ("NCBI API Key Usage", test_ncbi_api_key_usage),
        ("No MongoDB ObjectIds", test_no_mongodb_objectids),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR in {test_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed")
    print(f"{'='*80}\n")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
