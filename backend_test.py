#!/usr/bin/env python3
"""
Backend API tests for Supplement Discovery (DSLD proxy endpoints)
Tests GET /api/supplements/dsld/search and GET /api/supplements/dsld/{id}
"""

import requests
import json
import time
import sys
import re

# Base URL from environment
BASE_URL = "https://health-research-hub-3.preview.emergentagent.com/api"

# Marketplace domains that should NEVER appear in brand URLs
MARKETPLACE_DOMAINS = [
    'amazon.', 'walmart.', 'iherb.', 'vitacost.', 'gnc.',
    'ebay.', 'target.', 'costco.'
]

def test_search_methylfolate():
    """Test 1: Search for methylfolate with size=5, verify MethylPro curated brand"""
    print("\n=== Test 1: Search methylfolate (size=5) ===")
    try:
        start = time.time()
        resp = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
            'q': 'methylfolate',
            'size': 5
        }, timeout=15)
        elapsed = time.time() - start
        
        print(f"✓ Status: {resp.status_code} (took {elapsed:.2f}s)")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        print(f"✓ Query: {data.get('query')}")
        print(f"✓ Total: {data.get('total')}, Returned: {data.get('returned')}")
        
        assert 'results' in data, "Missing 'results' field"
        assert data['returned'] <= 5, f"Expected returned <= 5, got {data['returned']}"
        
        results = data['results']
        assert len(results) > 0, "Expected non-empty results"
        
        # Find MethylPro product
        methylpro_found = False
        methylpro_curated = False
        methylpro_url_correct = False
        methylpro_formquality_preferred = False
        
        for r in results:
            if r.get('brand', {}).get('name') == 'MethylPro':
                methylpro_found = True
                brand = r['brand']
                print(f"✓ Found MethylPro product: {r.get('fullName')}")
                print(f"  Brand curated: {brand.get('curated')}")
                print(f"  Brand URL: {brand.get('url', {}).get('url')}")
                print(f"  URL source: {brand.get('url', {}).get('source')}")
                
                if brand.get('curated') == True:
                    methylpro_curated = True
                
                if brand.get('url', {}).get('source') == 'curated' and \
                   brand.get('url', {}).get('url') == 'https://methylpro.com':
                    methylpro_url_correct = True
                
                # Check formQuality for preferred L-5-Methylfolate
                formQuality = r.get('formQuality', [])
                for fq in formQuality:
                    if fq.get('tier') == 'preferred' and 'methylfolate' in fq.get('formLabel', '').lower():
                        methylpro_formquality_preferred = True
                        print(f"  ✓ FormQuality: {fq.get('ingredient')} - {fq.get('tier')} - {fq.get('formLabel')}")
        
        assert methylpro_found, "MethylPro product not found in results"
        assert methylpro_curated, "MethylPro brand.curated should be true"
        assert methylpro_url_correct, "MethylPro URL should be curated https://methylpro.com"
        assert methylpro_formquality_preferred, "MethylPro should have preferred tier L-5-Methylfolate"
        
        print("✅ Test 1 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 1 FAILED: {e}")
        return False

def test_search_magnesium_glycinate():
    """Test 2: Search magnesium glycinate, verify all required fields present"""
    print("\n=== Test 2: Search magnesium glycinate (size=8) ===")
    try:
        start = time.time()
        resp = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
            'q': 'magnesium glycinate',
            'size': 8
        }, timeout=15)
        elapsed = time.time() - start
        
        print(f"✓ Status: {resp.status_code} (took {elapsed:.2f}s)")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        results = data.get('results', [])
        print(f"✓ Returned {len(results)} results")
        
        # Verify all required fields in each result
        required_fields = ['id', 'fullName', 'brand', 'productType', 'physicalState', 
                          'netContents', 'offMarket', 'entryDate', 'ingredients', 'formQuality']
        
        for i, r in enumerate(results):
            for field in required_fields:
                assert field in r, f"Result {i} missing field '{field}'"
            
            # Verify brand structure
            brand = r['brand']
            assert 'name' in brand, f"Result {i} brand missing 'name'"
            assert 'curated' in brand, f"Result {i} brand missing 'curated'"
            assert 'trustBadges' in brand, f"Result {i} brand missing 'trustBadges'"
            assert 'url' in brand, f"Result {i} brand missing 'url'"
            
            # Verify brand.url structure
            url_obj = brand['url']
            assert 'url' in url_obj, f"Result {i} brand.url missing 'url'"
            assert 'source' in url_obj, f"Result {i} brand.url missing 'source'"
            assert 'canonical' in url_obj, f"Result {i} brand.url missing 'canonical'"
            assert 'trust' in url_obj, f"Result {i} brand.url missing 'trust'"
        
        print(f"✓ All {len(results)} results have required fields")
        print("✅ Test 2 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 2 FAILED: {e}")
        return False

