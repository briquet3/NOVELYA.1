const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg={theme:localStorage.getItem('nv-theme')||'dark',siteTheme:"normal",animations:localStorage.getItem('nv-animations')!=='false',font:Number(localStorage.getItem('nv-font')||18)};
let db,stories=[],isAdmin=false,user=null,activeStory=null,activeChapter=0,page=0,pages=[],timer;let reactions=[],myReactions=[],publicProfiles=[],profile=null;
const validCover=u=>typeof u==='string'&&/^https:\/\//i.test(u);
function applySettings(){document.documentElement.dataset.theme=cfg.theme;document.body.classList.toggle('halloween',cfg.siteTheme==='halloween');document.body.classList.toggle('christmas',cfg.siteTheme==='christmas');document.body.classList.toggle('no-motion',!cfg.animations);document.documentElement.style.setProperty('--reader-size',cfg.font+'px');if($('#siteSeasonSelect'))$('#siteSeasonSelect').value=cfg.siteTheme;renderSeasonEffects();$('#themeSetting').value=cfg.theme;$('#animationsSetting').checked=cfg.animations;$('#fontSetting').value=cfg.font;}
function setSetting(k,v){cfg[k]=v;localStorage.setItem('nv-'+k,String(v));applySettings();}
async function init(){applySettings();try{if(window.ENCRIA_SUPABASE_URL&&window.ENCRIA_SUPABASE_ANON_KEY&&window.supabase){db=supabase.createClient(window.ENCRIA_SUPABASE_URL,window.ENCRIA_SUPABASE_ANON_KEY);const {data:{user:u}}=await db.auth.getUser();user=u;await checkAdmin();await loadSiteTheme();await loadProfile();db.auth.onAuthStateChange(()=>setTimeout(async()=>{const r=await db.auth.getUser();user=r.data.user;await checkAdmin();bookmarkCache.clear();await loadProfile();await loadSiteTheme();await loadStories();},0));await loadStories();}else{stories=await(await fetch('histoires.json')).json();render();await loadReadingList();} }catch(e){console.error(e);$('#empty').textContent='Impossible de charger les histoires : '+(e?.message||'connexion Supabase indisponible')+'. Aucune donnée n’a été supprimée.';$('#empty').hidden=false;}updateAccount();}
async function loadSiteTheme(){
 if(!db)return;
 const {data,error}=await db.from('site_settings').select('site_theme').eq('id',1).maybeSingle();
 if(error){console.warn('Exécuter MIGRATION-V5.sql pour activer les thèmes globaux :',error.message);return;}
 cfg.siteTheme=['normal','halloween','christmas'].includes(data?.site_theme)?data.site_theme:'normal';applySettings();
}
async function saveSiteTheme(e){
 const select=e.target;if(!isAdmin||!db){select.value=cfg.siteTheme;return;}
 select.disabled=true;$('#siteSeasonStatus').textContent='Enregistrement…';
 const requested=select.value;const {error}=await db.rpc('set_site_theme',{new_theme:requested});
 if(error){$('#siteSeasonStatus').textContent='Erreur : '+error.message;select.value=cfg.siteTheme;}
 else{cfg.siteTheme=requested;applySettings();$('#siteSeasonStatus').textContent='Thème appliqué à tous les visiteurs.';}
 select.disabled=false;
}
function renderSeasonEffects(){
 const layer=$('#seasonEffects');if(!layer)return;layer.replaceChildren();
 const kind=cfg.siteTheme;if(kind==='normal')return;
 const icons={
 web:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M0 0 L100 0 M0 0 L0 100 M0 0 L98 98 M0 0 L95 45 M0 0 L45 95"/><path d="M20 0 Q20 20 0 20 M40 0 Q42 42 0 40 M65 0 Q65 65 0 65 M85 0 Q85 85 0 85 M25 10 Q38 24 10 25 M43 18 Q63 45 18 43 M60 26 Q83 62 26 60"/></svg>`,
 bat:`<svg viewBox="0 0 100 55" fill="currentColor"><path d="M50 12 45 5 42 12 35 15 Q20 0 2 9 Q16 12 10 30 Q22 25 25 40 Q35 30 43 38 L50 50 57 38 Q65 30 75 40 Q78 25 90 30 Q84 12 98 9 Q80 0 65 15 L58 12 55 5Z"/></svg>`,
 ghost:`<svg viewBox="0 0 90 110" fill="none"><path d="M15 96 V45 C15 5 75 5 75 45 V96 L62 86 51 100 40 88 27 100Z" fill="#f6f1ed" fill-opacity=".86"/><ellipse cx="35" cy="49" rx="5" ry="8" fill="#252033"/><ellipse cx="55" cy="49" rx="5" ry="8" fill="#252033"/><ellipse cx="45" cy="69" rx="5" ry="7" fill="#252033"/></svg>`,
 pumpkin:`<svg viewBox="0 0 120 100"><path d="M60 22 Q54 8 65 2" stroke="#6f9b45" stroke-width="8" fill="none"/><ellipse cx="60" cy="62" rx="52" ry="35" fill="#f18b27"/><ellipse cx="38" cy="62" rx="21" ry="34" fill="#d8661d"/><ellipse cx="82" cy="62" rx="21" ry="34" fill="#d8661d"/><ellipse cx="60" cy="62" rx="27" ry="35" fill="#f99932"/><path d="m37 49 12 12H30Z M83 49 12 12H76Z M37 73 Q60 92 83 73 L75 71 69 78 60 73 51 78 45 71Z" fill="#1d1512"/></svg>`,
 snow:`<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 2V38M2 20H38M7 7L33 33M33 7L7 33"/><path d="m15 7 5 5 5-5 M15 33l5-5 5 5"/></svg>`,
 'xmas-tree':`<svg viewBox="0 0 100 130"><path d="M46 100h12v25H46z" fill="#77523b"/><path d="M50 8 15 61h15L6 104h88L70 61h15Z" fill="#247b61" stroke="#c4e6bf" stroke-width="2"/><path d="M50 3 55 14 68 15 58 24 61 37 50 30 39 37 42 24 32 15 45 14Z" fill="#ffe1a0"/><circle cx="30" cy="83" r="4" fill="#f5d7a4"/><circle cx="70" cy="82" r="4" fill="#f8a7a7"/><circle cx="50" cy="59" r="4" fill="#ffe5a1"/></svg>`,
 'xmas-gift':`<svg viewBox="0 0 90 90"><rect x="12" y="34" width="66" height="48" rx="4" fill="#b72f43"/><rect x="9" y="27" width="72" height="15" rx="3" fill="#d8485d"/><path d="M40 27C7 24 19 2 36 13L45 27C49 7 73 4 70 18 68 25 58 28 40 27Z" fill="none" stroke="#f8dba2" stroke-width="5"/><path d="M40 30h12v52H40z" fill="#f8dba2"/></svg>`,
 'santa':`<svg viewBox="0 0 440 155" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M25 116 Q95 140 166 111 L183 97" stroke="#f3c878" stroke-width="8"/><path d="M34 111 Q94 128 162 105 L165 72 L47 72Z" fill="#ad2337" stroke="#f3c878" stroke-width="4"/><rect x="55" y="40" width="65" height="58" rx="13" fill="#c73243" stroke="#fff4d8" stroke-width="6"/><path d="M65 48 Q63 7 96 11 Q124 15 121 48Z" fill="#c52a40" stroke="#fff" stroke-width="6"/><circle cx="122" cy="14" r="10" fill="#fff"/><circle cx="94" cy="58" r="22" fill="#f3c9a8"/><path d="M76 67 Q93 104 113 67 Q94 81 76 67Z" fill="#fff" stroke="#fff" stroke-width="3"/><circle cx="87" cy="55" r="3" fill="#29202a"/><circle cx="103" cy="55" r="3" fill="#29202a"/><path d="M116 74 L144 59" stroke="#c52a40" stroke-width="13"/><path d="M172 84 Q204 66 231 79" stroke="#f3c878" stroke-width="3" stroke-dasharray="6 5"/><path d="M247 90 Q267 53 295 66 L323 83 L314 111 L292 107 L276 116Z" fill="#a36c4b" stroke="#f0c39a" stroke-width="3"/><path d="M283 68 L272 35 L287 49 L294 28 L299 62 M308 71 L327 44 L319 67" stroke="#b88a61" stroke-width="7"/><path d="M255 103 L247 137 M301 109 L312 138" stroke="#8c563a" stroke-width="7"/><circle cx="318" cy="83" r="7" fill="#e85c56"/><circle cx="299" cy="80" r="3" fill="#1c1920"/><path d="M331 86 Q352 80 372 96" stroke="#f3c878" stroke-width="3" stroke-dasharray="6 5"/></g><path d="M380 36 385 48 398 51 385 55 380 68 375 55 362 51 375 48Z M405 10 408 18 417 20 408 23 405 32 402 23 393 20 402 18Z" fill="#ffe2a1"/></svg>`,
 'xmas-star':`<svg viewBox="0 0 70 70"><path d="M35 2 42 27 68 35 42 43 35 68 27 43 2 35 27 27Z" fill="#ffe6ab"/></svg>`
 };
 const types=kind==='halloween'?['web','web','pumpkin','pumpkin','ghost','ghost','bat','bat','bat','bat','blood']:Array.from({length:32},()=> 'snow').concat(['xmas-tree','xmas-star','xmas-gift','santa']);
 types.forEach((type,i)=>{const el=document.createElement('span');el.className='season-item '+type;if(type!=='blood')el.innerHTML=icons[type];el.style.setProperty('--i',i);el.style.setProperty('--x',((i*47+11)%95)+'%');el.style.setProperty('--delay',((i*7)%19)*-.6+'s');el.style.setProperty('--dur',(9+(i*3)%12)+'s');layer.append(el);});
}
async function checkAdmin(){isAdmin=false;if(user&&db){const r=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();isAdmin=!!r.data;}updateAccount();applySettings();}
function updateAccount(){const b=$('#accountButton');b.textContent=user?'👤 Profil':'Connexion';$('#profileArea').hidden=!user;$('#loginArea').hidden=!!user;$('#adminLink').hidden=!isAdmin;$('#myStoriesOpen').hidden=!user;$('#adminSeasonSetting').hidden=!isAdmin;$('#accountRole').textContent=isAdmin?'ADMINISTRATEUR':'COMPTE LECTEUR';if(user){$('#accountEmail').textContent=user.email||'';$('#accountName').textContent=profile?.pseudo||user.user_metadata?.pseudo||(isAdmin?'Administrateur':'Lecteur');}}
async function loadProfile(){if(!db||!user){profile=null;updateAccount();return;}const {data}=await db.from('profiles').select('user_id,pseudo,pseudo_changed_at').eq('user_id',user.id).maybeSingle();profile=data||null;updateAccount();}
function authorOf(s){if(s.author_alias)return s.author_alias;return s.owner_id?(publicProfiles.find(p=>p.user_id===s.owner_id)?.pseudo||s.author):s.author;}
async function loadStories(){if(!db)return;const [a,b]=await Promise.all([db.from('stories').select('*').order('created_at',{ascending:false}),db.from('chapters').select('*').order('publish_at')]);if(a.error||b.error){const problem=a.error||b.error;console.error('Novelya: lecture Supabase',problem);throw problem;}const pr=await db.from('author_names').select('user_id,pseudo');if(!pr.error)publicProfiles=pr.data||[];stories=a.data.filter(s=>isAdmin||s.visibility==='published'||(s.visibility==='scheduled'&&s.release_at&&new Date(s.release_at)<=new Date())||s.visibility==='scheduled').map(s=>({...s,chapters:b.data.filter(c=>c.story_id===s.id&&(isAdmin||new Date(c.publish_at)<=new Date())).map(c=>({title:c.title,text:c.body,background_url:c.background_url||null}))}));await loadReactions();render();await loadReadingList();}
function upcoming(s){return s.visibility==='scheduled'&&s.release_at&&new Date(s.release_at)>new Date();}
function counts(id){const r=reactions.filter(x=>x.story_id===id);const likes=r.filter(x=>x.liked).length;const notes=r.filter(x=>Number.isInteger(x.rating)&&x.rating>=1&&x.rating<=5).map(x=>x.rating);return {likes,avg:notes.length?notes.reduce((a,b)=>a+b,0)/notes.length:0,votes:notes.length,mine:myReactions.find(x=>x.story_id===id)};}
async function loadReactions(){if(!db){reactions=[];myReactions=[];return;}const {data,error}=await db.from('story_reactions').select('story_id,liked,rating,user_id');if(error){console.warn('Installer MIGRATION-V5-3-AVIS.sql :',error.message);reactions=[];myReactions=[];return;}reactions=data||[];myReactions=user?reactions.filter(r=>r.user_id===user.id):[];}
async function saveReaction(id,kind,value){if(!db||!user){$('#accountDialog').showModal();$('#authStatus').textContent='Connecte-toi pour liker ou noter une histoire.';return;}const mine=myReactions.find(x=>x.story_id===id);const payload={story_id:id,user_id:user.id,liked:kind==='like'?!mine?.liked:!!mine?.liked,rating:kind==='rating'?(mine?.rating===value?null:value):(mine?.rating||null)};const {error}=await db.from('story_reactions').upsert(payload,{onConflict:'story_id,user_id'});if(error){alert('Impossible d’enregistrer ton avis : '+error.message);return;}await loadReactions();render();if($('#storyDetail').open)openStoryDetail(id);}
function storyCard(s){const soon=upcoming(s),color=/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#7554a8';const date=soon?new Date(s.release_at):null;return `<article class="card"><div class="cover" data-detail="${esc(s.id)}" style="--cover:${color}">${validCover(s.cover_url)?`<img class="cover-image" src="${esc(s.cover_url)}" alt="Couverture de ${esc(s.title)}" loading="lazy">`:''}</div><div class="card-body"><h3 data-detail="${esc(s.id)}" class="clickable-title">${esc(s.title)}</h3><span class="genre-tag">${esc(s.story_format||"Roman")}</span> <span class="genre-tag">${esc(s.genre)}</span> <span class="status-tag">${soon?'🟠 À venir':s.visibility==='draft'?'🔒 Brouillon':'🟢 Publiée'}</span><div class="author">par ${esc(authorOf(s))}</div><div class="story-reactions"><button type="button" class="reaction-like ${counts(s.id).mine?.liked?'active':''}" data-like="${esc(s.id)}" aria-label="Aimer cette histoire">${counts(s.id).mine?.liked?'❤️':'🤍'} ${counts(s.id).likes} j’aime</button><div class="reaction-rating" aria-label="Noter sur cinq étoiles">${[1,2,3,4,5].map(n=>`<button type="button" data-rate="${esc(s.id)}" data-score="${n}" aria-label="Noter ${n} sur 5" class="${(counts(s.id).mine?.rating||0)>=n?'selected':''}">★</button>`).join('')}<small>${counts(s.id).votes?counts(s.id).avg.toFixed(1)+'/5 · '+counts(s.id).votes+' avis':'Aucune note'}</small></div><button class="review-open" data-reviews="${esc(s.id)}">💬 Voir les avis</button></div><p class="description">${esc(s.description)}</p>${soon?`<p class="release">📅 ${date.toLocaleString('fr-FR',{dateStyle:'long',timeStyle:'short'})}<br><span data-countdown="${esc(s.id)}"></span></p>`:''}${isAdmin?`<a class="edit-inline" href="admin.html?edit=${encodeURIComponent(s.id)}">✏️ Modifier l'histoire</a>`:''}<button class="read-btn" data-detail="${esc(s.id)}" ${soon&&!isAdmin||!s.chapters.length?'disabled':''}>${soon&&!isAdmin?'🔒 Bientôt disponible':s.chapters.length?'Découvrir l’histoire →':'Aucun chapitre disponible'}</button></div></article>`;}
function render(){const q=$('#search').value.toLowerCase(),g=$('#genre').value,f=$('#format').value,sort=$('#sort').value;const formats=['Roman','Manga','Webtoon','BD','Nouvelle','Light novel','Poésie','Fanfiction','Conte'];const genres=['Fantasy','Romance','Science-fiction','Horreur','Thriller','Policier','Aventure','Action','Drame','Comédie','Historique','Tranche de vie','Mystère','Fantastique','Dystopie','Autre'];const knownFormats=[...new Set([...formats,...stories.map(s=>s.story_format||'Roman')])];const knownGenres=[...new Set([...genres,...stories.map(s=>s.genre).filter(Boolean)])];$('#format').innerHTML='<option value="">Tous les formats</option>'+knownFormats.map(x=>`<option value="${esc(x)}" ${x===f?'selected':''}>${esc(x)}</option>`).join('');$('#genre').innerHTML='<option value="">Tous les genres</option>'+knownGenres.map(x=>`<option value="${esc(x)}" ${x===g?'selected':''}>${esc(x)}</option>`).join('');const filtered=stories.filter(s=>(!g||s.genre===g)&&(!f||(s.story_format||'Roman')===f)&&[s.title,authorOf(s),s.genre,s.story_format,s.description].join(' ').toLowerCase().includes(q));filtered.sort((a,b)=>sort==='rating'?(counts(b.id).votes?counts(b.id).avg:0)-(counts(a.id).votes?counts(a.id).avg:0)||counts(b.id).votes-counts(a.id).votes:sort==='recent'?new Date(b.created_at||0)-new Date(a.created_at||0):sort==='title'?a.title.localeCompare(b.title,'fr'):counts(b.id).likes-counts(a.id).likes||counts(b.id).avg-counts(a.id).avg);const live=filtered.filter(s=>!upcoming(s)),soon=filtered.filter(upcoming);$('#grid').innerHTML=live.map(storyCard).join('');$('#upcomingGrid').innerHTML=soon.map(storyCard).join('');$('#upcomingSection').hidden=!soon.length;$('#empty').hidden=!!filtered.length;$('#storyCount').textContent=stories.filter(s=>!upcoming(s)&&s.visibility!=='draft').length;renderFeatured();updateCountdowns();}
let featureIndex=0;
// Défilement autonome, sans remplacer la sélection lorsque la fenêtre de lecture est ouverte.
setInterval(()=>{const available=stories.filter(s=>!upcoming(s)&&(s.visibility==='published'||!s.visibility)&&s.chapters.length);if(available.length>1&&!document.hidden&&!$('#reader').open){featureIndex=(featureIndex+1)%available.length;renderFeatured();}},30000);
function renderFeatured(){
 const el=$('#featuredStories');if(!el)return;
 const choices=stories.filter(s=>!upcoming(s)&&(s.visibility==='published'||!s.visibility)&&s.chapters.length).sort((a,b)=>counts(b.id).likes-counts(a.id).likes||counts(b.id).avg-counts(a.id).avg);
 if(!choices.length){el.innerHTML='<div class="feature-empty"><span class="feature-sigil">✦</span><p>Découvre nos univers.<br>Chaque histoire commence ici.</p></div>';return;}
 featureIndex%=choices.length;
 const s=choices[featureIndex];const img=validCover(s.cover_url)?`<img src="${esc(s.cover_url)}" alt="Couverture de ${esc(s.title)}">`:'<span class="feature-sigil">✦</span>';
 el.innerHTML=`<button type="button" class="feature-book" data-detail="${esc(s.id)}" aria-label="Découvrir ${esc(s.title)}"><div class="feature-art" style="--feature-color:${/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#583979'}">${img}</div><div class="feature-bottom"><span class="feature-kicker">À DÉCOUVRIR · ${esc(s.genre)}</span><strong>${esc(s.title)}</strong><span class="feature-cta">Découvrir cette histoire →</span></div></button><div class="feature-nav"><button type="button" data-feature="-1" aria-label="Couverture précédente">←</button><span>${featureIndex+1} / ${choices.length}</span><button type="button" data-feature="1" aria-label="Couverture suivante">→</button></div>`;
}
function updateCountdowns(){document.querySelectorAll('[data-countdown]').forEach(el=>{const s=stories.find(x=>x.id===el.dataset.countdown);if(!s)return;const diff=new Date(s.release_at)-new Date();if(diff<=0){el.textContent='Disponible maintenant';return;}const days=Math.floor(diff/86400000),hrs=Math.floor(diff%86400000/3600000),mins=Math.floor(diff%3600000/60000);el.textContent=`⏳ ${days} j ${hrs} h ${mins} min avant la sortie`;});}
// Découpage fondé sur la taille réelle des pages, pas sur un nombre approximatif de caractères.
// La mesure tient compte des paragraphes, de la police, de la largeur et de la hauteur disponibles.
async function paginate(text){
 const probe=$('#bookPage'),source=String(text||'');
 if(!probe || !probe.clientHeight || !probe.clientWidth)return [source];
 // Mesurer sur une copie invisible : ne jamais afficher les essais dans la page de gauche.
 const rect=probe.getBoundingClientRect();
 const measure=probe.cloneNode(false);
 measure.removeAttribute('id');
 measure.removeAttribute('onclick');
 measure.style.cssText=`position:fixed!important;left:-20000px!important;top:0!important;visibility:hidden!important;pointer-events:none!important;transform:none!important;animation:none!important;width:${rect.width}px!important;height:${rect.height}px!important;min-height:0!important;max-height:${rect.height}px!important;overflow:hidden!important;flex:none!important;box-sizing:border-box!important;`;
 probe.parentNode.appendChild(measure);
 const result=[];let pos=0,iterations=0;
 const fits=end=>{measure.textContent=source.slice(pos,end);return measure.scrollHeight<=measure.clientHeight+1;};
 try{
  while(pos<source.length){
   const cap=Math.min(source.length,pos+1400);let lo=pos+1,hi=cap,best=pos;
   while(lo<=hi){const mid=Math.floor((lo+hi)/2);if(fits(mid)){best=mid;lo=mid+1;}else hi=mid-1;}
   if(best<=pos)best=Math.min(source.length,pos+1);
   if(best<source.length&&!/\s/.test(source[best-1])&&!/\s/.test(source[best])){
    const fragment=source.slice(pos,best),lastSpace=Math.max(fragment.lastIndexOf(' '),fragment.lastIndexOf('\n'));
    if(lastSpace>Math.floor(fragment.length*.55))best=pos+lastSpace+1;
   }
   result.push(source.slice(pos,best).trim());pos=best;
   if(++iterations%5===0)await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  }
 }finally{measure.remove();}
 return result.length?result:[''];
}
// Marque-pages enregistrés par compte et par histoire (synchronisés sur Supabase).
let readerLoadVersion=0, bookmarkCache=new Map();
function bookmarkLocalKey(id){return 'nv-bookmark-'+(user?.id||'guest')+'-'+id;}
function getBookmark(id){return bookmarkCache.get(String(id))||JSON.parse(localStorage.getItem(bookmarkLocalKey(id))||'null');}
async function loadBookmark(id){
 if(!user||!db)return getBookmark(id);
 const {data,error}=await db.from('reading_bookmarks').select('chapter_index,page_index').eq('user_id',user.id).eq('story_id',id).maybeSingle();
 if(error){console.warn('Marque-page indisponible :',error.message);return getBookmark(id);}
 if(data){const mark={chapter:data.chapter_index,page:data.page_index};bookmarkCache.set(String(id),mark);localStorage.setItem(bookmarkLocalKey(id),JSON.stringify(mark));}
 else {bookmarkCache.delete(String(id));localStorage.removeItem(bookmarkLocalKey(id));}
 return getBookmark(id);
}
async function saveBookmark(){
 if(!activeStory)return;
 if(!user||!db){$('#bookmarkStatus').textContent='Connecte-toi pour enregistrer ton marque-page.';return;}
 const entry={chapter:activeChapter,page};
 const {error}=await db.from('reading_bookmarks').upsert({user_id:user.id,story_id:activeStory.id,chapter_index:entry.chapter,page_index:entry.page,updated_at:new Date().toISOString()},{onConflict:'user_id,story_id'});
 if(error){$('#bookmarkStatus').textContent='Erreur : '+error.message;return;}
 bookmarkCache.set(String(activeStory.id),entry);localStorage.setItem(bookmarkLocalKey(activeStory.id),JSON.stringify(entry));
 $('#bookmarkStatus').textContent='Marque-page enregistré : chapitre '+(activeChapter+1)+', page '+(page+1)+'.';
 await loadReadingList();
 // Le bouton de reprise est immédiatement disponible pour cette histoire.
 const resume=$('#detailResume');if(resume&&String(resume.dataset.storyId)===String(activeStory.id))resume.hidden=false;
}
// V7.1 : liste de lecture personnelle, chargée uniquement pour le compte connecté.
async function loadReadingList(){
 const section=$('#continueReading'),list=$('#continueList');if(!section||!list)return;
 section.hidden=true;list.replaceChildren();if(!user||!db)return;
 const currentUser=user.id;
 const {data,error}=await db.from('reading_bookmarks').select('story_id,chapter_index,page_index,updated_at').eq('user_id',currentUser).order('updated_at',{ascending:false});
 if(error){console.warn('Lectures en cours indisponibles :',error.message);return;}
 if(user?.id!==currentUser)return;
 const saved=(data||[]).map(m=>({mark:m,story:stories.find(s=>String(s.id)===String(m.story_id)&&!upcoming(s)&&s.chapters?.length)})).filter(x=>x.story);
 for(const {mark,story} of saved){
  const entry={chapter:mark.chapter_index,page:mark.page_index};bookmarkCache.set(String(story.id),entry);localStorage.setItem(bookmarkLocalKey(story.id),JSON.stringify(entry));
  const item=document.createElement('article');item.className='continue-card';
  const cover=document.createElement('div');cover.className='continue-cover';
  if(validCover(story.cover_url)){const img=document.createElement('img');img.src=story.cover_url;img.alt='Couverture de '+story.title;img.loading='lazy';cover.append(img);}else cover.textContent='✦';
  const content=document.createElement('div');content.className='continue-info';
  const title=document.createElement('h3');title.textContent=story.title;
  const meta=document.createElement('p');meta.textContent='Chapitre '+(entry.chapter+1)+' · Page '+(entry.page+1);
  const buttons=document.createElement('div');buttons.className='continue-actions';
  const resume=document.createElement('button');resume.type='button';resume.className='continue-resume';resume.textContent='Reprendre la lecture →';resume.onclick=()=>resumeReader(story.id);
  const remove=document.createElement('button');remove.type='button';remove.className='continue-remove';remove.textContent='Retirer';remove.setAttribute('aria-label','Retirer '+story.title+' des lectures en cours');remove.onclick=()=>removeReadingBookmark(story.id);
  buttons.append(resume,remove);content.append(title,meta,buttons);item.append(cover,content);list.append(item);
 }
 section.hidden=!saved.length;
}
async function removeReadingBookmark(id){
 if(!db||!user)return;
 const {error}=await db.from('reading_bookmarks').delete().eq('user_id',user.id).eq('story_id',id);
 if(error){alert('Impossible de retirer le marque-page : '+error.message);return;}
 bookmarkCache.delete(String(id));localStorage.removeItem(bookmarkLocalKey(id));
 const resume=$('#detailResume');if(resume&&String(resume.dataset.storyId)===String(id))resume.hidden=true;
 await loadReadingList();
}
async function resumeReader(id){const mark=await loadBookmark(id);if(!mark){alert('Aucun marque-page enregistré pour cette histoire.');return;}await openReader(id,mark.chapter,false,mark.page);}

function readerStep(){return matchMedia('(max-width:760px)').matches?1:2;}
async function openReader(id,idx=0,restore=true,requestedPage=null){
 const s=stories.find(x=>String(x.id)===String(id));if(!s||!s.chapters[idx]||upcoming(s)&&!isAdmin)return;
 if($('#storyDetail').open)$('#storyDetail').close();
 activeStory=s;activeChapter=idx;
 $('#readerTitle').textContent=s.title;$('#readerMeta').textContent=`par ${authorOf(s)} · ${s.genre}`;
 $('#chapterSelect').innerHTML=s.chapters.map((c,i)=>`<option value="${i}" ${i===idx?'selected':''}>${esc(c.title)}</option>`).join('');
 const chapterBg=s.chapters[idx].background_url||s.cover_url;
 const background=validCover(chapterBg)?`url("${chapterBg.replace(/["\\\\]/g,'')}")`:'none';
 $('#reader').style.setProperty('--chapter-bg',background);
 if(!$('#reader').open)$('#reader').showModal();$('#bookmarkStatus').textContent='';
 // La boîte doit être visible avant de mesurer ses pages.
 const key='nv-progress-'+s.id+'-'+idx;
 const saved=requestedPage!==null?Number(requestedPage):(restore?Number(localStorage.getItem(key)||0):0);
 const thisLoad=++readerLoadVersion;$('#pageIndicator').textContent='Préparation des pages…';
 const newPages=await paginate(s.chapters[idx].text);
 if(thisLoad!==readerLoadVersion||!$('#reader').open)return;
 pages=newPages;
 page=Math.max(0,Math.min(Math.floor(saved/readerStep())*readerStep(),pages.length-1));
 drawPage();
}
function openStoryDetail(id){
 const s=stories.find(x=>String(x.id)===String(id));
 if(!s || (upcoming(s)&&!isAdmin))return;
 const n=counts(s.id),cover=validCover(s.cover_url)?s.cover_url:null;
 const chosenBackground=s.chapters[0]?.background_url&&validCover(s.chapters[0].background_url)?s.chapters[0].background_url:cover;
 $('#storyDetail').style.setProperty('--detail-bg',chosenBackground?`url("${chosenBackground.replace(/["\\\\]/g,'')}")`:'none');
 $('#detailCover').innerHTML=cover?`<img src="${esc(cover)}" alt="Couverture de ${esc(s.title)}">`:'<span class="detail-no-cover">✦</span>';
 $('#detailTitle').textContent=s.title;
 $('#detailAuthor').textContent='Écrit par '+authorOf(s);
 $('#detailTags').innerHTML=`<span>${esc(s.story_format||'Roman')}</span><span>${esc(s.genre||'Autre')}</span>`;
 $('#detailSummary').textContent=s.description||'Aucun résumé disponible pour cette histoire.';
 $('#detailStats').innerHTML=`<button type="button" data-like="${esc(s.id)}">${n.mine?.liked?'❤️':'🤍'} ${n.likes} j’aime</button><span>⭐ ${n.votes?n.avg.toFixed(1)+'/5 ('+n.votes+' notes)':'Pas encore de note'}</span>`;
 $('#detailRating').innerHTML='<span>Ta note : </span>'+[1,2,3,4,5].map(i=>`<button type="button" data-rate="${esc(s.id)}" data-score="${i}" aria-label="Noter ${i} sur 5" class="${(n.mine?.rating||0)>=i?'selected':''}">★</button>`).join('');
 $('#detailChapterCount').textContent=s.chapters.length+' chapitre'+(s.chapters.length>1?'s':'')+' disponible'+(s.chapters.length>1?'s':'');
 $('#detailRead').disabled=!s.chapters.length;
 $('#detailRead').onclick=()=>openReader(s.id,0,false,0);
 const resume=$('#detailResume');resume.dataset.storyId=String(s.id);resume.hidden=!getBookmark(s.id);resume.onclick=()=>resumeReader(s.id);
 loadBookmark(s.id).then(mark=>{if($('#storyDetail').open&&String(resume.dataset.storyId)===String(s.id))resume.hidden=!mark;}).catch(console.error);
 $('#detailReviews').onclick=()=>{ $('#storyDetail').close();openReviews(s.id); };
 if(!$('#storyDetail').open)$('#storyDetail').showModal();
}
function drawPage(direction=0){
 if(!activeStory)return;
 const left=$('#bookPage'),right=$('#bookPageRight'),spread=readerStep();
 left.classList.remove('flip-next','flip-prev');right.classList.remove('flip-next','flip-prev');
 left.textContent=pages[page]||'';right.textContent=spread===2?(pages[page+1]||''):'';
 right.hidden=spread===1;
 if(direction&&cfg.animations){const flipping=direction>0?right:left;void flipping.offsetWidth;flipping.classList.add(direction>0?'flip-next':'flip-prev');}
 $('#pageIndicator').textContent=spread===2?`Pages ${page+1}${page+1<pages.length?'–'+Math.min(page+2,pages.length):''} / ${pages.length}`:`Page ${page+1} / ${pages.length}`;
 $('#prevPage').disabled=page===0&&activeChapter===0;
 $('#nextPage').disabled=page+spread>=pages.length&&activeChapter===activeStory.chapters.length-1;
 localStorage.setItem('nv-progress-'+activeStory.id+'-'+activeChapter,page);
}
function turn(dir){
 if(!activeStory)return;const step=readerStep();const nextPage=page+dir*step;
 if(nextPage>=0&&nextPage<pages.length){page=nextPage;drawPage(dir);}
 else{const next=activeChapter+dir;if(next>=0&&next<activeStory.chapters.length){openReader(activeStory.id,next,false);if(dir<0){page=Math.floor((pages.length-1)/step)*step;drawPage(dir);}}}
}
// Recherche globale : résultats instantanés sans changement de page.
function updateGlobalSearch(){
 const q=$('#globalSearchInput').value.trim().toLocaleLowerCase('fr');
 const results=$('#globalSearchResults');
 if(!q){results.innerHTML='<p class="search-help">Écris le titre d’une histoire ou le pseudo d’un auteur.</p>';return;}
 const found=stories.filter(st=>!upcoming(st)||isAdmin).filter(st=>[st.title,authorOf(st),st.genre,st.story_format].join(' ').toLocaleLowerCase('fr').includes(q)).slice(0,20);
 results.innerHTML=found.length?found.map(st=>`<button type="button" class="global-search-result" data-search-story="${esc(st.id)}"><strong>${esc(st.title)}</strong><small>par ${esc(authorOf(st))} · ${esc(st.genre||'Histoire')}</small></button>`).join(''):'<p class="search-help">Aucune histoire trouvée.</p>';
}
$('#headerSearch').onclick=()=>{const dlg=$('#globalSearchDialog');if(!dlg.open)dlg.showModal();$('#globalSearchInput').value='';updateGlobalSearch();$('#globalSearchInput').focus();};
$('#globalSearchInput').addEventListener('input',updateGlobalSearch);
$('#globalSearchResults').addEventListener('click',e=>{const b=e.target.closest('[data-search-story]');if(!b)return;$('#globalSearchDialog').close();openStoryDetail(b.dataset.searchStory);});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#headerSearch').click();}});$('#saveBookmark').onclick=saveBookmark;$('#search').addEventListener('input',render);$('#genre').addEventListener('change',render);$('#format').addEventListener('change',render);$('#sort').addEventListener('change',render);$('#year').textContent=new Date().getFullYear();$('#siteSeasonSelect').onchange=saveSiteTheme;$('#themeSetting').onchange=e=>setSetting('theme',e.target.value);$('#animationsSetting').onchange=e=>setSetting('animations',e.target.checked);$('#fontSetting').oninput=e=>setSetting('font',Number(e.target.value));
$('#accountButton').onclick=()=>$('#accountDialog').showModal();$('#settingsButton').onclick=()=>$('#settingsDialog').showModal();$('#loginForm').onsubmit=async e=>{e.preventDefault();if(!db)return alert('Connexion indisponible sans Supabase.');const f=e.target;const {error}=await db.auth.signInWithPassword({email:f.elements.email.value,password:f.elements.password.value});$('#authStatus').textContent=error?error.message:'Connexion réussie.';if(!error)$('#accountDialog').close();};$('#registerForm').onsubmit=async e=>{e.preventDefault();if(!db)return;const f=e.target;const pseudo=f.elements.pseudo.value.trim();if(!/^[\p{L}\p{N}_-]{3,24}$/u.test(pseudo)){ $('#authStatus').textContent='Pseudo : 3 à 24 caractères, lettres, chiffres, tiret ou underscore.';return;}const {error}=await db.auth.signUp({email:f.elements.email.value,password:f.elements.password.value,options:{data:{pseudo},emailRedirectTo:window.location.origin+'/'}});$('#authStatus').textContent=error?error.message:'Compte créé ! Vérifie ton e-mail si une confirmation est demandée.';};$('#logoutButton').onclick=async()=>{await db.auth.signOut();$('#accountDialog').close();};
$('#prevPage').onclick=()=>turn(-1);$('#nextPage').onclick=()=>turn(1);$('#bookPage').onclick=()=>{if(!String(window.getSelection()).trim())turn(-1);};$('#bookPageRight').onclick=()=>{if(!String(window.getSelection()).trim())turn(1);};$('#chapterSelect').onchange=e=>openReader(activeStory.id,Number(e.target.value),true);
document.addEventListener('click',e=>{const like=e.target.closest('[data-like]');if(like){saveReaction(like.dataset.like,'like');return;}const rate=e.target.closest('[data-rate]');if(rate){saveReaction(rate.dataset.rate,'rating',Number(rate.dataset.score));return;}const d=e.target.closest('[data-detail]');if(d){openStoryDetail(d.dataset.detail);return;}const b=e.target.closest('[data-read]');if(b){openReader(b.dataset.read);return;}const f=e.target.closest('[data-feature]');if(f){const choices=stories.filter(s=>!upcoming(s)&&(s.visibility==='published'||!s.visibility)&&s.chapters.length).sort((a,b)=>counts(b.id).likes-counts(a.id).likes||counts(b.id).avg-counts(a.id).avg);if(choices.length){featureIndex=(featureIndex+Number(f.dataset.feature)+choices.length)%choices.length;renderFeatured();}}const close=e.target.closest('[data-close]');if(close)$('#'+close.dataset.close).close();});document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));$('#readerBackdrop').addEventListener('click',()=>$('#reader').close());$('#storyDetail').addEventListener('click',e=>{if(e.target===$('#storyDetail'))$('#storyDetail').close();});document.addEventListener('keydown',e=>{if(!$('#reader').open||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1);});window.addEventListener('resize',()=>{if(activeStory&&$('#reader').open)openReader(activeStory.id,activeChapter,true).catch(console.error);});setInterval(()=>{if(db){loadStories().catch(console.error);loadSiteTheme().catch(console.error);}else updateCountdowns();},30000);init();

