(function(){
const {h,$,t,cfg}=CM,O=window.CM_OPTS;
const S={uid:null,refresh:null,exp:0,tab:'ov',fac:'',q:'',st:'',D:{factory:[],contractor:[],observation:[],kpi:[],gate:[],round:[]},subs:[],synced:null};
const logoutBtn=h('button',{class:'iconbtn hide',onclick:()=>logout()});logoutBtn.dataset.i='logout';
document.getElementById('top').replaceWith(CM.topbar([logoutBtn]));
const root=document.getElementById('root');
CM.add({factoryF:'المصنع',add:'إضافة',edit:'تعديل',del:'حذف',save:'حفظ',cancel:'إلغاء',factories:'المصانع',confirmDel:'متأكد إنك عايز تحذف؟ الحذف هيتزامن مع التطبيق',
 saveFail:'تعذّر الحفظ. حاول تاني',needName:'الاسم مطلوب',needCode:'الكود مطلوب',codeExists:'الكود ده موجود قبل كده',factoryHasCons:'المصنع فيه مقاولين. انقلهم أو احذفهم الأول',
 approved:'المعتمدين',trained:'المدرّبين',photoLbl:'الصورة',newContractor:'مقاول جديد',newFactory:'مصنع جديد',newObs:'ملاحظة جديدة',pickPhoto:'اضغط لاختيار صورة',
 uploading:'جاري رفع الصورة...',needContractor:'اختر المقاول',contractorsCount:'مقاول',
 },{factoryF:'Factory',add:'Add',edit:'Edit',del:'Delete',save:'Save',cancel:'Cancel',factories:'Factories',confirmDel:'Delete this? The deletion will sync to the app',
 saveFail:'Could not save. Try again',needName:'Name is required',needCode:'Code is required',codeExists:'This code already exists',factoryHasCons:'This factory has contractors. Move or delete them first',
 approved:'Approved',trained:'Trained',photoLbl:'Photo',newContractor:'New contractor',newFactory:'New factory',newObs:'New observation',pickPhoto:'Tap to choose a photo',
 uploading:'Uploading photo...',needContractor:'Choose the contractor',contractorsCount:'contractors'});
const NAVY='#0B1F3A';
// ---- auth ----
function saveSes(j){S.exp=Date.now()+((j.expires_in||3600)*1000);CM.token=j.access_token;S.refresh=j.refresh_token||S.refresh;if(j.user)S.uid=j.user.id;
 localStorage.setItem('cm_ses',JSON.stringify({refresh:S.refresh,uid:S.uid}));}
async function ensureFresh(){if(!CM.token)return false;if(S.exp-Date.now()>120000)return true;if(!S.refresh)return false;
 const r=await fetch(cfg.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:cfg.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:S.refresh})});
 if(!r.ok)return false;saveSes(await r.json());return true;}
async function login(u,p){const r=await fetch(cfg.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cfg.key,'Content-Type':'application/json'},
 body:JSON.stringify({email:u.trim().toLowerCase()+'@'+cfg.userDomain,password:p})});
 if(!r.ok)return t('badLogin');saveSes(await r.json());return await checkAdmin();}
async function checkAdmin(){const r=await CM.rest(`/rest/v1/profiles?id=eq.${S.uid}&select=role`);const rows=r.ok?await r.json():[];
 if(!rows[0]||rows[0].role!=='admin'){logout(true);return t('adminsOnly');}return null;}
function logout(){CM.token=null;S.refresh=null;localStorage.removeItem('cm_ses');clearInterval(S.timer);renderLogin();}
async function restore(){try{const s=JSON.parse(localStorage.getItem('cm_ses')||'null');if(!s||!s.refresh)return false;S.refresh=s.refresh;S.uid=s.uid;CM.token='x';S.exp=0;
 if(!await ensureFresh()){CM.token=null;return false;}return(await checkAdmin())===null;}catch(_){return false;}}
