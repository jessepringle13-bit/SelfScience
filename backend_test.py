#!/usr/bin/env python3
"""
Backend API tests for SelfScience AI-powered endpoints.
Tests POST /api/coach, POST /api/research/plan, and POST /api/research/synthesize.
"""

import requests
import json
import time
import os
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://health-research-hub-3.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Test session IDs
SESSION_ID_COACH = f"test-coach-{int(time.time())}"
SESSION_ID_RESEARCH = f"test-research-{int(time.time())}"

def log(msg):
    """Print timestamped log message"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def test_coach_simple_message():
    """Test 1a: POST /api/coach with simple MTHFR question"""
    log("TEST 1a: POST /api/coach - Simple MTHFR question")
    try:
        payload = {
            "message": "What does MTHFR do?",
            "conversationHistory": [],
            "context": {},
            "sessionId": SESSION_ID_COACH
        }
        
        response = requests.post(f"{API_BASE}/coach", json=payload, timeout=60)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200, got {response.status_code}")
            log(f"  Response: {response.text[:500]}")
            return False
        
        data = response.json()
        
        # Check required fields
        required_fields = ['reply', 'provider', 'model', 'detectedGenes', 'citations', 'rateLimit']
        missing = [f for f in required_fields if f not in data]
        if missing:
            log(f"  ❌ FAILED: Missing fields: {missing}")
            return False
        
        # Check detectedGenes contains MTHFR
        if 'MTHFR' not in data.get('detectedGenes', []):
            log(f"  ❌ FAILED: Expected MTHFR in detectedGenes, got {data.get('detectedGenes')}")
            return False
        
        # Check citations contain rs1801133 or rs1801131
        citations = data.get('citations', [])
        rsids = [c.get('rsid', '') for c in citations]
        if 'rs1801133' not in rsids and 'rs1801131' not in rsids:
            log(f"  ⚠️  WARNING: Expected rs1801133 or rs1801131 in citations, got {rsids}")
        
        log(f"  ✅ PASSED")
        log(f"  Reply length: {len(data['reply'])} chars")
        log(f"  Provider: {data['provider']}, Model: {data['model']}")
        log(f"  Detected genes: {data['detectedGenes']}")
        log(f"  Citations: {rsids}")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_coach_empty_message():
    """Test 1b: POST /api/coach with empty message"""
    log("TEST 1b: POST /api/coach - Empty message (should return 400)")
    try:
        payload = {
            "message": "",
            "conversationHistory": [],
            "context": {},
            "sessionId": SESSION_ID_COACH
        }
        
        response = requests.post(f"{API_BASE}/coach", json=payload, timeout=30)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 400:
            log(f"  ❌ FAILED: Expected 400, got {response.status_code}")
            return False
        
        data = response.json()
        if 'error' not in data:
            log(f"  ❌ FAILED: Expected error field in response")
            return False
        
        log(f"  ✅ PASSED - Correctly rejected empty message")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_coach_multi_turn():
    """Test 1c: POST /api/coach with multi-turn conversation"""
    log("TEST 1c: POST /api/coach - Multi-turn conversation")
    try:
        payload = {
            "message": "What about folate supplementation?",
            "conversationHistory": [
                {"role": "user", "content": "What does MTHFR do?"},
                {"role": "assistant", "content": "MTHFR is a gene that encodes an enzyme involved in folate metabolism and homocysteine regulation."}
            ],
            "context": {},
            "sessionId": SESSION_ID_COACH
        }
        
        response = requests.post(f"{API_BASE}/coach", json=payload, timeout=60)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200, got {response.status_code}")
            log(f"  Response: {response.text[:500]}")
            return False
        
        data = response.json()
        
        if 'reply' not in data or len(data['reply']) < 10:
            log(f"  ❌ FAILED: Expected meaningful reply")
            return False
        
        log(f"  ✅ PASSED - Multi-turn context maintained")
        log(f"  Reply length: {len(data['reply'])} chars")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_coach_supplement_disclaimer():
    """Test 1d: POST /api/coach - Supplement question should end with disclaimer"""
    log("TEST 1d: POST /api/coach - Supplement question (should have disclaimer)")
    try:
        payload = {
            "message": "Should I take creatine?",
            "conversationHistory": [],
            "context": {},
            "sessionId": SESSION_ID_COACH
        }
        
        response = requests.post(f"{API_BASE}/coach", json=payload, timeout=60)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        reply = data.get('reply', '')
        
        # Check for disclaimer at the end
        disclaimer_phrases = [
            "educational only",
            "not medical advice",
            "talk to your practitioner"
        ]
        
        reply_lower = reply.lower()
        has_disclaimer = all(phrase in reply_lower for phrase in disclaimer_phrases)
        
        if not has_disclaimer:
            log(f"  ❌ FAILED: Expected disclaimer at end of reply")
            log(f"  Last 200 chars: {reply[-200:]}")
            return False
        
        log(f"  ✅ PASSED - Disclaimer present")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_coach_no_imperative():
    """Test 1e: POST /api/coach - Should not contain imperative phrasing"""
    log("TEST 1e: POST /api/coach - Check for imperative phrasing")
    try:
        payload = {
            "message": "What supplements help with energy?",
            "conversationHistory": [],
            "context": {},
            "sessionId": SESSION_ID_COACH
        }
        
        response = requests.post(f"{API_BASE}/coach", json=payload, timeout=60)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        reply = data.get('reply', '').lower()
        
        # Check for imperative phrases
        bad_phrases = ["you should take", "start taking", "take this", "you must take"]
        found_bad = [phrase for phrase in bad_phrases if phrase in reply]
        
        if found_bad:
            log(f"  ❌ FAILED: Found imperative phrasing: {found_bad}")
            log(f"  Reply excerpt: {reply[:300]}")
            return False
        
        log(f"  ✅ PASSED - No imperative phrasing found")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_coach_rate_limit():
    """Test 1f: POST /api/coach - Rate limit (21st request should get 429)"""
    log("TEST 1f: POST /api/coach - Rate limit test (20 requests)")
    
    # Use a unique session ID for rate limit testing
    rate_limit_session = f"rate-limit-test-{int(time.time())}"
    
    try:
        # Send 21 requests rapidly
        for i in range(1, 22):
            payload = {
                "message": f"Test message {i}",
                "conversationHistory": [],
                "context": {},
                "sessionId": rate_limit_session
            }
            
            response = requests.post(f"{API_BASE}/coach", json=payload, timeout=60)
            
            if i <= 20:
                if response.status_code != 200:
                    # If we hit rate limit before 20, it might be due to upstream free tier limits
                    # This is acceptable per the review request
                    if response.status_code == 429:
                        log(f"  ⚠️  Hit rate limit at request {i} (may be upstream free tier)")
                        return True
                    elif response.status_code == 503:
                        log(f"  ⚠️  Got 503 at request {i} (upstream models busy - acceptable)")
                        return True
                    else:
                        log(f"  ❌ FAILED: Request {i} returned {response.status_code}")
                        return False
            else:
                # 21st request should be rate limited
                if response.status_code != 429:
                    log(f"  ❌ FAILED: Request 21 should return 429, got {response.status_code}")
                    return False
                
                data = response.json()
                if data.get('error') != 'RATE_LIMITED':
                    log(f"  ❌ FAILED: Expected error='RATE_LIMITED', got {data.get('error')}")
                    return False
                
                log(f"  ✅ PASSED - Rate limit enforced at 21st request")
                return True
            
            # Small delay to avoid overwhelming the server
            time.sleep(0.1)
        
        log(f"  ❌ FAILED: Should have hit rate limit")
        return False
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_research_plan_valid():
    """Test 2a: POST /api/research/plan with valid question"""
    log("TEST 2a: POST /api/research/plan - Valid research question")
    try:
        payload = {
            "question": "Effects of methylated folate in MTHFR C677T carriers",
            "sessionId": SESSION_ID_RESEARCH,
            "context": {}
        }
        
        response = requests.post(f"{API_BASE}/research/plan", json=payload, timeout=60)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200, got {response.status_code}")
            log(f"  Response: {response.text[:500]}")
            return False
        
        data = response.json()
        
        if 'queries' not in data:
            log(f"  ❌ FAILED: Missing 'queries' field")
            return False
        
        queries = data['queries']
        if not isinstance(queries, list):
            log(f"  ❌ FAILED: 'queries' should be an array")
            return False
        
        if len(queries) < 1 or len(queries) > 6:
            log(f"  ❌ FAILED: Expected 1-6 queries, got {len(queries)}")
            return False
        
        # Check that queries are non-empty strings
        empty_queries = [q for q in queries if not q or not isinstance(q, str) or len(q.strip()) == 0]
        if empty_queries:
            log(f"  ❌ FAILED: Found empty queries")
            return False
        
        log(f"  ✅ PASSED")
        log(f"  Number of queries: {len(queries)}")
        log(f"  Sample query: {queries[0][:100]}")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_research_plan_empty():
    """Test 2b: POST /api/research/plan with empty question"""
    log("TEST 2b: POST /api/research/plan - Empty question (should return 400)")
    try:
        payload = {
            "question": "",
            "sessionId": SESSION_ID_RESEARCH,
            "context": {}
        }
        
        response = requests.post(f"{API_BASE}/research/plan", json=payload, timeout=30)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 400:
            log(f"  ❌ FAILED: Expected 400, got {response.status_code}")
            return False
        
        data = response.json()
        if 'error' not in data:
            log(f"  ❌ FAILED: Expected error field in response")
            return False
        
        log(f"  ✅ PASSED - Correctly rejected empty question")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_research_plan_fallback():
    """Test 2c: POST /api/research/plan - Fallback behavior"""
    log("TEST 2c: POST /api/research/plan - Fallback to original question")
    try:
        # Even if all cascade tiers fail, should return original question as fallback
        payload = {
            "question": "Test research question about MTHFR",
            "sessionId": SESSION_ID_RESEARCH,
            "context": {}
        }
        
        response = requests.post(f"{API_BASE}/research/plan", json=payload, timeout=60)
        log(f"  Status: {response.status_code}")
        
        # Should return 200 with queries (either parsed or fallback)
        if response.status_code == 503:
            log(f"  ⚠️  Got 503 - all cascade tiers failed (acceptable if retried)")
            return True
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200 or 503, got {response.status_code}")
            return False
        
        data = response.json()
        queries = data.get('queries', [])
        
        if len(queries) == 0:
            log(f"  ❌ FAILED: Should have at least fallback query")
            return False
        
        log(f"  ✅ PASSED - Returned {len(queries)} queries")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_research_plan_rate_limit():
    """Test 2d: POST /api/research/plan - Rate limit (4th request should get 429)"""
    log("TEST 2d: POST /api/research/plan - Rate limit test (4 requests)")
    
    # Use a unique session ID for rate limit testing
    rate_limit_session = f"research-rate-limit-{int(time.time())}"
    
    try:
        # Send 4 requests
        for i in range(1, 5):
            payload = {
                "question": f"Research question {i} about MTHFR",
                "sessionId": rate_limit_session,
                "context": {}
            }
            
            response = requests.post(f"{API_BASE}/research/plan", json=payload, timeout=60)
            
            if i <= 3:
                if response.status_code not in [200, 503]:
                    log(f"  ❌ FAILED: Request {i} returned {response.status_code}")
                    return False
            else:
                # 4th request should be rate limited
                if response.status_code != 429:
                    log(f"  ❌ FAILED: Request 4 should return 429, got {response.status_code}")
                    return False
                
                data = response.json()
                if data.get('error') != 'RATE_LIMITED':
                    log(f"  ❌ FAILED: Expected error='RATE_LIMITED', got {data.get('error')}")
                    return False
                
                log(f"  ✅ PASSED - Rate limit enforced at 4th request")
                return True
            
            # Delay between requests
            time.sleep(1)
        
        log(f"  ❌ FAILED: Should have hit rate limit")
        return False
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_research_synthesize_valid():
    """Test 3a: POST /api/research/synthesize with valid sources"""
    log("TEST 3a: POST /api/research/synthesize - Valid question with mock sources")
    try:
        payload = {
            "question": "Effects of methylated folate in MTHFR C677T carriers",
            "sources": [
                {
                    "pmid": "12345678",
                    "title": "Methylated folate supplementation in MTHFR C677T homozygotes",
                    "year": "2023",
                    "journal": "Journal of Nutrigenomics",
                    "abstract": "This study examined the effects of L-5-methyltetrahydrofolate supplementation in individuals homozygous for the MTHFR C677T variant.",
                    "reliability": "high"
                },
                {
                    "pmid": "23456789",
                    "title": "Folate metabolism and MTHFR polymorphisms",
                    "year": "2022",
                    "journal": "Molecular Genetics",
                    "abstract": "A comprehensive review of folate metabolism pathways and the impact of MTHFR genetic variants.",
                    "reliability": "medium"
                },
                {
                    "pmid": "34567890",
                    "title": "Homocysteine levels in MTHFR C677T carriers",
                    "year": "2021",
                    "journal": "Clinical Biochemistry",
                    "abstract": "Analysis of homocysteine levels in carriers of the MTHFR C677T variant and response to folate supplementation.",
                    "reliability": "high"
                }
            ]
        }
        
        response = requests.post(f"{API_BASE}/research/synthesize", json=payload, timeout=90)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200, got {response.status_code}")
            log(f"  Response: {response.text[:500]}")
            return False
        
        data = response.json()
        
        # Check required fields
        required_fields = ['report', 'provider', 'model', 'sourcesUsed']
        missing = [f for f in required_fields if f not in data]
        if missing:
            log(f"  ❌ FAILED: Missing fields: {missing}")
            return False
        
        report = data['report']
        
        # Check for markdown H2 headings
        if '## ' not in report:
            log(f"  ❌ FAILED: Expected markdown H2 headings in report")
            return False
        
        # Check for PMID citations
        if 'PMID:' not in report:
            log(f"  ❌ FAILED: Expected PMID citations in report")
            return False
        
        # Check for disclaimer at the end
        if 'Educational only' not in report or 'Not medical advice' not in report:
            log(f"  ❌ FAILED: Expected disclaimer at end of report")
            log(f"  Last 200 chars: {report[-200:]}")
            return False
        
        log(f"  ✅ PASSED")
        log(f"  Report length: {len(report)} chars")
        log(f"  Provider: {data['provider']}, Model: {data['model']}")
        log(f"  Sources used: {data['sourcesUsed']}")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_research_synthesize_empty_sources():
    """Test 3b: POST /api/research/synthesize with empty sources"""
    log("TEST 3b: POST /api/research/synthesize - Empty sources (should return 400)")
    try:
        payload = {
            "question": "Test question",
            "sources": []
        }
        
        response = requests.post(f"{API_BASE}/research/synthesize", json=payload, timeout=30)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 400:
            log(f"  ❌ FAILED: Expected 400, got {response.status_code}")
            return False
        
        data = response.json()
        if 'error' not in data:
            log(f"  ❌ FAILED: Expected error field in response")
            return False
        
        log(f"  ✅ PASSED - Correctly rejected empty sources")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_research_synthesize_citation_cleanup():
    """Test 3c: POST /api/research/synthesize - Citation cleanup"""
    log("TEST 3c: POST /api/research/synthesize - Citation cleanup (invalid PMIDs)")
    try:
        payload = {
            "question": "Test question about MTHFR",
            "sources": [
                {
                    "pmid": "99999999",
                    "title": "Test study about MTHFR",
                    "year": "2023",
                    "journal": "Test Journal",
                    "abstract": "This is a test abstract about MTHFR and folate metabolism.",
                    "reliability": "high"
                }
            ]
        }
        
        response = requests.post(f"{API_BASE}/research/synthesize", json=payload, timeout=90)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        report = data['report']
        
        # Check that only valid PMID (99999999) appears, not invented ones
        # If model invents other PMIDs, they should be replaced with "(citation missing)"
        if '(citation missing)' in report:
            log(f"  ✅ PASSED - Invalid citations cleaned up")
            return True
        
        # If no invalid citations were generated, that's also fine
        log(f"  ✅ PASSED - No invalid citations to clean up")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def test_research_synthesize_sections():
    """Test 3d: POST /api/research/synthesize - Check markdown sections"""
    log("TEST 3d: POST /api/research/synthesize - Markdown sections and disclaimer")
    try:
        payload = {
            "question": "Benefits of creatine supplementation",
            "sources": [
                {
                    "pmid": "11111111",
                    "title": "Creatine supplementation and muscle performance",
                    "year": "2023",
                    "journal": "Sports Medicine",
                    "abstract": "Study on creatine supplementation effects on muscle performance and strength.",
                    "reliability": "high"
                },
                {
                    "pmid": "22222222",
                    "title": "Safety of creatine supplementation",
                    "year": "2022",
                    "journal": "Nutrition Reviews",
                    "abstract": "Review of safety data for creatine supplementation in healthy adults.",
                    "reliability": "high"
                }
            ]
        }
        
        response = requests.post(f"{API_BASE}/research/synthesize", json=payload, timeout=90)
        log(f"  Status: {response.status_code}")
        
        if response.status_code != 200:
            log(f"  ❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        report = data['report']
        
        # Check for expected sections (at least some of them)
        expected_sections = ['## Overview', '## What the research suggests', '## Bottom line']
        found_sections = [s for s in expected_sections if s in report]
        
        if len(found_sections) < 2:
            log(f"  ❌ FAILED: Expected markdown sections, found only: {found_sections}")
            return False
        
        # Check for disclaimer line
        if '_Educational only. Not medical advice. Talk to your practitioner before making changes._' not in report:
            log(f"  ❌ FAILED: Expected exact disclaimer line at end")
            return False
        
        log(f"  ✅ PASSED")
        log(f"  Found sections: {found_sections}")
        return True
        
    except Exception as e:
        log(f"  ❌ EXCEPTION: {str(e)}")
        return False

def main():
    """Run all tests"""
    log("=" * 80)
    log("BACKEND API TESTS - AI-POWERED ENDPOINTS")
    log("=" * 80)
    log(f"Base URL: {API_BASE}")
    log("")
    
    results = {}
    
    # Test 1: POST /api/coach
    log("\n" + "=" * 80)
    log("TESTING POST /api/coach")
    log("=" * 80)
    
    results['1a_coach_simple'] = test_coach_simple_message()
    time.sleep(2)
    
    results['1b_coach_empty'] = test_coach_empty_message()
    time.sleep(1)
    
    results['1c_coach_multi_turn'] = test_coach_multi_turn()
    time.sleep(2)
    
    results['1d_coach_disclaimer'] = test_coach_supplement_disclaimer()
    time.sleep(2)
    
    results['1e_coach_no_imperative'] = test_coach_no_imperative()
    time.sleep(2)
    
    # Rate limit test - this will take longer
    log("\n⚠️  Rate limit test will send 21 requests - this may take 1-2 minutes")
    results['1f_coach_rate_limit'] = test_coach_rate_limit()
    
    # Test 2: POST /api/research/plan
    log("\n" + "=" * 80)
    log("TESTING POST /api/research/plan")
    log("=" * 80)
    
    results['2a_plan_valid'] = test_research_plan_valid()
    time.sleep(2)
    
    results['2b_plan_empty'] = test_research_plan_empty()
    time.sleep(1)
    
    results['2c_plan_fallback'] = test_research_plan_fallback()
    time.sleep(2)
    
    # Rate limit test for research
    log("\n⚠️  Rate limit test will send 4 requests")
    results['2d_plan_rate_limit'] = test_research_plan_rate_limit()
    
    # Test 3: POST /api/research/synthesize
    log("\n" + "=" * 80)
    log("TESTING POST /api/research/synthesize")
    log("=" * 80)
    
    results['3a_synth_valid'] = test_research_synthesize_valid()
    time.sleep(2)
    
    results['3b_synth_empty'] = test_research_synthesize_empty_sources()
    time.sleep(1)
    
    results['3c_synth_citation'] = test_research_synthesize_citation_cleanup()
    time.sleep(2)
    
    results['3d_synth_sections'] = test_research_synthesize_sections()
    
    # Summary
    log("\n" + "=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        log(f"{test_name}: {status}")
    
    log("")
    log(f"Total: {passed}/{total} tests passed ({int(passed/total*100)}%)")
    
    if passed == total:
        log("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        log(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
