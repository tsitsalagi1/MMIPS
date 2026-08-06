import assert from 'node:assert/strict'; import test from 'node:test';
import { sendTransactionalEmail } from '../../.test-dist/lib/email.js';
const original={key:process.env.RESEND_API_KEY,fetch:globalThis.fetch,node:process.env.NODE_ENV};
test('email provider fails closed without configuration and allowlists headers with bounded provider id', {concurrency:false}, async()=>{
  delete process.env.RESEND_API_KEY; process.env.NODE_ENV='production'; assert.deepEqual(await sendTransactionalEmail({to:'synthetic@example.test',subject:'Synthetic',text:'Synthetic'}),{ok:false,skipped:true,code:'provider_unconfigured'});
  process.env.RESEND_API_KEY='synthetic-provider-key'; let request;
  globalThis.fetch=async(_url,input)=>{request=input;return {ok:true,async json(){return {id:'synthetic_provider_id'};}}};
  const result=await sendTransactionalEmail({to:'synthetic@example.test',subject:'Synthetic',text:'Synthetic',headers:{'List-Unsubscribe':'<https://mmips.com/api/alerts/unsubscribe?token=opaque>','List-Unsubscribe-Post':'List-Unsubscribe=One-Click','X-Arbitrary-Unsafe':'rejected'},idempotencyKey:'synthetic-delivery-key'});
  assert.equal(result.providerMessageId,'synthetic_provider_id'); const body=JSON.parse(request.body); assert.equal(body.headers['X-Arbitrary-Unsafe'],undefined); assert.equal(request.headers['Idempotency-Key'],'synthetic-delivery-key');
  globalThis.fetch=async()=>({ok:true,async json(){return {id:'invalid provider id with spaces'};}}); assert.equal((await sendTransactionalEmail({to:'synthetic@example.test',subject:'Synthetic',text:'Synthetic'})).providerMessageId,undefined);
  if(original.key===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=original.key; globalThis.fetch=original.fetch; if(original.node!==undefined)process.env.NODE_ENV=original.node;
});