// ---- data ----
async function fetchAll(path){const out=[];for(let from=0;;from+=1000){const r=await CM.rest(path+(path.includes('?')?'&':'?')+`limit=1000&offset=${from}`);
 if(!r.ok)throw new Error(path+' '+r.status);const rows=await r.json();out.push(...rows);if(rows.length<1000)break;}return out;}
async function load(){await ensureFresh();
 const [items,subs]=await Promise.all([fetchAll('/rest/v1/cm_items?select=kind,id,data,updated_at&deleted=eq.false'),fetchAll('/rest/v1/cm_submissions?select=*&order=created_at.desc')]);
 const D={factory:[],contractor:[],observation:[],kpi:[],gate:[],round:[]};let last=null;
 for(const it of items){(D[it.kind]||(D[it.kind]=[])).push({_id:it.id,...it.data});if(!last||it.updated_at>last)last=it.updated_at;}
 S.D=D;S.subs=subs;S.synced=last;}
// ---- logic (same rules as the app) ----
const today=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate());};
const pd=s=>{if(!s)return null;const d=new Date(String(s).slice(0,10)+'T00:00:00');return isNaN(d)?null:d;};
const fd=d=>{const x=d?pd(d):null;return x?x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'):'-';};
function cstatus(c){const e=pd(c.end);if(!e)return'ساري';const n=today();if(e<n)return'منتهي';if((e-n)/864e5<=30)return'قارب على الانتهاء';return'ساري';}
const tpct=c=>c.approved>0?c.trained/c.approved:0;
function blockers(c){const r=[];if(cstatus(c)==='منتهي')r.push('العقد منتهي');if(c.licenses!=='مكتمل وساري')r.push('التراخيص والتأمينات غير مكتملة');
 if(tpct(c)<0.9)r.push('نسبة التدريب أقل من 90%');if(c.equipment==='يحتاج إعادة فحص')r.push('المعدات تحتاج إعادة فحص');return r;}
function ostatus(o){if(o.closed)return'مغلق';const t=pd(o.target);if(t&&t<today())return'متأخر';return'مفتوح';}
const cname=code=>{const c=S.D.contractor.find(x=>x.code===code);return c?c.name:code;};
const fname=id=>{const f=S.D.factory.find(x=>x.id===id);return f?f.name:'';};
const sevName=s=>CM.lang==='en'?(O.sevsEn[s]||s):s, catName=c=>CM.lang==='en'?(O.catsEn[c]||c):c;
const EN={'ساري':'Valid','منتهي':'Expired','قارب على الانتهاء':'Expiring soon','مفتوح':'Open','مغلق':'Closed','متأخر':'Overdue','مكتمل وساري':'Complete & valid','ناقص':'Incomplete','غير منطبق':'N/A','معتمد':'Approved','يحتاج إعادة فحص':'Needs re-inspection','مسموح بالعمل':'Cleared to work','موقوف':'Blocked'};
const tv=s=>CM.lang==='en'?(EN[s]||s):s;
const stColor=s=>({'ساري':'#1E9E5A','مفتوح':'#E8A200','مغلق':'#1E9E5A','منتهي':'#D93636','متأخر':'#D93636','قارب على الانتهاء':'#E8A200'}[s]||'#5E6A80');
const sevColor=s=>({'ملاحظة بسيطة':'#E8A200','مخالفة جسيمة':'#D93636','إيقاف عمل':'#7B1FA2','مطابق':'#1E9E5A'}[s]||'#5E6A80');
const inFac=(fid)=>!S.fac||fid===S.fac;
const cons=()=>S.D.contractor.filter(c=>inFac(c.fid)&&(!S.q||(c.name+' '+c.code+' '+c.field+' '+c.dept).toLowerCase().includes(S.q.toLowerCase())));
const obsList=()=>{const codes=new Set(S.D.contractor.filter(c=>inFac(c.fid)).map(c=>c.code));
 return S.D.observation.filter(o=>codes.has(o.contractor)||(!S.D.contractor.length&&true)).filter(o=>!S.q||(o.item+o.desc+cname(o.contractor)).toLowerCase().includes(S.q.toLowerCase()));};
const count=(list,f)=>{const m={};for(const x of list){const k=f(x);if(k)m[k]=(m[k]||0)+1;}return Object.entries(m).sort((a,b)=>b[1]-a[1]);};
// ---- views ----
function renderLogin(msg){root.innerHTML='';logoutBtn.classList.add('hide');
 const err=h('div',{class:'msg err'+(msg?'':' hide')},msg||'');const u=h('input',{autocomplete:'username',autocapitalize:'none'}),p=h('input',{type:'password',autocomplete:'current-password'});
 const go=h('button',{class:'btn',type:'submit',style:'width:100%'});go.dataset.i='login';
 root.append(h('form',{class:'card login',onsubmit:async e=>{e.preventDefault();go.disabled=true;const m=await login(u.value,p.value);go.disabled=false;if(m){err.textContent=m;err.classList.remove('hide');}else start();}},
  h('h2',{'data-i':'adminLogin'}),h('div',{class:'field'},h('label',{'data-i':'username'}),u),h('div',{class:'field'},h('label',{'data-i':'password'}),p),err,go));
 CM.applyLang();}
async function start(){root.innerHTML='<div class="wrap" style="text-align:center"><span class="spin"></span></div>';logoutBtn.classList.remove('hide');
 try{await load();}catch(e){console.error(e);root.innerHTML='';root.append(h('div',{class:'wrap'},h('div',{class:'msg err'},t('loadFail'))));return;}
 clearInterval(S.timer);S.timer=setInterval(async()=>{try{await load();render();}catch(_){}},180000);render();}
const kpi=(l,v,c)=>h('div',{class:'kpi '+(c||'')},h('b',{},String(v)),h('span',{},l));
const badge=(txt,col)=>h('span',{class:'badge',style:`background:${col}`},txt);
function avatar(x,big){const cls='avatar'+(big?' lg':'');return x.photo_url?h('img',{class:cls,src:x.photo_url,loading:'lazy',alt:''}):h('span',{class:cls},(x.name||'?').trim().slice(0,1));}
function bars(entries,fmt){const mx=Math.max(1,...entries.map(e=>e[1]));const box=h('div');if(!entries.length)box.append(h('p',{class:'muted'},t('noData')));
 for(const[k,n] of entries.slice(0,8))box.append(h('div',{class:'bar-row'},h('span',{},fmt?fmt(k):k),h('div',{class:'bar'},h('i',{style:`width:${n/mx*100}%`})),h('b',{},String(n))));return box;}
function donut(entries,col,lab){const total=entries.reduce((a,e)=>a+e[1],0)||1;let acc=0;const st=[];
 for(const[k,n] of entries){const a=acc/total*100;acc+=n;st.push(`${col(k)} ${a}% ${acc/total*100}%`);}
 const d=h('div',{style:`width:130px;height:130px;border-radius:50%;background:conic-gradient(${st.join(',')||'var(--surface-2) 0 100%'});display:grid;place-items:center`},
  h('div',{style:'width:80px;height:80px;border-radius:50%;background:var(--surface);display:grid;place-items:center;font-weight:800;font-size:1.3rem'},String(entries.reduce((a,e)=>a+e[1],0))));
 const lg=h('div',{class:'legend'});for(const[k,n] of entries)lg.append(h('div',{},h('i',{style:`background:${col(k)}`}),`${lab(k)}: ${n}`));return h('div',{class:'donut-wrap'},d,lg);}
function filters(withStatus){const fs=h('select',{onchange:e=>{S.fac=e.target.value;render();}},h('option',{value:''},t('allFactories')),...S.D.factory.map(f=>h('option',{value:f.id,selected:S.fac===f.id},f.name)));
 const q=h('input',{id:'qbox',value:S.q,placeholder:t('search'),oninput:e=>{S.q=e.target.value;clearTimeout(S.qt);S.qt=setTimeout(()=>{render();const i=$('#qbox');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},350);}});
 const kids=[fs];if(withStatus){kids.push(h('select',{onchange:e=>{S.st=e.target.value;render();}},h('option',{value:''},t('allStatus')),...withStatus.map(s=>h('option',{value:s,selected:S.st===s},tv(s)))));}
 kids.push(q);return h('div',{class:'filters'},...kids);}
function render(){
 root.innerHTML='';const w=h('div',{class:'wrap'});
 const tabs=[['ov','overview'],['con','contractors'],['fac','factories'],['obs','observations'],['inb','inbox']];
 w.append(h('div',{class:'tabs'},...tabs.map(([k,l])=>h('span',{class:'tab'+(S.tab===k?' on':''),onclick:()=>{S.tab=k;S.st='';render();}},t(l)+(k==='inb'?` (${S.subs.length})`:'')))));
 w.append(h('div',{class:'synced'},S.synced?`${t('lastSync')}: ${new Date(S.synced).toLocaleString(CM.lang==='ar'?'ar-EG':'en-GB')}`:t('noSync')));
 if(S.tab==='ov')w.append(viewOv());else if(S.tab==='con')w.append(viewCon());else if(S.tab==='fac')w.append(viewFac());else if(S.tab==='obs')w.append(viewObs());else w.append(viewInb());
 root.append(w);CM.applyLang();}
document.addEventListener('langchange',()=>{if(CM.token)render();});
function viewOv(){const cl=S.D.contractor.filter(c=>inFac(c.fid)),ob=obsList();const wrap=h('div');
 wrap.append(filters(null));
 const ok=cl.filter(c=>!blockers(c).length).length,exp=cl.filter(c=>cstatus(c)==='قارب على الانتهاء').length,ex=cl.filter(c=>cstatus(c)==='منتهي').length;
 const open=ob.filter(o=>!o.closed).length,od=ob.filter(o=>ostatus(o)==='متأخر').length;
 wrap.append(h('div',{class:'kpis'},kpi(t('contractors'),cl.length),kpi(t('allowed'),ok,'green'),kpi(t('blocked'),cl.length-ok,cl.length-ok?'red':''),kpi(t('expiring'),exp,exp?'amber':''),kpi(t('expired'),ex,ex?'red':''),kpi(t('openObs'),open,'orange'),kpi(t('overdue'),od,od?'red':'')));
 const g=h('div',{class:'grid2'});
 g.append(h('div',{class:'card'},h('h2',{},t('permit')),donut([[ 'ok',ok],['no',cl.length-ok]].filter(e=>e[1]),k=>k==='ok'?'#1E9E5A':'#D93636',k=>k==='ok'?t('allowed'):t('blocked'))));
 g.append(h('div',{class:'card'},h('h2',{},t('obsBySev')),donut(count(ob,o=>o.sev),sevColor,sevName)));
 g.append(h('div',{class:'card'},h('h2',{},t('obsByCat')),bars(count(ob,o=>o.cat),catName)));
 g.append(h('div',{class:'card'},h('h2',{},t('byField')),bars(count(cl,c=>c.field))));
 g.append(h('div',{class:'card'},h('h2',{},t('byFactory')),bars(count(S.D.contractor,c=>fname(c.fid)||c.fid))));
 wrap.append(g);return wrap;}
function viewCon(){const list=cons(),wrap=h('div');wrap.append(h('div',{style:'margin-bottom:10px'},h('button',{class:'btn',onclick:()=>editContractor(null)},'+ '+t('newContractor'))));wrap.append(filters(null));
 if(!list.length){wrap.append(h('p',{class:'muted'},t('noData')));return wrap;}
 const tb=h('tbody');for(const c of list){const b=blockers(c),cs=cstatus(c);
  tb.append(h('tr',{class:'click',onclick:()=>drawer(c)},h('td',{},avatar(c)),h('td',{},h('b',{},c.name),h('div',{class:'muted'},c.code+' · '+(c.field||''))),
   h('td',{},badge(b.length?tv('موقوف'):tv('مسموح بالعمل'),b.length?'#D93636':'#1E9E5A')),h('td',{},badge(tv(cs),stColor(cs))),h('td',{},fd(c.end)),
   h('td',{},h('div',{class:'pbar'},h('i',{style:`width:${Math.round(tpct(c)*100)}%;background:${tpct(c)>=.9?'#1E9E5A':'#D93636'}`}))),h('td',{},fname(c.fid))));}
 wrap.append(h('div',{class:'scroll'},h('table',{class:'tbl'},h('thead',{},h('tr',{},h('th'),h('th',{},t('name')),h('th',{},t('permit')),h('th',{},t('status')),h('th',{},t('contractEnd')),h('th',{},t('training')),h('th',{},t('factoryF')))),tb)));return wrap;}
function viewObs(){const list=obsList().filter(o=>!S.st||ostatus(o)===S.st).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),wrap=h('div');
 wrap.append(h('div',{style:'margin-bottom:10px'},h('button',{class:'btn',onclick:()=>editObs(null)},'+ '+t('newObs'))));wrap.append(filters(['مفتوح','متأخر','مغلق']));if(!list.length){wrap.append(h('p',{class:'muted'},t('noData')));return wrap;}
 const tb=h('tbody');for(const o of list.slice(0,500)){const st=ostatus(o);
  tb.append(h('tr',{class:'click',onclick:()=>editObs(o)},h('td',{},o.photos&&o.photos[0]&&/^https?:/.test(o.photos[0])?h('a',{href:o.photos[0],target:'_blank'},h('img',{class:'thumb',src:o.photos[0],loading:'lazy',alt:''})):''),
   h('td',{},o.id),h('td',{},fd(o.date)),h('td',{},cname(o.contractor)),h('td',{},catName(o.cat),h('div',{class:'muted'},o.item||'')),
   h('td',{},badge(sevName(o.sev),sevColor(o.sev))),h('td',{},badge(tv(st),stColor(st))),h('td',{},o.desc||'')));}
 wrap.append(h('div',{class:'scroll'},h('table',{class:'tbl'},h('thead',{},h('tr',{},h('th'),h('th',{},t('num')),h('th',{},t('date')),h('th',{},t('contractor')),h('th',{},t('category')),h('th',{},t('severity')),h('th',{},t('status')),h('th',{},t('desc')))),tb)));return wrap;}
