import { financeKinds, isOutflow, summarizePayments } from './finance-utils.js?v=2.1';
import { buildPaymentHistory, filterPaymentHistory, historyKinds, historyStages } from './payment-history.js?v=1.0';

export function createFinanceAdmin({getState,api,refresh,toast,esc,money}) {
  let search='', status='attention', view='attention', month='', historyKind='all', historyStage='all';
  let dialog=null, boundRoot=null, previousRoute='';
  const pendingKey='hoanPendingLedgerEntry';
  const pendingEntry=()=>{try{const value=JSON.parse(sessionStorage.getItem(pendingKey)||'null');if(!value||value.action!=='recordPayment'||typeof value.code!=='string')return null;validatePayment(value);return value;}catch{return null;}};
  const rememberPending=payload=>{try{if(payload)sessionStorage.setItem(pendingKey,JSON.stringify(payload));else sessionStorage.removeItem(pendingKey);}catch{/* Retry identity remains in memory. */}};
  const dateLabel=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'});};
  const monthOf=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'}).format(date);};
  const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
  const entries=()=>getState().paymentTransactions||[];
  const summary=appointment=>summarizePayments(appointment,entries());
  const required=appointment=>Math.max(0,Math.min(Number(appointment.total)||0,Math.max(0,Number(getState().bookingDetails?.[appointment.code]?.depositRequired??getState().settings?.deposit??200000)||0)));
  const needsRefund=row=>row.status==='cancelled'&&summary(row).netReceived>0&&row.refundStatus!=='rejected';
  const needsAttention=row=>needsRefund(row)||(row.status!=='cancelled'&&(row.paymentStatus==='pending_verification'||row.status==='pending'&&summary(row).netReceived<required(row)));
  const match=row=>key(`${row.code} ${row.customer} ${row.phone}`).includes(key(search));
  const navigate=code=>{location.hash='/admin/payments'+(code?'?q='+encodeURIComponent(code):'');};
  const onWorkspace=()=>location.hash.split('?')[0].replace(/\/$/,'')==='#/admin/payments';
  function filteredAppointments(){return(getState().appointments||[]).filter(row=>{
    const s=summary(row);if(!match(row))return false;
    if(status==='attention')return needsAttention(row);
    if(status==='pending')return row.status!=='cancelled'&&row.paymentStatus==='pending_verification';
    if(status==='due')return row.status!=='cancelled'&&s.remaining>0;
    if(status==='refund')return needsRefund(row);
    if(status==='settled')return s.remaining===0&&row.status!=='cancelled';return true;
  }).sort((a,b)=>Number(needsRefund(b))-Number(needsRefund(a))||Number(b.paymentStatus==='pending_verification')-Number(a.paymentStatus==='pending_verification')||`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));}
  function historyRows(){const state=getState();return buildPaymentHistory(state.appointments||[],entries(),{bookingDetails:state.bookingDetails,deposit:state.settings?.deposit??200000});}
  function filteredTransactions(){return filterPaymentHistory(historyRows(),{search,month,kind:historyKind,stage:historyStage});}
  function collectionChecks(row,s,deposit,short){
    const depositDone=short===0,fullyPaid=s.remaining===0;
    const options=[
      {kind:'deposit',title:'Thu cọc',done:depositDone,locked:false,detail:deposit===0?'Không yêu cầu cọc':depositDone?'Đã nhận đủ cọc':`Cần thu ${money(short)}`},
      {kind:'balance',title:'Thu còn lại',done:fullyPaid,locked:!depositDone,detail:Number(row.total)===0?'Không phải thu':fullyPaid?'Đã thanh toán đủ':!depositDone?'Sau khi nhận đủ cọc':`Cần thu ${money(s.remaining)}`},
    ];
    return `<div class="finance-collections" role="group" aria-label="Xác nhận khoản thu của ${esc(row.code)}">${options.map(option=>`<label class="finance-collection ${option.done?'is-complete':option.locked?'is-locked':''}" title="${option.done?option.detail:option.locked?'Ghi nhận đủ cọc trước khi thu phần còn lại':'Tích để mở xác nhận '+option.title.toLowerCase()}"><input type="checkbox" data-finance="collect" data-code="${esc(row.code)}" data-kind="${option.kind}" aria-label="Xác nhận ${option.title.toLowerCase()} cho ${esc(row.code)}" ${option.done?'checked':''} ${option.done||option.locked?'disabled':''}><span><b>${option.title}</b><small>${option.detail}</small></span></label>`).join('')}</div>`;
  }
  function bookingCard(row){
    const s=summary(row), deposit=required(row), short=Math.max(0,deposit-s.netReceived), cancelled=row.status==='cancelled';
    const label=cancelled?(needsRefund(row)?'Cần hoàn tiền':row.refundStatus==='rejected'?'Đã xử lý hủy':'Đã hủy'):s.remaining===0?'Đã thu đủ':short===0?'Đã đủ cọc':row.paymentStatus==='pending_verification'?'Khách báo đã chuyển':s.netReceived>0?'Cọc chưa đủ':'Chưa nhận cọc';
    const tone=needsRefund(row)?'refund':!cancelled&&short===0?'paid':'waiting';
    const action=needsRefund(row)?['refund','Ghi nhận hoàn tiền']:null;
    const collection=cancelled?'':collectionChecks(row,s,deposit,short);
    return `<article class="finance-booking" data-finance-booking="${esc(row.code)}"><div class="finance-customer"><span class="finance-avatar" aria-hidden="true">${esc(String(row.customer||'?').trim().slice(0,1).toUpperCase())}</span><div><h3>${esc(row.customer)}</h3><p>${esc(row.code)} <span>·</span> ${esc(row.phone)}</p><small>${esc(row.time)} · ${esc(row.date?.split('-').reverse().join('/')||'')}</small></div></div><div class="finance-booking-money"><span>Thực còn giữ</span><strong>${money(s.netReceived)}</strong><small>${cancelled?`Đã hoàn ${money(s.refunded)}`:`Tổng ${money(row.total)} · Còn ${money(s.remaining)}`}</small></div><div class="finance-booking-status"><span class="finance-badge ${tone}"><i aria-hidden="true"></i>${label}</span><small>${cancelled?'':short>0?`Cần thêm ${money(short)} để đủ cọc`:`Cọc yêu cầu ${money(deposit)}`}</small></div><div class="finance-booking-actions">${collection|| (action?`<button class="btn btn-dark" data-finance="record" data-code="${esc(row.code)}" data-kind="${action[0]}">${action[1]} <span aria-hidden="true">↗</span></button>`:'<span class="finance-complete">Đã xử lý <span aria-hidden="true">✓</span></span>')}<details class="finance-more"><summary aria-label="Thêm thao tác cho ${esc(row.code)}">Chi tiết <span aria-hidden="true">⌄</span></summary><div><a href="#/booking/${encodeURIComponent(row.code)}/receipt">Xem biên nhận</a>${s.netReceived>0&&!needsRefund(row)?`<button data-finance="record" data-code="${esc(row.code)}" data-kind="refund">Ghi nhận hoàn tiền</button>`:''}<p>Đã thu ${money(s.received)}<br>Đã hoàn ${money(s.refunded)}</p></div></details></div></article>`;
  }
  function ledger(){
    const all=historyRows(),scoped=filterPaymentHistory(all,{search,month,stage:historyStage});
    const transactions=filterPaymentHistory(scoped,{kind:historyKind});
    const actual=transactions.filter(row=>!row.legacy),received=actual.filter(row=>!isOutflow(row)).reduce((sum,row)=>sum+Number(row.amount),0),refunded=actual.filter(isOutflow).reduce((sum,row)=>sum+Number(row.amount),0);
    const filtered=Boolean(search||month||historyKind!=='all'||historyStage!=='all');
    return `<section class="finance-section finance-history">
      <div class="finance-section-head"><div><h2>Lịch sử giao dịch</h2><p>Toàn bộ các lần thu cọc, thanh toán và hoàn tiền. Mỗi lần giao dịch là một dòng riêng.</p></div><button class="btn" data-finance="export">Xuất danh sách CSV <span aria-hidden="true">↗</span></button></div>
      <nav class="finance-history-kinds" aria-label="Loại giao dịch">${Object.entries(historyKinds).map(([kind,label])=>`<button type="button" data-finance="history-kind" data-kind="${kind}" class="${historyKind===kind?'active':''}" aria-pressed="${historyKind===kind}">${label}<span>${filterPaymentHistory(scoped,{kind}).length}</span></button>`).join('')}</nav>
      <div class="finance-history-filters"><label>Thời gian<select data-history-period><option value="all" ${!month?'selected':''}>Toàn bộ thời gian</option><option value="month" ${month?'selected':''}>Chọn tháng</option></select></label><label ${!month?'hidden':''}>Tháng giao dịch<input data-finance-month type="month" value="${esc(month)}"></label><label>Trạng thái lịch hiện tại<select data-history-stage>${Object.entries(historyStages).map(([stage,label])=>`<option value="${stage}" ${historyStage===stage?'selected':''}>${label}</option>`).join('')}</select></label>${filtered?'<button class="finance-clear" data-finance="history-reset">Xóa bộ lọc</button>':''}</div>
      <div class="finance-history-summary" aria-label="Tổng tiền của danh sách đã lọc"><div><span>Tiền thu</span><b>${money(received)}</b></div><div><span>Tiền hoàn</span><b>${money(refunded)}</b></div><div><span>Thu ròng</span><b>${money(received-refunded)}</b></div></div>
      <div class="finance-history-caption"><span>Hiển thị <b>${transactions.length}</b> / ${all.length} giao dịch</span><span class="finance-history-scope">${month?'Tháng '+esc(month.split('-').reverse().join('/')):'Toàn bộ thời gian'}</span></div>
      <div class="table-wrap"><table class="data-table finance-history-table"><thead><tr><th>Thời gian</th><th>Khách / lịch hẹn</th><th>Loại giao dịch</th><th>Số tiền</th><th>Trạng thái lịch hiện tại</th><th>Đối chiếu / chứng từ</th></tr></thead><tbody>${transactions.length?transactions.map(row=>`<tr data-history-id="${esc(row.id)}"><td data-label="Thời gian">${row.legacy?'Không rõ ngày giao dịch':dateLabel(row.occurredAt)}${row.legacy?'<small>Số dư chuyển từ hệ thống cũ</small>':''}</td><td data-label="Khách / lịch hẹn"><b>${esc(row.customer||'Lịch hẹn '+row.appointmentCode)}</b><small><a href="#/admin/payments?q=${encodeURIComponent(row.appointmentCode)}">${esc(row.appointmentCode)}</a> · ${esc(row.phone||'')}</small></td><td data-label="Loại giao dịch"><span class="finance-history-kind ${row.legacy?'legacy':row.kind}">${row.kind==='balance'?'Thanh toán':esc(financeKinds[row.kind]||row.kind)}</span>${row.kind==='balance'?'<small>Thu phần còn lại</small>':''}</td><td data-label="Số tiền"><strong class="finance-history-amount ${isOutflow(row)?'out':'in'}">${isOutflow(row)?'−':'+'}${money(row.amount)}</strong></td><td data-label="Trạng thái lịch hiện tại"><span class="finance-badge ${['settled','deposited'].includes(row.stage)?'paid':row.stage==='cancelled'?'refund':'waiting'}">${esc(historyStages[row.stage])}</span>${row.remaining!==null?`<small>${row.stage==='cancelled'?'Thực còn giữ '+money(row.netReceived):'Còn phải thu '+money(row.remaining)}</small>`:''}</td><td data-label="Đối chiếu / chứng từ"><b>${esc(row.reference||'—')}</b><small>${row.method==='bank'?'Chuyển khoản':row.method==='cash'?'Tiền mặt':'Dữ liệu cũ'}</small><details class="finance-history-detail"><summary>Chứng từ <span aria-hidden="true">⌄</span></summary><div><small>${esc(row.id)}</small>${row.note?`<p>${esc(row.note)}</p>`:''}<a href="#/booking/${encodeURIComponent(row.appointmentCode)}/receipt">Xem biên nhận hiện tại ↗</a></div></details></td></tr>`).join(''):`<tr><td colspan="6" class="finance-empty"><b>${all.length?'Không có giao dịch phù hợp bộ lọc.':'Chưa có giao dịch được ghi nhận.'}</b><small>${all.length?'Xóa bộ lọc để xem toàn bộ lịch sử.':'Các lần thu cọc, thanh toán và hoàn tiền sẽ xuất hiện tại đây.'}</small>${filtered?'<button class="btn" data-finance="history-reset">Xem toàn bộ lịch sử</button>':''}</td></tr>`}</tbody></table></div>
      <p class="finance-context finance-history-note">Loại giao dịch giữ nguyên theo từng lần thu / hoàn. Trạng thái lịch phản ánh toàn bộ số tiền hiện còn giữ. Số dư cũ không tính vào tổng tiền thu / hoàn ở trên và chỉ hiển thị khi xem toàn bộ thời gian.</p>
    </section>`;
  }
  function content(){
    const appointments=getState().appointments||[], pending=appointments.filter(needsAttention).length;
    const currentMonth=monthOf(new Date()), movements=entries().filter(row=>!row.kind.startsWith('opening')&&monthOf(row.occurredAt)===currentMonth);
    const received=movements.filter(row=>!isOutflow(row)).reduce((sum,row)=>sum+Number(row.amount),0),refunded=movements.filter(isOutflow).reduce((sum,row)=>sum+Number(row.amount),0);
    const due=appointments.filter(row=>row.status!=='cancelled').reduce((sum,row)=>sum+summary(row).remaining,0), rows=filteredAppointments();
    return `<section class="finance-intro"><div><span class="finance-eyebrow">QUẢN LÝ THANH TOÁN</span><h2>Mỗi khoản tiền. Một lần xử lý.</h2><p>Kiểm tra tiền thực nhận, ghi nhận tại đây. Đủ cọc, lịch được xác nhận cùng lúc.</p></div><div class="finance-flow" aria-label="Quy trình"><span><b>01</b> Đối chiếu</span><i aria-hidden="true">→</i><span><b>02</b> Ghi nhận</span><i aria-hidden="true">→</i><span><b>03</b> Xác nhận lịch</span></div></section>
    <section class="finance-stats" aria-label="Tổng hợp thanh toán"><article class="finance-stat-attention"><span>Lịch cần xử lý</span><strong>${pending.toString().padStart(2,'0')}</strong><small>Cọc chờ kiểm tra & khoản cần hoàn</small></article><article><span>Thu ròng tháng này</span><strong>${money(received-refunded)}</strong><small>Đã trừ ${money(refunded)} hoàn tiền</small></article><article><span>Còn phải thu</span><strong>${money(due)}</strong><small>Tổng số còn thiếu của các lịch chưa hủy</small></article></section>
    <div class="finance-workspace-bar"><nav class="finance-tabs" aria-label="Chế độ thanh toán">${[['attention','Cần xử lý'],['all','Tất cả lịch'],['ledger','Lịch sử giao dịch']].map(([value,label])=>`<button type="button" data-finance="tab" data-view="${value}" class="${view===value?'active':''}" aria-current="${view===value?'page':'false'}">${label}${value==='attention'?`<span>${pending}</span>`:''}</button>`).join('')}</nav><div class="finance-workspace-tools"><button class="finance-refresh" data-finance="refresh" aria-label="Làm mới thanh toán">↻ <span>Làm mới</span></button><button class="btn" data-finance="record">Ghi giao dịch <span aria-hidden="true">＋</span></button></div></div>
    <div class="finance-filters"><label class="finance-search"><span class="sr-only">Tìm lịch hoặc giao dịch</span><span aria-hidden="true">⌕</span><input data-finance-search placeholder="${view==='ledger'?'Tìm mã lịch, khách, mã giao dịch…':'Tìm tên khách, số điện thoại, mã lịch…'}" value="${esc(search)}"></label>${view==='all'?`<label class="finance-filter-label"><span class="sr-only">Trạng thái thanh toán</span><select data-finance-status>${[['all','Mọi trạng thái'],['pending','Khách báo đã chuyển'],['due','Còn phải thu'],['refund','Cần hoàn tiền'],['settled','Đã thu đủ']].map(([value,label])=>`<option value="${value}" ${status===value?'selected':''}>${label}</option>`).join('')}</select></label>`:''}${search?'<button class="finance-clear" data-finance="clear">Xóa tìm kiếm</button>':''}</div>
    ${view==='ledger'?ledger():`<section class="finance-section finance-booking-section"><div class="finance-section-head"><div><h2>${view==='attention'?'Danh sách cần xử lý':'Thanh toán theo lịch hẹn'}</h2><p>${view==='attention'?'Ưu tiên khoản cần hoàn và khách đã báo chuyển tiền.':'Theo dõi cọc, tiền còn lại và biên nhận tại một nơi.'}</p></div><span>${rows.length} lịch hẹn</span></div><div class="finance-bookings">${rows.length?rows.map(bookingCard).join(''):`<div class="finance-empty-state"><span aria-hidden="true">${search?'⌕':'✓'}</span><h3>${search?'Không tìm thấy lịch phù hợp':view==='attention'?'Đã xử lý xong':'Chưa có lịch phù hợp'}</h3><p>${search?'Thử tên khách, số điện thoại hoặc mã lịch khác.':view==='attention'?'Không có khoản cọc chờ kiểm tra hoặc khoản hoàn cần xử lý.':'Lịch hẹn và các khoản thanh toán sẽ xuất hiện tại đây.'}</p><button class="btn" data-finance="${search?'clear':'tab'}" data-view="all">${search?'Xóa tìm kiếm':'Xem tất cả lịch'}</button></div>`}</div></section>`}`;
  }
  function html(){
    const route=location.hash;
    if(route!==previousRoute){
      previousRoute=route;
      const query=new URLSearchParams(route.split('?')[1]||''),requested=query.get('status');
      search=query.get('q')||'';
      // Existing overview and global-search links explicitly carry a month,
      // including month= for transaction searches across every period.
      view=query.get('view')==='ledger'||query.has('month')||query.has('kind')||query.has('payment')?'ledger':requested==='attention'||!requested&&!search?'attention':'all';
      status=view==='attention'?'attention':['pending','due','refund','settled'].includes(requested)?requested:'all';
      month=query.has('month')&&/^\d{4}-(0[1-9]|1[0-2])$/.test(query.get('month'))?query.get('month'):'';
      historyKind=Object.hasOwn(historyKinds,query.get('kind'))?query.get('kind'):'all';
      historyStage=Object.hasOwn(historyStages,query.get('payment'))?query.get('payment'):'all';
    }
    return `<div class="finance-admin" id="finance-admin">${content()}</div>`;
  }
  function draw(){const root=document.getElementById('finance-admin');if(!root)return;const active=root.contains(document.activeElement)?document.activeElement:null;const selection=active?.selectionStart;root.innerHTML=content();mount();if(active?.hasAttribute('data-finance-search')){const field=root.querySelector('[data-finance-search]');field.focus();if(selection!=null)field.setSelectionRange(selection,selection);}}
  function exportLedger(){
    const quote=value=>{const text=String(value??'');return '"'+(/^[\s]*[=+@\-\t\r]/.test(text)?"'":'')+text.replaceAll('"','""')+'"';};
    const rows=[['Mã chứng từ','Mã lịch','Khách hàng','Điện thoại','Loại giao dịch','Tiền vào','Tiền ra','Trạng thái lịch hiện tại','Phương thức','Mã giao dịch','Thời gian giao dịch','Thời gian ghi sổ','Ghi chú'],...filteredTransactions().map(row=>[row.id,row.appointmentCode,row.customer,row.phone,financeKinds[row.kind],isOutflow(row)?0:row.amount,isOutflow(row)?row.amount:0,historyStages[row.stage],row.method,row.reference,row.legacy?'Không xác định (số dư cũ)':row.occurredAt,row.createdAt,row.note])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`hoan-so-thu-hoan-${month||'tat-ca'}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function mount(){const root=document.getElementById('finance-admin');if(!root){previousRoute='';return;}if(root===boundRoot)return;boundRoot=root;
    root.addEventListener('input',event=>{if(event.target.hasAttribute('data-finance-search')){search=event.target.value;draw();}});
    root.addEventListener('change',event=>{
      if(event.target.hasAttribute('data-finance-month')){month=event.target.value;draw();}
      if(event.target.hasAttribute('data-finance-status')){status=event.target.value;draw();}
      if(event.target.hasAttribute('data-history-period')){month=event.target.value==='month'?(month||monthOf(new Date())):'';draw();}
      if(event.target.hasAttribute('data-history-stage')){historyStage=event.target.value;draw();}
    });
    root.addEventListener('click',async event=>{const button=event.target.closest('[data-finance]');if(!button)return;event.preventDefault();const action=button.dataset.finance;
      if(action==='record'||action==='collect')open(button.dataset.code||'',button.dataset.kind);
      if(action==='export')exportLedger();
      if(action==='clear'){search='';draw();}
      if(action==='history-kind'){historyKind=button.dataset.kind;draw();}
      if(action==='history-reset'){search='';month='';historyKind='all';historyStage='all';draw();}
      if(action==='tab'){view=button.dataset.view;status=view==='attention'?'attention':'all';if(view==='ledger'){month='';historyKind='all';historyStage='all';}draw();}
      if(action==='refresh'){button.disabled=true;try{await refresh();draw();}catch(error){toast(error.message||'Không thể làm mới dữ liệu.');}finally{button.disabled=false;}}
    });
  }
  function open(code='',kind){
    if(!onWorkspace()){navigate(code);return;}
    if(dialog?.open){dialog.focus();return;}
    const appointments=getState().appointments||[];
    if(!appointments.length){toast('Chưa có lịch hẹn để ghi nhận giao dịch.');return;}
    const pending=pendingEntry();if(pending&&appointments.some(row=>row.code===pending.code)){code=pending.code;kind=pending.kind;}
    const selected=appointments.find(row=>row.code===code)||filteredAppointments()[0]||appointments[0];
    code=selected.code;
    kind=kind||(selected.status==='cancelled'?'refund':summary(selected).netReceived<required(selected)?'deposit':'balance');
    const fixedCode=Boolean(arguments[0])||Boolean(pending);
    dialog=document.createElement('dialog');dialog.className='finance-dialog';dialog.setAttribute('aria-labelledby','finance-dialog-title');
    dialog.innerHTML=`<form><header><div><span class="finance-eyebrow">THANH TOÁN · HOÀN</span><h2 id="finance-dialog-title">Xác nhận cọc</h2><p>Ghi nhận sau khi đã kiểm tra giao dịch thực tế.</p></div><button type="button" class="finance-close" aria-label="Đóng">×</button></header><div class="finance-dialog-fields"><label class="full" ${fixedCode?'hidden':''}>Lịch hẹn<select name="code" required>${appointments.map(row=>`<option value="${esc(row.code)}" ${row.code===code?'selected':''}>${esc(row.code)} · ${esc(row.customer)}</option>`).join('')}</select></label><div class="finance-dialog-customer full"></div><select name="kind" aria-label="Loại giao dịch" hidden><option value="deposit">Thu cọc</option><option value="balance">Thu tiền còn lại</option><option value="refund">Hoàn tiền</option></select><div class="finance-dialog-summary full" aria-live="polite"></div><label>Số tiền thực nhận (VNĐ)<input name="amount" type="number" min="1" max="1000000000" step="1" inputmode="numeric" required></label><label>Phương thức<select name="method"><option value="bank">Chuyển khoản</option><option value="cash">Tiền mặt</option></select></label><label class="full finance-reference">Mã giao dịch ngân hàng<input name="reference" maxlength="120" autocomplete="off" placeholder="Nhập mã giao dịch từ ngân hàng" required><small>Dùng mã ngân hàng để đối chiếu và tránh ghi trùng.</small></label><label class="full finance-refund-reason" hidden>Lý do hoàn tiền<textarea name="refundNote" rows="2" maxlength="1000" placeholder="Nhập lý do và nội dung đã hoàn cho khách"></textarea></label><div class="finance-outcome full" aria-live="polite"></div><details class="finance-extra full"><summary>Thông tin bổ sung <span>Thời gian & ghi chú</span></summary><div><label>Thời gian thực giao dịch<input name="occurredAt" type="datetime-local" required><small>Mặc định hiện tại. Chỉnh lại nếu tiền về trước đó.</small></label><label class="finance-note">Ghi chú<textarea name="note" rows="2" maxlength="1000" placeholder="Thêm ghi chú nếu cần"></textarea></label></div></details></div><p class="finance-form-error" role="alert" tabindex="-1" hidden></p><footer><button class="btn finance-cancel" type="button">Để sau</button><button class="btn btn-dark" type="submit">Xác nhận cọc</button></footer></form>`;
    document.body.append(dialog);const form=dialog.querySelector('form'),field=name=>form.elements.namedItem(name),error=dialog.querySelector('.finance-form-error');
    form.noValidate = true;
    error.dataset.formFeedback = '';
    field('reference').placeholder='Mã riêng của giao dịch này, không phải tên ngân hàng';
    dialog.querySelector('.finance-reference small').textContent='Nhập mã giao dịch từ biên nhận ngân hàng; mỗi lần chuyển dùng một mã riêng.';
    field('kind').value=['deposit','balance','refund'].includes(kind)?kind:'deposit';
    field('occurredAt').value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
    let idempotencyKey=pending?.idempotencyKey||crypto.randomUUID(),submittedPayload=pending;
    const current=()=>appointments.find(row=>row.code===field('code').value);
    const outcome=()=>{const a=current(),s=summary(a),isRefund=field('kind').value==='refund',amount=Number(field('amount').value)||0,needed=required(a),remainingDeposit=Math.max(0,needed-s.netReceived-amount);dialog.querySelector('.finance-outcome').textContent=isRefund?'Chỉ ghi nhận khoản hoàn sau khi đã chuyển tiền thực tế cho khách.':a.status==='pending'?(remainingDeposit>0?`Sau khoản thu này còn thiếu ${money(remainingDeposit)} tiền cọc. Lịch tiếp tục chờ xác nhận.`:'Đủ cọc sau khoản thu này. Lịch được xác nhận cùng lúc, không cần duyệt thêm.'):`Sau khoản thu này còn phải thu ${money(Math.max(0,s.remaining-amount))}.`;};
    const update=()=>{const a=current(),s=summary(a),isRefund=field('kind').value==='refund',needed=required(a);const title=isRefund?'Ghi nhận hoàn tiền':field('kind').value==='deposit'?'Xác nhận cọc':'Thu tiền còn lại';dialog.querySelector('#finance-dialog-title').textContent=title;form.querySelector('[type="submit"]').textContent=title;field('amount').parentElement.firstChild.textContent=isRefund?'Số tiền thực hoàn (VNĐ)':'Số tiền thực nhận (VNĐ)';field('amount').value=isRefund?s.netReceived:field('kind').value==='deposit'?Math.max(0,Math.min(needed-s.netReceived,s.remaining)):s.remaining;field('amount').max=isRefund?s.netReceived:s.remaining;dialog.querySelector('.finance-dialog-customer').innerHTML=`<span class="finance-avatar" aria-hidden="true">${esc(String(a.customer||'?').trim().slice(0,1).toUpperCase())}</span><div><b>${esc(a.customer)}</b><small>${esc(a.code)} · ${esc(a.phone)}<br>${esc(a.time)} · ${esc(a.date?.split('-').reverse().join('/')||'')}</small></div>`;dialog.querySelector('.finance-dialog-summary').innerHTML=`<span>${isRefund?'Đã thu':'Cọc yêu cầu'}<b>${money(isRefund?s.received:needed)}</b></span><span>Thực còn giữ<b>${money(s.netReceived)}</b></span><span>${isRefund?'Đã hoàn':'Còn phải thu'}<b>${money(isRefund?s.refunded:s.remaining)}</b></span>`;field('refundNote').required=isRefund;field('refundNote').closest('label').hidden=!isRefund;field('note').closest('label').hidden=isRefund;outcome();};update();
    const close=()=>{if(form.dataset.saving)return;dialog.close();dialog.remove();dialog=null;};
    const freezeUncertain=()=>form.querySelectorAll('input,select,textarea').forEach(input=>input.disabled=true);
    const syncMethod=()=>{const bank=field('method').value==='bank';field('reference').required=bank;field('reference').closest('label').hidden=!bank;};
    if(pending){for(const name of ['code','kind','method','amount','reference'])field(name).value=pending[name]??'';const recorded = new Date(pending.occurredAt);field('occurredAt').value=Number.isFinite(recorded.getTime())?new Date(recorded.getTime()-recorded.getTimezoneOffset()*60000).toISOString().slice(0,16):'';field(pending.kind==='refund'?'refundNote':'note').value=pending.note;syncMethod();outcome();freezeUncertain();error.textContent='Giao dịch trước chưa nhận được kết quả. Bấm xác nhận để kiểm tra lại cùng giao dịch, không tạo khoản mới.';error.hidden=false;}
    dialog.querySelectorAll('.finance-close,.finance-cancel').forEach(button=>button.addEventListener('click',close));
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    form.addEventListener('change',event=>{if(event.target.name==='code'){const a=current();field('kind').value=a.status==='cancelled'?'refund':summary(a).netReceived<required(a)?'deposit':'balance';update();}if(event.target.name==='method')syncMethod();});
    form.addEventListener('input',event=>{if(event.target.name==='amount')outcome();if(submittedPayload){idempotencyKey=crypto.randomUUID();submittedPayload=null;}});
    form.addEventListener('submit',async event=>{event.preventDefault();if(form.dataset.saving)return;
      window.HoanFormFeedback.clear(form);
      try{
        const a=current(),wasPending=a.status==='pending',isRefund=field('kind').value==='refund';
        const date = new Date(field('occurredAt').value);
        const values = {
          kind: field('kind').value, amount: field('amount').value, method: field('method').value,
          reference: field('method').value === 'bank' ? field('reference').value : '',
          note: field(isRefund ? 'refundNote' : 'note').value,
          occurredAt: Number.isFinite(date.getTime()) ? date.toISOString() : '',
          idempotencyKey, confirmAppointment: !isRefund && wasPending,
        };
        const payload=submittedPayload||{action:'recordPayment',code:field('code').value,...values};submittedPayload=payload;rememberPending(payload);form.dataset.saving='true';form.querySelectorAll('button').forEach(button=>button.disabled=true);freezeUncertain();
        const response=await api(payload),state=getState(),appointment=state.appointments.find(row=>row.code===response.appointment.code);if(appointment)Object.assign(appointment,response.appointment);state.paymentTransactions=state.paymentTransactions||[];if(!state.paymentTransactions.some(row=>row.id===response.transaction.id))state.paymentTransactions.unshift(response.transaction);
        rememberPending(null);form.dataset.saving='';close();draw();toast(response.replayed?'Giao dịch đã có trong sổ, không ghi thêm.':response.appointment.status==='confirmed'&&wasPending?'Đã nhận cọc và xác nhận lịch.':'Đã ghi nhận giao dịch.');
      }catch(reason){
        if(submittedPayload&&(!reason.status||reason.status>=500)){freezeUncertain();error.textContent=(reason.message||'Chưa nhận được kết quả giao dịch.')+' Bấm xác nhận lại để kiểm tra cùng giao dịch.';}
        else {
          rememberPending(null);submittedPayload=null;idempotencyKey=crypto.randomUUID();
          form.querySelectorAll('input,select,textarea').forEach(input=>input.disabled=false);
          window.HoanFormFeedback.show(form, reason, { note: field('kind').value === 'refund' ? 'refundNote' : 'note' });
        }
        if(submittedPayload){error.hidden=false;error.focus();}
        form.dataset.saving='';form.querySelectorAll('button').forEach(button=>button.disabled=false);return;
      }
      try{await refresh();draw();}catch{toast('Đã ghi sổ thành công. Chưa làm mới được dữ liệu; vui lòng bấm Làm mới.');}
    });
    dialog.showModal();
    if(!pending)field('method').value==='bank'?field('reference').focus():field('amount').focus();
  }
  return {html,mount,open,navigate,exportLedger};
}
