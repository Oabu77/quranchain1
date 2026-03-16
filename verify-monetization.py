#!/usr/bin/env python3
"""Verify monetization on deployed blog"""
import subprocess, json, urllib.request, sys

# 1. Apply migration 0012
print("=== Applying D1 migration 0012 ===")
r = subprocess.run(
    ['npx', 'wrangler', 'd1', 'migrations', 'apply', 'DB', '--remote'],
    capture_output=True, text=True, input='y\n',
    cwd='/workspaces/quranchain1', timeout=60
)
print(r.stdout[-300:])
if r.returncode != 0 and r.stderr:
    print(f"ERR: {r.stderr[-300:]}")

# 2. Verify monetization markers on blog post
print("\n=== Monetization Markers ===")
url = 'https://darcloud.host/blog/what-is-riba-and-why-islam-forbids-interest'
req = urllib.request.Request(url, headers={'User-Agent': 'DarCloud/1.0'})
resp = urllib.request.urlopen(req, timeout=10)
body = resp.read().decode('utf-8', errors='replace')
checks = {
    'AD_SLOTS': 'ad-unit' in body,
    'ADSENSE_SCRIPT': 'adsbygoogle' in body,
    'LEAD_FORM': 'leadCapture' in body or 'leadForm' in body,
    'ANALYTICS': 'analytics/pageview' in body,
    'CTA_CHECKOUT': '/checkout/' in body,
    'JSON_LD_SEO': 'ld+json' in body,
    'OG_TAGS': 'og:title' in body,
    'LEAD_JS': 'submitLead' in body,
}
for tag, ok in checks.items():
    print(f"  {'✅' if ok else '❌'} {tag}")

# 3. Test analytics pixel
print("\n=== Analytics Pixel ===")
r3 = urllib.request.urlopen(urllib.request.Request(
    'https://darcloud.host/api/analytics/pageview?p=/test&r=test&t=0',
    headers={'User-Agent': 'DarCloud/1.0'}), timeout=10)
print(f"  Status: {r3.getcode()}")

# 4. Test lead capture
print("\n=== Lead Capture ===")
try:
    data = json.dumps({"email":"monetization-test@darcloud.host","source":"verify","page":"/blog"}).encode()
    req = urllib.request.Request('https://darcloud.host/api/leads/subscribe', data=data,
        headers={'Content-Type':'application/json'}, method='POST')
    resp = urllib.request.urlopen(req, timeout=10)
    print(f"  Result: {json.loads(resp.read().decode())}")
except Exception as e:
    print(f"  Error: {str(e)[:200]}")

# 5. Blog index lead capture
print("\n=== Blog Index ===")
req = urllib.request.Request('https://darcloud.host/blog', headers={'User-Agent': 'DarCloud/1.0'})
resp = urllib.request.urlopen(req, timeout=10)
body = resp.read().decode('utf-8', errors='replace')
has_lead = 'leadForm' in body or 'leadCapture' in body
has_ads = 'adsbygoogle' in body
print(f"  Lead form: {'✅' if has_lead else '❌'}")
print(f"  Ad script: {'✅' if has_ads else '❌'}")