function viewInb(){const wrap=h('div');if(!S.subs.length){wrap.append(h('p',{class:'muted'},t('noData')));return wrap;}
 const tb=h('tbody');for(const s of S.subs){
  tb.append(h('tr',{},h('td',{},s.photo_url?h('a',{href:s.photo_url,target:'_blank'},h('img',{class:'thumb',src:s.photo_url,loading:'lazy',alt:''})):''),
   h('td',{},'#'+s.no),h('td',{},new Date(s.created_at).toLocaleString(CM.lang==='ar'?'ar-EG':'en-GB')),h('td',{},h('b',{},s.contractor),h('div',{class:'muted'},s.factory||'')),
   h('td',{},catName(s.category),h('div',{class:'muted'},s.item||'')),h('td',{},badge(sevName(s.severity),sevColor(s.severity))),h('td',{},s.description||''),
   h('td',{},s.reporter||''),h('td',{},s.lat!=null?h('a',{href:`https://maps.google.com/?q=${s.lat},${s.lng}`,target:'_blank'},'📍'):'')));}
 wrap.append(h('div',{class:'scroll'},h('table',{class:'tbl'},h('thead',{},h('tr',{},h('th'),h('th',{},t('num')),h('th',{},t('date')),h('th',{},t('contractor')),h('th',{},t('category')),h('th',{},t('severity')),h('th',{},t('desc')),h('th',{},t('submittedBy')),h('th'))),tb)));return wrap;}