def test_search_ubiquinol():
    """Test 3: Search ubiquinol, verify CoQ10 formQuality with preferred tier"""
    print("\n=== Test 3: Search ubiquinol (size=5) ===")
    try:
        start = time.time()
        resp = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
            'q': 'ubiquinol',
            'size': 5
        }, timeout=15)
        elapsed = time.time() - start
        
        print(f"✓ Status: {resp.status_code} (took {elapsed:.2f}s)")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        results = data.get('results', [])
        print(f"✓ Returned {len(results)} results")
        
        # Look for CoQ10 formQuality with preferred tier and Ubiquinol
        coq10_preferred_found = False
        for r in results:
            formQuality = r.get('formQuality', [])
            for fq in formQuality:
                ingredient = fq.get('ingredient', '')
                tier = fq.get('tier', '')
                formLabel = fq.get('formLabel', '')
                
                if 'coq10' in ingredient.lower() and tier == 'preferred' and 'ubiquinol' in formLabel.lower():
                    coq10_preferred_found = True
                    print(f"✓ Found CoQ10 preferred form: {ingredient} - {tier} - {formLabel}")
                    print(f"  Product: {r.get('fullName')}")
                    break
            if coq10_preferred_found:
                break
        
        assert coq10_preferred_found, "No product found with CoQ10 preferred tier Ubiquinol"
        print("✅ Test 3 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 3 FAILED: {e}")
        return False

def test_search_empty_query():
    """Test 4: Empty query should return 200 with empty results"""
    print("\n=== Test 4: Empty query ===")
    try:
        resp = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
            'q': ''
        }, timeout=15)
        
        print(f"✓ Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        print(f"✓ Query: '{data.get('query')}'")
        print(f"✓ Total: {data.get('total')}, Returned: {data.get('returned')}")
        
        assert data.get('query') == '', "Expected empty query string"
        assert data.get('total') == 0, "Expected total = 0"
        assert data.get('results') == [], "Expected empty results array"
        
        print("✅ Test 4 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 4 FAILED: {e}")
        return False

def test_search_size_clamping():
    """Test 5: size=100 should be clamped to 50"""
    print("\n=== Test 5: Size clamping (size=100) ===")
    try:
        resp = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
            'q': 'vitamin d',
            'size': 100
        }, timeout=15)
        
        print(f"✓ Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        returned = data.get('returned', 0)
        print(f"✓ Returned: {returned}")
        
        assert returned <= 50, f"Expected returned <= 50, got {returned}"
        print("✅ Test 5 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 5 FAILED: {e}")
        return False

def test_search_onmarket_zero():
    """Test 6: onMarket=0 should still return 200"""
    print("\n=== Test 6: onMarket=0 ===")
    try:
        resp = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
            'q': 'vitamin c',
            'size': 5,
            'onMarket': 0
        }, timeout=15)
        
        print(f"✓ Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        print(f"✓ Returned: {data.get('returned')}")
        print("✅ Test 6 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 6 FAILED: {e}")
        return False

def test_search_cache_hit():
    """Test 7: Repeat request should return cache hit"""
    print("\n=== Test 7: Cache hit ===")
    try:
        # First request
        resp1 = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
            'q': 'methylfolate',
            'size': 5
        }, timeout=15)
        data1 = resp1.json()
        cache1 = data1.get('_cache')
        print(f"✓ First request _cache: {cache1}")
        
        # Second request (should hit cache)
        time.sleep(0.5)
        resp2 = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
            'q': 'methylfolate',
            'size': 5
        }, timeout=15)
        data2 = resp2.json()
        cache2 = data2.get('_cache')
        print(f"✓ Second request _cache: {cache2}")
        
        assert cache2 == 'hit', f"Expected _cache='hit' on second request, got '{cache2}'"
        print("✅ Test 7 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 7 FAILED: {e}")
        return False

