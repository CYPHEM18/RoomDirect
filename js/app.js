/* RoomDirect PROTOTYPE. Data lives in the browser (localStorage + IndexedDB). No real backend, no real payments. */
const APP_FEE=5000,SCH_FEE=1000;
const SCHOOLS={uniosun:'UNIOSUN, Osogbo',oau:'OAU, Ile-Ife',unilag:'UNILAG, Akoka'};
const AMEN=['Water','Prepaid meter','Generator','Security','Fence','Wi-Fi'];
const LIM={image:5*1048576,video:25*1048576,max:8};
const K='rd_proto_v2';
const $=(s,r=document)=>r.querySelector(s);
const N=n=>'₦'+Number(n).toLocaleString('en-NG');
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Q=new URLSearchParams(location.search);
let DB;try{DB=JSON.parse(localStorage.getItem(K))}catch{}
DB=DB||{users:[],hostels:[],bookings:[],messages:[],reviews:[],session:null,nid:1};
const save=()=>localStorage.setItem(K,JSON.stringify(DB));
const uid=p=>p+(DB.nid++)+Math.random().toString(36).slice(2,6);
const me=()=>DB.users.find(u=>u.id===DB.session)||null;
const home=u=>({student:'student.html',landlord:'landlord.html',admin:'admin.html',school:'school.html'})[u.role];
const mask=t=>String(t).replace(/https?:\/\/\S+|www\.\S+/gi,'[link hidden]').replace(/(?:\+?\d[\s-]?){7,}/g,'[number hidden]');
const rating=h=>{const r=DB.reviews.filter(x=>x.hostel===h.id);return r.length?{avg:r.reduce((a,x)=>a+x.stars,0)/r.length,n:r.length}:null};
const stars=n=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n));
const show=t=>{const m=$('#msg');if(m)m.textContent=t};

async function hash(p){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rd:'+p));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}

/* media: files are stored in IndexedDB, only ids are kept in the hostel record */
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('rd_media',1);r.onupgradeneeded=()=>r.result.createObjectStore('m');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function putMedia(file){const d=await idb(),id=uid('m');await new Promise((res,rej)=>{const t=d.transaction('m','readwrite');t.objectStore('m').put({blob:file,type:file.type},id);t.oncomplete=res;t.onerror=()=>rej(t.error)});return id}
async function delMedia(id){const d=await idb();d.transaction('m','readwrite').objectStore('m').delete(id)}
async function mediaEl(id){const d=await idb();const m=await new Promise(res=>{const r=d.transaction('m').objectStore('m').get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(!m)return null;const u=URL.createObjectURL(m.blob);let e;if(m.type.startsWith('video/')){e=document.createElement('video');e.controls=true;e.preload='metadata';e.playsInline=true}else{e=document.createElement('img');e.alt='Hostel photo'}e.src=u;return e}
async function fill(el,m){const e=await mediaEl(m.id||m);if(e)el.replaceChildren(e)}
function checkFile(f,only){const k=f.type.startsWith('video/')?'video':f.type.startsWith('image/')?'image':null;if(!k||(only&&k!==only))throw Error(f.name+': unsupported file type.');if(f.size>LIM[k])throw Error(f.name+' is too large (max '+LIM[k]/1048576+' MB for '+k+'s).');return k}

/* auth (demo only: client-side, so not secure) */
async function register(role,f,idFile){
  await ready;const email=f.email.trim().toLowerCase();
  if(DB.users.some(u=>u.email===email))throw Error('An account with this email already exists.');
  if(f.password.length<8)throw Error('Password must be at least 8 characters.');
  const u={id:uid('u'),role,name:f.name.trim(),email,phone:f.phone.trim(),school:f.school,pw:await hash(f.password),verified:role==='student'};
  if(role==='student')u.matric=f.matric.trim();
  if(idFile&&idFile.size){checkFile(idFile,'image');u.idMedia=await putMedia(idFile)}
  DB.users.push(u);DB.session=u.id;save();return u}
async function login(email,pw){await ready;const u=DB.users.find(x=>x.email===email.trim().toLowerCase());if(!u||u.pw!==await hash(pw))throw Error('Wrong email or password.');DB.session=u.id;save();return u}
async function guard(role){await ready;const u=me();if(!u||u.role!==role){location.href='login.html?next='+encodeURIComponent(location.pathname.split('/').pop()||'index.html');return null}return u}

function nav(){
  const u=me(),l=[['index.html','Browse hostels']];
  if(!u)l.push(['login.html','Log in'],['register-student.html','Student sign up'],['register-landlord.html','List your hostel']);
  else{l.push([home(u),'My dashboard']);if(u.role==='student'||u.role==='landlord')l.push(['messages.html','Messages'])}
  const cur=location.pathname.split('/').pop()||'index.html';
  $('#nav').innerHTML=l.map(([h,t])=>`<a href="${h}"${h===cur?' aria-current="page"':''}>${t}</a>`).join('')+(u?`<span class="who">${E(u.name)}</span><button class="btn alt" id="out">Log out</button>`:'');
  const o=$('#out');if(o)o.onclick=()=>{DB.session=null;save();location.href='index.html'};
}

const ready=(async()=>{
  if(!DB.users.length){
    const a=await hash('admin1234'),l=await hash('landlord1234'),sc=await hash('school1234');
    DB.users.push({id:'school-uniosun',role:'school',name:'UNIOSUN Bursary',email:'school@roomdirect.test',school:'uniosun',pw:sc,verified:true},{id:'admin',role:'admin',name:'Admin',email:'admin@roomdirect.test',pw:a,verified:true},
      {id:'demo-landlord',role:'landlord',name:'Mr. Adeyemi',email:'landlord@roomdirect.test',phone:'08000000000',school:'uniosun',pw:l,verified:true});
    DB.hostels.push({id:'h1',owner:'demo-landlord',school:'uniosun',name:'Olive Court',loc:'Ikire Road',km:0.8,desc:'Quiet compound with water and prepaid meters.',amen:['Water','Prepaid meter','Security','Fence'],media:[],rooms:[{id:'r1',type:'Single',price:180000,left:4},{id:'r2',type:'Shared (2)',price:110000,left:6}]},
      {id:'h2',owner:'demo-landlord',school:'uniosun',name:'Grace Lodge',loc:'Ajegunle',km:1.5,desc:'Walking distance to the back gate.',amen:['Water','Generator','Wi-Fi'],media:[],rooms:[{id:'r3',type:'Single',price:150000,left:2},{id:'r4',type:'Self-contained',price:260000,left:1}]});
    DB.reviews.push({id:'v1',hostel:'h1',name:'Tolu A.',stars:5,text:'Water runs all day and the owner is responsive.'},{id:'v2',hostel:'h1',name:'Chidi E.',stars:4,text:'Good value. Generator hours could be longer.'},{id:'v3',hostel:'h2',name:'Ayo B.',stars:4,text:'Close to the back gate and quiet at night.'});
    save();
  }
  nav();
})();