function drawer(c){const b=blockers(c),cs=cstatus(c);const gate=S.D.gate.find(g=>g._id===c.code);const kp=S.D.kpi.filter(k=>k.code===c.code).sort((a,b)=>(b.month||'').localeCompare(a.month||''))[0];
 const obs=S.D.observation.filter(o=>o.contractor===c.code);
 const kv=(k,v)=>h('div',{class:'kv'},h('b',{},t(k)),h('span',{},v));
 const close=()=>bg.remove();
 const dr=h('div',{class:'drawer'},
  h('div',{class:'row',style:'justify-content:space-between'},h('button',{class:'btn tonal',onclick:close},'✕'),h('span',{class:'row'},h('button',{class:'btn',onclick:()=>{close();editContractor(c);}},t('edit')),h('button',{class:'btn tonal',onclick:()=>{close();delContractor(c);}},t('del')))),
  h('div',{class:'row',style:'margin:10px 0'},avatar(c,true),h('div',{},h('h2',{},c.name),h('div',{class:'muted'},c.code),h('div',{style:'margin-top:6px'},badge(b.length?tv('موقوف'):tv('مسموح بالعمل'),b.length?'#D93636':'#1E9E5A')))),
  h('div',{class:'card'},kv('factoryF',fname(c.fid)),kv('field',c.field||'-'),kv('dept',c.dept||'-'),kv('risk',t(c.risk)),kv('contractStart',fd(c.start)),kv('contractEnd',fd(c.end)+' · '+tv(cs)),
   kv('training',`${c.trained}/${c.approved} (${Math.round(tpct(c)*100)}%)`),kv('licenses',tv(c.licenses)),kv('equipment',tv(c.equipment))),
  b.length?h('div',{class:'card',style:'margin-top:10px'},h('h2',{},t('reasons')),...b.map(x=>h('div',{},'• '+x))):null,
  gate?h('div',{class:'card',style:'margin-top:10px'},h('h2',{},t('gate')),h('div',{},`${gate.done||0}/${gate.total||0} ${t('mandatory')}`)):null,
  kp?h('div',{class:'card',style:'margin-top:10px'},h('h2',{},t('kpi')),h('div',{},`${kp.month} · ${Math.round((kp.total||0)*100)}% · ${kp.grade||''}`)):null,
  h('div',{class:'card',style:'margin-top:10px'},h('h2',{},`${t('observations')} (${obs.length})`),...obs.map(o=>h('div',{style:'margin:6px 0'},badge(tv(ostatus(o)),stColor(ostatus(o))),' ',`${fd(o.date)} · ${o.item||catName(o.cat)}`))));
 const bg=h('div',{class:'drawer-bg',onclick:e=>{if(e.target===bg)close();}},dr);document.body.append(bg);}

