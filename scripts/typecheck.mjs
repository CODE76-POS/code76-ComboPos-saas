import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
// Native TypeScript can otherwise size its Go runtime to the host rather than
// this small workspace. Cross-platform launcher; no shell or source changes.
const manifest=fileURLToPath(new URL('../node_modules/typescript/package.json',import.meta.url));
let pkg;
try{pkg=JSON.parse(readFileSync(manifest,'utf8'));}catch{console.error('TypeScript is missing. Run npm ci first.');process.exit(1);}
const relative=typeof pkg.bin==='string'?pkg.bin:pkg.bin?.tsc;
if(!relative){console.error('The installed TypeScript package has no tsc entry.');process.exit(1);}
const compiler=resolve(dirname(manifest),relative);
const result=spawnSync(process.execPath,[compiler,'--noEmit',...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,GOMAXPROCS:process.env.GOMAXPROCS||'2',GOMEMLIMIT:process.env.GOMEMLIMIT||'512MiB'}});
if(result.error){console.error(result.error.message);process.exit(1);}
process.exit(result.status??1);
