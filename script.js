const paper = document.getElementById("paper");
const itemsEl = document.getElementById("items");
const historyEl = document.getElementById("history");
const editor = document.querySelector(".editor");
const saveBtn = document.getElementById("save");
const statsEl = document.getElementById("stats");

let seller = JSON.parse(localStorage.getItem("seller")) || {
  name: "Your Business Name",
  gstin: "21ABCDE1234F1Z5",
  addr: "Your address, City, State"
};
let invoices = JSON.parse(localStorage.getItem("invoices")) || [];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = n => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nextNo = () => "INV-" + String(Math.max(0, ...invoices.map(x => parseInt(x.no.replace(/\D/g, "")) || 0)) + 1).padStart(3, "0");
const clone = o => JSON.parse(JSON.stringify(o));

const blank = () => ({
  no: nextNo(),
  date: new Date().toISOString().slice(0, 10),
  seller: { ...seller },
  buyer: { name: "", addr: "" },
  igst: false,
  paid: false,
  items: [{ d: "Sample item", q: 2, r: 500, g: 18 }]
});

let inv = blank();

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const two = n => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : ""));

function words(n) {
  if (n === 0) return "Zero";
  let s = "";
  for (const [v, name] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [100, "Hundred"]]) {
    if (n >= v) {
      s += words(Math.floor(n / v)) + " " + name + " ";
      n %= v;
    }
  }
  return (s + (n > 0 ? two(n) : "")).trim();
}

function totals(i) {
  let sub = 0;
  let tax = 0;
  i.items.forEach(x => {
    const a = x.q * x.r;
    sub += a;
    tax += a * x.g / 100;
  });
  const raw = sub + tax;
  const total = Math.round(raw);
  return { sub, tax, total, round: total - raw };
}

const get = p => p.split(".").reduce((o, k) => o[k], inv);

function set(p, v) {
  const k = p.split(".");
  const last = k.pop();
  k.reduce((o, key) => o[key], inv)[last] = v;
}

function fillEditor() {
  editor.querySelectorAll("[data-p]").forEach(el => {
    const v = get(el.dataset.p);
    if (el.type === "checkbox") el.checked = v;
    else el.value = v;
  });
}

function renderItems() {
  itemsEl.innerHTML = inv.items.map((it, i) => `<div class="item">
    <input data-i="${i}" data-k="d" value="${esc(it.d)}" placeholder="Description">
    <input data-i="${i}" data-k="q" type="number" min="0" value="${it.q}" placeholder="Qty">
    <input data-i="${i}" data-k="r" type="number" min="0" value="${it.r}" placeholder="Rate">
    <select data-i="${i}" data-k="g" aria-label="GST rate">${[0, 5, 12, 18, 28].map(g => `<option value="${g}" ${g === it.g ? "selected" : ""}>${g}% GST</option>`).join("")}</select>
    <button class="ghost" data-del="${i}" aria-label="Remove item">×</button>
  </div>`).join("");
}

