const selected=new Set(),rows=document.getElementById('rows'),search=document.getElementById('search'),count=document.getElementById('count'),buttonCount=document.getElementById('buttonCount'),message=document.getElementById('message');let titles=[];
function cell(tr,text){const td=document.createElement('td');td.textContent=text??'—';tr.append(td);return td}
function update(){count.textContent=`${selected.size} selected`;buttonCount.textContent=`(${selected.size})`}
function render(){const q=search.value.toLowerCase().trim();rows.replaceChildren();const filtered=titles.filter(t=>[t.artist,t.title,t.label,t.format].some(x=>x.toLowerCase().includes(q)));const fragment=document.createDocumentFragment();for(const t of filtered){const tr=document.createElement('tr'),td=document.createElement('td'),cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.has(t.upc);cb.setAttribute('aria-label',`Select ${t.artist} – ${t.title}`);cb.addEventListener('change',()=>{cb.checked?selected.add(t.upc):selected.delete(t.upc);update()});td.append(cb);tr.append(td);cell(tr,t.artist);cell(tr,t.title);cell(tr,t.label);cell(tr,t.format);cell(tr,t.available==null?'—':Number(t.available).toLocaleString());fragment.append(tr)}rows.append(fragment)}
search.addEventListener('input',render);
fetch('/api/titles').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{titles=data;render()}).catch(()=>message.textContent='Unable to load releases. Please refresh.');
document.getElementById('submit').addEventListener('click',async()=>{if(!selected.size){message.textContent='Please select at least one release.';return}const btn=document.getElementById('submit');btn.disabled=true;message.textContent='Submitting…';try{const res=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({selected:[...selected]})});const data=await res.json();if(!res.ok)throw Error(data.error||'Submission failed');selected.clear();render();update();message.textContent='Thank you! Your wishlist has been recorded.'}catch(e){message.textContent=e.message}finally{btn.disabled=false}});



/* Automatically resize Shopify iframe */
(function () {
  const parentOrigin = "https://joseyrecords.com";

  let lastHeight = 0;

  function sendHeight() {
    // Measure the actual content, not the iframe viewport.
    const elements = [
      ...document.querySelectorAll(
        "header, main, footer, .submit, .table-wrap"
      )
    ];

    let bottom = 0;

    for (const element of elements) {
      const rect = element.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        bottom = Math.max(
          bottom,
          rect.bottom + window.scrollY
        );
      }
    }

    const height = Math.ceil(bottom + 20);

    if (height < 100 || height === lastHeight) return;

    lastHeight = height;

    window.parent.postMessage(
      {
        type: "josey-rsd-resize",
        height: height
      },
      parentOrigin
    );
  }

  window.addEventListener("load", sendHeight);
  window.addEventListener("resize", sendHeight);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(sendHeight);

    document.querySelectorAll(
      "header, main, footer, .table-wrap"
    ).forEach(el => observer.observe(el));
  }

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(sendHeight);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  sendHeight();
})();
