export function parseIsoDate(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));if(!match)return null;
  const [,year,month,day]=match.map(Number),date=new Date(Date.UTC(year,month-1,day));
  return year>=1000&&year<=9999&&date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?date:null;
}
export function formatVietnamDate(value){return parseIsoDate(value)?value.split('-').reverse().join('/'):'';}
export function parseVietnamDate(value){
  const match=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value||'').trim());if(!match)return '';
  const iso=`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;return parseIsoDate(iso)?iso:'';
}
export const vietnamToday=(value=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const iso=date=>date.toISOString().slice(0,10);
const calendarIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/></svg>';
const clockIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>';

export function createVietnamDate(){
  let active=null,sequence=0;
  const close=(focus=false)=>{if(!active)return;const old=active;active=null;try{old.panel.hidePopover?.();}catch{/* A dismissed popover is already closed. */}old.panel.remove();old.button.setAttribute('aria-expanded','false');if(focus&&old.display.isConnected)old.display.focus();};
  const allowed=(source,value)=>(!source.min||value>=source.min)&&(!source.max||value<=source.max);
  const position=()=>{if(!active)return;if(!active.source.isConnected){close();return;}const r=active.wrapper.getBoundingClientRect(),p=active.panel;const width=Math.min(320,innerWidth-24),height=p.offsetHeight;p.style.width=width+'px';p.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';p.style.top=Math.max(12,Math.min(r.bottom+8+height>innerHeight?r.top-height-8:r.bottom+8,innerHeight-height-12))+'px';};
  function emit(source){source.dispatchEvent(new Event('input',{bubbles:true}));source.dispatchEvent(new Event('change',{bubbles:true}));}
  function commit(state,value){state.source.value=value;state.display.value=formatVietnamDate(value);state.display.setCustomValidity('');close(true);emit(state.source);}
  function draw(focusDate=''){
    const state=active;if(!state)return;
    const {year,month,source,panel}=state,first=new Date(Date.UTC(year,month,1)),days=new Date(Date.UTC(year,month+1,0)).getUTCDate(),offset=(first.getUTCDay()+6)%7,today=vietnamToday();
    panel.innerHTML=`<div class="vn-date-header"><button type="button" data-vn-nav="-1" aria-label="Tháng trước">‹</button><select aria-label="Tháng">${Array.from({length:12},(_,i)=>`<option value="${i}" ${i===month?'selected':''}>Tháng ${i+1}</option>`).join('')}</select><input type="number" aria-label="Năm" min="1000" max="9999" value="${year}"><button type="button" data-vn-nav="1" aria-label="Tháng sau">›</button></div><div class="vn-date-weekdays" aria-hidden="true">${['T2','T3','T4','T5','T6','T7','CN'].map(day=>`<span>${day}</span>`).join('')}</div><div class="vn-date-grid" role="group" aria-label="Tháng ${month+1} năm ${year}">${'<span></span>'.repeat(offset)}${Array.from({length:days},(_,i)=>{const value=`${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;return `<button type="button" data-vn-date="${value}" class="${source.value===value?'selected ':''}${today===value?'today':''}" aria-label="${i+1} tháng ${month+1} năm ${year}" aria-pressed="${source.value===value}" ${allowed(source,value)?'':'disabled'}>${i+1}</button>`;}).join('')}</div><div class="vn-date-footer"><button type="button" data-vn-today ${allowed(source,today)?'':'disabled'}>Hôm nay</button>${source.required?'':'<button type="button" data-vn-clear>Xóa ngày</button>'}<button type="button" data-vn-close>Đóng</button></div>`;
    position();
    const target=focusDate||source.value;
    (panel.querySelector(`[data-vn-date="${target}"]:not(:disabled)`)||panel.querySelector('.vn-date-grid button:not(:disabled)'))?.focus();
  }
  function open(state){
    if(state.source.disabled||state.source.readOnly)return;
    if(active?.source===state.source){close(true);return;}close();
    const start=state.source.value||parseVietnamDate(state.display.value)||vietnamToday(),date=parseIsoDate(start)||parseIsoDate(vietnamToday());
    const panel=document.createElement('div');panel.className='vn-date-calendar';panel.id='vn-calendar-'+(++sequence);panel.lang='vi';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Chọn ngày theo ngày tháng năm');
    const popover=typeof panel.showPopover==='function';if(popover)panel.setAttribute('popover','manual');
    document.body.append(panel);active={...state,panel,year:date.getUTCFullYear(),month:date.getUTCMonth()};
    state.button.setAttribute('aria-expanded','true');state.button.setAttribute('aria-controls',panel.id);
    if(popover)panel.showPopover();draw();
    panel.addEventListener('click',event=>{
      const selected=event.target.closest('[data-vn-date]');if(selected){commit(state,selected.dataset.vnDate);return;}
      const nav=event.target.closest('[data-vn-nav]');if(nav){const next=new Date(Date.UTC(active.year,active.month+Number(nav.dataset.vnNav),1));if(next.getUTCFullYear()<1000||next.getUTCFullYear()>9999)return;active.year=next.getUTCFullYear();active.month=next.getUTCMonth();draw();return;}
      if(event.target.closest('[data-vn-today]'))commit(state,vietnamToday());
      else if(event.target.closest('[data-vn-clear]'))commit(state,'');
      else if(event.target.closest('[data-vn-close]'))close(true);
    });
    panel.addEventListener('change',event=>{if(event.target.matches('select'))active.month=Number(event.target.value);else if(event.target.matches('input')){const year=Number(event.target.value);if(!Number.isInteger(year)||year<1000||year>9999)return;active.year=year;}draw();});
    panel.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
      const day=event.target.closest('[data-vn-date]');if(!day)return;
      const date=parseIsoDate(day.dataset.vnDate),moves={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
      if(Object.hasOwn(moves,event.key))date.setUTCDate(date.getUTCDate()+moves[event.key]);
      else if(event.key==='Home')date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);
      else if(event.key==='End')date.setUTCDate(date.getUTCDate()+6-(date.getUTCDay()+6)%7);
      else return;
      event.preventDefault();const value=iso(date);if(!parseIsoDate(value)||!allowed(state.source,value))return;active.year=date.getUTCFullYear();active.month=date.getUTCMonth();draw(value);
    });
  }
  function enhance(source){
    const type=source.type,value=source.id==='modal-date'?vietnamToday():source.value;
    if(['modal-date','modal-time','modal-edit-date','modal-edit-time','modal-appointment-date','modal-appointment-time','modal-slot-date','modal-slot-start','modal-slot-end','modal-block-date','modal-block-time'].includes(source.id))source.required=true;
    const wrapper=document.createElement('span');wrapper.className='vn-date-control'+(type==='time'?' is-time':'');
    const display=document.createElement('input');display.type='text';display.lang='vi';display.inputMode='numeric';display.autocomplete='off';display.className='vn-date-display';
    const key=source.id||source.name||'field-'+(++sequence);display.id='vn-display-'+key;display.dataset.vnDateFor=key;
    display.required=source.required;display.disabled=source.disabled;display.readOnly=source.readOnly;
    const label=source.getAttribute('aria-label')||source.labels?.[0]?.textContent?.trim()||source.closest('.field,.ma-field')?.querySelector('label')?.textContent?.trim()||(type==='time'?'Giờ':'Ngày');
    display.setAttribute('aria-label',label);display.placeholder=type==='time'?'Giờ:phút (24 giờ)':'Ngày/tháng/năm';
    display.pattern=type==='time'?'(?:[01][0-9]|2[0-3]):[0-5][0-9]':'[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}';
    source.before(wrapper);source.dataset.vnDateSource=type;source.type='hidden';source.value=value;wrapper.append(source,display);
    const button=document.createElement(type==='time'?'span':'button');button.className='vn-date-trigger';button.innerHTML=type==='time'?clockIcon:calendarIcon;
    if(type!=='time'){button.type='button';button.setAttribute('aria-label','Mở lịch chọn '+label.toLowerCase());button.setAttribute('aria-expanded','false');button.disabled=source.disabled||source.readOnly;}else button.setAttribute('aria-hidden','true');wrapper.append(button);
    const state={source,display,button,wrapper};
    const sync=()=>{display.value=type==='time'?source.value:formatVietnamDate(source.value);display.setCustomValidity('');};sync();source.addEventListener('change',sync);
    const validate=()=>{
      const raw=display.value.trim(),next=type==='time'?(/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(raw)?raw:''):parseVietnamDate(raw);
      const valid=!raw||Boolean(next)&&allowed(source,next);
      source.value=valid?next:'';
      display.setCustomValidity(valid?'':type==='time'?'Nhập giờ theo định dạng 24 giờ, ví dụ 09:30 hoặc 15:00.':'Nhập ngày hợp lệ theo ngày/tháng/năm, ví dụ 03/11/2026.');
      return valid;
    };
    display.addEventListener('input',()=>{validate();});
    display.addEventListener('change',()=>{if(validate()){sync();emit(source);}});
    if(type!=='time'){
      button.addEventListener('click',()=>open(state));
      display.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();open(state);}});
    }
  }
  function mount(root=document){
    if(active&&!active.source.isConnected)close();
    root.querySelectorAll('.admin-page input[type="date"],.admin-page input[type="time"],.ma-app input[type="date"],.ma-app input[type="time"],.modal input[type="date"],.modal input[type="time"]').forEach(enhance);
  }
  document.addEventListener('click',event=>{
    if(active&&!active.panel.contains(event.target)&&!active.wrapper.contains(event.target))close();
  },true);
  document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}},true);
  window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
  return {mount,close,today:vietnamToday};
}
