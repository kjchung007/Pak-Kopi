import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import assert from 'node:assert/strict';
const c={exports:{},URL};vm.runInNewContext(ts.transpileModule(fs.readFileSync('packages/brand/src/app-url.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,c);
const fallback='https://pak-kopi-order.vercel.app';for(const u of ['http://localhost:5173','https://pakkopi.vercel.app:5173','http://192.168.0.148:5173','bad url'])assert.equal(c.exports.appUrl(u,fallback,false),fallback);
assert.equal(c.exports.appUrl('http://localhost:5173',fallback,true),'http://localhost:5173');assert.equal(c.exports.appUrl(fallback,fallback,false),fallback);console.log('Production URL checks passed; local development preserved.');
