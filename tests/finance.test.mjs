import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { summarizePayments, validateMoneySettings, validatePayment, validateVndAmount } from '../public/finance-utils.js';
import { dataErrorMessage } from '../lib/data-errors.mjs';
import { buildPaymentHistory, filterPaymentHistory } from '../public/payment-history.js';

const migration = readFileSync(new URL('../drizzle/0003_payment_ledger.sql', import.meta.url),'utf8');
function fixture() {
  const db=new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../drizzle/0000_broken_jubilee.sql', import.meta.url),'utf8'));
  db.exec("ALTER TABLE appointments ADD COLUMN refund_status TEXT NOT NULL DEFAULT 'none'; ALTER TABLE appointments ADD COLUMN refund_note TEXT NOT NULL DEFAULT '';");
  db.prepare("INSERT INTO site_content(key,value) VALUES('settings',?)").run(JSON.stringify({deposit:200000}));
  const insert=db.prepare("INSERT INTO appointments(code,customer,phone,service_id,date,time,total,deposit,payment_status,refund_status) VALUES(?,'Khách thử','0900000000','party','2026-12-01','09:00',700000,?,?,?)");
  insert.run('F-LEGACY',200000,'received','none');insert.run('F-PAID',200000,'received','paid');insert.run('F-NEW',0,'unverified','none');
  db.exec(migration);
  return db;
}
function add(db,id,kind,amount,code='F-NEW',reference=id,confirm=0) {
  return db.prepare("INSERT INTO payment_transactions(id,appointment_code,kind,amount,method,reference,occurred_at,created_at,idempotency_key,confirm_appointment) VALUES(?,?,?,?,'bank',?,'2026-10-31T08:00:00.000Z','2026-10-31T08:00:00.000Z',?,?)").run(id,code,kind,amount,reference,id,confirm);
}
test('legacy migration preserves credit and paid refunds once across repeated migrations',()=>{
  const db=fixture();
  assert.equal(db.prepare('SELECT count(*) AS n FROM payment_transactions').get().n,3);
  assert.equal(db.prepare("SELECT deposit FROM appointments WHERE code='F-PAID'").get().deposit,0);
  add(db,'new-payment','deposit',200000);
  db.exec(migration);
  assert.equal(db.prepare('SELECT count(*) AS n FROM payment_transactions').get().n,4);
  assert.equal(db.prepare("SELECT deposit FROM appointments WHERE code='F-NEW'").get().deposit,200000);
  db.close();
});
test('deposits and final payments accumulate; full deposit can confirm a pending appointment',()=>{
  const db=fixture();add(db,'one','deposit',100000,'F-NEW','ref-one',1);
  assert.equal(db.prepare("SELECT status FROM appointments WHERE code='F-NEW'").get().status,'pending');
  add(db,'two','deposit',100000,'F-NEW','ref-two',1);add(db,'three','balance',500000);
  assert.deepEqual({...db.prepare("SELECT deposit,status,payment_status FROM appointments WHERE code='F-NEW'").get()},{deposit:700000,status:'confirmed',payment_status:'received'});
  assert.throws(()=>add(db,'over','balance',1),/PAYMENT_EXCEEDS_TOTAL/);
  db.close();
});
test('refunds subtract actual retained amount and cannot exceed it, including repeated partial refunds',()=>{
  const db=fixture();add(db,'income','deposit',200000);add(db,'refund-one','refund',50000);
  assert.equal(db.prepare("SELECT deposit FROM appointments WHERE code='F-NEW'").get().deposit,150000);
  assert.equal(db.prepare("SELECT refund_status FROM appointments WHERE code='F-NEW'").get().refund_status,'partial');
  assert.throws(()=>add(db,'refund-over','refund',150001),/PAYMENT_REFUND_EXCEEDS_RECEIVED/);
  add(db,'refund-two','refund',150000);
  assert.equal(db.prepare("SELECT refund_status FROM appointments WHERE code='F-NEW'").get().refund_status,'paid');
  assert.throws(()=>add(db,'refund-three','refund',1),/PAYMENT_REFUND_EXCEEDS_RECEIVED/);db.close();
});
test('duplicate references, edits, deletion and reducing cost below retained money are rejected atomically',()=>{
  const db=fixture();add(db,'one','deposit',200000,'F-NEW','SAME-REF');
  assert.throws(()=>add(db,'two','deposit',200000,'F-LEGACY','same-ref'),/UNIQUE/);
  assert.throws(()=>db.exec("UPDATE payment_transactions SET amount=1 WHERE id='one'"),/PAYMENT_IMMUTABLE/);
  assert.throws(()=>db.exec("DELETE FROM payment_transactions WHERE id='one'"),/PAYMENT_IMMUTABLE/);
  assert.throws(()=>db.exec("DELETE FROM appointments WHERE code='F-NEW'"),/PAYMENT_HISTORY_EXISTS/);
  assert.throws(()=>db.exec("UPDATE appointments SET total=100000 WHERE code='F-NEW'"),/PAYMENT_TOTAL_BELOW_RECEIVED/);
  db.exec("UPDATE appointments SET status='cancelled' WHERE code='F-NEW'");
  assert.throws(()=>add(db,'three','balance',1),/PAYMENT_CANCELLED/);db.close();
});
test('input validation rejects fractional/negative money, missing bank reference, refund reason and future time',()=>{
  const valid={kind:'deposit',amount:200000,method:'bank',reference:'MB-EXAMPLE',note:'',occurredAt:'2026-10-31T08:00:00Z',idempotencyKey:'fixture-00000000000001'};
  const now=Date.parse('2026-10-31T09:00:00Z');assert.equal(validatePayment(valid,now).amount,200000);
  for(const input of [{amount:1.1},{amount:-1},{amount:0},{amount:Infinity},{amount:true},{method:'bank',reference:''},{kind:'refund',note:''},{occurredAt:'2030-01-01'},{idempotencyKey:''}])assert.throws(()=>validatePayment({...valid,...input},now));
});
test('summary keeps gross receipts, refunds, net and outstanding distinct',()=>{
  const rows=[{appointmentCode:'A',kind:'opening',amount:200000},{appointmentCode:'A',kind:'balance',amount:500000},{appointmentCode:'A',kind:'refund',amount:100000},{appointmentCode:'B',kind:'deposit',amount:999999}];
  const value=summarizePayments({code:'A',total:700000},rows);
  assert.deepEqual({received:value.received,refunded:value.refunded,net:value.netReceived,remaining:value.remaining,deposit:value.depositReceived},{received:700000,refunded:100000,net:600000,remaining:100000,deposit:200000});
});
test('money settings preserve zero and reject negative, fractional, nonfinite and oversized values',()=>{
  assert.equal(validateVndAmount(0,'Tổng chi phí'),0);
  assert.equal(validateVndAmount('700000','Giá dịch vụ'),700000);
  assert.doesNotThrow(()=>validateMoneySettings({deposit:0,travelFee:'0'}));
  assert.doesNotThrow(()=>validateMoneySettings({deposit:'200000',travelFee:50000}));
  for(const value of [-1,1.5,Infinity,NaN,true,null,'','-10','1.5','Infinity',1000000001]){
    assert.throws(()=>validateVndAmount(value,'Tổng chi phí'));
    for(const field of ['deposit','travelFee'])assert.throws(()=>validateMoneySettings({[field]:value}));
  }
});

