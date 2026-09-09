(() => {
const CFG = window.HADI_CONFIG;
const configured = CFG.SUPABASE_URL && !CFG.SUPABASE_URL.startsWith("YOUR_");
const sb = configured ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;

const DEMO_CATEGORIES = [
 {id:"c1",name:"Phones",slug:"phones",parent_id:null,sort_order:1},
 {id:"c2",name:"Cases",slug:"cases",parent_id:null,sort_order:2},
 {id:"c3",name:"Charging",slug:"charging",parent_id:null,sort_order:3},
 {id:"c4",name:"Audio",slug:"audio",parent_id:null,sort_order:4},
 {id:"c5",name:"Power Banks",slug:"power-banks",parent_id:null,sort_order:5},
 {id:"c6",name:"Smartwatches",slug:"smartwatches",parent_id:null,sort_order:6},
 {id:"s1",name:"iPhone",slug:"iphone",parent_id:"c1",sort_order:1},
 {id:"s2",name:"Samsung",slug:"samsung",parent_id:"c1",sort_order:2},
 {id:"s3",name:"USB-C",slug:"usb-c",parent_id:"c3",sort_order:1}
];
const placeholder = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#F8FBFF"/><stop offset=".55" stop-color="#EEF6FF"/><stop offset="1" stop-color="#F4EEFF"/></linearGradient><linearGradient id="g" x1="0" x2="1"><stop stop-color="#00C2FF"/><stop offset=".5" stop-color="#1677FF"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><text x="50%" y="48%" text-anchor="middle" fill="#0A1F44" font-family="Arial" font-weight="800" font-size="64">HADI</text><text x="50%" y="57%" text-anchor="middle" fill="url(#g)" font-family="Arial" font-weight="700" font-size="27" letter-spacing="8">MOBILE</text></svg>`);
const DEMO_PRODUCTS = [
 {id:"p1",name:"iPhone 17 Pro",price:1199,description:"Premium smartphone with pro camera system and high-performance display.",image_url:placeholder,category_id:"s1",featured:true,in_stock:true,created_at:"2026-09-09"},
 {id:"p2",name:"MagSafe Clear Case",price:24,description:"Protective clear case with magnetic charging compatibility.",image_url:placeholder,category_id:"c2",featured:true,in_stock:true,created_at:"2026-09-08"},
 {id:"p3",name:"USB-C Fast Charger 30W",price:29,description:"Compact fast charger for compatible phones and accessories.",image_url:placeholder,category_id:"s3",featured:true,in_stock:true,created_at:"2026-09-07"},
 {id:"p4",name:"Wireless Earbuds",price:59,description:"Compact everyday earbuds with charging case.",image_url:placeholder,category_id:"c4",featured:false,in_stock:true,created_at:"2026-09-06"},
 {id:"p5",name:"10,000mAh Power Bank",price:39,description:"Portable power bank for everyday charging on the move.",image_url:placeholder,category_id:"c5",featured:false,in_stock:true,created_at:"2026-09-05"},
 {id:"p6",name:"Smart Watch",price:89,description:"Everyday smart watch with fitness and notification features.",image_url:placeholder,category_id:"c6",featured:false,in_stock:true,created_at:"2026-09-04"}
];

let categories=[], products=[], activeCategory="all", search="", sort="newest";
let cart = JSON.parse(localStorage.getItem("hadi_cart") || "[]");

const $ = s => document.querySelector(s);
const money = n => `$${Number(n).toFixed(2)}`;
const catName = id => categories.find(c=>c.id===id)?.name || "Tech";

async function load(){
  if(sb){
    const [{data:cats,error:ce},{data:prods,error:pe}] = await Promise.all([
      sb.from("categories").select("*").order("sort_order"),
      sb.from("products").select("*").eq("is_active",true).order("created_at",{ascending:false})
    ]);
    if(!ce && !pe){ categories=cats||[]; products=prods||[]; }
    else { categories=DEMO_CATEGORIES; products=DEMO_PRODUCTS; }
  } else {
    categories=DEMO_CATEGORIES; products=DEMO_PRODUCTS;
  }
  renderCategories(); renderProducts(); renderFeatured(); renderCart();
}

function rootCategories(){ return categories.filter(c=>!c.parent_id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); }
function childrenOf(id){ return categories.filter(c=>c.parent_id===id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); }
function descendantIds(id){
  const ids=[id]; childrenOf(id).forEach(ch=>ids.push(...descendantIds(ch.id))); return ids;
}
function renderCategories(){
  const el=$("#categoryList");
  el.innerHTML = `<button class="category-chip ${activeCategory==="all"?"active":""}" data-cat="all">All</button>` +
    rootCategories().map(c=>`<button class="category-chip ${activeCategory===c.id?"active":""}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`).join("");
  el.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat; renderCategories(); renderProducts();});
  const sub=$("#subcategoryList");
  const root = categories.find(c=>c.id===activeCategory);
  const kids = root ? childrenOf(root.id) : [];
  sub.innerHTML = kids.map(c=>`<button class="subcategory-chip" data-sub="${c.id}">${escapeHtml(c.name)}</button>`).join("");
  sub.querySelectorAll("[data-sub]").forEach(b=>b.onclick=()=>{activeCategory=b.dataset.sub; renderCategories(); renderProducts();});
}
function filtered(){
  let list=[...products];
  if(activeCategory!=="all"){ const ids=descendantIds(activeCategory); list=list.filter(p=>ids.includes(p.category_id)); }
  if(search){ const q=search.toLowerCase(); list=list.filter(p=>`${p.name} ${p.description||""} ${catName(p.category_id)}`.toLowerCase().includes(q)); }
  if(sort==="price-low") list.sort((a,b)=>Number(a.price)-Number(b.price));
  else if(sort==="price-high") list.sort((a,b)=>Number(b.price)-Number(a.price));
  else if(sort==="name") list.sort((a,b)=>a.name.localeCompare(b.name));
  else list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  return list;
}
function card(p){
  return `<article class="product-card">
    <div class="product-image-wrap" data-view="${p.id}">
      <img src="${p.image_url||placeholder}" alt="${escapeAttr(p.name)}" loading="lazy">
      ${p.featured?'<span class="product-badge">FEATURED</span>':""}
    </div>
    <div class="product-body">
      <div class="product-category">${escapeHtml(catName(p.category_id))}</div>
      <h3>${escapeHtml(p.name)}</h3>
      <div class="product-price">${money(p.price)}</div>
      <div class="product-actions">
        <button class="add-btn" data-add="${p.id}" ${p.in_stock===false?"disabled":""}>${p.in_stock===false?"Out of stock":"Add to cart"}</button>
        <button class="view-btn" data-view="${p.id}" aria-label="View ${escapeAttr(p.name)}">+</button>
      </div>
    </div>
  </article>`;
}
function bindCards(scope=document){
  scope.querySelectorAll("[data-add]").forEach(b=>b.onclick=e=>{e.stopPropagation(); addToCart(b.dataset.add);});
  scope.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>openProduct(b.dataset.view));
}
function renderProducts(){
  const list=filtered(), grid=$("#productGrid");
  grid.innerHTML=list.map(card).join(""); bindCards(grid);
  $("#emptyState").classList.toggle("hidden",list.length>0);
  const c=categories.find(x=>x.id===activeCategory);
  $("#productsTitle").textContent=search?`Search results`:c?c.name:"All products";
}
function renderFeatured(){
  const list=products.filter(p=>p.featured).slice(0,6);
  $("#featuredSection").classList.toggle("hidden",!list.length);
  $("#featuredGrid").innerHTML=list.map(card).join(""); bindCards($("#featuredGrid"));
}
function openProduct(id){
  const p=products.find(x=>String(x.id)===String(id)); if(!p)return;
  $("#productModalContent").innerHTML=`<div class="modal-product">
    <img src="${p.image_url||placeholder}" alt="${escapeAttr(p.name)}">
    <div class="modal-copy">
      <span class="eyebrow">${escapeHtml(catName(p.category_id))}</span>
      <h2>${escapeHtml(p.name)}</h2>
      <div class="modal-price">${money(p.price)}</div>
      <p class="desc">${escapeHtml(p.description||"")}</p>
      <div class="stock-note">${p.in_stock===false?"Currently out of stock":"In stock"}</div>
      <button class="primary-btn" style="margin-top:16px" data-add="${p.id}" ${p.in_stock===false?"disabled":""}>${p.in_stock===false?"Out of stock":"Add to cart"}</button>
    </div>
  </div>`;
  bindCards($("#productModalContent"));
  $("#productModal").classList.add("open"); $("#productModal").setAttribute("aria-hidden","false");
}
function addToCart(id){
  const p=products.find(x=>String(x.id)===String(id)); if(!p||p.in_stock===false)return;
  const ex=cart.find(x=>String(x.id)===String(id)); if(ex) ex.qty++; else cart.push({id:p.id,name:p.name,price:Number(p.price),image_url:p.image_url||placeholder,qty:1});
  saveCart(); openCart();
}
function saveCart(){ localStorage.setItem("hadi_cart",JSON.stringify(cart)); renderCart(); }
function renderCart(){
  const count=cart.reduce((s,i)=>s+i.qty,0), total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  $("#cartCount").textContent=count; $("#bottomCartCount").textContent=count; $("#cartTotal").textContent=money(total);
  $("#cartEmpty").classList.toggle("hidden",cart.length>0); $("#cartItems").classList.toggle("hidden",cart.length===0);
  $("#cartItems").innerHTML=cart.map(i=>`<div class="cart-row">
    <img src="${i.image_url||placeholder}" alt="">
    <div><h4>${escapeHtml(i.name)}</h4><small>${money(i.price)}</small>
      <div class="qty"><button data-dec="${i.id}">−</button><span>${i.qty}</span><button data-inc="${i.id}">+</button></div>
    </div>
    <button class="remove" data-remove="${i.id}">Remove</button>
  </div>`).join("");
  $("#cartItems").querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>changeQty(b.dataset.inc,1));
  $("#cartItems").querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>changeQty(b.dataset.dec,-1));
  $("#cartItems").querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart=cart.filter(i=>String(i.id)!==b.dataset.remove);saveCart();});
}
function changeQty(id,n){const i=cart.find(x=>String(x.id)===String(id)); if(!i)return;i.qty+=n;if(i.qty<=0)cart=cart.filter(x=>String(x.id)!==String(id));saveCart();}
function openCart(){ $("#cartSheet").classList.add("open");$("#sheetBackdrop").classList.add("open");$("#cartSheet").setAttribute("aria-hidden","false");}
function closeCart(){ $("#cartSheet").classList.remove("open");$("#sheetBackdrop").classList.remove("open");$("#cartSheet").setAttribute("aria-hidden","true");}
function checkout(){
  if(!cart.length) return;
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const lines=cart.map((i,n)=>`${n+1}. ${i.name} × ${i.qty} — ${money(i.price*i.qty)}`).join("\n");
  const msg=`Hello HADI MOBILE 👋\n\nI'd like to place this order:\n\n${lines}\n\nTotal: ${money(total)}\n\nPlease confirm availability and continue the order with me here.`;
  window.open(`https://wa.me/${CFG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank");
}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function escapeAttr(s=""){return escapeHtml(s);}

$("#searchInput").addEventListener("input",e=>{search=e.target.value.trim();renderProducts();});
$("#sortSelect").addEventListener("change",e=>{sort=e.target.value;renderProducts();});
$("#cartButton").onclick=openCart; $("#bottomCart").onclick=openCart; $("#closeCart").onclick=closeCart; $("#sheetBackdrop").onclick=closeCart;
$("#whatsappCheckout").onclick=checkout;
$("#closeProduct").onclick=()=>$("#productModal").classList.remove("open");
$("#productModal").onclick=e=>{if(e.target===$("#productModal"))$("#productModal").classList.remove("open");};
document.querySelectorAll("[data-scroll]").forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}));
load();
})();
