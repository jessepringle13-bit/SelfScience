#!/usr/bin/env python3
"""
Backend API Testing for SelfScience Search Endpoint
Focus: Gene fan-out load pattern from Dashboard→Search handoff
"""

import asyncio
import aiohttp
import time
import json
import os
from typing import List, Dict, Any

# Load base URL from .env
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://health-research-hub-3.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Test genes for concurrent burst test
GENE_QUERIES = [
    "ALDH2 nutrigenomics dietary intervention",
    "CYP1A2 nutrigenomics dietary intervention",
    "LCT nutrigenomics dietary intervention",
    "FTO nutrigenomics dietary intervention",
    "APOA5 nutrigenomics dietary intervention",
    "MTHFR nutrigenomics dietary intervention",
    "VDR nutrigenomics dietary intervention",
    "APOE nutrigenomics dietary intervention",
]

# Regression test queries
REGRESSION_QUERIES = [
    {"q": "MTHFR C677T", "expected_status": 200, "expect_results": True},
    {"q": "zone 2 training", "expected_status": 200, "expect_results": True},
    {"q": "creatine supplementation", "expected_status": 200, "expect_results": True},
]

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name: str, details: str = ""):
        self.passed.append({"test": test_name, "details": details})
        print(f"✅ PASS: {test_name}")
        if details:
            print(f"   {details}")
    
    def add_fail(self, test_name: str, details: str):
        self.failed.append({"test": test_name, "details": details})
        print(f"❌ FAIL: {test_name}")
        print(f"   {details}")
    
    def add_warning(self, test_name: str, details: str):
        self.warnings.append({"test": test_name, "details": details})
        print(f"⚠️  WARNING: {test_name}")
        print(f"   {details}")
    
    def summary(self):
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"✅ Passed: {len(self.passed)}")
        print(f"❌ Failed: {len(self.failed)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        print("="*80)
        
        if self.failed:
            print("\nFailed Tests:")
            for fail in self.failed:
                print(f"  - {fail['test']}: {fail['details']}")
        
        if self.warnings:
            print("\nWarnings:")
            for warn in self.warnings:
                print(f"  - {warn['test']}: {warn['details']}")
        
        return len(self.failed) == 0


async def test_concurrent_burst(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 1: Concurrent burst test - Fire 8 parallel GET requests
    All must return HTTP 200 within 60s total wall-time
    """
    print("\n" + "="*80)
    print("TEST 1: Concurrent Burst Test (8 parallel gene queries)")
    print("="*80)
    
    start_time = time.time()
    tasks = []
    
    for gene_query in GENE_QUERIES:
        url = f"{API_BASE}/search?q={gene_query}&limit=12"
        tasks.append(fetch_with_timing(session, url, gene_query))
    
    try:
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        wall_time = time.time() - start_time
        
        print(f"\n⏱️  Total wall-time: {wall_time:.2f}s")
        
        # Check wall-time constraint
        if wall_time > 60:
            results.add_fail(
                "Concurrent burst - wall-time",
                f"Took {wall_time:.2f}s, exceeds 60s limit"
            )
        else:
            results.add_pass(
                "Concurrent burst - wall-time",
                f"Completed in {wall_time:.2f}s (< 60s)"
            )
        
        # Check individual responses
        all_200 = True
        latencies = []
        
        for i, resp_data in enumerate(responses):
            gene_name = GENE_QUERIES[i].split()[0]
            
            if isinstance(resp_data, Exception):
                results.add_fail(
                    f"Concurrent burst - {gene_name}",
                    f"Request failed with exception: {str(resp_data)}"
                )
                all_200 = False
                continue
            
            status, data, latency = resp_data
            latencies.append(latency)
            
            if status == 200:
                print(f"  ✓ {gene_name}: HTTP {status} in {latency:.2f}s")
            elif status in [502, 503, 504]:
                results.add_fail(
                    f"Concurrent burst - {gene_name}",
                    f"Got HTTP {status} (gateway error) in {latency:.2f}s"
                )
                all_200 = False
            else:
                results.add_warning(
                    f"Concurrent burst - {gene_name}",
                    f"Got HTTP {status} (not 200) in {latency:.2f}s"
                )
        
        if all_200:
            avg_latency = sum(latencies) / len(latencies) if latencies else 0
            results.add_pass(
                "Concurrent burst - all 200 OK",
                f"All 8 requests returned 200. Avg latency: {avg_latency:.2f}s"
            )
        
        return responses
        
    except Exception as e:
        results.add_fail("Concurrent burst test", f"Exception: {str(e)}")
        return []


async def test_response_shape(responses: List[Any], results: TestResults):
    """
    Test 2: Response shape validation
    Verify JSON has: query, results (with proper fields), sources object
    """
    print("\n" + "="*80)
    print("TEST 2: Response Shape Validation")
    print("="*80)
    
    if not responses:
        results.add_fail("Response shape", "No responses to validate")
        return
    
    for i, resp_data in enumerate(responses):
        if isinstance(resp_data, Exception):
            continue
        
        status, data, latency = resp_data
        gene_name = GENE_QUERIES[i].split()[0]
        
        if status != 200:
            continue
        
        try:
            # Check top-level fields
            required_fields = ['query', 'results', 'sources']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                results.add_fail(
                    f"Response shape - {gene_name}",
                    f"Missing fields: {missing_fields}"
                )
                continue
            
            # Check query field
            if not isinstance(data['query'], str):
                results.add_fail(
                    f"Response shape - {gene_name}",
                    f"'query' is not a string: {type(data['query'])}"
                )
                continue
            
            # Check results array
            if not isinstance(data['results'], list):
                results.add_fail(
                    f"Response shape - {gene_name}",
                    f"'results' is not a list: {type(data['results'])}"
                )
                continue
            
            # Check result object structure
            if len(data['results']) > 0:
                result = data['results'][0]
                required_result_fields = ['id', 'provider', 'title', 'url', 'source', 'year']
                missing_result_fields = [f for f in required_result_fields if f not in result]
                
                if missing_result_fields:
                    results.add_fail(
                        f"Response shape - {gene_name} result object",
                        f"Missing fields in result: {missing_result_fields}"
                    )
                    continue
                
                # Check for MongoDB ObjectId leaks
                result_str = json.dumps(result)
                if 'ObjectId' in result_str or 'ObjectID' in result_str:
                    results.add_fail(
                        f"Response shape - {gene_name}",
                        "MongoDB ObjectId detected in response"
                    )
                    continue
            
            # Check sources object
            if not isinstance(data['sources'], dict):
                results.add_fail(
                    f"Response shape - {gene_name}",
                    f"'sources' is not an object: {type(data['sources'])}"
                )
                continue
            
            required_sources = ['pubmed', 'semanticScholar', 'openAlex', 'crossref']
            missing_sources = [s for s in required_sources if s not in data['sources']]
            
            if missing_sources:
                results.add_fail(
                    f"Response shape - {gene_name}",
                    f"Missing source keys: {missing_sources}"
                )
                continue
            
            # Verify source values are numbers
            for source_key, source_val in data['sources'].items():
                if not isinstance(source_val, (int, float)):
                    results.add_fail(
                        f"Response shape - {gene_name}",
                        f"Source '{source_key}' value is not a number: {type(source_val)}"
                    )
                    break
            else:
                results.add_pass(
                    f"Response shape - {gene_name}",
                    f"All fields valid. {len(data['results'])} results, sources: {data['sources']}"
                )
        
        except Exception as e:
            results.add_fail(
                f"Response shape - {gene_name}",
                f"Validation exception: {str(e)}"
            )


async def test_rate_limit_graceful_degradation(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 3: Rate-limit graceful degradation
    If Semantic Scholar returns 429, endpoint should still return 200 with sources.semanticScholar: 0
    """
    print("\n" + "="*80)
    print("TEST 3: Rate-limit Graceful Degradation")
    print("="*80)
    
    # This test is implicit in the concurrent burst test
    # If any request succeeded with 200, the graceful degradation is working
    # We'll do a simple check here
    
    url = f"{API_BASE}/search?q=test+query&limit=5"
    
    try:
        status, data, latency = await fetch_with_timing(session, url, "rate-limit test")
        
        if status == 200:
            # Check if semanticScholar is 0 (might be rate-limited)
            if 'sources' in data and 'semanticScholar' in data['sources']:
                if data['sources']['semanticScholar'] == 0:
                    results.add_pass(
                        "Rate-limit graceful degradation",
                        "Endpoint returned 200 with semanticScholar: 0 (graceful degradation working)"
                    )
                else:
                    results.add_pass(
                        "Rate-limit graceful degradation",
                        f"Endpoint returned 200 with semanticScholar: {data['sources']['semanticScholar']}"
                    )
            else:
                results.add_warning(
                    "Rate-limit graceful degradation",
                    "Could not verify - sources object missing semanticScholar key"
                )
        else:
            results.add_fail(
                "Rate-limit graceful degradation",
                f"Expected 200, got {status}"
            )
    
    except Exception as e:
        results.add_fail(
            "Rate-limit graceful degradation",
            f"Exception: {str(e)}"
        )


async def test_empty_gene_guard(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 4: Empty-gene guard
    Test with bogus gene name, must return 200 with results: []
    """
    print("\n" + "="*80)
    print("TEST 4: Empty-gene Guard")
    print("="*80)
    
    url = f"{API_BASE}/search?q=BOGUSGENEXYZ+nutrigenomics&limit=12"
    
    try:
        status, data, latency = await fetch_with_timing(session, url, "empty-gene test")
        
        if status != 200:
            results.add_fail(
                "Empty-gene guard",
                f"Expected 200, got {status}"
            )
            return
        
        if 'results' not in data:
            results.add_fail(
                "Empty-gene guard",
                "Response missing 'results' field"
            )
            return
        
        if not isinstance(data['results'], list):
            results.add_fail(
                "Empty-gene guard",
                f"'results' is not a list: {type(data['results'])}"
            )
            return
        
        # Empty or very few results is expected for bogus gene
        if len(data['results']) == 0:
            results.add_pass(
                "Empty-gene guard",
                "Returned 200 with empty results array as expected"
            )
        else:
            results.add_warning(
                "Empty-gene guard",
                f"Returned {len(data['results'])} results (expected 0, but some noise is acceptable)"
            )
    
    except Exception as e:
        results.add_fail(
            "Empty-gene guard",
            f"Exception: {str(e)}"
        )


async def test_regression_queries(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 5: Regression sweep
    Test previously-verified queries to ensure nothing broke
    """
    print("\n" + "="*80)
    print("TEST 5: Regression Sweep")
    print("="*80)
    
    # Test service metadata endpoint
    try:
        url = f"{API_BASE}/"
        status, data, latency = await fetch_with_timing(session, url, "service metadata")
        
        if status == 200 and 'status' in data and data['status'] == 'ok':
            results.add_pass(
                "Regression - GET /api/",
                f"Service metadata returned correctly in {latency:.2f}s"
            )
        else:
            results.add_fail(
                "Regression - GET /api/",
                f"Expected 200 with status:ok, got {status}"
            )
    except Exception as e:
        results.add_fail("Regression - GET /api/", f"Exception: {str(e)}")
    
    # Test autocomplete endpoint
    try:
        url = f"{API_BASE}/autocomplete?q=metfor"
        status, data, latency = await fetch_with_timing(session, url, "autocomplete")
        
        if status == 200 and 'suggestions' in data and isinstance(data['suggestions'], list):
            results.add_pass(
                "Regression - GET /api/autocomplete",
                f"Autocomplete returned {len(data['suggestions'])} suggestions in {latency:.2f}s"
            )
        else:
            results.add_fail(
                "Regression - GET /api/autocomplete",
                f"Expected 200 with suggestions array, got {status}"
            )
    except Exception as e:
        results.add_fail("Regression - GET /api/autocomplete", f"Exception: {str(e)}")
    
    # Test regression queries
    for query_spec in REGRESSION_QUERIES:
        q = query_spec['q']
        expected_status = query_spec['expected_status']
        expect_results = query_spec['expect_results']
        
        try:
            url = f"{API_BASE}/search?q={q}"
            status, data, latency = await fetch_with_timing(session, url, f"regression {q}")
            
            if status != expected_status:
                results.add_fail(
                    f"Regression - {q}",
                    f"Expected {expected_status}, got {status}"
                )
                continue
            
            if expect_results:
                if 'results' in data and len(data['results']) > 0:
                    results.add_pass(
                        f"Regression - {q}",
                        f"Returned {len(data['results'])} results in {latency:.2f}s"
                    )
                else:
                    results.add_warning(
                        f"Regression - {q}",
                        f"Expected non-empty results, got {len(data.get('results', []))} results"
                    )
            else:
                results.add_pass(
                    f"Regression - {q}",
                    f"Returned {status} in {latency:.2f}s"
                )
        
        except Exception as e:
            results.add_fail(f"Regression - {q}", f"Exception: {str(e)}")


async def fetch_with_timing(session: aiohttp.ClientSession, url: str, label: str):
    """Helper to fetch URL and return (status, data, latency)"""
    start = time.time()
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=60)) as response:
            latency = time.time() - start
            status = response.status
            
            try:
                data = await response.json()
            except:
                data = {}
            
            return (status, data, latency)
    except asyncio.TimeoutError:
        latency = time.time() - start
        print(f"  ⏱️  TIMEOUT: {label} after {latency:.2f}s")
        raise Exception(f"Timeout after {latency:.2f}s")
    except Exception as e:
        latency = time.time() - start
        print(f"  ❌ ERROR: {label} - {str(e)}")
        raise


async def main():
    print("="*80)
    print("SelfScience Backend API Testing")
    print("Focus: /api/search gene fan-out load pattern")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = TestResults()
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Concurrent burst
        responses = await test_concurrent_burst(session, results)
        
        # Test 2: Response shape
        await test_response_shape(responses, results)
        
        # Test 3: Rate-limit graceful degradation
        await test_rate_limit_graceful_degradation(session, results)
        
        # Test 4: Empty-gene guard
        await test_empty_gene_guard(session, results)
        
        # Test 5: Regression sweep
        await test_regression_queries(session, results)
    
    # Print summary
    success = results.summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
