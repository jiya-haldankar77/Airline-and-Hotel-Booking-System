// holiday.js - Interactions for Holiday Packages (India Only) page
(function(){
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));

  const API_BASE = 'http://localhost:3000';

  // Load packages from database
  async function loadPackagesFromDB() {
    try {
      const response = await fetch(`${API_BASE}/api/packages`);
      const data = await response.json();
      
      if (data.success && data.packages && data.packages.length > 0) {
        const pkgGrid = $('#pkgGrid');
        if (!pkgGrid) return;
        
        // Clear existing packages
        pkgGrid.innerHTML = '';
        
        // Render packages from database
        data.packages.forEach(pkg => {
          const category = getCategoryForDestination(pkg.destination);
          const card = document.createElement('article');
          card.className = 'card fade';
          card.setAttribute('data-cat', category);
          
          // Store package data in card for later use
          card.setAttribute('data-pkg-id', pkg.package_id);
          card.setAttribute('data-origin', pkg.origin || '');
          card.setAttribute('data-destination', pkg.destination || '');
          card.setAttribute('data-airline', pkg.airline || '');
          card.setAttribute('data-flight-no', pkg.flight_number || '');
          card.setAttribute('data-departure', pkg.departure_time || '');
          card.setAttribute('data-arrival', pkg.arrival_time || '');
          card.setAttribute('data-duration', pkg.duration || '');
          
          // Build route display
          const routeDisplay = pkg.origin && pkg.destination 
            ? `<div style="font-size:13px;color:#2563eb;font-weight:600;margin-bottom:6px;">
                 <i class="fa-solid fa-route"></i> ${pkg.origin} → ${pkg.destination}
               </div>`
            : '';
          
          card.innerHTML = `
            <img alt="${pkg.destination}" src="${pkg.image_url || 'https://via.placeholder.com/400x300'}" />
            <div class="card-body">
              <h3 class="card-title">${pkg.package_name}</h3>
              ${routeDisplay}
              <p class="card-desc">${pkg.description || 'Explore this amazing destination'}</p>
              <div class="price">₹${Number(pkg.price).toLocaleString('en-IN')}</div>
              <div class="card-actions">
                <a class="btn btn-primary" href="/modern-flight-booking.html">Book Now</a>
              </div>
            </div>
          `;
          
          pkgGrid.appendChild(card);
        });
        
        // Reattach handlers after loading
        attachPackageHandlers();
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  }

  // Helper function to determine category based on destination
  function getCategoryForDestination(destination) {
    const dest = (destination || '').toLowerCase();
    if (dest.includes('goa') || dest.includes('kerala') || dest.includes('andaman')) return 'beaches,relaxation';
    if (dest.includes('manali') || dest.includes('darjeeling') || dest.includes('shimla') || dest.includes('ladakh')) return 'mountains,adventure,relaxation';
    if (dest.includes('jaipur') || dest.includes('agra') || dest.includes('delhi')) return 'heritage,relaxation';
    return 'relaxation';
  }

  // Load packages on page load
  loadPackagesFromDB();

  // Smooth scroll for Explore Packages
  const exploreBtn = $('#exploreBtn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', (e) => {
      const href = exploreBtn.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const tgt = $(href);
        if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Filters
  const filterBtns = $$('.filter-btn');
  const cards = $$('#pkgGrid .card');
  function applyFilter(cat){
    cards.forEach(card => {
      const cats = (card.getAttribute('data-cat') || '').split(',').map(s => s.trim());
      const show = (cat === 'all') || cats.includes(cat);
      if (show) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter') || 'all';
      applyFilter(cat);
    });
  });

  // Initial filter (all)
  applyFilter('all');

  // Testimonials carousel
  const slidesWrap = $('#slides');
  const dotsWrap = $('#dots');
  const slides = $$('.slide', slidesWrap);
  const dots = $$('.dot', dotsWrap);
  let idx = 0;
  function go(i){
    if (!slidesWrap || slides.length === 0) return;
    idx = (i + slides.length) % slides.length;
    slidesWrap.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle('active', di === idx));
  }
  dots.forEach((d, di) => d.addEventListener('click', () => go(di)));
  let timer = setInterval(() => go(idx + 1), 4000);
  // Pause on hover
  if (slidesWrap) {
    slidesWrap.addEventListener('mouseenter', () => clearInterval(timer));
    slidesWrap.addEventListener('mouseleave', () => { timer = setInterval(() => go(idx + 1), 4000); });
  }

  // Newsletter
  const form = $('#newsForm');
  const email = $('#newsEmail');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (email?.value || '').trim();
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        alert('Please enter a valid email');
        return;
      }
      alert('Subscribed! We\'ll send you the best domestic deals.');
      if (email) email.value = '';
    });
  }

  // Chat toggle
  const chatToggle = $('#chatToggle');
  const chatBox = $('#chatBox');
  if (chatToggle && chatBox) {
    chatToggle.addEventListener('click', () => {
      const open = chatBox.style.display === 'flex';
      if (open) {
        chatBox.style.display = 'none';
        chatBox.setAttribute('aria-hidden', 'true');
      } else {
        chatBox.style.display = 'flex';
        chatBox.setAttribute('aria-hidden', 'false');
      }
    });
  }

  const pkgModal = document.getElementById('pkgModal');
  const pkgClose = document.getElementById('pkgClose');
  const btnConfirmPkg = document.getElementById('btnConfirmPkg');
  const inpName = document.getElementById('inpName');
  const inpEmail = document.getElementById('inpEmail');
  const inpPhone = document.getElementById('inpPhone');
  const inpDate = document.getElementById('inpDate');
  const pkgImg = document.getElementById('pkgImg');
  const pkgName = document.getElementById('pkgName');
  const pkgSubtitle = document.getElementById('pkgSubtitle');
  const pkgRoute = document.getElementById('pkgRoute');
  const pkgAirline = document.getElementById('pkgAirline');
  const pkgFlightNo = document.getElementById('pkgFlightNo');
  const pkgDate = document.getElementById('pkgDate');
  const pkgDep = document.getElementById('pkgDep');
  const pkgArr = document.getElementById('pkgArr');
  const pkgDur = document.getElementById('pkgDur');
  const pkgTotal = document.getElementById('pkgTotal');

  const payModal = document.getElementById('payModal');
  const payClose = document.getElementById('payClose');
  const btnPayNow = document.getElementById('btnPayNow');
  const payMode = document.getElementById('payMode');
  const payStatus = document.getElementById('payStatus');
  const API_BASES = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  // Review elements
  const reviewModal = document.getElementById('reviewModal');
  const reviewClose = document.getElementById('reviewClose');
  const btnSubmitReview = document.getElementById('btnSubmitReview');
  const openReviewBtn = document.getElementById('openReviewBtn');
  const revPackage = document.getElementById('revPackage');
  const revName = document.getElementById('revName');
  const revEmail = document.getElementById('revEmail');
  const revPhone = document.getElementById('revPhone');
  const revRating = document.getElementById('revRating');
  const revText = document.getElementById('revText');
  const revStatus = document.getElementById('revStatus');
  let allPkgs = [];

  function openModal(el){ if (el) { el.style.display = 'flex'; } }
  function closeModal(el){ if (el) { el.style.display = 'none'; } }

  let currentPkg = null;

  function toINR(x){
    const n = Number(String(x).replace(/[^\d.]/g, '')) || 0;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  function nextDate(days){
    const d = new Date();
    d.setDate(d.getDate() + (days || 7));
    return d.toISOString().slice(0,10);
  }

  function mapPackage(name){
    const n = (name || '').toLowerCase();
    if (n.includes('manali')) return { from:'Delhi', to:'Manali', airline:'SpiceJet', flight_no:'SG494', dep:'10:15:00', arr:'12:30:00', dur:'2h 15m' };
    if (n.includes('goa')) return { from:'Mumbai', to:'Goa', airline:'IndiGo', flight_no:'6E404', dep:'09:30:00', arr:'11:45:00', dur:'2h 15m' };
    if (n.includes('jaipur')) return { from:'Delhi', to:'Jaipur', airline:'Air India', flight_no:'AI111', dep:'08:00:00', arr:'09:10:00', dur:'1h 10m' };
    if (n.includes('kerala')) return { from:'Delhi', to:'Kochi', airline:'Air India', flight_no:'AI707', dep:'07:10:00', arr:'10:05:00', dur:'2h 55m' };
    if (n.includes('andaman')) return { from:'Chennai', to:'Port Blair', airline:'SpiceJet', flight_no:'SG010', dep:'06:30:00', arr:'08:45:00', dur:'2h 15m' };
    return { from:'Delhi', to:'Mumbai', airline:'IndiGo', flight_no:'6E212', dep:'10:15:00', arr:'12:45:00', dur:'2h 30m' };
  }

  function attachPackageHandlers(){
    const links = Array.from(document.querySelectorAll('#pkgGrid .card .btn-primary'));
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const card = link.closest('.card');
        const title = card.querySelector('.card-title')?.textContent?.trim() || 'Holiday Package';
        const priceText = card.querySelector('.price')?.textContent || '₹0';
        const descText = card.querySelector('.card-desc')?.textContent?.trim() || '';
        const imgSrc = card.querySelector('img')?.src || '';
        
        // Get actual package data from card attributes
        const origin = card.getAttribute('data-origin') || '';
        const destination = card.getAttribute('data-destination') || '';
        const airline = card.getAttribute('data-airline') || 'IndiGo';
        const flightNo = card.getAttribute('data-flight-no') || 'TBA';
        const departure = card.getAttribute('data-departure') || '10:00:00';
        const arrival = card.getAttribute('data-arrival') || '12:00:00';
        const duration = card.getAttribute('data-duration') || '2h';

        const dateStr = nextDate(7);
        if (inpDate) inpDate.value = dateStr;

        if (pkgImg) pkgImg.src = imgSrc;
        if (pkgName) pkgName.textContent = title;
        if (pkgSubtitle) pkgSubtitle.textContent = 'Flight + Stay';
        if (pkgRoute) pkgRoute.textContent = origin && destination ? `${origin} → ${destination}` : 'Package Tour';
        if (pkgAirline) pkgAirline.textContent = airline;
        if (pkgFlightNo) pkgFlightNo.textContent = flightNo;
        if (pkgDate) pkgDate.textContent = dateStr;
        if (pkgDep) pkgDep.textContent = departure ? departure.slice(0,5) : '10:00';
        if (pkgArr) pkgArr.textContent = arrival ? arrival.slice(0,5) : '12:00';
        if (pkgDur) pkgDur.textContent = duration;
        if (pkgTotal) pkgTotal.textContent = toINR(priceText);

        currentPkg = {
          title,
          imgSrc,
          description: descText,
          price: Number(String(priceText).replace(/[^\d.]/g, '')) || 0,
          from: origin,
          to: destination,
          airline: airline,
          flight_no: flightNo,
          dep: departure,
          arr: arrival,
          dur: duration
        };

        openModal(pkgModal);
      });
    });
  }

  attachPackageHandlers();

  function collectPackages(){
    const cards = Array.from(document.querySelectorAll('#pkgGrid .card'));
    allPkgs = cards.map(card => {
      const title = card.querySelector('.card-title')?.textContent?.trim() || 'Holiday Package';
      const descText = card.querySelector('.card-desc')?.textContent?.trim() || '';
      const priceText = card.querySelector('.price')?.textContent || '₹0';
      const imgSrc = card.querySelector('img')?.src || '';
      
      // Get actual package data from card attributes
      const origin = card.getAttribute('data-origin') || '';
      const destination = card.getAttribute('data-destination') || '';
      const airline = card.getAttribute('data-airline') || 'IndiGo';
      const flightNo = card.getAttribute('data-flight-no') || 'TBA';
      const departure = card.getAttribute('data-departure') || '10:00:00';
      const arrival = card.getAttribute('data-arrival') || '12:00:00';
      const duration = card.getAttribute('data-duration') || '2h';
      
      return {
        title,
        imgSrc,
        description: descText,
        price: Number(String(priceText).replace(/[^\d.]/g, '')) || 0,
        from: origin,
        to: destination,
        airline: airline,
        flight_no: flightNo,
        dep: departure,
        arr: arrival,
        dur: duration
      };
    });
  }

  function populateRevPackage(){
    collectPackages();
    if (!revPackage) return;
    // Clear existing
    revPackage.innerHTML = '<option value="" disabled selected>Select a package</option>'; 
    allPkgs.forEach((pkg, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = pkg.title;
      revPackage.appendChild(opt);
    });
  }

  if (openReviewBtn) {
    openReviewBtn.addEventListener('click', () => {
      populateRevPackage();
      if (revStatus) revStatus.textContent = 'Share details to help other travelers.';
      // Default select first package if available
      if (revPackage && revPackage.options.length > 1) {
        revPackage.selectedIndex = 1;
        const idx = Number(revPackage.value);
        if (!Number.isNaN(idx) && allPkgs[idx]) currentPkg = allPkgs[idx];
      }
      openModal(reviewModal);
    });
  }

  if (revPackage) {
    revPackage.addEventListener('change', () => {
      const idx = Number(revPackage.value);
      if (!Number.isNaN(idx) && allPkgs[idx]) {
        currentPkg = allPkgs[idx];
      }
    });
  }

  if (pkgClose) pkgClose.addEventListener('click', () => closeModal(pkgModal));
  if (payClose) payClose.addEventListener('click', () => closeModal(payModal));
  if (reviewClose) reviewClose.addEventListener('click', () => closeModal(reviewModal));

  if (btnConfirmPkg) btnConfirmPkg.addEventListener('click', () => {
    if (!currentPkg) return;
    const name = inpName?.value?.trim();
    const email = inpEmail?.value?.trim();
    const phone = inpPhone?.value?.trim();
    const dateVal = inpDate?.value || nextDate(7);
    if (!name || !email || !phone) { alert('Please enter passenger name, email and phone'); return; }
    closeModal(pkgModal);
    if (payStatus) payStatus.textContent = 'Awaiting payment…';
    openModal(payModal);
  });

  function safeOpenPdf(url){
    let win = null;
    try { win = window.open(url, '_blank'); } catch(e) { /* ignore */ }
    if (!win) {
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  async function bookTicket(){
    const mode = payMode?.value || 'UPI';
    const dateVal = inpDate?.value || nextDate(7);
    const payload = {
      // customer
      name: inpName?.value?.trim() || 'Guest',
      email: inpEmail?.value?.trim() || 'guest@example.com',
      phone: inpPhone?.value?.trim() || '0000000000',
      // package
      package_name: currentPkg.title,
      description: currentPkg.description,
      origin: currentPkg.from,
      destination: currentPkg.to,
      flight_number: currentPkg.flight_no,
      airline: currentPkg.airline,
      flight_date: dateVal,
      departure_time: currentPkg.dep,
      arrival_time: currentPkg.arr,
      duration: currentPkg.dur,
      stay_details: 'Flight + Stay',
      price: currentPkg.price,
      image_url: currentPkg.imgSrc,
      // booking/payment
      travel_date: dateVal,
      payment_mode: mode,
      transaction_id: `TXN${Date.now()}${Math.floor(Math.random()*999999)}`
    };
    try{
      if (payStatus) payStatus.textContent = 'Processing payment…';
      btnPayNow && (btnPayNow.disabled = true);

      let lastErr = null;
      for (const base of API_BASES) {
        try {
          const res = await fetch(`${base}/api/packages/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || `Request failed (${res.status})`);
          }

          if (payStatus) payStatus.textContent = 'Paid successfully! Generating ticket…';

          const bookingId = data.booking_id;
          const pdfUrl = `${base}/api/package-bookings/${bookingId}/pdf`;

          // Try to open automatically
          safeOpenPdf(pdfUrl);

          // Also render an explicit Download button for reliability
          const downloadBtn = document.createElement('button');
          downloadBtn.className = 'btn btn-primary';
          downloadBtn.style.marginTop = '10px';
          downloadBtn.textContent = 'Download Ticket (PDF)';
          downloadBtn.onclick = () => safeOpenPdf(pdfUrl);
          if (payStatus && !payStatus.nextSibling) {
            payStatus.parentElement.appendChild(downloadBtn);
          }

          setTimeout(() => { closeModal(payModal); }, 1500);
          return; // success
        } catch (e) {
          lastErr = e;
          // Try next base
        }
      }
      throw lastErr || new Error('Load failed');
    } catch(err){
      if (payStatus) payStatus.textContent = (err && err.message) ? err.message : 'Load failed';
    } finally {
      btnPayNow && (btnPayNow.disabled = false);
    }
  }

  if (btnPayNow) btnPayNow.addEventListener('click', bookTicket);

  async function submitReview(){
    if (!currentPkg && revPackage && revPackage.value !== '') {
      const idx = Number(revPackage.value);
      if (!Number.isNaN(idx) && allPkgs[idx]) currentPkg = allPkgs[idx];
    }
    if (!currentPkg) { alert('Please select a package first.'); return; }
    const payload = {
      name: revName?.value?.trim() || 'Guest',
      email: revEmail?.value?.trim() || 'guest@example.com',
      phone: revPhone?.value?.trim() || '',
      package_name: currentPkg.title,
      description: currentPkg.description,
      origin: currentPkg.from,
      destination: currentPkg.to,
      flight_number: currentPkg.flight_no,
      airline: currentPkg.airline,
      flight_date: inpDate?.value || nextDate(7),
      departure_time: currentPkg.dep,
      arrival_time: currentPkg.arr,
      duration: currentPkg.dur,
      stay_details: 'Flight + Stay',
      price: currentPkg.price,
      image_url: currentPkg.imgSrc,
      rating: Number(revRating?.value || 5),
      review_text: revText?.value?.trim() || ''
    };

    if (!payload.review_text) {
      alert('Please write a short review.');
      return;
    }

    try{
      revStatus && (revStatus.textContent = 'Submitting review…');
      let lastErr = null;
      for (const base of API_BASES){
        // Skip invalid base strings if any
        try { new URL(base); } catch { continue; }
        try{
          const res = await fetch(`${base}/api/packages/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || `Request failed (${res.status})`);
          revStatus && (revStatus.textContent = 'Review submitted! Thank you.');
          setTimeout(() => closeModal(reviewModal), 900);
          return;
        } catch(e) { lastErr = e; }
      }
      throw lastErr || new Error('Failed');
    } catch(err){
      revStatus && (revStatus.textContent = err.message || 'Failed to submit review');
    }
  }

  if (btnSubmitReview) btnSubmitReview.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    submitReview();
  });

  // Prevent Enter from triggering any outer form
  if (reviewModal) {
    reviewModal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        submitReview();
      }
    }, true);
  }

})();