// ---- editing ----
const clean=o=>{const x={...o};delete x._id;return x;};
async function push(items){await ensureFresh();const r=await CM.rest('/rest/v1/rpc/cm_push',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({p:items.map(i=>({edited_at:new Date().toISOString(),deleted:false,...i}))})});if(!r.ok)throw new Error('push '+r.status);return r.json();}
function shrink(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const k=Math.min(1,1000/Math.max(img.width,img.height));const c=document.createElement('canvas');
 c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>b?res(b):rej(new Error('blob')),'image/jpeg',0.82);};img.onerror=rej;img.src=URL.createObjectURL(file);});}
async function uploadPhoto(blob){const name=`adm_${CM.uuid()}.jpg`;const r=await CM.rest('/storage/v1/object/cm-photos/'+name,{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});
 if(!r.ok)throw new Error('upload '+r.status);return `${cfg.url}/storage/v1/object/public/cm-photos/${name}`;}
// fields: {k,label,type,opts,ro,req}
function modal(title,fields,vals,onSave,onDelete){
 const ins={},err=h('div',{class:'msg err hide'});const blobs={};
 const rows=fields.map(f=>{let el;
  if(f.type==='select')el=h('select',{},...f.opts.map(([v,l])=>h('option',{value:v,selected:String(vals[f.k]??'')===String(v)},l)));
  else if(f.type==='textarea')el=h('textarea',{},vals[f.k]||'');
  else if(f.type==='photo'){const prev=h('img',{class:'avatar lg',src:vals[f.k]||'',style:vals[f.k]?'':'display:none',alt:''});
   const inp=h('input',{type:'file',accept:'image/*',class:'hide',onchange:async e=>{const fl=e.target.files[0];if(!fl)return;try{blobs[f.k]=await shrink(fl);prev.src=URL.createObjectURL(blobs[f.k]);prev.style.display='';}catch(_){}}});
   el=h('label',{class:'photo-drop'},prev,h('span',{},t('pickPhoto')),inp);ins[f.k]={photo:true,url:vals[f.k]||null};return h('div',{class:'field'},h('span',{class:'lbl'},f.label),el);}
  else el=h('input',{type:f.type||'text',value:vals[f.k]??'',readonly:!!f.ro,inputmode:f.type==='number'?'numeric':null});
  ins[f.k]=el;return h('div',{class:'field'},h('label',{},f.label),el);});
 const close=()=>bg.remove();
 const save=h('button',{class:'btn',type:'submit',style:'flex:1'},t('save'));
 const form=h('form',{class:'card',onsubmit:async e=>{e.preventDefault();err.classList.add('hide');save.disabled=true;
   try{const out={};for(const f of fields){const i=ins[f.k];if(i.photo){out[f.k]=i.url;if(blobs[f.k]){save.textContent=t('uploading');out[f.k]=await uploadPhoto(blobs[f.k]);}}
     else out[f.k]=f.type==='number'?(parseInt(i.value,10)||0):i.value.trim?i.value.trim():i.value;}
    const m=onSave(out);if(m){err.textContent=m;err.classList.remove('hide');save.disabled=false;save.textContent=t('save');return;}
    close();}catch(x){console.error(x);err.textContent=t('saveFail');err.classList.remove('hide');save.disabled=false;save.textContent=t('save');}}},
  h('h2',{},title),...rows,err,h('div',{class:'row'},save,h('button',{type:'button',class:'btn tonal',onclick:close},t('cancel')),
   onDelete?h('button',{type:'button',class:'btn tonal',onclick:()=>{if(confirm(t('confirmDel'))){close();onDelete();}}},t('del')):null));
 const bg=h('div',{class:'drawer-bg',onclick:e=>{if(e.target===bg)close();}},h('div',{class:'drawer'},form));document.body.append(bg);}