test('remaining payment rejects a reused bank reference and accepts its own transaction reference',()=>{
  const db=fixture();add(db,'deposit-mb','deposit',200000,'F-NEW','mb',1);
  let failure;try{add(db,'remaining-mb','balance',500000,'F-NEW','mb');}catch(error){failure=error;}
  assert.ok(failure);
  const wrapped=new Error('Failed query: insert into payment_transactions params: private-customer,500000,mb',{cause:new Error('D1_ERROR',{cause:failure})});
  assert.match(dataErrorMessage(wrapped),/Mã giao dịch ngân hàng đã được ghi nhận/);
  assert.doesNotMatch(dataErrorMessage(wrapped),/Failed query|params:|private-customer|SQLITE/);
  assert.equal(db.prepare("SELECT deposit FROM appointments WHERE code='F-NEW'").get().deposit,200000);
  add(db,'remaining-unique','balance',500000,'F-NEW','MB-REAL-TRANSFER-2');
  assert.equal(db.prepare("SELECT deposit FROM appointments WHERE code='F-NEW'").get().deposit,700000);db.close();
});

test('wrapped trigger and unknown database errors never expose SQL or payment parameters',()=>{
  const wrapper=cause=>new Error('Failed query: insert into payment_transactions params: personal-data',{cause});
  assert.match(dataErrorMessage(wrapper(new Error('D1_ERROR: PAYMENT_EXCEEDS_TOTAL: SQLITE_CONSTRAINT'))),/vượt phần còn phải thanh toán/);
  assert.match(dataErrorMessage(wrapper(new Error('no such table: payment_transactions'))),/migration/);
  assert.doesNotMatch(dataErrorMessage(wrapper(new Error('SQLITE_CONSTRAINT: unknown check'))),/Failed query|params:|personal-data|SQLITE/);
  assert.doesNotMatch(dataErrorMessage(new Error('Failed query: params: PAYMENT_CANCELLED,private')),/private|đã hủy/,'user text in SQL parameters is not a trusted error code');
  assert.equal(dataErrorMessage(new Error('Vui lòng ghi lý do hoàn tiền.')),'Vui lòng ghi lý do hoàn tiền.');
  const cycle=new Error('D1_ERROR');cycle.cause=cycle;assert.doesNotThrow(()=>dataErrorMessage(cycle));
});

