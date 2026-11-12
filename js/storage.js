const DB_NAME='memory-bookshelf-private',DB_VERSION=1;
let dbPromise;
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('vault'))d.createObjectStore('vault');if(!d.objectStoreNames.contains('books'))d.createObjectStore('books')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return dbPromise}
export async function getValue(key,store='vault'){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(store);const r=t.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function setValue(key,value,store='vault'){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(store,'readwrite');t.objectStore(store).put(value,key);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error)})}
export async function deleteValue(key,store='vault'){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(store,'readwrite');t.objectStore(store).delete(key);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error)})}
export async function getBooks(){return (await getValue('collection','books'))||null}
export async function setBooks(books){await setValue('collection',books,'books')}
export async function clearLocalBooksOnce(){
 const d=await db(),resetKey='app:empty-shelf-reset-v1';
 await new Promise((resolve,reject)=>{
  const t=d.transaction(['books','vault'],'readwrite'),vault=t.objectStore('vault'),request=vault.get(resetKey);
  request.onsuccess=()=>{if(request.result)return;t.objectStore('books').clear();vault.clear();vault.put(true,resetKey)};
  request.onerror=()=>{try{t.abort()}catch{}reject(request.error)};
  t.oncomplete=resolve;
  t.onerror=()=>reject(t.error);
  t.onabort=()=>reject(t.error||new Error('Local book reset was interrupted.'));
 });
 localStorage.removeItem('memory-bookshelf-read');
}
export async function getRead(){try{return JSON.parse(localStorage.getItem('memory-bookshelf-read')||'{}')}catch{return {}}}
export async function markRead(bookId,spreadId){const value=await getRead();value[bookId]??=[];if(!value[bookId].includes(spreadId))value[bookId].push(spreadId);localStorage.setItem('memory-bookshelf-read',JSON.stringify(value))}
