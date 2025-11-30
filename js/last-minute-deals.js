// Last Minute Deals Page JS
(function(){
  const qs = (s, p=document) => p.querySelector(s);
  const qsa = (s, p=document) => Array.from(p.querySelectorAll(s));

  // Update date
  const dateEl = qs('#currentDate');
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Load deals from database
  let DEALS = [];
  const API_BASE = 'http://localhost:3000';

  async function loadDealsFromDB() {
    try {
      const response = await fetch(`${API_BASE}/api/deals`);
      const data = await response.json();
      
      if (data.success && data.deals && data.deals.length > 0) {
        // Transform database deals to match expected format
        // Filter out deals that are already booked (have customer_name)
        const availableDeals = data.deals.filter(deal => !deal.customer_name);
        
        DEALS = availableDeals.map(deal => ({
          deal_id: deal.deal_id,
          from: deal.origin || 'Mumbai',
          to: deal.destination || 'Goa',
          airline: deal.airline || 'IndiGo',
          flight_no: deal.flight_number || '6E212',
          duration: deal.duration || '2h',
          date: deal.travel_date || new Date().toISOString().slice(0,10),
          dep: deal.departure_time || '10:00:00',
          arr: deal.arrival_time || '12:00:00',
          badge: deal.discount_percent >= 30 ? 'Best Price' : 'Last Minute',
          price: parseFloat(deal.total_amount) || parseFloat(deal.base_price) || 0,
          depart: formatDepartureTime(deal.travel_date, deal.departure_time),
          discount_name: deal.discount_name,
          discount_percent: deal.discount_percent,
          base_price: parseFloat(deal.base_price) || 0
        }));
        
        console.log('Loaded deals:', DEALS);
        renderDeals(DEALS);
        attachDealHandlers();
      } else {
        console.log('No deals available or API error:', data);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  }

  function formatDepartureTime(date, time) {
    if (!date) return 'TBA';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dayStr = 'Today';
    if (d.toDateString() === tomorrow.toDateString()) dayStr = 'Tomorrow';
    else if (d.toDateString() !== today.toDateString()) dayStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    
    const timeStr = time ? time.slice(0,5) : '';
    return `${dayStr}${timeStr ? ', ' + timeStr : ''}`;
  }

  const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  function renderDeals(list){
    const wrap = qs('#dealsContainer');
    if (!wrap) return;
    wrap.innerHTML = '';
    list.forEach(d => {
      const div = document.createElement('div');
      div.className = 'deal-card';
      
      // Show route if origin and destination exist
      const routeDisplay = d.from && d.to ? `${d.from} → ${d.to}` : d.discount_name || 'Special Deal';
      
      div.innerHTML = `
        <div class="deal-header">
          <span class="route">${routeDisplay}</span>
          <span class="badge">${d.badge}</span>
        </div>
        <div class="meta">${d.airline} · ${d.depart}</div>
        <div class="price">${fmt.format(d.price)}</div>
        <div class="card-actions">
          <button class="card-btn">Details</button>
          <button class="card-btn primary">Book</button>
        </div>
      `;
      wrap.appendChild(div);
    });
  }

  // Load deals on page load
  loadDealsFromDB();

  // ---------- Details -> Booking -> Payment flow ----------
  const API_BASES = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const toINR = (x) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(x||0));
  const openModal = (el) => { if (el) el.style.display = 'flex'; };
  const closeModal = (el) => { if (el) el.style.display = 'none'; };

  // Modals
  const detModal = document.getElementById('dealDetailsModal');
  const detClose = document.getElementById('detClose');
  const detTitle = document.getElementById('detTitle');
  const detAirline = document.getElementById('detAirline');
  const detFlightNo = document.getElementById('detFlightNo');
  const detDate = document.getElementById('detDate');
  const detDur = document.getElementById('detDur');
  const detDep = document.getElementById('detDep');
  const detArr = document.getElementById('detArr');
  const detBase = document.getElementById('detBase');
  const detDiscount = document.getElementById('detDiscount');
  const detStatus = document.getElementById('detStatus');
  const btnProceedBook = document.getElementById('btnProceedBook');

  const bkModal = document.getElementById('dealBookModal');
  const bkClose = document.getElementById('bkClose');
  const bkName = document.getElementById('bkName');
  const bkAge = document.getElementById('bkAge');
  const bkEmail = document.getElementById('bkEmail');
  const bkPhone = document.getElementById('bkPhone');
  const bkIdType = document.getElementById('bkIdType');
  const bkIdNo = document.getElementById('bkIdNo');
  const bkDiscount = document.getElementById('bkDiscount');
  const bkTotal = document.getElementById('bkTotal');
  const bkStatus = document.getElementById('bkStatus');
  const btnConfirmPay = document.getElementById('btnConfirmPay');

  const payModal = document.getElementById('dealPayModal');
  const payCloseD = document.getElementById('payCloseD');
  const payMethod = document.getElementById('payMethod');
  const btnPayDeal = document.getElementById('btnPayDeal');
  const payStatusD = document.getElementById('payStatusD');

  let currentDeal = null;
  let chosenDiscount = { name: 'None', percent: 0 };

  function attachDealHandlers(){
    const cards = qsa('.deal-card');
    cards.forEach((card, idx) => {
      const buttons = qsa('.card-btn', card);
      const d = DEALS[idx];
      if (!d) return;
      // Details
      if (buttons[0]) {
        buttons[0].addEventListener('click', () => {
          currentDeal = d;
          chosenDiscount = { name: 'None', percent: 0 };
          if (detTitle) detTitle.textContent = `${d.from} → ${d.to}`;
          if (detAirline) detAirline.textContent = d.airline;
          if (detFlightNo) detFlightNo.textContent = d.flight_no || '—';
          if (detDate) detDate.textContent = d.date || new Date().toISOString().slice(0,10);
          if (detDur) detDur.textContent = d.duration || '—';
          if (detDep) detDep.textContent = (d.dep||'').slice(0,5);
          if (detArr) detArr.textContent = (d.arr||'').slice(0,5);
          if (detBase) detBase.textContent = toINR(d.price);
          if (detDiscount) detDiscount.value = 'None|0';
          if (detStatus) detStatus.textContent = 'Select a discount if eligible.';
          openModal(detModal);
        });
      }
      // Book (skip details)
      if (buttons[1]) {
        buttons[1].addEventListener('click', () => {
          currentDeal = d;
          chosenDiscount = { name: 'None', percent: 0 };
          populateBookingDiscount('None|0');
          updateBookingTotal();
          if (bkStatus) bkStatus.textContent = 'Verify details before payment.';
          openModal(bkModal);
        });
      }
    });
  }

  function populateBookingDiscount(sel){
    if (!bkDiscount || !detDiscount) return;
    // Mirror options from details dropdown
    bkDiscount.innerHTML = '';
    Array.from(detDiscount.options).forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.value; o.textContent = opt.textContent;
      bkDiscount.appendChild(o);
    });
    if (sel) bkDiscount.value = sel;
  }

  function parseDiscount(val){
    const [name, pct] = (val || 'None|0').split('|');
    return { name, percent: Number(pct)||0 };
  }

  function calcTotal(base, percent){
    const b = Number(base)||0; const p = Number(percent)||0;
    return Math.max(0, Math.round(b * (100 - p) / 100));
  }

  function updateBookingTotal(){
    const total = calcTotal(currentDeal?.price||0, chosenDiscount.percent);
    if (bkTotal) bkTotal.textContent = toINR(total);
  }

  if (detDiscount){
    detDiscount.addEventListener('change', () => {
      chosenDiscount = parseDiscount(detDiscount.value);
      if (detStatus) detStatus.textContent = `${chosenDiscount.name}: ${chosenDiscount.percent}% applied`;
    });
  }

  if (btnProceedBook){
    btnProceedBook.addEventListener('click', () => {
      populateBookingDiscount(detDiscount?.value || 'None|0');
      chosenDiscount = parseDiscount(detDiscount?.value || 'None|0');
      updateBookingTotal();
      closeModal(detModal);
      openModal(bkModal);
    });
  }

  if (bkDiscount){
    bkDiscount.addEventListener('change', () => {
      chosenDiscount = parseDiscount(bkDiscount.value);
      updateBookingTotal();
    });
  }

  if (bkClose) bkClose.addEventListener('click', () => closeModal(bkModal));
  if (detClose) detClose.addEventListener('click', () => closeModal(detModal));
  if (payCloseD) payCloseD.addEventListener('click', () => closeModal(payModal));

  if (btnConfirmPay){
    btnConfirmPay.addEventListener('click', () => {
      if (!bkName?.value?.trim() || !bkEmail?.value?.trim() || !bkPhone?.value?.trim() || !bkIdNo?.value?.trim()){
        alert('Please fill Name, Email, Phone and Government ID');
        return;
      }
      closeModal(bkModal);
      payStatusD && (payStatusD.textContent = 'Awaiting payment…');
      openModal(payModal);
    });
  }

  function safeOpenPdf(url){
    let win = null; try { win = window.open(url, '_blank'); } catch(e) {}
    if (!win){
      const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel='noopener';
      document.body.appendChild(a); a.click(); a.remove();
    }
  }

  async function bookDeal(){
    const base = Number(currentDeal?.price||0);
    const total = calcTotal(base, chosenDiscount.percent);
    const payload = {
      customer_name: bkName?.value?.trim(),
      age: Number(bkAge?.value || 0) || null,
      email: bkEmail?.value?.trim(),
      phone: bkPhone?.value?.trim(),
      id_type: bkIdType?.value || 'Aadhaar',
      government_id: bkIdNo?.value?.trim(),
      airline: currentDeal?.airline,
      flight_number: currentDeal?.flight_no || null,
      origin: currentDeal?.from,
      destination: currentDeal?.to,
      flight_date: currentDeal?.date || new Date().toISOString().slice(0,10),
      departure_time: currentDeal?.dep || null,
      arrival_time: currentDeal?.arr || null,
      duration: currentDeal?.duration || null,
      base_price: base,
      discount_name: chosenDiscount.name,
      discount_percent: chosenDiscount.percent,
      travel_date: currentDeal?.date || new Date().toISOString().slice(0,10),
      total_amount: total,
      payment_method: payMethod?.value || 'UPI'
    };

    let lastErr = null;
    for (const baseUrl of API_BASES){
      try {
        console.log('[Deals] Trying base:', baseUrl);
        const res = await fetch(`${baseUrl}/api/deals/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `Request failed (${res.status})`);
        const id = data.deal_id;
        payStatusD && (payStatusD.textContent = 'Paid successfully! Generating ticket…');
        const pdfUrl = `${baseUrl}/api/deals/bookings/${id}/pdf`;
        safeOpenPdf(pdfUrl);
        setTimeout(() => closeModal(payModal), 1200);
        return;
      } catch(e){
        console.error('[Deals] Book error for', baseUrl, e);
        lastErr = e;
      }
    }
    // Show the actual error message if available
    if (lastErr && lastErr.message && !lastErr.message.includes('fetch')) {
      throw lastErr;
    }
    throw new Error('Could not reach the server. Please ensure http://localhost:3000 is running.');
  }

  if (btnPayDeal){
    btnPayDeal.addEventListener('click', async () => {
      btnPayDeal.disabled = true;
      payStatusD && (payStatusD.textContent = 'Processing payment…');
      try { await bookDeal(); }
      catch(err){ payStatusD && (payStatusD.textContent = err.message || 'Payment failed'); }
      finally { btnPayDeal.disabled = false; }
    });
  }

  attachDealHandlers();

  // Prevent Enter from causing native validation or background form submit
  if (detModal){
    detModal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (btnProceedBook) btnProceedBook.click(); }
    }, true);
  }
  if (bkModal){
    bkModal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (btnConfirmPay) btnConfirmPay.click(); }
    }, true);
  }
  if (payModal){
    payModal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (btnPayDeal) btnPayDeal.click(); }
    }, true);
  }

  // Tabs (visual only)
  const tabs = qsa('.tab-btn');
  tabs.forEach((b, i) => b.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    b.classList.add('active');
  }));

  // Swap button
  const swap = qs('.swap-btn');
  if (swap){
    swap.addEventListener('click', () => {
      const inputs = qsa('.search-input');
      if (inputs.length >= 2){
        const tmp = inputs[0].value;
        inputs[0].value = inputs[1].value;
        inputs[1].value = tmp;
      }
    });
  }

  // Fake submit
  const form = qs('.search-form');
  if (form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const valFrom = qs('.search-input', form)?.value || 'Your city';
      const valTo = qsa('.search-input', form)[1]?.value || 'Destination';
      alert(`Searching last-minute deals from ${valFrom} to ${valTo}...`);
    });
  }
})();
