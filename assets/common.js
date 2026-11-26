(function(){
const C=window.CM_CONFIG;
const I18N={
ar:{app:'مراقب المقاولين',lang:'English',
 submitTitle:'تسجيل ملاحظة على مقاول',submitSub:'سجّل ملاحظة أو مخالفة في دقيقة، من غير تسجيل دخول',
 contractor:'اسم المقاول',factory:'المصنع (اختياري)',category:'التصنيف',item:'البند / الموضوع',severity:'الشدة',desc:'الوصف',reporter:'اسمك (اختياري)',
 photo:'صورة (اختياري)',addPhoto:'اضغط لالتقاط صورة أو اختيارها',getLoc:'تحديد موقعي',locSet:'تم تحديد الموقع',
 send:'إرسال',sending:'جاري الإرسال...',required:'اكتب اسم المقاول على الأقل',thanks:'تم استلام ملاحظتك. شكرًا لك',another:'ملاحظة جديدة',
 sendFail:'تعذّر الإرسال. حاول مرة أخرى',tooBig:'الصورة كبيرة، اختر صورة أصغر',adminLogin:'دخول المدير',
 username:'اسم المستخدم',password:'كلمة المرور',login:'دخول',logout:'خروج',badLogin:'اسم المستخدم أو كلمة المرور غلط',adminsOnly:'الحساب ده مش مدير',
 overview:'نظرة عامة',contractors:'المقاولون',observations:'الملاحظات',inbox:'الواردة من الويب',
 loadFail:'تعذّر تحميل البيانات',noData:'مفيش بيانات',noSync:'لسه مفيش بيانات اترفعت من التطبيق. افتح التطبيق: المزيد > الإعدادات > المزامنة مع الويب',
 lastSync:'آخر رفع من التطبيق',allFactories:'كل المصانع',search:'بحث...',allStatus:'كل الحالات',
 total:'الإجمالي',allowed:'مسموح بالعمل',blocked:'موقوف',expiring:'قارب على الانتهاء',expired:'منتهي',valid:'ساري',
 openObs:'ملاحظات مفتوحة',overdue:'متأخرة',closed:'مغلقة',open:'مفتوحة',
 byField:'حسب المجال',byFactory:'عدد المقاولين لكل مصنع',obsByCat:'الملاحظات حسب التصنيف',obsBySev:'الملاحظات حسب الشدة',
 code:'الكود',name:'الاسم',field:'المجال',dept:'القسم',risk:'الخطورة',contractEnd:'انتهاء العقد',contractStart:'بداية العقد',training:'التدريب',
 licenses:'التراخيص',equipment:'المعدات',permit:'قرار العمل',reasons:'أسباب الإيقاف',gate:'فحص الدخول',kpi:'آخر تقييم أداء',
 date:'التاريخ',status:'الحالة',target:'الموعد المستهدف',closedOn:'تاريخ الإغلاق',num:'رقم',submittedBy:'المبلّغ',map:'الموقع على الخريطة',
 Low:'منخفض',Medium:'متوسط',High:'عالي',ok:'مكتمل',mandatory:'إلزامي',items:'بنود'},
en:{app:'Contractor Monitor',lang:'العربية',
 submitTitle:'Report an observation on a contractor',submitSub:'Log an observation or violation in a minute, no login needed',
 contractor:'Contractor name',factory:'Factory (optional)',category:'Category',item:'Item / subject',severity:'Severity',desc:'Description',reporter:'Your name (optional)',
 photo:'Photo (optional)',addPhoto:'Tap to take or choose a photo',getLoc:'Use my location',locSet:'Location captured',
 send:'Send',sending:'Sending...',required:'Enter the contractor name at least',thanks:'Your observation was received. Thank you',another:'New observation',
 sendFail:'Could not send. Please try again',tooBig:'Photo is too large, choose a smaller one',adminLogin:'Admin sign in',
 username:'Username',password:'Password',login:'Sign in',logout:'Sign out',badLogin:'Wrong username or password',adminsOnly:'This account is not an admin',
 overview:'Overview',contractors:'Contractors',observations:'Observations',inbox:'Web submissions',
 loadFail:'Could not load data',noData:'No data',noSync:'Nothing uploaded from the app yet. Open the app: More > Settings > Web sync',
 lastSync:'Last upload from the app',allFactories:'All factories',search:'Search...',allStatus:'All statuses',
 total:'Total',allowed:'Cleared to work',blocked:'Blocked',expiring:'Expiring soon',expired:'Expired',valid:'Valid',
 openObs:'Open observations',overdue:'Overdue',closed:'Closed',open:'Open',
 byField:'By field',byFactory:'Contractors per factory',obsByCat:'Observations by category',obsBySev:'Observations by severity',
 code:'Code',name:'Name',field:'Field',dept:'Department',risk:'Risk',contractEnd:'Contract end',contractStart:'Contract start',training:'Training',
 licenses:'Licenses',equipment:'Equipment',permit:'Work decision',reasons:'Blocking reasons',gate:'Entry check',kpi:'Latest performance score',
 date:'Date',status:'Status',target:'Target date',closedOn:'Closed on',num:'No.',submittedBy:'Reporter',map:'Open on map',
 Low:'Low',Medium:'Medium',High:'High',ok:'Done',mandatory:'mandatory',items:'items'}};
const E={cfg:C};
E.lang=localStorage.getItem('cm_lang')||((navigator.language||'ar').startsWith('en')?'en':'ar');
E.t=k=>(I18N[E.lang][k]??I18N.ar[k]??k);
E.applyLang=()=>{document.documentElement.lang=E.lang;document.documentElement.dir=E.lang==='ar'?'rtl':'ltr';
 document.querySelectorAll('[data-i]').forEach(n=>n.textContent=E.t(n.dataset.i));document.title=E.t('app');};
E.setLang=l=>{E.lang=l;localStorage.setItem('cm_lang',l);E.applyLang();document.dispatchEvent(new Event('langchange'));};
E.theme=localStorage.getItem('cm_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
E.applyTheme=()=>document.documentElement.dataset.theme=E.theme;
E.toggleTheme=()=>{E.theme=E.theme==='dark'?'light':'dark';localStorage.setItem('cm_theme',E.theme);E.applyTheme();};
E.applyTheme();
E.$=(s,r=document)=>r.querySelector(s);
E.h=(tag,attrs={},...kids)=>{const n=document.createElement(tag);
 for(const[k,v] of Object.entries(attrs||{})){if(k==='class')n.className=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)n.setAttribute(k,v===true?'':v);}
 for(const c of kids.flat()){if(c==null||c===false)continue;n.append(c.nodeType?c:document.createTextNode(c));}return n;};
E.uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});
E.topbar=extra=>{const bar=E.h('header',{class:'topbar'});
 bar.innerHTML='<div class="brand"><span class="dot">🛡</span><span data-i="app"></span></div>';
 const lang=E.h('button',{class:'iconbtn',onclick:()=>E.setLang(E.lang==='ar'?'en':'ar')});lang.dataset.i='lang';
 const th=E.h('button',{class:'iconbtn',title:'theme',onclick:E.toggleTheme},'◐');
 bar.append(...(extra||[]),lang,th);return bar;};
E.add=(ar,en)=>{Object.assign(I18N.ar,ar);Object.assign(I18N.en,en);};
E.token=null;
E.rest=(path,opts={})=>fetch(C.url+path,{...opts,headers:{apikey:C.key,...(E.token?{Authorization:'Bearer '+E.token}:{}),...(opts.headers||{})}});
window.CM=E;
})();
