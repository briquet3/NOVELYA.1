const $=s=>document.querySelector(s);const status=s=>$('#status').textContent=s;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db,stories=[],chapters=[],removeExistingCover=false,removeChapterBg=false,presenceMap=new Map();
const coverFile=$('#coverFile'),coverPreview=$('#coverPreview');
function showCover(url){coverPreview.src=url||'';coverPreview.classList.toggle('hidden',!url);}
coverFile.addEventListener('change',()=>{const f=coverFile.files[0];if(f)showCover(URL.createObjectURL(f));});
$('#removeCover').onclick=()=>{removeExistingCover=true;coverFile.value='';showCover(null);$('#coverHelp').textContent='La couverture sera retirée à l’enregistrement.';};
if(!window.ENCRIA_SUPABASE_URL||!window.ENCRIA_SUPABASE_ANON_KEY){status('Configure d’abord config.js et exécute supabase.sql (voir GUIDE-ADMIN.md).');$('#loginBox').classList.add('hidden');}else{db=supabase.createClient(window.ENCRIA_SUPABASE_URL,window.ENCRIA_SUPABASE_ANON_KEY);check();}
async function check(){const {data:{user}}=await db.auth.getUser();if(!user){$('#dashboard').classList.add('hidden');$('#loginBox').classList.remove('hidden');status('Connecte-toi.');return;}const {data,error}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(error||!data){await db.auth.signOut();status('Ce compte n’a pas les droits administrateur.');return;}$('#loginBox').classList.add('hidden');$('#dashboard').classList.remove('hidden');status('Connecté en tant qu’administrateur.');await refresh();await refreshModeration();await refreshQueue();const edit=new URLSearchParams(location.search).get('edit');if(edit){const b=document.querySelector(`[data-story-edit="${CSS.escape(edit)}"]`);if(b)b.click();}}
$('#loginForm').onsubmit=async e=>{e.preventDefault();const f=e.target;const {error}=await db.auth.signInWithPassword({email:f.email.value,password:f.password.value});if(error){status(error.message);return;}await check();};
$('#logout').onclick=async()=>{await db.auth.signOut();await check();};
async function refresh(){const [a,b]=await Promise.all([db.from('stories').select('*').order('created_at'),db.from('chapters').select('*').order('created_at')]);if(a.error||b.error){status((a.error||b.error).message);return;}stories=a.data;chapters=b.data;const current=$('#storySelect').value;$('#storyList').innerHTML=stories.map(s=>`<div class="row"><b>${esc(s.title)}</b> · ${esc(s.genre)} <button data-story-edit="${s.id}">Modifier</button><button data-story-del="${s.id}">Supprimer</button></div>`).join('');$('#storySelect').innerHTML=stories.map(s=>`<option value="${s.id}">${esc(s.title)}</option>`).join('');if(stories.some(s=>s.id===current))$('#storySelect').value=current;renderChapters();}
function renderChapters(){const list=chapters.filter(c=>c.story_id===$('#storySelect').value);$('#chapterList').innerHTML=list.map(c=>`<div class="row"><b>${esc(c.title)}</b> — ${new Date(c.publish_at).toLocaleString('fr-FR')} ${new Date(c.publish_at)>new Date()?'(programmé)':'(publié)'}<br><button data-ch-edit="${c.id}">Modifier</button><button data-ch-del="${c.id}">Supprimer</button></div>`).join('');}
$('#storySelect').onchange=renderChapters;
$('#newStory').onclick=()=>{const f=$('#storyForm');f.reset();f.elements.id.value='';removeExistingCover=false;coverFile.value='';showCover(null);$('#coverHelp').textContent='Facultatif : si aucune image n’est ajoutée, la couleur sera utilisée.';f.elements.visibility.value='draft';toggleRelease();f.classList.remove('hidden');};
function toggleRelease(){const scheduled=$('#storyForm').elements.visibility.value==='scheduled';$('#releaseLabel').classList.toggle('hidden',!scheduled);$('#storyForm').elements.release_at.required=scheduled;}
$('#visibility').onchange=toggleRelease;
$('#cancelStory').onclick=()=>$('#storyForm').classList.add('hidden');
$('#newChapter').onclick=()=>{if(!$('#storySelect').value){status('Crée d’abord une histoire.');return;}const f=$('#chapterForm');f.reset();removeChapterBg=false;$('#chapterBackgroundInfo').textContent='La couverture sera utilisée par défaut.';f.elements.id.value='';const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());f.elements.publish_at.value=d.toISOString().slice(0,16);f.classList.remove('hidden');};
$('#cancelChapter').onclick=()=>$('#chapterForm').classList.add('hidden');$('#removeChapterBackground').onclick=()=>{removeChapterBg=true;$('#chapterBackgroundFile').value='';$('#chapterBackgroundInfo').textContent='Fond personnalisé supprimé lors de l’enregistrement.';};
$('#storyForm').onsubmit=async e=>{e.preventDefault();const f=e.target;const id=f.elements.id.value;const payload={title:f.elements.title.value,author:f.elements.author.value,author_alias:f.elements.author.value,genre:f.elements.genre.value,story_format:f.elements.story_format.value,description:f.elements.description.value,color:f.elements.color.value,visibility:f.elements.visibility.value,release_at:f.elements.visibility.value==='scheduled'?new Date(f.elements.release_at.value).toISOString():null};const file=coverFile.files[0];
if(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){status('Image invalide : utilise JPG, PNG ou WebP de 5 Mo maximum.');return;}
 const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];
 const path=`${crypto.randomUUID()}.${ext}`;
 status('Envoi de la couverture en cours…');
 const {error:uploadError}=await db.storage.from('covers').upload(path,file,{contentType:file.type,upsert:false});
 if(uploadError){status('Échec de l’envoi : '+uploadError.message);return;}
 const {data:publicUrl}=db.storage.from('covers').getPublicUrl(path);
 payload.cover_url=publicUrl.publicUrl;
}else if(removeExistingCover){payload.cover_url=null;}
const {error}=id?await db.from('stories').update(payload).eq('id',id):await db.from('stories').insert(payload);if(error){status(error.message);return;}f.classList.add('hidden');await refresh();status('Histoire enregistrée.');};
$('#chapterForm').onsubmit=async e=>{e.preventDefault();const f=e.target;const id=f.elements.id.value;const payload={story_id:$('#storySelect').value,title:f.elements.title.value,body:f.elements.body.value,publish_at:new Date(f.elements.publish_at.value).toISOString()};const bgFile=$('#chapterBackgroundFile').files[0];
 if(bgFile){if(!['image/jpeg','image/png','image/webp'].includes(bgFile.type)||bgFile.size>5*1024*1024){status('Image de chapitre invalide (JPG, PNG ou WebP, max. 5 Mo).');return;}
 const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[bgFile.type];
 const path=`chapters/${crypto.randomUUID()}.${ext}`;status('Envoi du fond du chapitre…');
 const {error:uploadError}=await db.storage.from('covers').upload(path,bgFile,{contentType:bgFile.type,upsert:false});
 if(uploadError){status('Envoi impossible : '+uploadError.message);return;}
 payload.background_url=db.storage.from('covers').getPublicUrl(path).data.publicUrl;
 }else if(removeChapterBg)payload.background_url=null;
 const {error}=id?await db.from('chapters').update(payload).eq('id',id):await db.from('chapters').insert(payload);if(error){status('Impossible d’enregistrer le chapitre : '+error.message);alert('Enregistrement refusé : '+error.message);return;}f.classList.add('hidden');await refresh();status('Chapitre enregistré et programmé.');};
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;let id=b.dataset.storyEdit;if(id){const s=stories.find(x=>x.id===id),f=$('#storyForm');for(const k of ['id','title','description','color'])f.elements[k].value=s[k];f.elements.author.value=s.author_alias||s.author;f.elements.story_format.value=s.story_format||'Roman';if(![...f.elements.genre.options].some(o=>o.value===s.genre))f.elements.genre.add(new Option(s.genre,s.genre));f.elements.genre.value=s.genre;removeExistingCover=false;coverFile.value='';showCover(s.cover_url);$('#coverHelp').textContent=s.cover_url?'Couverture actuelle affichée ci-dessus.':'Aucune image de couverture.';f.elements.visibility.value=s.visibility||'published';if(s.release_at){const d=new Date(s.release_at);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());f.elements.release_at.value=d.toISOString().slice(0,16);}else f.elements.release_at.value='';toggleRelease();f.classList.remove('hidden');f.scrollIntoView();}id=b.dataset.chEdit;if(id){const c=chapters.find(x=>x.id===id),f=$('#chapterForm');$('#storySelect').value=c.story_id;renderChapters();for(const k of ['id','title','body'])f.elements[k].value=c[k];removeChapterBg=false;$('#chapterBackgroundFile').value='';$('#chapterBackgroundInfo').textContent=c.background_url?'Image personnalisée déjà enregistrée. Ajouter un fichier pour la remplacer.':'La couverture de l’histoire sera utilisée.';const d=new Date(c.publish_at);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());f.elements.publish_at.value=d.toISOString().slice(0,16);f.classList.remove('hidden');f.scrollIntoView();}id=b.dataset.storyDel;if(id&&confirm('Supprimer cette histoire ET tous ses chapitres ?')){const {error}=await db.from('stories').delete().eq('id',id);if(error)status(error.message);else await refresh();}id=b.dataset.chDel;if(id&&confirm('Supprimer ce chapitre ?')){const {error}=await db.from('chapters').delete().eq('id',id);if(error)status(error.message);else await refresh();}});
$('#scheduleAll').onclick=async()=>{const list=chapters.filter(c=>c.story_id===$('#storySelect').value);if(!list.length){status('Aucun chapitre à programmer.');return;}const day=Number($('#weekday').value),date=$('#startDate').value,time=$('#weeklyTime').value;if(!date||!time){status('Choisis une date et une heure.');return;}if(!confirm(`Reprogrammer les ${list.length} chapitres, y compris ceux déjà publiés ?`))return;const base=new Date(`${date}T${time}:00`);base.setDate(base.getDate()+(day-base.getDay()+7)%7);for(let i=0;i<list.length;i++){const d=new Date(base);d.setDate(base.getDate()+7*i);const {error}=await db.from('chapters').update({publish_at:d.toISOString()}).eq('id',list[i].id);if(error){status(error.message);return;}}await refresh();status(`${list.length} chapitres programmés, un par semaine.`);};
$('#startDate').value=new Date().toLocaleDateString('en-CA');

