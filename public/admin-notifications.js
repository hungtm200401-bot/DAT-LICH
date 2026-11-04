export function createAdminNotifications({getState,api,render,toast,esc}){
  const pending=new Set(),errors=new Map();let search='';
  const count=()=> (getState().notifications||[]).filter(row=>row.status==='unread').length;
  const date=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour12:false,hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}):'Chưa có thời gian';};
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
  function content({mobile=false}={}){
    const rows=(getState().notifications||[]).slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))),unread=count(),tab=new URLSearchParams(location.hash.split('?')[1]||'').get('tab')==='unread'?'unread':'all';
    const visible=rows.filter(row=>(tab!=='unread'||row.status==='unread')&&normalize([row.title,row.message].join(' ')).includes(normalize(search)));
    return `<div class="notice-workspace" data-notice-mobile="${mobile}" aria-label="Danh sách thông báo"><div class="notice-summary"><span><b>${unread}</b> chưa đọc</span><p>Tích ô ở từng thông báo để đánh dấu đã đọc.</p></div><div class="notice-toolbar"><nav aria-label="Lọc thông báo"><a class="${tab==='all'?'active':''}" href="#/admin/notifications?tab=all">Tất cả <span>${rows.length}</span></a><a class="${tab==='unread'?'active':''}" href="#/admin/notifications?tab=unread">Chưa đọc <span>${unread}</span></a></nav><label class="notice-search"><span class="ops-sr">Tìm thông báo</span><input data-notice-search value="${esc(search)}" placeholder="Tìm nội dung thông báo…"></label></div>${getState().backendError?'<p class="ops-error" role="alert">Chưa làm mới được dữ liệu. Đang hiển thị thông báo đã tải.</p>':''}<div class="notice-list">${visible.length?visible.map(row=>{
      const read=row.status!=='unread',busy=pending.has(row.id),href=row.entityType==='appointment'?`#/admin/appointments${mobile?'/':'?code='}${encodeURIComponent(row.entityId||'')}`:row.entityType==='request'?`#/admin/requests${mobile?'/'+encodeURIComponent(row.entityId||''):'?id='+encodeURIComponent(row.entityId||'')}`:'#/admin/notifications';
      return `<article class="notice-row ${read?'is-read':'is-unread'}" data-notice-id="${esc(row.id||'')}"><label class="notice-check"><input type="checkbox" data-notice-read="${esc(row.id||'')}" aria-label="${esc((read?'Đã đọc: ':'Đánh dấu đã đọc: ')+(row.title||'Thông báo'))}" ${read?'checked':''} ${read||busy||!row.id?'disabled':''}><span class="ops-sr">Đã đọc</span></label><div class="notice-copy"><div class="notice-row-head"><b>${esc(row.title||'Thông báo')}</b><span class="notice-status ${read?'':'unread'}">${read?'Đã đọc':'<i aria-hidden="true"></i>Chưa đọc'}</span></div><p>${esc(row.message||'')}</p><div class="notice-row-foot"><time>${esc(date(row.createdAt))}</time>${row.entityId?`<a href="${href}">${row.entityType==='appointment'?'Mở lịch hẹn':'Mở yêu cầu'} <span aria-hidden="true">↗</span></a>`:''}</div>${busy?'<small role="status">Đang lưu trạng thái…</small>':''}${errors.has(row.id)?`<p class="ops-error" role="alert">${esc(errors.get(row.id))} Tích lại để thử.</p>`:''}</div></article>`;
    }).join(''):`<div class="ops-empty"><b>${search?'Không tìm thấy thông báo':tab==='unread'?'Bạn đã đọc hết thông báo':'Chưa có thông báo'}</b><p>${search?'Thử từ khóa khác.':'Thông báo mới sẽ được đánh dấu để bạn dễ nhận biết.'}</p></div>`}</div></div>`;
  }
  function draw(){const root=document.querySelector('.notice-workspace');if(!root)return;const mobile=root.dataset.noticeMobile==='true';root.outerHTML=content({mobile});}
  document.addEventListener('input',event=>{if(!event.target.matches('[data-notice-search]'))return;search=event.target.value;const cursor=event.target.selectionStart;draw();const input=document.querySelector('[data-notice-search]');input?.focus();if(cursor!=null)input?.setSelectionRange(cursor,cursor);});
  document.addEventListener('change',async event=>{
    const input=event.target.closest('[data-notice-read]');if(!input)return;
    const id=input.dataset.noticeRead,row=(getState().notifications||[]).find(row=>row.id===id);input.checked=false;
    if(!id||!row||row.status!=='unread'||pending.has(id))return;
    pending.add(id);errors.delete(id);draw();
    try{
      await api({action:'markNotificationsRead',id});
      // Other checkboxes may finish concurrently; update the live state only.
      const current=(getState().notifications||[]).find(row=>row.id===id);if(current){current.status='read';current.readAt=new Date().toISOString();}
      pending.delete(id);render();toast('Đã đọc thông báo.');
    }catch(error){pending.delete(id);errors.set(id,error.message||'Không thể lưu trạng thái.');draw();toast('Chưa lưu được. Thông báo vẫn chưa đọc.');}
  });
  return {content,count};
}