let shown = 0;
let raf;
let lastTotal = null;
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function countTo(to) {
  cancelAnimationFrame(raf);
  const el = document.getElementById("gv");
  if (calm) {
    shown = to;
    el.textContent = money(to);
    return;
  }
  const from = shown;
  const start = performance.now();
  const frame = now => {
    const p = Math.min(1, (now - start) / 450);
    shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
    el.textContent = money(shown);
    if (p < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}

function renderPaper() {
  const t = totals(inv);
  const rows = inv.items.map((x, n) => `<tr><td>${n + 1}</td><td>${esc(x.d)}</td><td class="r">${x.q}</td><td class="r">${money(x.r)}</td><td class="r">${x.g}%</td><td class="r">${money(x.q * x.r)}</td></tr>`).join("");
  const taxRows = inv.igst
    ? `<tr><td>IGST</td><td class="r">${money(t.tax)}</td></tr>`
    : `<tr><td>CGST</td><td class="r">${money(t.tax / 2)}</td></tr><tr><td>SGST</td><td class="r">${money(t.tax / 2)}</td></tr>`;
  paper.innerHTML = `
    <div class="top">
      <div><h1>${esc(inv.seller.name)}</h1>
        <div class="pre muted">${esc(inv.seller.addr)}</div>
        <div>GSTIN: ${esc(inv.seller.gstin)}</div></div>
      <div class="r"><h1>Tax Invoice</h1>
        <div>No: ${esc(inv.no)}</div>
        <div>Date: ${inv.date.split("-").reverse().join("-")}</div></div>
    </div>
    <div><span class="muted">Bill to</span><br><strong>${esc(inv.buyer.name) || "Customer name"}</strong>
      <div class="pre muted">${esc(inv.buyer.addr)}</div></div>
    <table>
      <tr><th>#</th><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">GST</th><th class="r">Amount</th></tr>
      ${rows}
    </table>
    <table class="tot">
      <tr><td>Subtotal</td><td class="r">${money(t.sub)}</td></tr>
      ${taxRows}
      <tr><td>Round off</td><td class="r">${money(t.round)}</td></tr>
      <tr class="grand"><td>Total</td><td class="r">₹<span id="gv">${money(t.total)}</span></td></tr>
    </table>
    <p class="words"><span class="muted">Amount in words:</span> Rupees ${words(t.total)} Only</p>
    <div class="sign">For ${esc(inv.seller.name)}<br><br>Authorised signatory</div>
    ${inv.paid ? `<div class="stamp${slam ? " slam" : ""}">PAID</div>` : ""}`;
  slam = false;
  if (t.total !== lastTotal) {
    paper.querySelector(".grand").classList.add("flash");
    lastTotal = t.total;
  }
  countTo(t.total);
}

function renderHistory() {
  const sum = f => invoices.reduce((a, x) => a + f(x), 0);
  const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");
  statsEl.innerHTML = invoices.length
    ? `<div><b>${inr(sum(x => totals(x).total))}</b><span>Billed</span></div>
       <div><b>${inr(sum(x => totals(x).tax))}</b><span>GST collected</span></div>
       <div><b>${inr(sum(x => (x.paid ? 0 : totals(x).total)))}</b><span>Unpaid</span></div>`
    : "";
  historyEl.innerHTML = invoices.length
    ? invoices.map((x, i) => `<li><div><strong>${esc(x.no)}</strong> ${esc(x.buyer.name || "No name")}<small>₹${money(totals(x).total)} - ${x.paid ? "Paid" : "Unpaid"}</small></div>
      <div><button class="ghost small" data-open="${i}">Open</button><button class="ghost small" data-rm="${i}">Delete</button></div></li>`).join("")
    : '<li class="empty">No saved invoices yet.</li>';
}

function refresh() {
  fillEditor();
  renderItems();
  renderPaper();
}

editor.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.p) {
    set(el.dataset.p, el.type === "checkbox" ? el.checked : el.value);
    if (el.dataset.p.startsWith("seller")) {
      seller = { ...inv.seller };
      localStorage.setItem("seller", JSON.stringify(seller));
    }
  } else if (el.dataset.i) {
    inv.items[el.dataset.i][el.dataset.k] = el.dataset.k === "d" ? el.value : Number(el.value);
  }
  const justPaid = el.dataset.p === "paid" && el.checked;
  if (justPaid) slam = true;
  renderPaper();
  if (justPaid) {
    setTimeout(() => {
      const r = paper.querySelector(".stamp").getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    }, 280);
  }
});

editor.addEventListener("click", e => {
  const d = e.target.dataset;
  if (d.del !== undefined && inv.items.length > 1) {
    inv.items.splice(d.del, 1);
    renderItems();
    renderPaper();
  }
  if (d.open !== undefined) {
    inv = clone(invoices[d.open]);
    refresh();
  }
  if (d.rm !== undefined) {
    invoices.splice(d.rm, 1);
    localStorage.setItem("invoices", JSON.stringify(invoices));
    renderHistory();
  }
});

