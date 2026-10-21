"""Resolve controls from a fresh CLI snapshot, then use normal CLI click/fill actions.
Usage: python qa/ui-action.py click button 'Exact accessible name' [index]
       python qa/ui-action.py fill textbox 'Exact accessible name' 'value' [index]
"""
import json,re,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def cli(*args):
    result=subprocess.run(['playwright-cli','-s=arena',*args],cwd=root,text=True,capture_output=True,timeout=20)
    if result.returncode or '### Error' in result.stdout:
        raise RuntimeError(result.stdout+result.stderr)
    return result.stdout
op,role,name=sys.argv[1:4]
snapshot=cli('snapshot')
needle=f'- {role} '+json.dumps(name,ensure_ascii=False)+' '
lines=[line for line in snapshot.splitlines() if needle in line]
if not lines:
    print(snapshot[-9000:]); raise SystemExit('Control not found: '+needle)
index=int(sys.argv[5] if op=='fill' and len(sys.argv)>5 else sys.argv[4] if op!='fill' and len(sys.argv)>4 else 0)
ref=re.search(r'\[ref=([^\]]+)\]',lines[index]).group(1)
args=[op,ref]
if op=='fill': args.append(sys.argv[4])
print(cli(*args))
after=cli('snapshot')
(root/'qa'/'evidence'/'latest-ui-snapshot.txt').write_text(after)
print(after[-6500:])
