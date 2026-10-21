"""Local no-key API smoke and input-shape checks. Never calls Gemini."""
import json
import urllib.request
import urllib.error
from pathlib import Path

BASE = 'http://127.0.0.1:3000'
OUTPUT = Path(__file__).parent / 'evidence' / 'api-checks.json'

def call(path, data=None, raw=None, headers=None):
    payload = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    request = urllib.request.Request(BASE + path, data=payload, headers=headers or ({'Content-Type': 'application/json'} if payload is not None else {}))
    try:
        response = urllib.request.urlopen(request, timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    body = response.read().decode('utf-8', errors='replace')
    try:
        body = json.loads(body)
    except json.JSONDecodeError:
        body = body[:200]
    return response.status, dict(response.headers), body

health = call('/api/health')
assert health[2].get('hasApiKey') is False, 'Do not run no-key QA against a server with live API billing enabled.'
results = []

def check(name, path, expected, data=None, raw=None, headers=None, condition=None):
    status, response_headers, body = call(path, data=data, raw=raw, headers=headers)
    passed = status == expected and (condition(body, response_headers) if condition else True)
    results.append({'name': name, 'expected_status': expected, 'actual_status': status, 'passed': passed, 'body': body, 'content_type': response_headers.get('Content-Type')})

check('Health is healthy without an AI key', '/api/health', 200, condition=lambda b,h: b.get('status')=='ok' and b.get('hasApiKey') is False)
check('Chat uses a local no-key fallback', '/api/gemini/chat', 200, data={'messages':[{'role':'user','text':'What is the price?'}]}, condition=lambda b,h: b.get('modelUsed')=='system-grounded-engine' and bool(b.get('reply')))
check('Marketing no-key template returns subject and body', '/api/gemini/marketing', 200, data={'product':{'name':'QA Fixture','stock':2},'customer':{'firstName':'QA'},'company':{'name':'QA Company'}}, condition=lambda b,h: bool(b.get('subject')) and bool(b.get('body')))
check('CFO fallback exposes the action-plan field consumed by the UI', '/api/gemini/insights', 200, data={'financialData':{'grossRevenue':100,'netProfit':20,'netProfitMarginPercent':20},'companyName':'QA Company'}, condition=lambda b,h: bool(b.get('executiveSummary') or b.get('summary')) and isinstance(b.get('actionPlan'),list) and bool(b.get('actionPlan')))
check('Malformed JSON is rejected', '/api/gemini/chat', 400, raw=b'{broken')
check('Missing chat messages receive a client validation error', '/api/gemini/chat', 400, data={})
check('Non-array chat messages receive a client validation error', '/api/gemini/chat', 400, data={'messages':{}})
check('Chat message with no text receives a client validation error', '/api/gemini/chat', 400, data={'messages':[{'role':'user'}]})
check('Unknown API route returns JSON 404 instead of SPA HTML', '/api/qa-does-not-exist', 404, condition=lambda b,h: 'application/json' in h.get('Content-Type',''))
check('SPA browser refresh route is served', '/qa-spa-refresh', 200, condition=lambda b,h: 'text/html' in h.get('Content-Type',''))

OUTPUT.parent.mkdir(parents=True,exist_ok=True)
OUTPUT.write_text(json.dumps({'mode':'local no-key QA; no Gemini requests', 'checks':results,'passed':sum(c['passed'] for c in results),'failed':sum(not c['passed'] for c in results)}, indent=2))
for result in results:
    print(('PASS' if result['passed'] else 'FAIL') + ': ' + result['name'] + ' (HTTP '+str(result['actual_status'])+')')
print('Evidence:', OUTPUT)