document.getElementById("add").addEventListener("click", () => {
  inv.items.push({ d: "", q: 1, r: 0, g: 18 });
  renderItems();
  renderPaper();
});

saveBtn.addEventListener("click", () => {
  const k = invoices.findIndex(x => x.no === inv.no);
  if (k >= 0) invoices[k] = clone(inv);
  else invoices.push(clone(inv));
  localStorage.setItem("invoices", JSON.stringify(invoices));
  renderHistory();
  toast(`Invoice ${inv.no} saved`);
  const r = saveBtn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top);
});

document.getElementById("print").addEventListener("click", () => window.print());

document.getElementById("new").addEventListener("click", () => {
  inv = blank();
  refresh();
});

document.getElementById("csv").addEventListener("click", () => {
  const rows = [["Invoice", "Date", "Customer", "Subtotal", "Tax", "Total"]];
  invoices.forEach(x => {
    const t = totals(x);
    rows.push([x.no, x.date, `"${x.buyer.name.replace(/"/g, '""')}"`, t.sub.toFixed(2), t.tax.toFixed(2), t.total]);
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" }));
  a.download = "invoices.csv";
  a.click();
});

let slam = false;
const themes = [
  { n: "Emerald", c: ["#0b4d3b", "#0f7a5c", "#14a37f"] },
  { n: "Indigo", c: ["#1b2470", "#3446c9", "#6b7cff"] },
  { n: "Rose", c: ["#7a1237", "#c42353", "#f06a8f"] },
  { n: "Saffron", c: ["#7a3300", "#c9610a", "#f59e3b"] },
  { n: "Slate", c: ["#1c2530", "#3b4a5a", "#6f8398"] }
];
let cfg = JSON.parse(localStorage.getItem("theme")) || { i: 0, dark: false };
const swatchEl = document.getElementById("swatches");
const modeBtn = document.getElementById("mode");
const swap = fn => (document.startViewTransition ? document.startViewTransition(fn) : fn());

function applyTheme() {
  const root = document.documentElement;
  themes[cfg.i].c.forEach((v, k) => root.style.setProperty("--g" + (k + 1), v));
  root.dataset.theme = cfg.dark ? "dark" : "";
  modeBtn.textContent = cfg.dark ? "☀️" : "🌙";
  swatchEl.querySelectorAll("button").forEach((b, k) => b.classList.toggle("on", k === cfg.i));
  localStorage.setItem("theme", JSON.stringify(cfg));
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function burst(x, y) {
  if (calm) return;
  const colors = themes[cfg.i].c.concat(["#f2b640", "#ffffff"]);
  for (let n = 0; n < 36; n++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.background = colors[n % colors.length];
    document.body.appendChild(el);
    const dx = (Math.random() - 0.5) * 360;
    const dy = -80 - Math.random() * 220;
    el.animate([
      { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 720}deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx * 1.2}px,${dy + 260}px) rotate(900deg)`, opacity: 0 }
    ], { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => el.remove();
  }
}

swatchEl.innerHTML = themes.map((t, k) => `<button class="sw" data-t="${k}" title="${t.n}" aria-label="${t.n} theme" style="background:linear-gradient(135deg,${t.c[2]},${t.c[0]})"></button>`).join("");

swatchEl.addEventListener("click", e => {
  if (e.target.dataset.t) {
    cfg.i = Number(e.target.dataset.t);
    swap(applyTheme);
  }
});

modeBtn.addEventListener("click", () => {
  cfg.dark = !cfg.dark;
  swap(applyTheme);
});

if (!calm && window.matchMedia("(hover: hover)").matches) {
  paper.addEventListener("mousemove", e => {
    const r = paper.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    paper.style.transform = `perspective(1400px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-3px)`;
  });
  paper.addEventListener("mouseleave", () => (paper.style.transform = ""));
}

applyTheme();
refresh();
renderHistory();
