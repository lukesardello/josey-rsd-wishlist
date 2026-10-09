const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const titles=require('./titles.json'), ids=new Set(titles.map(x=>x.upc));
const dbFile=process.env.DATA_FILE||path.join(__dirname,'submissions.json');
const port=Number(process.env.PORT||3000), password=process.env.ADMIN_PASSWORD;
let submissions=[];try{submissions=JSON.parse(fs.readFileSync(dbFile,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
const limits=new Map();
function send(res,status,obj,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(obj))}
function read(req){return new Promise((resolve,reject)=>{let data='',size=0;req.on('data',c=>{size+=c.length;if(size>100000){reject(new Error('Request too large'));req.destroy()}else data+=c});req.on('end',()=>{try{resolve(JSON.parse(data))}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject)})}
function authorized(req){if(!password)return false;const a=req.headers.authorization||'';if(!a.startsWith('Basic '))return false;let decoded='';try{decoded=Buffer.from(a.slice(6),'base64').toString()}catch{}const given=decoded.slice(decoded.indexOf(':')+1),x=Buffer.from(given),y=Buffer.from(password);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function tally(){const counts=new Map(titles.map(t=>[t.upc,0]));for(const s of submissions)for(const id of s.selected)counts.set(id,(counts.get(id)||0)+1);return {submissions:submissions.length,titles:titles.map(t=>({...t,requests:counts.get(t.upc)||0}))}}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');

 res.setHeader('X-Content-Type-Options','nosniff');

 // Allow the customer wishlist to be embedded on Josey Records.
 // Keep the admin dashboard protected from iframe embedding.
 if(url.pathname==='/' || url.pathname==='/index.html'){
  res.setHeader(
   'Content-Security-Policy',
   "frame-ancestors 'self' https://joseyrecords.com https://www.joseyrecords.com"
  );
 }else{
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"frame-ancestors 'none'");
 }
 if(req.method==='GET'&&url.pathname==='/api/titles')return send(res,200,titles);
 if(req.method==='POST'&&url.pathname==='/api/submit'){
  const ip=req.socket.remoteAddress||'unknown',now=Date.now();if(now-(limits.get(ip)||0)<10000)return send(res,429,{error:'Please wait before submitting again.'});
  try{const b=await read(req);if(!Array.isArray(b.selected)||!b.selected.length||b.selected.length>titles.length||b.selected.some(id=>typeof id!=='string'||!ids.has(id))||new Set(b.selected).size!==b.selected.length)return send(res,400,{error:'Select at least one valid release.'});
   submissions.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),selected:b.selected});
   try{const temp=dbFile+'.tmp';fs.writeFileSync(temp,JSON.stringify(submissions));fs.renameSync(temp,dbFile)}catch(e){submissions.pop();throw e}
   limits.set(ip,now);return send(res,201,{ok:true});
  }catch(e){return send(res,500,{error:'Unable to save submission. Please try again.'})}
 }
 if(url.pathname.startsWith('/api/admin/')){
  if(!authorized(req))return send(res,401,{error:'Admin login required'},{'WWW-Authenticate':'Basic realm="Josey RSD Admin"'});
  if(req.method==='GET'&&url.pathname==='/api/admin/tally')return send(res,200,tally());
  if(req.method==='GET'&&url.pathname==='/api/admin/export'){
   const csv=[['UPC','Artist','Title','Label','Format','Total Qty Available','Wishlist Requests'],...tally().titles.map(t=>[t.upc,t.artist,t.title,t.label,t.format,t.available??'',t.requests])].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="rsd-black-friday-2026-tally.csv"'});return res.end('\ufeff'+csv)
  }
  return send(res,404,{error:'Not found'});
 }
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const route=url.pathname==='/'?'/index.html':url.pathname;const allowed=new Set(['/index.html','/admin.html','/style.css','/app.js','/admin.js']);if(!allowed.has(route))return send(res,404,{error:'Not found'});
 const f=path.join(__dirname,'public',route);res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'text/plain','Cache-Control':'no-store'});fs.createReadStream(f).pipe(res);
});server.listen(port,()=>console.log('RSD wishlist running on port '+port));