test('history includes every year and derives payment status from the full ledger before filtering',()=>{
  const appointments=[{code:'A',customer:'Đỗ Ánh',phone:'0901234567',total:700000,status:'confirmed',deposit:0,paymentStatus:'unverified'},{code:'B',customer:'Thu Hà',total:700000,status:'pending'}];
  const transactions=[{id:'A-DEP',appointmentCode:'A',kind:'deposit',amount:200000,occurredAt:'2024-12-31T17:00:00Z',reference:'BANK-OLD'},{id:'A-BAL',appointmentCode:'A',kind:'balance',amount:500000,occurredAt:'2026-11-01T08:00:00Z'},{id:'B-DEP',appointmentCode:'B',kind:'deposit',amount:200000,occurredAt:'2023-01-01T08:00:00Z'}];
  const original=JSON.stringify(transactions),rows=buildPaymentHistory(appointments,transactions,{bookingDetails:{B:{depositRequired:300000}}});
  assert.equal(filterPaymentHistory(rows).length,3);
  assert.deepEqual(filterPaymentHistory(rows,{month:'2025-01',kind:'deposit',stage:'settled'}).map(row=>row.id),['A-DEP']);
  assert.equal(rows.find(row=>row.id==='A-DEP').kind,'deposit','an old deposit is not relabelled as a balance payment');
  assert.equal(rows.find(row=>row.id==='B-DEP').stage,'partial','the booking-specific deposit snapshot takes precedence');
  assert.equal(rows.find(row=>row.id==='A-BAL').remaining,0);
  assert.equal(filterPaymentHistory(rows,{search:'do anh'}).length,2);
  assert.equal(filterPaymentHistory(rows,{search:'090123'}).length,2);
  assert.equal(filterPaymentHistory(rows,{search:'bank-old'})[0].id,'A-DEP');
  assert.equal(JSON.stringify(transactions),original);
});

test('history preserves cancelled/refunded records and separates legacy balances with unknown dates',()=>{
  const appointments=[{code:'C',total:700000,status:'cancelled'},{code:'D',total:700000,status:'confirmed'}];
  const transactions=[{id:'C-DEP',appointmentCode:'C',kind:'deposit',amount:200000,occurredAt:'2026-11-01'},{id:'C-REF',appointmentCode:'C',kind:'refund',amount:50000,occurredAt:'2026-11-02'},{id:'D-OPEN',appointmentCode:'D',kind:'opening',amount:200000,occurredAt:'2026-11-01'},{id:'D-OPEN-REF',appointmentCode:'D',kind:'opening_refund',amount:50000,occurredAt:'2026-11-01'}];
  const rows=buildPaymentHistory(appointments,transactions);
  assert.equal(filterPaymentHistory(rows,{stage:'cancelled'}).length,2);
  assert.equal(rows.find(row=>row.id==='C-REF').netReceived,150000);
  assert.equal(filterPaymentHistory(rows,{kind:'legacy'}).length,2);
  assert.equal(filterPaymentHistory(rows,{month:'2026-11',kind:'legacy'}).length,0,'migration timestamps are not real historical transaction dates');
  assert.deepEqual(rows.slice(-2).map(row=>row.legacy),[true,true]);
});

test('history has no implicit record cap and refunds update current settlement without changing original receipts',()=>{
  const appointments=[{code:'A',total:700000,status:'confirmed'},{code:'B',total:700000,status:'confirmed'}];
  const transactions=Array.from({length:125},(_,i)=>({id:'B-'+i,appointmentCode:'B',kind:'deposit',amount:1000,occurredAt:'2020-01-01'}));
  transactions.push({id:'A-PAID',appointmentCode:'A',kind:'balance',amount:700000,occurredAt:'2025-01-01'},{id:'A-REF',appointmentCode:'A',kind:'refund',amount:50000,occurredAt:'2026-01-01'});
  const rows=buildPaymentHistory(appointments,transactions);
  assert.equal(filterPaymentHistory(rows).length,127);
  assert.equal(filterPaymentHistory(rows,{stage:'settled'}).length,0);
  assert.equal(rows.find(row=>row.id==='A-PAID').stage,'deposited');
  assert.equal(rows.find(row=>row.id==='A-PAID').remaining,50000);
  assert.equal(filterPaymentHistory(rows,{kind:'balance'}).length,1);
  assert.equal(filterPaymentHistory(rows,{kind:'refund'}).length,1);
});
