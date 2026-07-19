#!/usr/bin/env python3
"""
Backend testing script for SelfScience Next.js app
Tests two main features:
1. POST /api/supplements/prices - admin-token gated write endpoint
2. Search adapter refactor regression check
"""

import requests
import json
import time
import sys
from datetime import datetime

# Base URL - using localhost as specified in review request
BASE_URL = "http://localhost:3000"

# Read admin token from .env
PRICES_ADMIN_TOKEN = "ss_prices_a4dJp8kNqT2vXeR7yLwFmZ3bH6cKgV1u"

# Test results tracking
test_results = []

def log_test(test_num, description, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = {
        "test": test_num,
        "description": description,
        "passed": passed,
        "details": details
    }
    test_results.append(result)
    print(f"\n{status} Test {test_num}: {description}")
    if details:
        print(f"  Details: {details}")
    return passed

def test_1_get_prices_baseline():
    """Test 1: GET /api/supplements/prices baseline"""
    try:
        resp = requests.get(f"{BASE_URL}/api/supplements/prices", timeout=10)
        
        if resp.status_code != 200:
            return log_test(1, "GET /api/supplements/prices baseline", False, 
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Check response shape
        if "meta" not in data or "prices" not in data or "count" not in data:
            return log_test(1, "GET /api/supplements/prices baseline", False,
                          "Missing required fields: meta, prices, or count")
        
        # Check meta.source
        source = data.get("meta", {}).get("source")
        if source not in ["bundled", "bundled+overlay"]:
            return log_test(1, "GET /api/supplements/prices baseline", False,
                          f"meta.source should be 'bundled' or 'bundled+overlay', got '{source}'")
        
        return log_test(1, "GET /api/supplements/prices baseline", True,
                       f"Response has correct shape. meta.source='{source}', count={data.get('count')}")
    
    except Exception as e:
        return log_test(1, "GET /api/supplements/prices baseline", False, str(e))

def test_2_post_no_token():
    """Test 2: POST without token should return 401"""
    try:
        payload = {"mode": "replace", "prices": {}}
        resp = requests.post(f"{BASE_URL}/api/supplements/prices", 
                           json=payload, timeout=10)
        
        if resp.status_code != 401:
            return log_test(2, "POST without token → 401", False,
                          f"Expected 401, got {resp.status_code}")
        
        data = resp.json()
        if "error" not in data or data["error"] != "Unauthorized":
            return log_test(2, "POST without token → 401", False,
                          f"Expected error='Unauthorized', got {data}")
        
        return log_test(2, "POST without token → 401", True,
                       "Correctly rejected with 401 Unauthorized")
    
    except Exception as e:
        return log_test(2, "POST without token → 401", False, str(e))

def test_3_post_incorrect_token():
    """Test 3: POST with incorrect token should return 401"""
    try:
        payload = {"mode": "replace", "prices": {}}
        headers = {"x-prices-admin-token": "wrong_token_12345"}
        resp = requests.post(f"{BASE_URL}/api/supplements/prices",
                           json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 401:
            return log_test(3, "POST with incorrect token → 401", False,
                          f"Expected 401, got {resp.status_code}")
        
        data = resp.json()
        if "error" not in data or data["error"] != "Unauthorized":
            return log_test(3, "POST with incorrect token → 401", False,
                          f"Expected error='Unauthorized', got {data}")
        
        return log_test(3, "POST with incorrect token → 401", True,
                       "Correctly rejected with 401 Unauthorized")
    
    except Exception as e:
        return log_test(3, "POST with incorrect token → 401", False, str(e))

def test_4_post_replace_mode():
    """Test 4: POST with correct token, mode='replace'"""
    try:
        payload = {
            "mode": "replace",
            "source": "test-agent",
            "prices": {
                "thorne::creatine": {
                    "perServing": 0.99,
                    "currency": "USD",
                    "updated": "2026-09",
                    "source": "scraped"
                },
                "test brand::test ingredient": {
                    "perServing": 1.50,
                    "currency": "USD",
                    "updated": "2026-09",
                    "source": "scraped",
                    "productUrl": "https://example.com/product"
                }
            }
        }
        headers = {"x-prices-admin-token": PRICES_ADMIN_TOKEN}
        resp = requests.post(f"{BASE_URL}/api/supplements/prices",
                           json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            return log_test(4, "POST replace mode with correct token", False,
                          f"Expected 200, got {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        # Check response shape
        if not data.get("ok"):
            return log_test(4, "POST replace mode with correct token", False,
                          f"Expected ok=true, got {data}")
        
        if data.get("mode") != "replace":
            return log_test(4, "POST replace mode with correct token", False,
                          f"Expected mode='replace', got {data.get('mode')}")
        
        if data.get("wrote") != 2:
            return log_test(4, "POST replace mode with correct token", False,
                          f"Expected wrote=2, got {data.get('wrote')}")
        
        if "updatedAt" not in data:
            return log_test(4, "POST replace mode with correct token", False,
                          "Missing updatedAt field")
        
        return log_test(4, "POST replace mode with correct token", True,
                       f"Successfully wrote 2 prices. updatedAt={data.get('updatedAt')}")
    
    except Exception as e:
        return log_test(4, "POST replace mode with correct token", False, str(e))

def test_5_get_after_replace():
    """Test 5: GET after POST should show merged prices"""
    try:
        # Small delay to ensure cache invalidation
        time.sleep(0.5)
        
        resp = requests.get(f"{BASE_URL}/api/supplements/prices", timeout=10)
        
        if resp.status_code != 200:
            return log_test(5, "GET after POST shows merged prices", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Check meta
        meta = data.get("meta", {})
        if meta.get("source") != "bundled+overlay":
            return log_test(5, "GET after POST shows merged prices", False,
                          f"Expected meta.source='bundled+overlay', got '{meta.get('source')}'")
        
        if meta.get("overlayCount") != 2:
            return log_test(5, "GET after POST shows merged prices", False,
                          f"Expected overlayCount=2, got {meta.get('overlayCount')}")
        
        # Check prices
        prices = data.get("prices", {})
        thorne_creatine = prices.get("thorne::creatine")
        
        if not thorne_creatine:
            return log_test(5, "GET after POST shows merged prices", False,
                          "thorne::creatine not found in prices")
        
        if thorne_creatine.get("perServing") != 0.99:
            return log_test(5, "GET after POST shows merged prices", False,
                          f"Expected thorne::creatine.perServing=0.99, got {thorne_creatine.get('perServing')}")
        
        return log_test(5, "GET after POST shows merged prices", True,
                       f"Prices merged correctly. thorne::creatine.perServing=0.99, overlayCount=2")
    
    except Exception as e:
        return log_test(5, "GET after POST shows merged prices", False, str(e))

def test_6_post_merge_mode():
    """Test 6: POST with mode='merge' should preserve existing keys"""
    try:
        payload = {
            "mode": "merge",
            "prices": {
                "now foods::vitamin d": {
                    "perServing": 0.11,
                    "currency": "USD",
                    "updated": "2026-09",
                    "source": "scraped"
                }
            }
        }
        headers = {"x-prices-admin-token": PRICES_ADMIN_TOKEN}
        resp = requests.post(f"{BASE_URL}/api/supplements/prices",
                           json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            return log_test(6, "POST merge mode preserves existing keys", False,
                          f"Expected 200, got {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        if not data.get("ok") or data.get("mode") != "merge" or data.get("wrote") != 1:
            return log_test(6, "POST merge mode preserves existing keys", False,
                          f"Expected ok=true, mode='merge', wrote=1, got {data}")
        
        # Verify merge preserved previous keys
        time.sleep(0.5)
        get_resp = requests.get(f"{BASE_URL}/api/supplements/prices", timeout=10)
        get_data = get_resp.json()
        prices = get_data.get("prices", {})
        
        # Should have all 3 keys now (2 from replace + 1 from merge)
        if "thorne::creatine" not in prices:
            return log_test(6, "POST merge mode preserves existing keys", False,
                          "thorne::creatine was removed (should be preserved)")
        
        if "test brand::test ingredient" not in prices:
            return log_test(6, "POST merge mode preserves existing keys", False,
                          "test brand::test ingredient was removed (should be preserved)")
        
        if "now foods::vitamin d" not in prices:
            return log_test(6, "POST merge mode preserves existing keys", False,
                          "now foods::vitamin d not found (should be added)")
        
        overlay_count = get_data.get("meta", {}).get("overlayCount", 0)
        if overlay_count != 3:
            return log_test(6, "POST merge mode preserves existing keys", False,
                          f"Expected overlayCount=3, got {overlay_count}")
        
        return log_test(6, "POST merge mode preserves existing keys", True,
                       f"Merge successful. All 3 keys present, overlayCount=3")
    
    except Exception as e:
        return log_test(6, "POST merge mode preserves existing keys", False, str(e))

def test_7_post_invalid_mode():
    """Test 7: POST with mode='delete' should return 400"""
    try:
        payload = {"mode": "delete", "prices": {}}
        headers = {"x-prices-admin-token": PRICES_ADMIN_TOKEN}
        resp = requests.post(f"{BASE_URL}/api/supplements/prices",
                           json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 400:
            return log_test(7, "POST with invalid mode → 400", False,
                          f"Expected 400, got {resp.status_code}")
        
        data = resp.json()
        if "error" not in data or 'mode must be "replace" or "merge"' not in data["error"]:
            return log_test(7, "POST with invalid mode → 400", False,
                          f"Expected mode validation error, got {data}")
        
        return log_test(7, "POST with invalid mode → 400", True,
                       "Correctly rejected invalid mode with 400")
    
    except Exception as e:
        return log_test(7, "POST with invalid mode → 400", False, str(e))

def test_8_post_malformed_json():
    """Test 8: POST with malformed JSON should return 400"""
    try:
        headers = {
            "x-prices-admin-token": PRICES_ADMIN_TOKEN,
            "Content-Type": "application/json"
        }
        # Send malformed JSON
        resp = requests.post(f"{BASE_URL}/api/supplements/prices",
                           data="{invalid json", headers=headers, timeout=10)
        
        if resp.status_code != 400:
            return log_test(8, "POST with malformed JSON → 400", False,
                          f"Expected 400, got {resp.status_code}")
        
        data = resp.json()
        if "error" not in data or "Invalid JSON" not in data["error"]:
            return log_test(8, "POST with malformed JSON → 400", False,
                          f"Expected JSON validation error, got {data}")
        
        return log_test(8, "POST with malformed JSON → 400", True,
                       "Correctly rejected malformed JSON with 400")
    
    except Exception as e:
        return log_test(8, "POST with malformed JSON → 400", False, str(e))

def test_9_post_sanitization():
    """Test 9: POST with mixed valid/invalid entries - sanitization"""
    try:
        payload = {
            "mode": "replace",
            "prices": {
                "valid::ingredient": {
                    "perServing": 0.50,
                    "currency": "USD",
                    "updated": "2026-09"
                },
                "no_delimiter_key": {
                    "perServing": 1.0
                },
                "negative::price": {
                    "perServing": -5
                },
                "toohigh::price": {
                    "perServing": 999
                },
                "badurl::key": {
                    "perServing": 1.0,
                    "productUrl": "javascript:alert(1)"
                }
            }
        }
        headers = {"x-prices-admin-token": PRICES_ADMIN_TOKEN}
        resp = requests.post(f"{BASE_URL}/api/supplements/prices",
                           json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            return log_test(9, "POST sanitization filters invalid entries", False,
                          f"Expected 200, got {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        # Only valid::ingredient should be accepted (wrote=1)
        # Note: badurl::key might be accepted with productUrl stripped
        wrote = data.get("wrote", 0)
        if wrote < 1 or wrote > 2:
            return log_test(9, "POST sanitization filters invalid entries", False,
                          f"Expected wrote=1 or 2 (valid entries only), got {wrote}")
        
        # Verify the sanitization worked
        time.sleep(0.5)
        get_resp = requests.get(f"{BASE_URL}/api/supplements/prices", timeout=10)
        get_data = get_resp.json()
        prices = get_data.get("prices", {})
        
        # valid::ingredient should be present
        if "valid::ingredient" not in prices:
            return log_test(9, "POST sanitization filters invalid entries", False,
                          "valid::ingredient was rejected (should be accepted)")
        
        # Invalid entries should be rejected
        if "no_delimiter_key" in prices:
            return log_test(9, "POST sanitization filters invalid entries", False,
                          "no_delimiter_key was accepted (should be rejected)")
        
        if "negative::price" in prices:
            return log_test(9, "POST sanitization filters invalid entries", False,
                          "negative::price was accepted (should be rejected)")
        
        if "toohigh::price" in prices:
            return log_test(9, "POST sanitization filters invalid entries", False,
                          "toohigh::price was accepted (should be rejected)")
        
        return log_test(9, "POST sanitization filters invalid entries", True,
                       f"Sanitization working correctly. wrote={wrote}, only valid entries accepted")
    
    except Exception as e:
        return log_test(9, "POST sanitization filters invalid entries", False, str(e))

def test_10_search_mthfr():
    """Test 10: GET /api/search?q=MTHFR C677T"""
    try:
        resp = requests.get(f"{BASE_URL}/api/search",
                          params={"q": "MTHFR C677T", "limit": 5},
                          timeout=15)
        
        if resp.status_code != 200:
            return log_test(10, "GET /api/search MTHFR C677T", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Check response shape
        if "total" not in data or "sources" not in data or "results" not in data:
            return log_test(10, "GET /api/search MTHFR C677T", False,
                          "Missing required fields: total, sources, or results")
        
        # Check total is between 1 and 5
        total = data.get("total", 0)
        if total < 1 or total > 5:
            return log_test(10, "GET /api/search MTHFR C677T", False,
                          f"Expected total between 1-5, got {total}")
        
        # Check sources object has expected keys
        sources = data.get("sources", {})
        expected_sources = ["pubmed", "semanticScholar", "openAlex", "crossref", 
                          "europePMC", "omim", "disgenet", "clinicalTrials"]
        for src in expected_sources:
            if src not in sources:
                return log_test(10, "GET /api/search MTHFR C677T", False,
                              f"Missing source: {src}")
        
        # Check results array
        results = data.get("results", [])
        if len(results) == 0:
            return log_test(10, "GET /api/search MTHFR C677T", False,
                          "results array is empty")
        
        # Check first result has required fields
        first = results[0]
        required_fields = ["provider", "source", "title", "journal", "url"]
        for field in required_fields:
            if field not in first:
                return log_test(10, "GET /api/search MTHFR C677T", False,
                              f"First result missing field: {field}")
        
        # Check clinicalTrials array
        if "clinicalTrials" not in data:
            return log_test(10, "GET /api/search MTHFR C677T", False,
                          "Missing clinicalTrials field")
        
        clinical_trials = data.get("clinicalTrials", [])
        
        return log_test(10, "GET /api/search MTHFR C677T", True,
                       f"Search working. total={total}, results={len(results)}, clinicalTrials={len(clinical_trials)}")
    
    except Exception as e:
        return log_test(10, "GET /api/search MTHFR C677T", False, str(e))

def test_11_search_zone2_relevance():
    """Test 11: GET /api/search zone 2 training - relevance filter"""
    try:
        resp = requests.get(f"{BASE_URL}/api/search",
                          params={"q": "zone 2 training", "limit": 10},
                          timeout=15)
        
        if resp.status_code != 200:
            return log_test(11, "GET /api/search zone 2 training relevance", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        results = data.get("results", [])
        
        if len(results) == 0:
            return log_test(11, "GET /api/search zone 2 training relevance", False,
                          "No results returned")
        
        # Check top 5 results for relevance
        top_results = results[:5]
        irrelevant_keywords = ["war zone", "work zone safety", "training zone hypermodel"]
        
        irrelevant_found = []
        for i, result in enumerate(top_results):
            title = result.get("title", "").lower()
            for keyword in irrelevant_keywords:
                if keyword in title:
                    irrelevant_found.append(f"Result {i+1}: '{result.get('title')}'")
        
        if irrelevant_found:
            return log_test(11, "GET /api/search zone 2 training relevance", False,
                          f"Irrelevant results found: {'; '.join(irrelevant_found)}")
        
        return log_test(11, "GET /api/search zone 2 training relevance", True,
                       f"Relevance filter working. {len(results)} results, top 5 are topic-relevant")
    
    except Exception as e:
        return log_test(11, "GET /api/search zone 2 training relevance", False, str(e))

def test_12_search_creatine():
    """Test 12: GET /api/search creatine supplementation"""
    try:
        resp = requests.get(f"{BASE_URL}/api/search",
                          params={"q": "creatine supplementation", "limit": 5},
                          timeout=15)
        
        if resp.status_code != 200:
            return log_test(12, "GET /api/search creatine supplementation", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        results = data.get("results", [])
        
        if len(results) == 0:
            return log_test(12, "GET /api/search creatine supplementation", False,
                          "No results returned")
        
        # Check that results are about creatine
        creatine_count = 0
        for result in results:
            title = result.get("title", "").lower()
            abstract = result.get("abstract", "").lower()
            if "creatine" in title or "creatine" in abstract:
                creatine_count += 1
        
        if creatine_count == 0:
            return log_test(12, "GET /api/search creatine supplementation", False,
                          "No results about creatine found")
        
        return log_test(12, "GET /api/search creatine supplementation", True,
                       f"{creatine_count}/{len(results)} results about creatine")
    
    except Exception as e:
        return log_test(12, "GET /api/search creatine supplementation", False, str(e))

def test_13_search_rapamycin():
    """Test 13: GET /api/search rapamycin (single-token)"""
    try:
        resp = requests.get(f"{BASE_URL}/api/search",
                          params={"q": "rapamycin", "limit": 5},
                          timeout=15)
        
        if resp.status_code != 200:
            return log_test(13, "GET /api/search rapamycin", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        results = data.get("results", [])
        
        if len(results) == 0:
            return log_test(13, "GET /api/search rapamycin", False,
                          "No results returned")
        
        # Check that results are about rapamycin
        rapamycin_count = 0
        for result in results:
            title = result.get("title", "").lower()
            abstract = result.get("abstract", "").lower()
            if "rapamycin" in title or "rapamycin" in abstract:
                rapamycin_count += 1
        
        if rapamycin_count == 0:
            return log_test(13, "GET /api/search rapamycin", False,
                          "No results about rapamycin found")
        
        return log_test(13, "GET /api/search rapamycin", True,
                       f"{rapamycin_count}/{len(results)} results about rapamycin")
    
    except Exception as e:
        return log_test(13, "GET /api/search rapamycin", False, str(e))

def test_14_semantic_expand():
    """Test 14: POST /api/semantic-expand"""
    try:
        payload = {"query": "MTHFR"}
        resp = requests.post(f"{BASE_URL}/api/semantic-expand",
                           json=payload, timeout=15)
        
        if resp.status_code != 200:
            return log_test(14, "POST /api/semantic-expand", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        if "expansions" not in data:
            return log_test(14, "POST /api/semantic-expand", False,
                          "Missing expansions field")
        
        expansions = data.get("expansions")
        if not isinstance(expansions, list):
            return log_test(14, "POST /api/semantic-expand", False,
                          f"expansions should be array, got {type(expansions)}")
        
        # Empty array is acceptable on LLM 429
        return log_test(14, "POST /api/semantic-expand", True,
                       f"Endpoint working. expansions={len(expansions)} terms")
    
    except Exception as e:
        return log_test(14, "POST /api/semantic-expand", False, str(e))

def test_15_semantic_rerank():
    """Test 15: POST /api/semantic-rerank"""
    try:
        payload = {
            "query": "MTHFR",
            "items": [
                {"id": "a", "title": "MTHFR gene polymorphism"},
                {"id": "b", "title": "Unrelated cardiology study"}
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/semantic-rerank",
                           json=payload, timeout=15)
        
        if resp.status_code != 200:
            return log_test(15, "POST /api/semantic-rerank", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        if "order" not in data:
            return log_test(15, "POST /api/semantic-rerank", False,
                          "Missing order field")
        
        # order can be null or array
        order = data.get("order")
        if order is not None and not isinstance(order, list):
            return log_test(15, "POST /api/semantic-rerank", False,
                          f"order should be array or null, got {type(order)}")
        
        return log_test(15, "POST /api/semantic-rerank", True,
                       f"Endpoint working. order={order}")
    
    except Exception as e:
        return log_test(15, "POST /api/semantic-rerank", False, str(e))

def test_16_clinical_trials_gene():
    """Test 16: GET /api/clinical-trials/gene?gene=MTHFR"""
    try:
        resp = requests.get(f"{BASE_URL}/api/clinical-trials/gene",
                          params={"gene": "MTHFR"},
                          timeout=15)
        
        if resp.status_code != 200:
            return log_test(16, "GET /api/clinical-trials/gene MTHFR", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Check required fields
        required_fields = ["gene", "total", "recruiting", "completed", 
                         "terminated", "other", "active", "top"]
        for field in required_fields:
            if field not in data:
                return log_test(16, "GET /api/clinical-trials/gene MTHFR", False,
                              f"Missing field: {field}")
        
        if data.get("gene") != "MTHFR":
            return log_test(16, "GET /api/clinical-trials/gene MTHFR", False,
                          f"Expected gene='MTHFR', got '{data.get('gene')}'")
        
        return log_test(16, "GET /api/clinical-trials/gene MTHFR", True,
                       f"Endpoint working. total={data.get('total')}, recruiting={data.get('recruiting')}")
    
    except Exception as e:
        return log_test(16, "GET /api/clinical-trials/gene MTHFR", False, str(e))

def test_17_pubmed_search():
    """Test 17: GET /api/pubmed-search?gene=COMT"""
    try:
        resp = requests.get(f"{BASE_URL}/api/pubmed-search",
                          params={"gene": "COMT", "limit": 2},
                          timeout=15)
        
        if resp.status_code != 200:
            return log_test(17, "GET /api/pubmed-search COMT", False,
                          f"Expected 200, got {resp.status_code}")
        
        # Just verify it returns 200 - this endpoint is separate and unaffected
        return log_test(17, "GET /api/pubmed-search COMT", True,
                       "Endpoint working (separate endpoint, unaffected by refactor)")
    
    except Exception as e:
        return log_test(17, "GET /api/pubmed-search COMT", False, str(e))

def test_18_supplements_dsld_search():
    """Test 18: GET /api/supplements/dsld/search?q=methylfolate"""
    try:
        resp = requests.get(f"{BASE_URL}/api/supplements/dsld/search",
                          params={"q": "methylfolate", "size": 3},
                          timeout=15)
        
        if resp.status_code != 200:
            return log_test(18, "GET /api/supplements/dsld/search", False,
                          f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        if "results" not in data:
            return log_test(18, "GET /api/supplements/dsld/search", False,
                          "Missing results field")
        
        results = data.get("results", [])
        if len(results) > 3:
            return log_test(18, "GET /api/supplements/dsld/search", False,
                          f"Expected max 3 results, got {len(results)}")
        
        return log_test(18, "GET /api/supplements/dsld/search", True,
                       f"Endpoint working. {len(results)} results returned")
    
    except Exception as e:
        return log_test(18, "GET /api/supplements/dsld/search", False, str(e))

def test_19_nutrition_product():
    """Test 19: GET /api/nutrition/product?barcode=0038000845017"""
    try:
        resp = requests.get(f"{BASE_URL}/api/nutrition/product",
                          params={"barcode": "0038000845017"},
                          timeout=15)
        
        if resp.status_code != 200:
            return log_test(19, "GET /api/nutrition/product barcode", False,
                          f"Expected 200, got {resp.status_code}")
        
        # Just verify it returns 200 - this endpoint is separate and unaffected
        return log_test(19, "GET /api/nutrition/product barcode", True,
                       "Endpoint working (separate endpoint, unaffected by refactor)")
    
    except Exception as e:
        return log_test(19, "GET /api/nutrition/product barcode", False, str(e))

def cleanup_prices():
    """Cleanup: Reset prices overlay to empty"""
    try:
        print("\n\n=== CLEANUP: Resetting prices overlay ===")
        payload = {"mode": "replace", "prices": {}}
        headers = {"x-prices-admin-token": PRICES_ADMIN_TOKEN}
        resp = requests.post(f"{BASE_URL}/api/supplements/prices",
                           json=payload, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            print("✅ Prices overlay reset successfully")
        else:
            print(f"⚠️  Cleanup warning: Failed to reset prices overlay (status {resp.status_code})")
    except Exception as e:
        print(f"⚠️  Cleanup warning: {e}")

def main():
    print("=" * 80)
    print("SelfScience Backend Testing")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Started at: {datetime.now().isoformat()}")
    print("=" * 80)
    
    # Test 1: POST /api/supplements/prices feature (Tests 1-9)
    print("\n\n### FEATURE 1: POST /api/supplements/prices (Admin-token gated)")
    print("=" * 80)
    
    test_1_get_prices_baseline()
    test_2_post_no_token()
    test_3_post_incorrect_token()
    test_4_post_replace_mode()
    test_5_get_after_replace()
    test_6_post_merge_mode()
    test_7_post_invalid_mode()
    test_8_post_malformed_json()
    test_9_post_sanitization()
    
    # Test 2: Search adapter refactor (Tests 10-19)
    print("\n\n### FEATURE 2: Search Adapter Refactor Regression Check")
    print("=" * 80)
    
    test_10_search_mthfr()
    test_11_search_zone2_relevance()
    test_12_search_creatine()
    test_13_search_rapamycin()
    test_14_semantic_expand()
    test_15_semantic_rerank()
    test_16_clinical_trials_gene()
    test_17_pubmed_search()
    test_18_supplements_dsld_search()
    test_19_nutrition_product()
    
    # Cleanup
    cleanup_prices()
    
    # Summary
    print("\n\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for r in test_results if r["passed"])
    failed = sum(1 for r in test_results if not r["passed"])
    total = len(test_results)
    
    print(f"\nTotal Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if failed > 0:
        print("\n\nFailed Tests:")
        for r in test_results:
            if not r["passed"]:
                print(f"  ❌ Test {r['test']}: {r['description']}")
                if r["details"]:
                    print(f"     {r['details']}")
    
    print("\n" + "=" * 80)
    print(f"Completed at: {datetime.now().isoformat()}")
    print("=" * 80)
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