// Profils, commentaires et propositions de publication : permissions vérifiées dans Supabase.
async function openReviews(id){const st=stories.find(x=>x.id===id);if(!st)return;$('#reviewsTitle').textContent='Avis — '+st.title;$('#reviewsStory').value=id;$('#reviewsDialog').showModal();await refreshReviews(id);}
async function refreshReviews(id){const box=$('#reviewsList');box.textContent='Chargement…';if(!db){box.textContent='Connexion indisponible.';return;}const {data,error}=await db.from('story_comments').select('id,body,created_at,user_id').eq('story_id',id).eq('status','approved').order('created_at',{ascending:false}).limit(100);if(error){box.textContent='Commentaires indisponibles : '+error.message;return;}box.innerHTML=(data||[]).map(c=>`<article class="review-item"><b>${esc(publicProfiles.find(p=>p.user_id===c.user_id)?.pseudo||'Lecteur')}</b> <small>${new Date(c.created_at).toLocaleDateString('fr-FR')}</small><p>${esc(c.body)}</p><button type="button" data-report-comment="${esc(c.id)}">Signaler</button></article>`).join('')||'<p>Pas encore de commentaires approuvés.</p>';}
$('#reviewForm').onsubmit=async e=>{e.preventDefault();if(!user)return $('#accountDialog').showModal();const f=e.target,body=f.elements.body.value.trim();if(body.length<3||body.length>1500)return alert('Commentaire entre 3 et 1500 caractères.');const {error}=await db.from('story_comments').insert({story_id:$('#reviewsStory').value,user_id:user.id,body});$('#reviewStatus').textContent=error?error.message:'Commentaire envoyé à la modération. Il sera visible après validation.';if(!error)f.reset();};
$('#renameForm').onsubmit=async e=>{e.preventDefault();if(!db||!user)return;const pseudo=e.target.elements.pseudo.value.trim();const {error}=await db.rpc('change_my_pseudo',{new_pseudo:pseudo});$('#renameStatus').textContent=error?error.message:'Pseudonyme modifié.';if(!error){await loadProfile();await loadStories();}};
$('#submitStoryForm').onsubmit=async e=>{e.preventDefault();if(!user)return $('#accountDialog').showModal();const f=e.target;const payload={p_title:f.elements.title.value.trim(),p_description:f.elements.description.value.trim(),p_genre:f.elements.genre.value,p_format:f.elements.story_format.value,p_body:f.elements.body.value.trim()};const {error}=await db.rpc('submit_story_for_review',payload);$('#submitStoryStatus').textContent=error?error.message:'Histoire enregistrée. Publication automatique si aucun problème n’a été détecté ; sinon vérification admin.';if(!error){f.reset();await loadStories();}};
document.addEventListener('click',async e=>{const reviews=e.target.closest('[data-reviews]');if(reviews){openReviews(reviews.dataset.reviews);return;}const report=e.target.closest('[data-report-comment]');if(report){if(!user){$('#accountDialog').showModal();return;}const reason=prompt('Pourquoi signales-tu ce commentaire ?');if(!reason||reason.trim().length<5)return;const {error}=await db.from('comment_reports').insert({comment_id:report.dataset.reportComment,reporter_id:user.id,reason:reason.trim().slice(0,300)});alert(error?error.message:'Signalement transmis aux administrateurs.');}});