let roleTab='members', roleOwner=null, adminIds=new Set(), allProfiles=[];
$('#showAdmins').onclick=()=>{roleTab='admins';renderModeration();};
$('#showMembers').onclick=()=>{roleTab='members';renderModeration();};
async function refreshModeration(){
 const area=$('#moderationList');if(!area)return;
 const [p,a,o]=await Promise.all([
 db.from('profiles').select('user_id,pseudo,publish_banned,ban_reason,ban_until').order('created_at',{ascending:false}),
 db.from('admins').select('user_id'),db.rpc('get_role_owner')]);
 if(p.error){$('#moderationStatus').textContent='Impossible de charger les profils : '+p.error.message;return;}
 if(a.error){$('#moderationStatus').textContent='Exécute MIGRATION-V6-8-ROLES-MARQUEPAGES.sql : '+a.error.message;return;}
 allProfiles=p.data||[];const pres=await db.from('novelya_presence').select('user_id,last_seen');presenceMap=new Map((pres.data||[]).map(x=>[x.user_id,new Date(x.last_seen).getTime()]));adminIds=new Set((a.data||[]).map(x=>x.user_id));roleOwner=o.error?null:o.data;renderModeration();
}
function renderModeration(){
 const area=$('#moderationList');const selected=allProfiles.filter(p=>!p.publish_banned&&adminIds.has(p.user_id)===(roleTab==='admins'));
 $('#showAdmins').classList.toggle('primary',roleTab==='admins');$('#showMembers').classList.toggle('primary',roleTab==='members');
 $('#roleInfo').textContent=roleTab==='admins'?`Administrateurs (${selected.length})`:`Membres (${selected.length})`;
 area.innerHTML=selected.map(p=>{const admin=adminIds.has(p.user_id),owner=p.user_id===roleOwner;
 return `<div class="row"><b>${esc(p.pseudo)}</b> <span class="role-badge ${admin?'role-admin':'role-member'}">${owner?'👑 PROPRIÉTAIRE':admin?'🛡️ ADMIN':'👤 MEMBRE'}</span> <small>${esc(p.user_id)}</small> ${Date.now()-(presenceMap.get(p.user_id)||0)<120000?'🟢 En ligne':'⚪ Hors ligne'} ${p.ban_reason?`— ${esc(p.ban_reason)}`:''}<br><button type="button" data-manage-member="${esc(p.user_id)}">⚙️ Gérer le membre</button></div>`;
 }).join('')||'Aucun compte dans cette catégorie.';const banned=allProfiles.filter(p=>p.publish_banned);area.innerHTML+=banned.length?'<details><summary>🚫 Comptes sanctionnés ('+banned.length+')</summary>'+banned.map(p=>`<div class="row"><b>${esc(p.pseudo)}</b> — ${esc(p.ban_reason||'Sanction')} <button type="button" data-manage-member="${esc(p.user_id)}">Gérer / débannir</button></div>`).join('')+'</details>':'';
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-role-id]');if(!b)return;
 const target=b.dataset.roleId,grant=b.dataset.roleAction==='grant';
 if(!confirm(grant?'Donner les droits administrateur à ce membre ?':'Retirer les droits administrateur de ce compte ?'))return;
 b.disabled=true;
 const {error}=await db.rpc('manage_admin_role',{target,make_admin:grant});
 $('#moderationStatus').textContent=error?'Modification refusée : '+error.message:'Droits mis à jour.';
 await refreshModeration();
});
// Gestion des membres : aucune sanction déclenchée à l'ouverture.
let managedMemberId=null;
document.addEventListener('click',e=>{
 const btn=e.target.closest('[data-manage-member]');if(!btn)return;
 const p=allProfiles.find(x=>String(x.user_id)===btn.dataset.manageMember);if(!p)return;
 managedMemberId=p.user_id;
 $('#memberManageTitle').textContent='Gérer : '+p.pseudo;
 $('#memberPseudo').value=p.pseudo||'';
 $('#memberManageStatus').textContent='';
 const isOwner=p.user_id===roleOwner, admin=adminIds.has(p.user_id);
 $('#memberRoleAction').textContent=admin?'Retirer les droits administrateur':'Nommer administrateur';
 $('#memberRoleAction').disabled=!roleOwner||isOwner;
 $('#memberRoleAction').dataset.grant=String(!admin);
 $('#memberBanAction').textContent=p.publish_banned?'Lever la sanction':'Sanctionner ce membre';
 $('#memberBanReasonLabel').hidden=!!p.publish_banned;
 $('#memberBanDurationLabel').hidden=!!p.publish_banned;
 $('#memberBanReason').value='';$('#memberBanDuration').value='';
 $('#memberBanAction').dataset.unban=String(!!p.publish_banned);
 $('#memberBanAction').disabled=isOwner;
 $('#memberManageDialog').showModal();
});
$('#memberRoleAction').onclick=async()=>{
 if(!managedMemberId)return;
 const grant=$('#memberRoleAction').dataset.grant==='true';
 if(!confirm(grant?'Nommer ce membre administrateur ?':'Retirer les droits administrateur de ce compte ?'))return;
 const {error}=await db.rpc('manage_admin_role',{target:managedMemberId,make_admin:grant});
 $('#memberManageStatus').textContent=error?'Erreur : '+error.message:'Droits mis à jour.';
 if(!error){$('#memberManageDialog').close();await refreshModeration();}
};
$('#memberPseudoForm').onsubmit=async e=>{
 e.preventDefault();if(!managedMemberId)return;
 const pseudo=$('#memberPseudo').value.trim();
 if(!/^[\p{L}\p{N}_-]{3,24}$/u.test(pseudo)){$('#memberManageStatus').textContent='Pseudo invalide : 3 à 24 caractères (lettres, chiffres, - ou _).';return;}
 if(!confirm('Changer le pseudo de ce membre en « '+pseudo+' » ?'))return;
 const {error}=await db.rpc('admin_change_member_pseudo',{target:managedMemberId,new_pseudo:pseudo});
 $('#memberManageStatus').textContent=error?'Erreur : '+error.message:'Pseudonyme mis à jour.';
 if(!error){$('#memberManageDialog').close();await refreshModeration();}
};
$('#memberBanAction').onclick=async()=>{
 if(!managedMemberId)return;
 const unban=$('#memberBanAction').dataset.unban==='true';
 let reason='Sanction levée',until=null;
 if(!unban){reason=$('#memberBanReason').value.trim();if(reason.length<3){$('#memberManageStatus').textContent='Indique un motif (au moins 3 caractères).';return;}
 const duration=$('#memberBanDuration').value.trim();if(duration){const n=Number(duration);if(!Number.isFinite(n)||n<=0){$('#memberManageStatus').textContent='Durée invalide.';return;}until=new Date(Date.now()+n*86400000).toISOString();}}
 if(!confirm(unban?'Lever la sanction de ce membre ?':'Confirmer la sanction pour : '+reason+' ?'))return;
 const {error}=await db.rpc('moderate_reader',{target:managedMemberId,banned:!unban,motive:reason,expires_at:until});
 $('#memberManageStatus').textContent=error?'Erreur : '+error.message:'Sanction mise à jour.';
 if(!error){$('#memberManageDialog').close();await refreshModeration();}
};