async function commit(items){try{await push(items);await load();render();}catch(e){console.error(e);alert(t('saveFail'));}}
// onSave may return a message (validation) or a promise; wrap async
const facOpts=()=>S.D.factory.map(f=>[f.id,f.name]);
function editContractor(c){const isNew=!c;const v=c?clean(c):{fid:S.fac||(S.D.factory[0]||{}).id||'F1',risk:'Medium',licenses:'ناقص',equipment:'غير منطبق',approved:0,trained:0};
 if(c)v.photo=c.photo_url;
 modal(isNew?t('newContractor'):t('edit'),[
  {k:'code',label:t('code'),ro:!isNew},{k:'name',label:t('name')},{k:'fid',label:t('factoryF'),type:'select',opts:facOpts().length?facOpts():[['F1','—']]},
  {k:'field',label:t('field')},{k:'dept',label:t('dept')},{k:'risk',label:t('risk'),type:'select',opts:[['High',t('High')],['Medium',t('Medium')],['Low',t('Low')]]},
  {k:'start',label:t('contractStart'),type:'date'},{k:'end',label:t('contractEnd'),type:'date'},{k:'approved',label:t('approved'),type:'number'},{k:'trained',label:t('trained'),type:'number'},
  {k:'licenses',label:t('licenses'),type:'select',opts:['مكتمل وساري','ناقص','منتهي'].map(x=>[x,tv(x)])},
  {k:'equipment',label:t('equipment'),type:'select',opts:['معتمد','يحتاج إعادة فحص','غير منطبق'].map(x=>[x,tv(x)])},{k:'photo',label:t('photoLbl'),type:'photo'}],v,
  out=>{if(!out.name)return t('needName');if(!out.code)return t('needCode');if(isNew&&S.D.contractor.some(x=>x.code===out.code))return t('codeExists');
   const data={...(c?clean(c):{}),...out,photo_url:out.photo||null};delete data.photo;data.start=out.start||null;data.end=out.end||null;
   commit([{kind:'contractor',id:out.code,data}]);return null;},null);}
