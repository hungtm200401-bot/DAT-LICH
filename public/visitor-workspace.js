export function createVisitorWorkspace({request,esc,toast,adminShell,getServiceName}){
  let days='7',source='',activeOnly=false,offset=0,report=null,error='',loading=false,sequence=0,bound=null,timer=null,query='';
  let detailId='',detailOffset=0,detailGeneration=0;
  function date(value, includeSeconds = false) {
    const parsed = new Date(value || NaN);
    return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', hour12: false,
      hour: '2-digit', minute: '2-digit', ...(includeSeconds ? { second: '2-digit' } : {}),
      day: '2-digit', month: '2-digit', year: 'numeric',
    }) : '—';
  }
  const duration=value=>{const seconds=Math.max(0,Number(value)||0);return `${Math.floor(seconds/60)} phút ${Math.floor(seconds%60)} giây`;};
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
  function sessionState(row) {
    if (row.left_at) {
      return { active: false, label: 'Đã rời trang', endLabel: 'Rời lúc', endAt: row.left_at };
    }
    let endAt = null;
    let endTime = -Infinity;
    for (const value of [row.started_at, row.last_event_at, row.last_seen_at]) {
      const timestamp = Date.parse(value);
      if (timestamp > endTime) {
        endAt = value;
        endTime = timestamp;
      }
    }
    const startedTime = Date.parse(row.started_at);
    if (row.active_seconds > 0 && Math.floor(endTime / 1000) <= Math.floor(startedTime / 1000)) {
      endAt = null;
    }
    const active = Boolean(report?.activeSince && row.last_seen_at >= report.activeSince);
    return { active, label: active ? 'Đang hoạt động' : 'Không hoạt động', endLabel: 'Ghi nhận cuối', endAt };
  }
  const rows=()=> (report?.sessions||[]).filter(row=>normalize([row.display_name,row.session_code,row.id,row.source,row.campaign,row.current_page,pageName(row.current_page),row.declared_purpose].join(' ')).includes(normalize(query)));
  const sourceLabel=value=>value==='direct'?'Trực tiếp':value==='facebook'?'Facebook':value||'Chưa rõ';
  const sessionCodeLabel=code=>code?`Mã phiên <code>${esc(code)}</code>`:'Chưa có mã phiên';
  const icon=name=>{
    const paths={page:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',click:'<path d="m4 3 7 18 2-8 8-2Z"/>',conversion:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',person:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',source:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>'};
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.page}</svg>`;
  };
  const pageNames = {
    '/': 'Trang chủ',
    '/services': 'Dịch vụ',
    '/gallery': 'Bộ sưu tập',
    '/about': 'Về Hoàn',
    '/contact': 'Liên hệ',
    '/support': 'Hỗ trợ',
    '/policies': 'Chính sách',
    '/search': 'Tìm kiếm',
    '/lookup': 'Tra cứu lịch hẹn',
    '/booking/service': 'Đặt lịch · Chọn dịch vụ',
    '/booking/time': 'Đặt lịch · Chọn thời gian',
    '/booking/location': 'Đặt lịch · Địa điểm',
    '/booking/info': 'Đặt lịch · Thông tin khách',
    '/booking/deposit': 'Đặt lịch · Đặt cọc',
    '/booking/confirm': 'Đặt lịch · Xác nhận',
    '/booking/success': 'Đặt lịch · Hoàn tất',
  };
  const pageGroups = {
    services: 'Chi tiết dịch vụ',
    look: 'Chi tiết bộ sưu tập',
    support: 'Bài viết hỗ trợ',
    policies: 'Chính sách',
    booking: 'Chi tiết lịch hẹn',
  };
  function pageName(value) {
    const urlPath = String(value || '').replace(/^#/, '').split('?')[0];
    if (!urlPath) return 'Chưa ghi nhận trang';
    const path = urlPath.replace(/\/+$/, '') || '/';
    if (pageNames[path]) return pageNames[path];
    const [, group, id] = path.split('/');
    if (group === 'services' && id) {
      const serviceName = getServiceName?.(id);
      if (serviceName) return serviceName;
    }
    return Object.hasOwn(pageGroups, group) ? pageGroups[group] : 'Trang khác';
  }
  const eventDate=(value,clock=false)=>{
    const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour12:false,...(clock?{hour:'2-digit',minute:'2-digit',second:'2-digit'}:{day:'2-digit',month:'2-digit',year:'numeric'})}):'Chưa rõ thời gian';
  };
  const shareTools=()=>`<details class="visitor-tools"><summary>Tạo link chia sẻ & mã QR <span> Mở công cụ ↗</span></summary><div class="visitor-share-grid"><form id="visit-share-form"><label>Website công khai<input name="website" type="url" required placeholder="https://website-cua-ban.vn/" value="${esc(location.protocol==='https:'?location.origin+'/':'')}"></label><label>Trang đích<select name="targetPage"><option value="#/">Trang chủ</option><option value="#/services">Dịch vụ</option><option value="#/gallery">Bộ sưu tập</option><option value="#/booking/service">Đặt lịch</option></select></label><label>Tên chiến dịch<input name="campaign" required maxlength="120" placeholder="vi-du: bai-viet-thang-11"></label><button class="btn btn-dark" type="submit">Tạo link Facebook & QR</button></form><div><div id="visit-qr-container" class="visitor-qr-placeholder">Mã QR hiển thị sau khi tạo link.</div><label>Link chia sẻ<input id="visit-share-link" readonly placeholder="Chưa tạo link"></label><div class="visitor-inline-actions"><button class="btn" data-visit-admin="copy">Sao chép link</button><button class="btn" data-action="download-qr" disabled>Tải mã QR</button></div></div></div></details>`;
  function sessionTime(label, value) {
    const formatted = date(value, true);
    const time = formatted === '—' ? 'Chưa ghi nhận' : `<time datetime="${esc(value)}">${esc(formatted)}</time>`;
    return `<div><dt>${label}</dt><dd>${time}</dd></div>`;
  }
  function sessionRow(row){
    const status = sessionState(row);
    return `<article class="visitor-session" data-visitor-session-row="${esc(row.id)}">
      <div class="visitor-person">
        <span class="visitor-person-icon" aria-hidden="true">${esc(row.display_name?.slice(0,1)||'K')}</span>
        <div>
          <b>${esc(row.display_name||'Khách vãng lai')}</b>
          <small>${sessionCodeLabel(row.session_code)} · ${esc(row.device||'Chưa rõ thiết bị')}</small>
        </div>
      </div>
      <div class="visitor-origin">
        <b>${esc(sourceLabel(row.source))}</b><small>${esc(row.campaign||'Không có chiến dịch')}</small>
      </div>
      <div class="visitor-journey">
        <b title="${esc(row.current_page || '')}">${esc(pageName(row.current_page))}</b>
        <small>${Number(row.pageviews)||0} lượt xem · ${duration(row.active_seconds)}</small>
      </div>
      <div class="visitor-last">
        <span class="visitor-online ${status.active ? 'active' : ''}"><i aria-hidden="true"></i>${status.label}</span>
        <dl class="visitor-session-times">
          ${sessionTime('Bắt đầu', row.started_at)}
          ${sessionTime(status.endLabel, status.endAt)}
        </dl>
      </div>
      <button class="btn" data-visitor="detail" data-session="${esc(row.id)}">Xem hành trình ↗</button>
    </article>`;
  }
  function body(){
    const summary=report?.summary,visible=rows(),pageSize=Number(report?.pageSize)||10,total=Number(summary?.total)||0;
    return `<div class="visitor-heading"><div><span class="ops-eyebrow">LƯU LƯỢNG WEBSITE</span><h2>Khách & hành trình</h2><p>Xem nguồn vào, trang đã xem và hoạt động của từng phiên.</p></div><div class="visitor-inline-actions"><button class="btn" data-visitor="refresh" ${loading?'disabled':''}>${loading?'Đang tải…':'Làm mới'}</button><button class="btn" data-visitor="export" ${!report||loading||error?'disabled':''}>Xuất trang CSV</button></div></div>
      <div class="visitor-filters"><label>Thời gian<select data-visitor-filter="days">${[1,7,30,90].map(n=>`<option value="${n}" ${days===String(n)?'selected':''}>${n} ngày gần nhất</option>`).join('')}</select></label><label>Nguồn truy cập<select data-visitor-filter="source">${[['','Tất cả nguồn'],['facebook','Facebook'],['direct','Trực tiếp'],...Array.from(new Set((report?.sessions||[]).map(row=>row.source))).filter(s=>s&&!['facebook','direct'].includes(s)).map(s=>[s,s])].map(([value,label])=>`<option value="${esc(value)}" ${source===value?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label class="visitor-online-toggle"><input type="checkbox" data-visitor-filter="active" ${activeOnly?'checked':''}>Chỉ đang hoạt động</label>${source||activeOnly||days!=='7'?'<button class="visitor-reset" data-visitor="reset">Đặt lại</button>':''}</div>
      <section class="visitor-stats" aria-label="Thống kê trong bộ lọc">${[['Tổng phiên truy cập',summary?.total],['Đang hoạt động',summary?.active],['Từ Facebook',summary?.facebook]].map(([title,value])=>`<article><span>${title}</span><strong>${summary?Number(value)||0:'—'}</strong></article>`).join('')}</section>
      <div class="visitor-list-head"><div><h3>Danh sách truy cập</h3><p>${report?'Cập nhật '+esc(date(report.serverTime))+' · tự làm mới mỗi 10 giây':'Đang kết nối dữ liệu'}</p></div><label><span class="ops-sr">Tìm trên trang này</span><input data-visitor-search placeholder="Tìm trên trang này…" value="${esc(query)}"></label></div>
      ${error?`<div class="ops-error" role="alert">${esc(error)} ${report?'Số liệu đang hiển thị là lần tải trước.':''} <button data-visitor="refresh">Thử lại</button></div>`:''}
      <div class="visitor-session-list" aria-busy="${loading}">${!report?`<div class="ops-empty" role="status">${error?'Chưa tải được dữ liệu.':'Đang tải danh sách truy cập…'}</div>`:visible.length?visible.map(sessionRow).join(''):`<div class="ops-empty"><b>${query?'Không có kết quả trên trang này':'Chưa có phiên phù hợp'}</b><p>${query?'Thử từ khóa khác hoặc chuyển trang.':'Thử đổi thời gian hoặc nguồn truy cập.'}</p></div>`}</div>
      <div class="visitor-pagination"><span>${report?`${total?offset+1:0}–${Math.min(offset+(report.sessions||[]).length,total)} / ${total} phiên${query?' · Tìm trong '+(report.sessions||[]).length+' phiên trên trang':''}`:'Chưa có dữ liệu'}</span><div><button class="btn" data-visitor="prev" ${loading||!offset?'disabled':''}>← Trước</button><button class="btn" data-visitor="next" ${loading||!report||offset+pageSize>=total?'disabled':''}>Sau →</button></div></div>
      <p class="visitor-note">Chỉ gồm các phiên trình duyệt được ghi nhận khi khách đồng ý thống kê; không đồng nghĩa số người duy nhất. Giờ Việt Nam (UTC+7), lưu giữ tối đa 90 ngày.</p>`;
  }
  function content(){return `<div class="visitor-workspace"><div data-visitor-body>${body()}</div>${shareTools()}<dialog class="visitor-detail-dialog" aria-labelledby="visitor-detail-title" aria-describedby="visitor-detail-description"><div data-visitor-detail></div></dialog></div>`;}
  function html(){return adminShell('visitors',content(),'Khách truy cập website','Theo dõi lượt vào và hành trình, gọn trong một danh sách.');}
  function draw(){const root=document.querySelector('[data-visitor-body]');if(!root)return;const input=root.querySelector('[data-visitor-search]'),focused=document.activeElement===input,cursor=input?.selectionStart;root.innerHTML=body();if(focused){const next=root.querySelector('[data-visitor-search]');next.focus();if(cursor!=null)next.setSelectionRange(cursor,cursor);}}
  async function load(){
    if(!document.querySelector('.visitor-workspace'))return;const generation=++sequence;loading=true;draw();
    try{const params=new URLSearchParams({days,source,active:activeOnly?'1':'0',offset:String(offset)}),result=await request('/api/visits?'+params,null,true);if(generation!==sequence)return;report=result;error='';
      if(offset&&offset>=Number(result.summary?.total||0)){offset=0;loading=false;return load();}
    }catch(reason){if(generation===sequence)error=reason.message||'Không thể tải thống kê.';}
    finally{if(generation===sequence){loading=false;draw();}}
  }
  function exportCsv(){
    const safe=value=>{const s=String(value??'');return '"'+(/^[\s]*[=+@\-\t\r]/.test(s)?"'":'')+s.replaceAll('"','""')+'"';};
    const values=[['Tên hiển thị','Mã phiên','Nguồn','Chiến dịch','Thiết bị','Trang hiện tại','Lượt xem','Giây hoạt động','Truy cập cuối (giờ Việt Nam)'],...rows().map(row=>[row.display_name||'Khách vãng lai',row.session_code,sourceLabel(row.source),row.campaign,row.device,row.current_page,row.pageviews,row.active_seconds,date(sessionState(row).endAt)])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+values.map(row=>row.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`hoan-khach-truy-cap-trang-${Math.floor(offset/(report?.pageSize||10))+1}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function closeDetail(){detailGeneration++;document.querySelector('.visitor-detail-dialog')?.close();}
  function detailSummary(session, status){
    if(!session)return '';
    const fields=[['Thiết bị',[session.device,session.browser].filter(Boolean).join(' · ')||'Chưa ghi nhận'],['Chiến dịch',session.campaign||'Không có chiến dịch'],['Bắt đầu',date(session.started_at, true)],[status.endLabel,status.endAt?date(status.endAt, true):'Chưa ghi nhận']];
    return `<section class="visitor-detail-summary" aria-label="Tóm tắt phiên truy cập"><div class="visitor-detail-stats">${[['page','Lượt xem trang',Number(session.pageviews)||0],['clock','Thời gian hoạt động',duration(session.active_seconds)],['source','Nguồn truy cập',sourceLabel(session.source)]].map(([symbol,label,value])=>`<div>${icon(symbol)}<span>${label}</span><strong>${esc(String(value))}</strong></div>`).join('')}</div><dl class="visitor-detail-meta">${fields.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><div class="visitor-detail-route"><span>Trang vào<strong>${session.landing_page?esc(pageName(session.landing_page)):'Chưa ghi nhận'}</strong></span><span class="visitor-route-divider" aria-hidden="true"></span><span>Trang gần nhất<strong>${session.current_page?esc(pageName(session.current_page)):'Chưa ghi nhận'}</strong></span></div>${session.declared_purpose?`<div class="visitor-detail-purpose"><b>Nhu cầu khách chia sẻ</b><p>${esc(session.declared_purpose)}</p></div>`:''}</section>`;
  }
  function eventDescription(event) {
    const label = String(event.label || '').trim();
    switch (event.type) {
      case 'pageview':
        return `Xem ${pageName(event.page)}`;
      case 'click': {
        const prefix = 'Đi tới ';
        if (label.startsWith(prefix + '/')) return `Mở ${pageName(label.slice(prefix.length))}`;
        if (label === 'Chọn dịch vụ / bước đặt lịch') return 'Thao tác đặt lịch';
        return label || 'Nhấp liên kết';
      }
      case 'identify':
        return 'Chia sẻ thông tin';
      case 'conversion':
        return label || 'Hoàn tất yêu cầu';
      default:
        return 'Hoạt động khác';
    }
  }
  function eventTimeline(events,eventOffset){
    if(!events.length)return `<div class="visitor-detail-empty" role="status"><span>${icon('page')}</span><b>${eventOffset?'Đã hết sự kiện ở phần này':'Chưa có hoạt động được ghi nhận'}</b><p>${eventOffset?'Chọn Mới hơn để quay lại các hoạt động trước.':'Các trang đã xem và thao tác của khách sẽ xuất hiện tại đây khi được ghi nhận.'}</p></div>`;
    const eventIcons = { pageview: 'page', click: 'click', conversion: 'conversion', identify: 'person' };
    let previousDay = '';
    return `<ol class="visitor-event-list">${events.map(event => {
      const day = eventDate(event.occurred_at);
      const showDay = day !== previousDay;
      previousDay = day;
      const validDate = Number.isFinite(Date.parse(event.occurred_at));
      return `<li class="visitor-event ${event.type === 'conversion' ? 'is-conversion' : ''}">
        ${showDay ? `<div class="visitor-event-day">${esc(day)}</div>` : ''}
        <div class="visitor-event-row">
          <time ${validDate ? `datetime="${esc(event.occurred_at)}"` : ''}>${esc(eventDate(event.occurred_at, true))}</time>
          <span class="visitor-event-marker">${icon(eventIcons[event.type] || 'page')}</span>
          <p class="visitor-event-card">${esc(eventDescription(event))}</p>
        </div>
      </li>`;
    }).join('')}</ol>`;
  }
  async function detail(id,eventOffset=0){
    const dialog=document.querySelector('.visitor-detail-dialog');if(!dialog)return;detailId=id;detailOffset=eventOffset;const generation=++detailGeneration,container=dialog.querySelector('[data-visitor-detail]'),session=(report?.sessions||[]).find(row=>row.id===id);
    const status = session ? sessionState(session) : null;
    const focusedAction=dialog.contains(document.activeElement)?document.activeElement?.dataset.visitor:null;
    const header=`<header class="visitor-detail-header"><div><span class="visitor-detail-eyebrow">CHI TIẾT PHIÊN TRUY CẬP</span><h2 id="visitor-detail-title">Hành trình truy cập</h2><p id="visitor-detail-description">Các trang đã xem và tương tác của khách trên website.</p></div><button type="button" data-visitor="close-detail" aria-label="Đóng hành trình" autofocus>${icon('close')}</button></header>`;
    const person=`<div class="visitor-detail-person"><span class="visitor-detail-avatar" aria-hidden="true">${icon('person')}</span><div><b>${esc(session?.display_name||'Khách vãng lai')}</b><span>${sessionCodeLabel(session?.session_code)}${session?.display_name?' · Tên khách tự chia sẻ':''}</span></div>${status?`<span class="visitor-detail-status ${status.active?'is-active':''}"><i aria-hidden="true"></i>${status.label}</span>`:''}</div>`;
    const shell=inner=>header+`<main class="visitor-detail-body">${person}${detailSummary(session, status)}<section class="visitor-detail-activity" aria-labelledby="visitor-activity-title"><div class="visitor-activity-heading"><h3 id="visitor-activity-title">Dòng thời gian</h3><span>Mới nhất trước · Giờ Việt Nam</span></div>${inner}</section></main>`;
    const footer=(events=[],busy=false)=>`<footer><span>${busy?'Đang tải sự kiện…':events.length?`Hiển thị ${eventOffset+1}–${eventOffset+events.length} sự kiện`:'0 sự kiện trong phần này'}</span><nav aria-label="Phân trang sự kiện"><button type="button" class="btn" data-visitor="events-prev" ${busy||!eventOffset?'disabled':''}>Mới hơn</button><button type="button" class="btn" data-visitor="events-next" ${busy||events.length<100?'disabled':''}>Cũ hơn</button></nav></footer>`;
    const restoreFocus=()=>{if(focusedAction||!dialog.contains(document.activeElement))(container.querySelector(`[data-visitor="${focusedAction}"]:not(:disabled)`)||container.querySelector('[data-visitor="close-detail"]'))?.focus({preventScroll:true});};
    container.innerHTML=shell('<div class="visitor-detail-loading" role="status"><span class="visitor-loading-bar"></span><span class="visitor-loading-bar"></span><span class="visitor-loading-bar"></span><p>Đang tải hành trình…</p></div>')+footer([],true);if(!dialog.open)dialog.showModal();restoreFocus();
    try{const result=await request('/api/visits?'+new URLSearchParams({session:id,offset:String(eventOffset)}),null,true);if(generation!==detailGeneration||!dialog.isConnected)return;
      const events=Array.isArray(result.events)?result.events:[];
      container.innerHTML=shell(eventTimeline(events,eventOffset))+footer(events);restoreFocus();
    }catch(reason){if(generation===detailGeneration&&dialog.isConnected){container.innerHTML=shell(`<div class="visitor-detail-failure"><p class="ops-error" role="alert">${esc(reason.message||'Không thể tải hành trình.')}</p><button type="button" class="btn" data-visitor="retry-detail">Thử lại</button></div>`)+`<footer><span>Chưa tải được sự kiện</span>${eventOffset?'<button type="button" class="btn" data-visitor="events-prev">Mới hơn</button>':''}</footer>`;restoreFocus();}}
  }
  function unmount(){clearInterval(timer);timer=null;sequence++;loading=false;detailGeneration++;}
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&document.querySelector('.visitor-detail-dialog[open]')){
      event.preventDefault();event.stopImmediatePropagation();closeDetail();
    }
  },true);
  function mount(){
    const root=document.querySelector('.visitor-workspace');if(!root)return;if(root===bound)return;bound=root;
    root.addEventListener('input',event=>{if(event.target.matches('[data-visitor-search]')){query=event.target.value;draw();}});
    root.addEventListener('change',event=>{const key=event.target.dataset.visitorFilter;if(!key)return;if(key==='days')days=event.target.value;if(key==='source')source=event.target.value;if(key==='active')activeOnly=event.target.checked;offset=0;query='';report=null;error='';void load();});
    root.addEventListener('click',event=>{const button=event.target.closest('[data-visitor]');if(!button)return;const action=button.dataset.visitor;event.preventDefault();if(action==='refresh')void load();if(action==='reset'){days='7';source='';activeOnly=false;offset=0;query='';report=null;void load();}if(action==='prev'||action==='next'){offset=Math.max(0,offset+(action==='next'?1:-1)*(report?.pageSize||10));query='';void load();}if(action==='export')exportCsv();if(action==='detail')void detail(button.dataset.session);if(action==='close-detail')closeDetail();if(action==='retry-detail')void detail(detailId,detailOffset);if(action==='events-prev'||action==='events-next')void detail(detailId,Math.max(0,detailOffset+(action==='events-next'?100:-100)));});
    root.querySelector('dialog').addEventListener('cancel',()=>{detailGeneration++;});
    root.querySelector('dialog').addEventListener('click',event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDetail();}});
    draw();void load();clearInterval(timer);timer=setInterval(()=>{if(!document.hidden&&!loading&&!root.querySelector('dialog')?.open&&!root.querySelector('details')?.open&&!root.contains(document.activeElement))void load();},10000);
  }
  return {html,content,mount,unmount};
}
