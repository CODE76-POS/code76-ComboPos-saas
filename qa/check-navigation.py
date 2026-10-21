"""Navigate already-open demo session with normal Playwright CLI actions.
Precondition: arena browser at localhost:3000, signed in as the demo CEO.
No external services, emails, payments, registration, or deletion.
"""
import json,re,subprocess
from pathlib import Path

root=Path(__file__).resolve().parents[1]
evidence=root/'qa'/'evidence'

def cli(*args):
    result=subprocess.run(['playwright-cli','-s=arena',*args],cwd=root,text=True,capture_output=True,timeout=20)
    if result.returncode or '### Error' in result.stdout:
        raise RuntimeError(result.stdout+result.stderr)
    return result.stdout

routes=['Sales History','Inventory','Expenses','Invoices','Analytics & P&L','Customers','Vendors','Transporters','Marketing Team','Company Members','My Company','Messaging','Business Landing Page','Settings','Audit & Access Logs','About & Manual','Sales POS']
results=[]
for name in routes:
    try:
        snapshot=cli('snapshot')
        matches=[line for line in snapshot.splitlines() if f'- button "{name}" ' in line]
        if not matches: raise RuntimeError('Navigation button absent in current snapshot')
        ref=re.search(r'\[ref=([^\]]+)\]',matches[0]).group(1)
        cli('click',ref)
        after=cli('snapshot')
        headings=re.findall(r'heading "(.*?)" \[level=(\d)\]',after)
        assert headings, 'No visible heading after navigation'
        results.append({'platform':name,'passed':True,'headings':headings[:3]})
        print('PASS: '+name+' → '+headings[0][0],flush=True)
    except Exception as error:
        results.append({'platform':name,'passed':False,'error':str(error)[:500]})
        print('FAIL: '+name+' → '+str(error)[:200],flush=True)
(evidence/'navigation-checks.json').write_text(json.dumps(results,indent=2))
(evidence/'browser-console.txt').write_text(cli('console','error'))
print('RESULTS',sum(x['passed'] for x in results),'passed;',sum(not x['passed'] for x in results),'failed')
