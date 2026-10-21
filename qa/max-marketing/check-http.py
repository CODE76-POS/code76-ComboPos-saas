"""Local HTTP/SEO smoke checks. No external requests, authentication or AI calls."""
import json, re
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from xml.etree import ElementTree
ROOT=Path(__file__).resolve().parents[2]
BASE='http://127.0.0.1:5173'
results=[]
def get(path='/', headers=None, method='GET'):
    try: response=urlopen(Request(BASE+path, headers=headers or {}, method=method),timeout=10)
    except HTTPError as error: response=error
    return response.status, dict(response.headers), response.read()
def check(name, ok):
    results.append({'name':name,'passed':bool(ok)})
    print(('PASS' if ok else 'FAIL')+': '+name)
    assert ok,name
for path in ['/', '/index.html', '/?view=storefront', '/pos/landing_page_builder', '/landing_page_builder']:
    status,headers,body=get(path)
    html=body.decode()
    check(path+' serves the application shell, not 403', status==200 and 'text/html' in headers['Content-Type'] and 'id="root"' in html)
    check(path+' has one absolute public-root canonical without private query/hash', re.findall(r'<link rel="canonical" href="([^"]+)"',html)==[BASE+'/'])
status,headers,body=get(method='HEAD')
check('HEAD / is 200 with no body',status==200 and body==b'')
status,headers,body=get('/api/health')
health=json.loads(body)
check('server is healthy and no Gemini key is loaded',status==200 and health['status']=='ok' and health['hasApiKey'] is False)
status,headers,body=get('/api/not-a-real-route')
check('unknown API is JSON 404, never the public HTML fallback',status==404 and 'application/json' in headers['Content-Type'] and json.loads(body)['error']=='API endpoint not found')
status,headers,body=get('/assets/missing.js')
check('missing JS is 404, not HTML disguised as a module',status==404 and b'id="root"' not in body)
status,headers,body=get('/code76-social-card.png')
check('own social image is served successfully',status==200 and headers['Content-Type']=='image/png' and body.startswith(b'\x89PNG'))
status,headers,body=get('/robots.txt')
check('workspace/local robots disallow indexing',status==200 and 'text/plain' in headers['Content-Type'] and body==b'User-agent: *\nDisallow: /\n')
status,headers,body=get('/sitemap.xml')
xml=ElementTree.fromstring(body)
urls=[node.text for node in xml.findall('.//{*}loc')]
check('sitemap contains only the public product root',status==200 and urls==[BASE+'/'])
status,headers,body=get(headers={'Host':'public.example.com','X-Forwarded-Proto':'https'})
html=body.decode()
check('production-like host gets absolute HTTPS canonical and public index/follow metadata',status==200 and 'href="https://public.example.com/"' in html and 'content="index, follow, max-image-preview:large"' in html and 'content="https://public.example.com/code76-social-card.png"' in html)
status,headers,body=get('/robots.txt',headers={'Host':'public.example.com','X-Forwarded-Proto':'https'})
check('public robots points to the public sitemap and excludes API/legacy workspace paths',status==200 and b'Sitemap: https://public.example.com/sitemap.xml' in body and b'Disallow: /api/' in body and b'Disallow: /pos/' in body)
status,headers,body=get(headers={'Host':'3000-routing-check.e2b.app','X-Forwarded-Proto':'https'})
check('application accepts workspace-preview host and keeps it noindex',status==200 and 'noindex' in headers.get('X-Robots-Tag','') and b'href="https://3000-routing-check.e2b.app/"' in body)
status,headers,body=get(headers={'Host':'internal.local','X-Forwarded-Host':'3000-routing-check.e2b.app','X-Forwarded-Proto':'https'})
check('proxy-forwarded host/protocol use the correct public preview origin',status==200 and b'href="https://3000-routing-check.e2b.app/"' in body)
(ROOT/'qa/max-marketing/http-results.json').write_text(json.dumps({'checks':results,'health':health},indent=2)+'\n')
print(f'\n{len(results)}/{len(results)} HTTP checks passed')