$('#submitStoryOpen').onclick=()=>$('#submitStoryDialog').showModal();

// Espace auteur : les RPC Supabase vérifient l'identité du propriétaire.
let authorStoryCache=[],authorChapterCache=[];
async function authorRefresh(){
 if(!user||!db)return;
 const [s,c]=await Promise.all([db.from('stories').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}),db.from('chapters').select('*')]);
 const status=$('#authorStatus');if(s.error||c.error){status.textContent=(s.error||c.error).message;return;}
 authorStoryCache=s.data||[];authorChapterCache=c.data||[];
 $('#myStoriesList').innerHTML=authorStoryCache.map(st=>`<div class="author-item"><b>${esc(st.title)}</b> — ${esc(st.visibility)}<div><button type="button" class="outline" data-author-edit="${esc(st.id)}">✏️ Modifier</button> <button type="button" class="outline" data-author-chapters="${esc(st.id)}">📖 Chapitres</button></div></div>`).join('')||'<p>Tu n’as pas encore proposé d’histoire.</p>';
}
$('#myStoriesOpen').onclick=async()=>{$('#myStoriesDialog').showModal();await authorRefresh();};
async function authorUpload(file){if(!file)return null;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Image JPG, PNG ou WebP de 5 Mo maximum.');const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];const path=`authors/${user.id}/${crypto.randomUUID()}.${ext}`;const {error}=await db.storage.from('covers').upload(path,file,{contentType:file.type});if(error)throw error;return db.storage.from('covers').getPublicUrl(path).data.publicUrl;}
document.addEventListener('click',e=>{
 const edit=e.target.closest('[data-author-edit]');if(edit){const st=authorStoryCache.find(s=>String(s.id)===edit.dataset.authorEdit);if(!st)return;const f=$('#authorStoryForm');f.hidden=false;for(const k of ['title','description','genre','story_format'])f.elements[k].value=st[k]||'';f.elements.story_id.value=st.id;$('#authorChapterForm').hidden=true;}
 const chapters=e.target.closest('[data-author-chapters]');if(chapters){const st=authorStoryCache.find(s=>String(s.id)===chapters.dataset.authorChapters);if(!st)return;const f=$('#authorChapterForm');f.hidden=false;f.reset();f.elements.story_id.value=st.id;f.elements.chapter_id.value='';$('#authorChapterHeading').textContent='Ajouter un chapitre à « '+st.title+' »';const list=authorChapterCache.filter(c=>String(c.story_id)===String(st.id));$('#authorStatus').innerHTML=list.map(c=>`<button type="button" class="outline" data-author-chapter-edit="${esc(c.id)}">✏️ ${esc(c.title)}</button>`).join(' ')||'Aucun chapitre.';}
 const ch=e.target.closest('[data-author-chapter-edit]');if(ch){const c=authorChapterCache.find(x=>String(x.id)===ch.dataset.authorChapterEdit);if(!c)return;const f=$('#authorChapterForm');f.hidden=false;f.elements.story_id.value=c.story_id;f.elements.chapter_id.value=c.id;f.elements.title.value=c.title;f.elements.body.value=c.body;$('#authorChapterHeading').textContent='Modifier le chapitre';}
});
$('#authorStoryForm').onsubmit=async e=>{e.preventDefault();const f=e.target;$('#authorStatus').textContent='Enregistrement…';try{const st=authorStoryCache.find(s=>String(s.id)===f.elements.story_id.value);const cover=await authorUpload(f.elements.cover.files[0]);const {error}=await db.rpc('novelya_author_edit_story',{target:st.id,new_title:f.elements.title.value,new_description:f.elements.description.value,new_genre:f.elements.genre.value,new_format:f.elements.story_format.value,new_cover:cover||st.cover_url||null});if(error)throw error;$('#authorStatus').textContent='Histoire enregistrée.';await authorRefresh();await loadStories();}catch(err){$('#authorStatus').textContent='Erreur : '+err.message;}};
$('#authorChapterForm').onsubmit=async e=>{e.preventDefault();const f=e.target;$('#authorStatus').textContent='Enregistrement du chapitre…';try{const old=authorChapterCache.find(c=>String(c.id)===f.elements.chapter_id.value);const background=await authorUpload(f.elements.background.files[0]);const {error}=await db.rpc('novelya_author_save_chapter',{target_story:f.elements.story_id.value,target_chapter:f.elements.chapter_id.value||null,new_title:f.elements.title.value,new_body:f.elements.body.value,new_background:background||old?.background_url||null});if(error)throw error;$('#authorStatus').textContent='Chapitre enregistré. Un contenu suspect est mis en attente.';await authorRefresh();await loadStories();}catch(err){$('#authorStatus').textContent='Erreur : '+err.message;}};
async function presencePing(){if(!db||!user||document.hidden)return;try{await db.from('novelya_presence').upsert({user_id:user.id,last_seen:new Date().toISOString()},{onConflict:'user_id'});}catch(e){console.warn('Présence indisponible',e);}}
setInterval(presencePing,45000);setTimeout(presencePing,2000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)presencePing();});
