export const historyKinds={all:'Tất cả',deposit:'Thu cọc',balance:'Thanh toán',refund:'Hoàn tiền',legacy:'Số dư cũ'};
export const historyStages={all:'Mọi trạng thái',unpaid:'Chưa thanh toán',partial:'Cọc chưa đủ',deposited:'Đã đủ cọc, chưa trả hết',settled:'Đã thanh toán đủ',cancelled:'Lịch đã hủy',no_charge:'Không phải thu',unknown:'Không có thông tin lịch'};
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
const monthFormatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'});

// Derive each booking's CURRENT payment state from its full ledger, before
// filtering history. A deposit stays a deposit even after the balance is paid.
export function buildPaymentHistory(appointments=[],transactions=[],{bookingDetails={},deposit=200000}={}){
  const bookings=new Map(appointments.map(row=>[row.code,{...row,received:0,refunded:0}]));
  for(const row of transactions){
    const booking=bookings.get(row.appointmentCode);if(!booking)continue;
    if(row.kind==='refund'||row.kind==='opening_refund')booking.refunded+=Number(row.amount)||0;
    else booking.received+=Number(row.amount)||0;
  }
  for(const row of bookings.values()){
    row.netReceived=row.received-row.refunded;
    row.remaining=Math.max(0,(Number(row.total)||0)-row.netReceived);
    const required=Math.max(0,Math.min(Number(row.total)||0,Number(bookingDetails[row.code]?.depositRequired??deposit)||0));
    row.stage=row.status==='cancelled'?'cancelled':Number(row.total)===0&&row.netReceived===0?'no_charge':row.remaining===0?'settled':row.netReceived<=0?'unpaid':row.netReceived>=required?'deposited':'partial';
  }
  return transactions.map(row=>{
    const booking=bookings.get(row.appointmentCode);
    return {...row,customer:booking?.customer||'',phone:booking?.phone||'',stage:booking?.stage||'unknown',netReceived:booking?.netReceived??null,remaining:booking?.remaining??null,legacy:row.kind==='opening'||row.kind==='opening_refund'};
  }).sort((a,b)=>Number(a.legacy)-Number(b.legacy)||(Date.parse(b.occurredAt)||0)-(Date.parse(a.occurredAt)||0)||(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)||String(b.id).localeCompare(String(a.id)));
}

// No implicit time range or record cap. Opening balances have no known real
// transaction date and are therefore excluded only from explicit month filters.
export function filterPaymentHistory(rows,{search='',month='',kind='all',stage='all'}={}){
  const keyword=normalize(search).trim();
  return rows.filter(row=>{
    if(kind!=='all'&&(kind==='legacy'?!row.legacy:row.kind!==kind))return false;
    if(stage!=='all'&&row.stage!==stage)return false;
    if(month){const date=new Date(row.occurredAt);if(row.legacy||!Number.isFinite(date.getTime())||monthFormatter.format(date)!==month)return false;}
    return !keyword||normalize([row.id,row.appointmentCode,row.customer,row.phone,row.reference,row.note].join(' ')).includes(keyword);
  });
}
