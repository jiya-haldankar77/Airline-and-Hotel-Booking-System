// chatbot.js - Simple AI-like chat interactions and prediction widgets
(function(){
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));

  // Theme toggle
  const root = document.documentElement;
  const themeToggle = $('#themeToggle');
  if (themeToggle){
    themeToggle.addEventListener('change', ()=>{
      const light = themeToggle.checked;
      root.setAttribute('data-theme', light ? 'light' : 'dark');
    });
  }

  // Chat elements
  const log = $('#log');
  const input = $('#composer');
  const sendBtn = $('#sendBtn');

  const INSIGHTS = {
    timeHints: [
      'Book Goa flights 10–15 days in advance for lowest fares.',
      'Book Delhi flights 7–10 days early; mid-week travel is cheapest.',
      'Mumbai fares dip on Tuesdays—book 8–12 days ahead.',
      'Kolkata monsoon deals are best 5–9 days in advance.'
    ],
    trends: [
      'Himachal trips are trending 🌄 — 24% rise in searches.',
      'Goa long-weekend trips up by 31% 🏖️',
      'Jaipur heritage tours trending for couples 👑',
      'Kerala houseboats popular this season 🌿'
    ],
    fares: [
      'Average flight fare to Jaipur: ₹4,299 (↓ 12% this week)',
      'Average flight fare to Delhi: ₹3,999 (↓ 8% this week)',
      'Average flight fare to Goa: ₹5,199 (↓ 5% this week)'
    ]
  };

  function addMsg(text, who='bot'){
    const m = document.createElement('div');
    m.className = `msg ${who}`;
    m.innerHTML = `${text}<span class="time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>`;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }

  function typing(on=true){
    if (on){
      const t = document.createElement('div');
      t.className = 'msg bot';
      t.id = 'typing';
      t.innerHTML = `<span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`;
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
    } else {
      const t = $('#typing');
      if (t) t.remove();
    }
  }

  function handleQuery(q){
    const txt = q.toLowerCase();
    // simple intent detection
    if (txt.includes('flight') && (txt.includes('goa') || txt.includes('delhi') || txt.includes('mumbai'))){
      return 'Let’s search flights! Open the Flights page to continue: /modern-flight-booking.html';
    }
    if (txt.includes('package') || txt.includes('holiday')){
      return 'Explore curated holidays!<br><a href="/holiday.html" class="btn" target="_self" aria-label="Open Holiday Packages">Open Holiday Packages</a>';
    }
    if (txt.includes('predict') || txt.includes('cheapest') || txt.includes('fare')){
      const hint = INSIGHTS.timeHints[Math.floor(Math.random()*INSIGHTS.timeHints.length)];
      return `AI Fare Prediction: ${hint}`;
    }
    if (txt.includes('offer') || txt.includes('deal')){
      return 'Hot deals are live!<br><a href="/last-minute-deals.html" class="btn" target="_self" aria-label="Open Last Minute Deals">Open Deals</a>';
    }
    if (txt.includes('support') || txt.includes('help') || txt.includes('contact')){
      return 'Our 24/7 support is ready to help. Share your issue or call +91-12345-67890.';
    }
    // default
    return 'Let’s plan your next sky adventure! ☁️ Try asking for Goa flights, Jaipur fares, or packages under ₹10,000.';
  }

  function botReply(q){
    typing(true);
    setTimeout(()=>{
      typing(false);
      addMsg(handleQuery(q), 'bot');
      // intent suggestion
      if (/goa|manali|himachal|jaipur|kerala|andaman/i.test(q)){
        addMsg('Looks like you’re planning a trip—want hotel deals too?', 'bot');
      }
      // update sidebar insights slightly
      shuffleInsights(true);
    }, 700);
  }

  function onSend(){
    const v = (input.value || '').trim();
    if (!v) return;
    addMsg(v, 'user');
    input.value = '';
    botReply(v);
  }

  if (sendBtn) sendBtn.addEventListener('click', onSend);
  if (input) input.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') onSend(); });

  // Quick replies
  $$('.chip').forEach(ch => ch.addEventListener('click', () => {
    const msg = ch.getAttribute('data-msg') || ch.textContent;
    addMsg(msg, 'user');
    botReply(msg);
  }));

  // Dashboard button
  const openDash = $('#openDashboard');
  if (openDash){
    openDash.addEventListener('click', ()=>{
      addMsg('Opening AI Prediction Dashboard...', 'bot');
      // Could open a modal; for now, just nudge insights
      shuffleInsights(true);
    });
  }

  // Insights shuffle
  const bestTimeText = $('#bestTimeText');
  const bestTimeBar = $('#bestTimeBar');
  const trendText = $('#trendText');
  const trendBar = $('#trendBar');
  const fareJaipur = $('#fareJaipur');
  const fareBar = $('#fareBar');
  const keralaBook = $('#keralaBook');
  const keralaBar = $('#keralaBar');
  const shuffleBest = $('#shuffleBest');

  function randPct(min=25, max=80){ return Math.floor(min + Math.random()*(max-min)); }

  function shuffleInsights(all=false){
    if (all || bestTimeText){
      bestTimeText.textContent = INSIGHTS.timeHints[Math.floor(Math.random()*INSIGHTS.timeHints.length)];
      bestTimeBar.style.width = randPct()+"%";
    }
    if (all || trendText){
      trendText.textContent = INSIGHTS.trends[Math.floor(Math.random()*INSIGHTS.trends.length)];
      trendBar.style.width = randPct()+"%";
    }
    if (all || fareJaipur){
      fareJaipur.textContent = INSIGHTS.fares[Math.floor(Math.random()*INSIGHTS.fares.length)];
      fareBar.style.width = randPct()+"%";
    }
    if (all || keralaBook){
      keralaBook.textContent = 'Next weekend: '+randPct(20,50)+'% more bookings to Kerala 🌿';
      keralaBar.style.width = randPct()+"%";
    }
  }

  if (shuffleBest) shuffleBest.addEventListener('click', ()=> shuffleInsights(true));
  shuffleInsights(true);
})();