async function refreshQueue(){const [s,c]=await Promise.all([db.from('stories').select('*').eq('visibility','pending').order('created_at',{ascending:false}),db.from('story_comments').select('*').eq('status','pending').order('created_at',{ascending:false})]);$('#pendingStories').innerHTML='<h3>Histoires à examiner</h3>'+(s.error?esc(s.error.message):(s.data||[]).map(x=>`<div class="row"><b>${esc(x.title)}</b> — ${esc(x.author)} <strong>${esc(x.moderation_flags||'Vérification humaine requise')}</strong><p>${esc(x.description)}</p><button data-queue-story="${esc(x.id)}" data-queue-action="approve">Approuver</button><button data-queue-story="${esc(x.id)}" data-queue-action="reject">Refuser</button><button data-story-edit="${esc(x.id)}">Examiner / modifier</button></div>`).join('')||'Aucune histoire en attente.');$('#pendingComments').innerHTML='<h3>Commentaires à examiner</h3>'+(c.error?esc(c.error.message):(c.data||[]).map(x=>`<div class="row"><p>${esc(x.body)}</p><button data-queue-comment="${esc(x.id)}" data-queue-action="approve">Approuver</button><button data-queue-comment="${esc(x.id)}" data-queue-action="reject">Refuser</button></div>`).join('')||'Aucun commentaire en attente.');}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-queue-action]');if(!b)return;const action=b.dataset.queueAction;if(!confirm(action==='approve'?'Confirmer la publication ?':'Confirmer le refus ?'))return;let error;if(b.dataset.queueStory){({error}=await db.rpc('review_story_submission',{target_story:b.dataset.queueStory,decision:action}));}else if(b.dataset.queueComment){({error}=await db.rpc('review_comment',{target_comment:b.dataset.queueComment,decision:action}));}$('#queueStatus').textContent=error?error.message:'Décision enregistrée.';if(!error){await refreshQueue();await refresh();}});