function delContractor(c){if(!confirm(t('confirmDel')))return;
 const items=[{kind:'contractor',id:c.code,data:clean(c),deleted:true}];
 for(const o of S.D.observation.filter(o=>o.contractor===c.code))items.push({kind:'observation',id:o._id,data:clean(o),deleted:true});
 for(const k of S.D.kpi.filter(k=>k.code===c.code))items.push({kind:'kpi',id:k._id,data:clean(k),deleted:true});
 for(const g of S.D.gate.filter(g=>g._id===c.code))items.push({kind:'gate',id:g._id,data:clean(g),deleted:true});
 commit(items);}
function editObs(o){const isNew=!o;const v=o?clean(o):{date:fd(new Date()),sev:'ملاحظة بسيطة',cat:O.cats[0],contractor:(cons()[0]||{}).code};
 modal(isNew?t('newObs'):t('edit'),[
  {k:'contractor',label:t('contractor'),type:'select',opts:S.D.contractor.map(c=>[c.code,c.name])},{k:'date',label:t('date'),type:'date'},
  {k:'cat',label:t('category'),type:'select',opts:O.cats.map(c=>[c,catName(c)])},{k:'item',label:t('item')},
  {k:'sev',label:t('severity'),type:'select',opts:['مطابق',...O.sevs].map(x=>[x,sevName(x)])},{k:'desc',label:t('desc'),type:'textarea'},
  {k:'target',label:t('target'),type:'date'},{k:'closed',label:t('closedOn'),type:'date'}],v,
  out=>{if(!out.contractor)return t('needContractor');const id=o?o._id:'WEB-'+Date.now().toString(36).toUpperCase();
   const data={...(o?clean(o):{photos:[]}),...out,id,target:out.target||null,closed:out.closed||null};
   commit([{kind:'observation',id,data}]);return null;},o?()=>commit([{kind:'observation',id:o._id,data:clean(o),deleted:true}]):null);}
