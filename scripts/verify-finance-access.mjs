import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
// Invalid/nonexistent record codes provide another safeguard if access control
// regresses: this check can never record money or update a real appointment.
for(const action of ['recordPayment','updateAppointment']){
  const response=await fetch(base+'/api/data',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://unauthorized-finance.example'},body:JSON.stringify({action,code:'SECURITY-CHECK-NONEXISTENT'})});
  assert.ok([401,403].includes(response.status),`${action} cross-origin request must be denied, got ${response.status}`);
}
console.log('PASS: cross-origin recordPayment and updateAppointment denied. No customer records or monetary writes.');
