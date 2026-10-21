"""Snapshot-driven UI checks using the preinstalled Playwright CLI, arena session only.
No synthetic click/evaluate shortcuts; eval is used only to inspect DOM/style/local-storage results.
All test records are browser-local fixtures, not real customers, payments or emails.
"""
import json, re, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]

def cli(*args):
    result = subprocess.run(['playwright-cli', '-s=arena', *args], cwd=ROOT, capture_output=True, text=True, timeout=25)
    if result.returncode or '### Error' in result.stdout:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout

def snap():
    return cli('snapshot')

def controls(snapshot, role, label=None, prefix=False):
    found=[]
    for line in snapshot.splitlines():
        match=re.search(r'- '+re.escape(role)+r'(?: "([^"]*)")?[^\n]*?\[ref=([^\]]+)\]', line)
        if match and (label is None or (match.group(1) or '') == label or prefix and (match.group(1) or '').startswith(label)):
            found.append((match.group(2),match.group(1),line))
    return found

def act(op, role, label=None, value=None, prefix=False, index=0):
    state=snap()
    matches=controls(state,role,label,prefix)
    if len(matches)<=index:
        (ROOT/'qa/companies-plans/failed-ui-snapshot.txt').write_text(state)
        raise AssertionError(f'Control not found: {role} {label!r}; index {index}')
    args=[op,matches[index][0]]
    if value is not None: args.append(str(value))
    output=cli(*args)
    print(f'{op}: {role} {label or "(unnamed)"}')
    return output

def inspect(js):
    output=cli('eval',js)
    marker='### Result\n'
    if marker not in output: raise RuntimeError(output)
    return json.JSONDecoder().raw_decode(output.split(marker,1)[1].lstrip())[0]

def check(name, passed, detail=None):
    path=ROOT/'qa/companies-plans/browser-results.json'
    existing=json.loads(path.read_text()) if path.exists() else []
    existing.append({'name':name,'passed':bool(passed),'detail':detail})
    path.write_text(json.dumps(existing,indent=2))
    print(('PASS' if passed else 'FAIL')+': '+name)
    assert passed,name

def save_snapshot(filename):
    (ROOT/'qa/companies-plans'/filename).write_text(snap())

def screenshot(filename):
    cli('screenshot',f'--filename={ROOT/filename}')
    print('Screenshot: '+filename)
