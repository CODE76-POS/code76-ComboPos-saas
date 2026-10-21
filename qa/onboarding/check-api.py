"""No-key smoke checks for the two explicitly scoped landing-page assistants.
Runs only against the local preview and refuses to spend live AI quota.
"""
import json
import urllib.request
from pathlib import Path

BASE = 'http://127.0.0.1:3000'
ROOT = Path(__file__).resolve().parents[2]
health = json.load(urllib.request.urlopen(BASE + '/api/health'))
assert not health['hasApiKey'], 'Do not call paid AI during this smoke test'
company = {'name': 'TEST Acacia Market', 'currency': 'KES', 'address': 'TEST Market Road', 'location': 'Nairobi', 'tel1': '+254700123456'}
products = [{'name': 'TEST Acacia Coffee', 'category': 'Groceries', 'type': 'product', 'sellingPrice': 250, 'stock': 8}]
cases = [
    ('merchant catalog', 'business', 'price', products, lambda reply: 'Acacia Coffee' in reply and 'KES 250.00' in reply and 'CODE76' not in reply),
    ('merchant empty', 'business', 'price', [], lambda reply: 'has not added any catalog items' in reply and 'Terminal' not in reply),
    ('merchant no booking promise', 'business', 'Book an appointment', products, lambda reply: 'does not reserve stock or confirm appointments' in reply),
    ('CODE76 rejects tenant context', 'code76', 'price', products, lambda reply: 'CODE76' in reply and 'Acacia' not in reply),
    ('merchant location', 'business', 'where can I visit', products, lambda reply: 'TEST Market Road' in reply and 'CODE76' not in reply),
]
results = []
for name, surface, text, items, check in cases:
    body = {'surface': surface, 'messages': [{'role': 'user', 'text': text}], 'posContext': {'company': company, 'products': items}}
    request = urllib.request.Request(BASE + '/api/gemini/chat', json.dumps(body).encode(), {'Content-Type': 'application/json'})
    with urllib.request.urlopen(request) as response:
        data = json.load(response)
        results.append({'name': name, 'passed': bool(check(data['reply'])), 'status': response.status, 'model': data.get('modelUsed'), 'reply': data['reply']})
(ROOT / 'qa/onboarding/api-results.json').write_text(json.dumps({'health': health, 'results': results}, indent=2))
summary = {'checks': len(results), 'passed': sum(row['passed'] for row in results), 'failed': sum(not row['passed'] for row in results), 'noLiveAI': True}
print(json.dumps(summary, indent=2))
assert all(row['passed'] for row in results)