def test_no_marketplace_urls():
    """Test 8: Verify no marketplace URLs in any brand.url.url"""
    print("\n=== Test 8: No marketplace URLs ===")
    try:
        # Test multiple queries
        queries = ['methylfolate', 'magnesium', 'vitamin d']
        all_urls = []
        
        for q in queries:
            resp = requests.get(f"{BASE_URL}/supplements/dsld/search", params={
                'q': q,
                'size': 10
            }, timeout=15)
            data = resp.json()
            results = data.get('results', [])
            
            for r in results:
                url = r.get('brand', {}).get('url', {}).get('url', '')
                if url:
                    all_urls.append((q, r.get('fullName'), url))
        
        print(f"✓ Collected {len(all_urls)} URLs from {len(queries)} queries")
        
        # Check for marketplace domains
        marketplace_found = []
        for query, product, url in all_urls:
            url_lower = url.lower()
            for marketplace in MARKETPLACE_DOMAINS:
                if marketplace in url_lower:
                    marketplace_found.append((query, product, url, marketplace))
        
        if marketplace_found:
            print("❌ Found marketplace URLs:")
            for query, product, url, marketplace in marketplace_found:
                print(f"  Query: {query}")
                print(f"  Product: {product}")
                print(f"  URL: {url}")
                print(f"  Marketplace: {marketplace}")
            assert False, f"Found {len(marketplace_found)} marketplace URLs"
        
        print("✓ No marketplace URLs found")
        print("✅ Test 8 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 8 FAILED: {e}")
        return False

def test_label_detail_methylpro():
    """Test 9: Label detail for MethylPro L-Methylfolate 1mg (id=274162)"""
    print("\n=== Test 9: Label detail 274162 (MethylPro) ===")
    try:
        start = time.time()
        resp = requests.get(f"{BASE_URL}/supplements/dsld/274162", timeout=15)
        elapsed = time.time() - start
        
        print(f"✓ Status: {resp.status_code} (took {elapsed:.2f}s)")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        assert 'product' in data, "Missing 'product' field"
        
        product = data['product']
        print(f"✓ Product: {product.get('fullName')}")
        
        # Verify brand
        brand = product.get('brand', {})
        brand_name = brand.get('name')
        print(f"✓ Brand name: {brand_name}")
        assert brand_name == 'MethylPro', f"Expected brand 'MethylPro', got '{brand_name}'"
        
        # Verify manufacturer
        manufacturer = brand.get('manufacturer', {})
        mfg_name = manufacturer.get('name')
        print(f"✓ Manufacturer: {mfg_name}")
        assert mfg_name == 'Metabolic Maintenance', f"Expected manufacturer 'Metabolic Maintenance', got '{mfg_name}'"
        
        # Verify labelPdf
        labelPdf = product.get('labelPdf')
        print(f"✓ Label PDF: {labelPdf}")
        assert labelPdf and labelPdf.startswith('https://dsld.od.nih.gov/labels/'), \
            f"Expected labelPdf to start with 'https://dsld.od.nih.gov/labels/', got '{labelPdf}'"
        
        # Verify formQuality has preferred L-5-Methylfolate
        formQuality = product.get('formQuality', [])
        preferred_found = False
        for fq in formQuality:
            if fq.get('tier') == 'preferred' and 'methylfolate' in fq.get('formLabel', '').lower():
                preferred_found = True
                print(f"✓ FormQuality: {fq.get('ingredient')} - {fq.get('tier')} - {fq.get('formLabel')}")
        
        assert preferred_found, "Expected preferred tier L-5-Methylfolate in formQuality"
        
        print("✅ Test 9 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 9 FAILED: {e}")
        return False

