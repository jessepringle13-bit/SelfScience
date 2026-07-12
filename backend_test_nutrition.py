#!/usr/bin/env python3
"""
Backend API Testing for SelfScience Nutrition Product Endpoint
Focus: Open Food Facts proxy endpoint validation
"""

import asyncio
import aiohttp
import time
import json
import os
from typing import Dict, Any, Optional

# Load base URL from .env
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://health-research-hub-3.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

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


def validate_product_shape(product: Dict[str, Any], test_name: str, results: TestResults) -> bool:
    """Validate that a product has all required fields with correct types"""
    required_fields = {
        'name': str,
        'brand': str,
        'barcode': str,
        'image': (str, type(None)),
        'ingredients_text': str,
        'ingredients': list,
        'allergens': list,
        'additives': list,
        'nutriments': dict,
        'nutriscore': (str, type(None)),
        'nova_group': (int, type(None)),
        'serving_size': (str, type(None)),
    }
    
    nutriment_fields = [
        'energy_kcal', 'protein', 'carbs', 'sugars', 
        'fat', 'saturated_fat', 'fiber', 'sodium'
    ]
    
    # Check all required fields exist
    missing_fields = []
    for field, expected_type in required_fields.items():
        if field not in product:
            missing_fields.append(field)
            continue
        
        # Check type
        if not isinstance(product[field], expected_type):
            results.add_fail(
                f"{test_name} - Field type validation",
                f"Field '{field}' has wrong type. Expected {expected_type}, got {type(product[field])}"
            )
            return False
    
    if missing_fields:
        results.add_fail(
            f"{test_name} - Missing fields",
            f"Product missing required fields: {', '.join(missing_fields)}"
        )
        return False
    
    # Check nutriments structure
    if not isinstance(product['nutriments'], dict):
        results.add_fail(
            f"{test_name} - Nutriments validation",
            f"nutriments must be a dict, got {type(product['nutriments'])}"
        )
        return False
    
    missing_nutriments = []
    for field in nutriment_fields:
        if field not in product['nutriments']:
            missing_nutriments.append(field)
    
    if missing_nutriments:
        results.add_fail(
            f"{test_name} - Nutriments fields",
            f"nutriments missing required fields: {', '.join(missing_nutriments)}"
        )
        return False
    
    return True


