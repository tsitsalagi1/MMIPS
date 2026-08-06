import assert from 'node:assert/strict'; import test from 'node:test';
import { verifyTurnstileToken } from '../../.test-dist/lib/security/turnstile.js';
const request=new Request('https://mmips.com/api/alerts/subscribe');
const original={secret:process.env.TURNSTILE_SECRET_KEY,bypass:process.env.ALLOW_INSECURE_TURNSTILE_BYPASS,node:process.env.NODE_ENV};
function response(payload,ok=true){return async()=>({ok,async json(){return payload;}});}
test('Turnstile behavior validates success, rejection, action, hostname, timeout, and production configuration', {concurrency:false}, async()=>{
  process.env.TURNSTILE_SECRET_KEY='synthetic-turnstile-secret'; process.env.NODE_ENV='production'; delete process.env.ALLOW_INSECURE_TURNSTILE_BYPASS;
  const options={expectedAction:'alerts_subscribe',expectedHostname:'mmips.com'};
  assert.equal((await verifyTurnstileToken('synthetic-valid',request,{...options,fetcher:response({success:true,action:'alerts_subscribe',hostname:'mmips.com'})})).ok,true);
  for(const payload of [{success:false},{success:false,'error-codes':['timeout-or-duplicate']},{success:true,action:'wrong',hostname:'mmips.com'},{success:true,action:'alerts_subscribe',hostname:'foreign.example'}]) assert.equal((await verifyTurnstileToken('synthetic-token',request,{...options,fetcher:response(payload)})).ok,false);
  assert.equal((await verifyTurnstileToken('synthetic-token',request,{...options,fetcher:async()=>{throw new DOMException('timeout','AbortError')}})).ok,false);
  delete process.env.TURNSTILE_SECRET_KEY; assert.equal((await verifyTurnstileToken('synthetic-token',request,options)).ok,false);
  process.env.TURNSTILE_SECRET_KEY='synthetic-turnstile-secret'; assert.equal((await verifyTurnstileToken('synthetic-token',request,{expectedAction:'alerts_subscribe',fetcher:response({success:true})})).ok,false);
  delete process.env.TURNSTILE_SECRET_KEY; process.env.ALLOW_INSECURE_TURNSTILE_BYPASS='true'; process.env.NODE_ENV='development'; assert.deepEqual(await verifyTurnstileToken(null,request,options),{ok:true,skipped:true});
  process.env.NODE_ENV='production'; assert.equal((await verifyTurnstileToken(null,request,options)).ok,false);
  assert.equal(JSON.stringify(process.env).includes('synthetic-valid'),false);
  if(original.secret===undefined)delete process.env.TURNSTILE_SECRET_KEY;else process.env.TURNSTILE_SECRET_KEY=original.secret;
  if(original.bypass===undefined)delete process.env.ALLOW_INSECURE_TURNSTILE_BYPASS;else process.env.ALLOW_INSECURE_TURNSTILE_BYPASS=original.bypass;
  if(original.node!==undefined)process.env.NODE_ENV=original.node;
});