def test_label_detail_not_found():
    """Test 10: Non-existent label should return 404"""
    print("\n=== Test 10: Label detail 999999999 (not found) ===")
    try:
        resp = requests.get(f"{BASE_URL}/supplements/dsld/999999999", timeout=15)
        
        print(f"✓ Status: {resp.status_code}")
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        
        data = resp.json()
        assert 'error' in data, "Expected 'error' field in response"
        print(f"✓ Error message: {data.get('error')}")
        
        # Verify it's not a 500 error
        assert resp.status_code != 500, "Should return 404, not 500"
        
        print("✅ Test 10 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 10 FAILED: {e}")
        return False

def test_label_detail_cache_hit():
    """Test 11: Repeat label detail request should return cache hit"""
    print("\n=== Test 11: Label detail cache hit ===")
    try:
        # First request
        resp1 = requests.get(f"{BASE_URL}/supplements/dsld/274162", timeout=15)
        data1 = resp1.json()
        cache1 = data1.get('_cache')
        print(f"✓ First request _cache: {cache1}")
        
        # Second request (should hit cache)
        time.sleep(0.5)
        resp2 = requests.get(f"{BASE_URL}/supplements/dsld/274162", timeout=15)
        data2 = resp2.json()
        cache2 = data2.get('_cache')
        print(f"✓ Second request _cache: {cache2}")
        
        assert cache2 == 'hit', f"Expected _cache='hit' on second request, got '{cache2}'"
        print("✅ Test 11 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 11 FAILED: {e}")
        return False

def test_timing_and_json():
    """Test 12-13: All calls within 15s and JSON well-formed"""
    print("\n=== Test 12-13: Timing and JSON validation ===")
    try:
        test_cases = [
            (f"{BASE_URL}/supplements/dsld/search?q=creatine&size=5", "search creatine"),
            (f"{BASE_URL}/supplements/dsld/274162", "label detail 274162"),
        ]
        
        for url, desc in test_cases:
            start = time.time()
            resp = requests.get(url, timeout=15)
            elapsed = time.time() - start
            
            print(f"✓ {desc}: {resp.status_code} in {elapsed:.2f}s")
            assert elapsed < 15, f"{desc} took {elapsed:.2f}s (> 15s)"
            
            # Verify JSON is well-formed
            data = resp.json()
            json_str = json.dumps(data)
            
            # Check for MongoDB ObjectId patterns (should not exist)
            objectid_pattern = r'ObjectId\(["\']?[a-f0-9]{24}["\']?\)'
            if re.search(objectid_pattern, json_str, re.IGNORECASE):
                raise AssertionError(f"Found MongoDB ObjectId in response for {desc}")
            
            # Check for undefined values in critical fields
            if 'results' in data:
                for r in data['results']:
                    for key in ['id', 'fullName', 'brand']:
                        if key not in r or r[key] is None:
                            raise AssertionError(f"Critical field '{key}' is undefined in {desc}")
            
            if 'product' in data:
                product = data['product']
                for key in ['id', 'fullName', 'brand']:
                    if key not in product or product[key] is None:
                        raise AssertionError(f"Critical field '{key}' is undefined in product for {desc}")
        
        print("✓ All requests completed within 15s")
        print("✓ JSON well-formed, no ObjectId leaks, no undefined critical fields")
        print("✅ Test 12-13 PASSED")
        return True
    except Exception as e:
        print(f"❌ Test 12-13 FAILED: {e}")
        return False

def main():
    print("=" * 70)
    print("BACKEND API TESTS - Supplement Discovery (DSLD Proxy)")
    print("=" * 70)
    print(f"Base URL: {BASE_URL}")
    
    # Spread requests over time to respect rate limits
    tests = [
        test_search_methylfolate,
        test_search_magnesium_glycinate,
        test_search_ubiquinol,
        test_search_empty_query,
        test_search_size_clamping,
        test_search_onmarket_zero,
        test_search_cache_hit,
        test_no_marketplace_urls,
        test_label_detail_methylpro,
        test_label_detail_not_found,
        test_label_detail_cache_hit,
        test_timing_and_json,
    ]
    
    results = []
    for i, test in enumerate(tests):
        if i > 0:
            time.sleep(1)  # Spread requests to respect rate limits
        results.append(test())
    
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ ALL TESTS PASSED")
        sys.exit(0)
    else:
        print(f"❌ {total - passed} TEST(S) FAILED")
        sys.exit(1)

if __name__ == '__main__':
    main()