async def test_barcode_valid_product(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 1: Barcode lookup with known valid product (Pringles)
    Expected: HTTP 200, valid product shape, name non-empty, ingredients contain relevant text
    """
    print("\n" + "="*80)
    print("TEST 1: Barcode Lookup - Valid Product (0038000845017)")
    print("="*80)
    
    url = f"{API_BASE}/nutrition/product?barcode=0038000845017"
    
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            status = response.status
            
            if status != 200:
                results.add_fail(
                    "Valid barcode lookup - Status code",
                    f"Expected 200, got {status}"
                )
                return
            
            results.add_pass("Valid barcode lookup - Status code", "HTTP 200")
            
            data = await response.json()
            
            # Check response has 'product' key
            if 'product' not in data:
                results.add_fail(
                    "Valid barcode lookup - Response structure",
                    "Response missing 'product' key"
                )
                return
            
            results.add_pass("Valid barcode lookup - Response structure", "Has 'product' key")
            
            product = data['product']
            
            # Validate product shape
            if not validate_product_shape(product, "Valid barcode lookup", results):
                return
            
            results.add_pass("Valid barcode lookup - Product shape", "All required fields present")
            
            # Check name is non-empty
            if not product['name'] or product['name'] == 'Unknown product':
                results.add_fail(
                    "Valid barcode lookup - Product name",
                    f"Product name is empty or unknown: '{product['name']}'"
                )
                return
            
            results.add_pass("Valid barcode lookup - Product name", f"Name: {product['name']}")
            
            # Check ingredients_text contains relevant keywords (Pringles-style)
            ingredients_lower = product['ingredients_text'].lower()
            relevant_keywords = ['potato', 'corn', 'wheat', 'rice', 'oil', 'salt']
            found_keywords = [kw for kw in relevant_keywords if kw in ingredients_lower]
            
            if not found_keywords:
                results.add_warning(
                    "Valid barcode lookup - Ingredients",
                    f"No typical Pringles ingredients found in: {product['ingredients_text'][:100]}"
                )
            else:
                results.add_pass(
                    "Valid barcode lookup - Ingredients",
                    f"Found keywords: {', '.join(found_keywords)}"
                )
            
    except asyncio.TimeoutError:
        results.add_fail("Valid barcode lookup - Timeout", "Request timed out after 15s")
    except Exception as e:
        results.add_fail("Valid barcode lookup - Exception", str(e))


async def test_barcode_invalid(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 2: Barcode lookup with invalid/unknown barcode
    Expected: HTTP 404 with error message
    """
    print("\n" + "="*80)
    print("TEST 2: Barcode Lookup - Invalid Barcode (0000000000000)")
    print("="*80)
    
    url = f"{API_BASE}/nutrition/product?barcode=0000000000000"
    
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            status = response.status
            
            if status != 404:
                results.add_fail(
                    "Invalid barcode lookup - Status code",
                    f"Expected 404, got {status}"
                )
                return
            
            results.add_pass("Invalid barcode lookup - Status code", "HTTP 404")
            
            data = await response.json()
            
            # Check response has 'error' key
            if 'error' not in data:
                results.add_fail(
                    "Invalid barcode lookup - Response structure",
                    "Response missing 'error' key"
                )
                return
            
            if data['error'] != 'Product not found':
                results.add_fail(
                    "Invalid barcode lookup - Error message",
                    f"Expected 'Product not found', got '{data['error']}'"
                )
                return
            
            results.add_pass("Invalid barcode lookup - Error message", "Correct error message")
            
    except asyncio.TimeoutError:
        results.add_fail("Invalid barcode lookup - Timeout", "Request timed out after 15s")
    except Exception as e:
        results.add_fail("Invalid barcode lookup - Exception", str(e))


async def test_text_query_search(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 3: Text query search for products
    Expected: HTTP 200 with products array (up to 10), each with valid shape
    """
    print("\n" + "="*80)
    print("TEST 3: Text Query Search (oatly oat milk)")
    print("="*80)
    
    url = f"{API_BASE}/nutrition/product?query=oatly%20oat%20milk"
    
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            status = response.status
            
            if status != 200:
                results.add_fail(
                    "Text query search - Status code",
                    f"Expected 200, got {status}"
                )
                return
            
            results.add_pass("Text query search - Status code", "HTTP 200")
            
            data = await response.json()
            
            # Check response has 'products' key
            if 'products' not in data:
                results.add_fail(
                    "Text query search - Response structure",
                    "Response missing 'products' key"
                )
                return
            
            results.add_pass("Text query search - Response structure", "Has 'products' key")
            
            products = data['products']
            
            if not isinstance(products, list):
                results.add_fail(
                    "Text query search - Products type",
                    f"products must be a list, got {type(products)}"
                )
                return
            
            results.add_pass("Text query search - Products type", "products is a list")
            
            # Check we have at least 1 product
            if len(products) == 0:
                results.add_fail(
                    "Text query search - Results count",
                    "Expected at least 1 product, got 0"
                )
                return
            
            results.add_pass(
                "Text query search - Results count",
                f"Got {len(products)} products (expected 1-10)"
            )
            
            # Check we don't have more than 10 products
            if len(products) > 10:
                results.add_warning(
                    "Text query search - Max results",
                    f"Got {len(products)} products, expected max 10"
                )
            
            # Validate shape of first product
            if products:
                if not validate_product_shape(products[0], "Text query search", results):
                    return
                
                results.add_pass(
                    "Text query search - Product shape",
                    f"First product validated: {products[0]['name']}"
                )
            
    except asyncio.TimeoutError:
        results.add_fail("Text query search - Timeout", "Request timed out after 15s")
    except Exception as e:
        results.add_fail("Text query search - Exception", str(e))


async def test_missing_parameters(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 4: Request with no barcode or query parameter
    Expected: HTTP 400 with error message
    """
    print("\n" + "="*80)
    print("TEST 4: Missing Parameters")
    print("="*80)
    
    url = f"{API_BASE}/nutrition/product"
    
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            status = response.status
            
            if status != 400:
                results.add_fail(
                    "Missing parameters - Status code",
                    f"Expected 400, got {status}"
                )
                return
            
            results.add_pass("Missing parameters - Status code", "HTTP 400")
            
            data = await response.json()
            
            # Check response has 'error' key
            if 'error' not in data:
                results.add_fail(
                    "Missing parameters - Response structure",
                    "Response missing 'error' key"
                )
                return
            
            if data['error'] != 'Provide barcode or query':
                results.add_fail(
                    "Missing parameters - Error message",
                    f"Expected 'Provide barcode or query', got '{data['error']}'"
                )
                return
            
            results.add_pass("Missing parameters - Error message", "Correct error message")
            
    except asyncio.TimeoutError:
        results.add_fail("Missing parameters - Timeout", "Request timed out after 15s")
    except Exception as e:
        results.add_fail("Missing parameters - Exception", str(e))


async def test_regression_endpoints(session: aiohttp.ClientSession, results: TestResults):
    """
    Test 5: Regression check - verify previously working endpoints still work
    """
    print("\n" + "="*80)
    print("TEST 5: Regression Check - Previously Verified Endpoints")
    print("="*80)
    
    # Test /api/search
    try:
        url = f"{API_BASE}/search?q=MTHFR%20C677T"
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data and len(data['results']) > 0:
                    results.add_pass("Regression - /api/search", "Returns 200 with results")
                else:
                    results.add_fail("Regression - /api/search", "Returns 200 but no results")
            else:
                results.add_fail("Regression - /api/search", f"Expected 200, got {response.status}")
    except Exception as e:
        results.add_fail("Regression - /api/search", str(e))
    
    # Test /api/autocomplete
    try:
        url = f"{API_BASE}/autocomplete?q=metfor"
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status == 200:
                results.add_pass("Regression - /api/autocomplete", "Returns 200")
            else:
                results.add_fail("Regression - /api/autocomplete", f"Expected 200, got {response.status}")
    except Exception as e:
        results.add_fail("Regression - /api/autocomplete", str(e))
    
    # Test /api/ (service metadata)
    try:
        url = f"{API_BASE}/"
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status == 200:
                data = await response.json()
                if 'status' in data and data['status'] == 'ok':
                    results.add_pass("Regression - /api/ metadata", "Returns 200 with status ok")
                else:
                    results.add_fail("Regression - /api/ metadata", "Returns 200 but invalid metadata")
            else:
                results.add_fail("Regression - /api/ metadata", f"Expected 200, got {response.status}")
    except Exception as e:
        results.add_fail("Regression - /api/ metadata", str(e))


async def main():
    print("="*80)
    print("NUTRITION PRODUCT ENDPOINT TESTING")
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print("="*80)
    
    results = TestResults()
    
    async with aiohttp.ClientSession() as session:
        # Run all tests
        await test_barcode_valid_product(session, results)
        await test_barcode_invalid(session, results)
        await test_text_query_search(session, results)
        await test_missing_parameters(session, results)
        await test_regression_endpoints(session, results)
    
    # Print summary
    success = results.summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
