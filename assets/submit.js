(function(){
const {h,$,t,cfg}=CM,O=window.CM_OPTS;
document.getElementById('top').replaceWith(CM.topbar());
let sev='ملاحظة بسيطة',lat=null,lng=null,blob=null;
const sevName=s=>CM.lang==='en'?(O.sevsEn[s]||s):s, catName=c=>CM.lang==='en'?(O.catsEn[c]||c):c;
function renderStatic(){
 const cs=$('#cat'),cur=cs.value;cs.innerHTML='';for(const c of O.cats)cs.append(h('option',{value:c},catName(c)));if(cur)cs.value=cur;
 const sc=$('#sev');sc.innerHTML='';
 for(const s of O.sevs)sc.append(h('span',{class:'chip'+(sev===s?' on':''),onclick:()=>{sev=s;renderStatic();}},sevName(s)));
 CM.applyLang();
}
document.addEventListener('langchange',renderStatic);renderStatic();
function shrink(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{
 const max=1600,k=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');
 c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
 c.toBlob(b=>b?res(b):rej(new Error('blob')),'image/jpeg',0.82);};img.onerror=rej;img.src=URL.createObjectURL(file);});}
$('#photo').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;
 try{blob=await shrink(f);$('#prev').src=URL.createObjectURL(blob);$('#prev').classList.remove('hide');$('#dropTxt').classList.add('hide');}
 catch(_){blob=null;showErr(t('sendFail'));}});
$('#geo').addEventListener('click',()=>{if(!navigator.geolocation)return;$('#geoMsg').textContent=' ...';
 navigator.geolocation.getCurrentPosition(p=>{lat=p.coords.latitude;lng=p.coords.longitude;$('#geoMsg').textContent=' '+t('locSet');},()=>{$('#geoMsg').textContent='';},{enableHighAccuracy:true,timeout:15000});});
function showErr(m){const e=$('#err');e.textContent=m;e.classList.remove('hide');}
$('#f').addEventListener('submit',async ev=>{
 ev.preventDefault();$('#err').classList.add('hide');
 const contractor=$('#contractor').value.trim();
 if(!contractor){showErr(t('required'));return;}
 if(blob&&blob.size>5.5*1024*1024){showErr(t('tooBig'));return;}
 const btn=$('#send');btn.disabled=true;btn.textContent=t('sending');
 try{
  let photo_url=null;
  if(blob){const name=`sub_${CM.uuid()}_${Date.now()}.jpg`;
   const up=await CM.rest('/storage/v1/object/cm-photos/'+name,{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});
   if(!up.ok)throw new Error('upload '+up.status);
   photo_url=`${cfg.url}/storage/v1/object/public/cm-photos/${name}`;}
  const r=await CM.rest('/rest/v1/rpc/cm_submit',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({p:{contractor,factory:$('#factory').value.trim(),category:$('#cat').value,item:$('#item').value.trim(),severity:sev,
    description:$('#desc').value.trim(),reporter:$('#reporter').value.trim(),lat,lng,photo_url}})});
  if(!r.ok)throw new Error('rpc '+r.status);
  const no=await r.json();
  $('#f').classList.add('hide');$('#done').classList.remove('hide');$('#doneMsg').textContent=t('thanks');$('#doneNo').textContent=no?('#'+no):'';
 }catch(e){showErr(t('sendFail'));console.error(e);}
 finally{btn.disabled=false;btn.textContent=t('send');}});
$('#again').addEventListener('click',()=>location.reload());
})();