function viewFac(){const wrap=h('div');wrap.append(h('div',{style:'margin-bottom:10px'},h('button',{class:'btn',onclick:()=>editFac(null)},'+ '+t('newFactory'))));
 if(!S.D.factory.length){wrap.append(h('p',{class:'muted'},t('noData')));return wrap;}
 const g=h('div',{class:'grid2'});for(const f of S.D.factory){const n=S.D.contractor.filter(c=>c.fid===f.id).length;
  g.append(h('div',{class:'card row',style:'cursor:pointer',onclick:()=>editFac(f)},avatar({name:f.name,photo_url:f.photo_url},true),h('div',{},h('h2',{},f.name),h('div',{class:'muted'},n+' '+t('contractorsCount')))));}
 wrap.append(g);return wrap;}
function editFac(f){const isNew=!f;const v=f?{name:f.name,photo:f.photo_url}:{};
 modal(isNew?t('newFactory'):t('edit'),[{k:'name',label:t('name')},{k:'photo',label:t('photoLbl'),type:'photo'}],v,
  out=>{if(!out.name)return t('needName');const id=f?f.id:'W'+Math.random().toString(36).slice(2,8).toUpperCase();
   commit([{kind:'factory',id,data:{...(f?clean(f):{}),id,name:out.name,photo_url:out.photo||null}}]);return null;},
  f?()=>{if(S.D.contractor.some(c=>c.fid===f.id)){alert(t('factoryHasCons'));return;}commit([{kind:'factory',id:f.id,data:clean(f),deleted:true}]);}:null);}
(async()=>{if(await restore())start();else renderLogin();})();
})();
