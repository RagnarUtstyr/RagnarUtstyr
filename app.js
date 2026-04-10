import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCNmMDNgT91vrj_BsivKvLewCq2SHXHb2o',
  authDomain: 'checkout-52442.firebaseapp.com',
  projectId: 'checkout-52442',
  storageBucket: 'checkout-52442.firebasestorage.app',
  messagingSenderId: '500953675538',
  appId: '1:500953675538:web:92179889a6dfea7342a5cb',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const rentalsRef = collection(db, 'rentals');
const equipmentRef = collection(db, 'equipment');

const state = {
  user: null,
  route: getRoute(),
  notice: '',
  error: '',
};

function requireUserUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to access your data.');
  return uid;
}

function getRoute() {
  return (location.hash || '#/').replace(/^#/, '');
}

function setRoute(route) {
  location.hash = route;
}

function getRouteInfo() {
  const raw = state.route || '/';
  const [path, queryString = ''] = raw.split('?');
  return { path, params: new URLSearchParams(queryString) };
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function displayName(name, unitNumber) {
  return unitNumber ? `${name} #${unitNumber}` : name;
}

function formatDate(value) {
  if (!value) return '—';
  const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function daysUntil(dateInput) {
  const today = new Date();
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 0;
  const diff = date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  return Math.round(diff / 86400000);
}

function setFlash({ notice = '', error = '' } = {}) {
  state.notice = notice;
  state.error = error;
}

function consumeFlash() {
  const markup = `${state.error ? `<div class="error">${escapeHtml(state.error)}</div>` : ''}${state.notice ? `<div class="success">${escapeHtml(state.notice)}</div>` : ''}`;
  state.error = '';
  state.notice = '';
  return markup;
}

function isCurrentRoute(routeBase) {
  return state.route.split('?')[0] === routeBase;
}

function getEl(id) {
  return document.getElementById(id);
}

function setHtmlIfPresent(id, html) {
  const el = getEl(id);
  if (!el) return false;
  el.innerHTML = html;
  return true;
}

function setTextIfPresent(id, text) {
  const el = getEl(id);
  if (!el) return false;
  el.textContent = text;
  return true;
}

function shell(content) {
  const route = state.route.split('?')[0];
  const nav = [
    ['/', 'Overview'],
    ['/booking', 'Booking'],
    ['/checkout', 'Checkout'],
    ['/checkin', 'Check-in'],
    ['/equipment', 'Equipment'],
  ];

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="eyebrow">Rental management</div>
          <h1>Equipment Tracker</h1>
          <p>Private inventory, bookings and returns.</p>
        </div>
        <nav class="nav">
          ${nav.map(([href, label]) => `<a href="#${href}" class="${route === href ? 'active' : ''}">${label}</a>`).join('')}
        </nav>
      </aside>
      <div class="content-shell">
        <header class="topbar">
          <div class="topbar-left muted small">Signed in as <strong>${escapeHtml(state.user?.displayName || state.user?.email || '')}</strong></div>
          <div class="row compact-row">
            <button class="secondary slim" id="logoutBtn">Log out</button>
          </div>
        </header>
        <main class="content stack">
          ${consumeFlash()}
          ${content}
        </main>
      </div>
    </div>
  `;
}

function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-shell">
      <div class="card auth-card stack">
        <div>
          <div class="eyebrow">Rental equipment tracker</div>
          <h1>Sign in</h1>
          <p class="muted">Use Google or email/password with Firebase Authentication.</p>
        </div>
        ${consumeFlash()}
        <button class="primary" id="googleLoginBtn">Continue with Google</button>
        <hr class="sep" />
        <form id="emailAuthForm" class="stack">
          <div>
            <label>Email</label>
            <input type="email" name="email" required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" name="password" required />
          </div>
          <div class="row compact-row">
            <button class="primary" type="submit">Log in</button>
            <button class="secondary" type="button" id="registerBtn">Create account</button>
          </div>
        </form>
      </div>
    </div>
  `;

  getEl('googleLoginBtn').onclick = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setFlash({ error: error.message || 'Google sign-in failed.' });
      render();
    }
  };

  getEl('emailAuthForm').onsubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await signInWithEmailAndPassword(auth, form.get('email'), form.get('password'));
    } catch (error) {
      setFlash({ error: error.message || 'Email sign-in failed.' });
      render();
    }
  };

  getEl('registerBtn').onclick = async () => {
    const form = new FormData(getEl('emailAuthForm'));
    try {
      await createUserWithEmailAndPassword(auth, form.get('email'), form.get('password'));
    } catch (error) {
      setFlash({ error: error.message || 'Registration failed.' });
      render();
    }
  };
}

async function getAllEquipment() {
  const uid = requireUserUid();
  const snapshot = await getDocs(query(equipmentRef, where('ownerId', '==', uid)));
  return snapshot.docs
    .map((snap) => ({ id: snap.id, ...snap.data() }))
    .filter((item) => item.active !== false)
    .map((item) => ({
      ...item,
      name: item.name || 'Unnamed equipment',
      type: item.type || item.category || 'General',
      unitNumber: Number(item.unitNumber) || 1,
      displayName: item.displayName || displayName(item.name || 'Unnamed equipment', Number(item.unitNumber) || 1),
      groupKey: item.groupKey || `${slugify(item.type || item.category || 'General')}__${slugify(item.name || 'Unnamed equipment')}`,
      status: item.status || 'available',
    }))
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
}

async function getEquipmentGroups() {
  const items = await getAllEquipment();
  const groups = new Map();
  for (const item of items) {
    const key = item.groupKey;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: item.name,
        type: item.type,
        manufacturer: item.manufacturer || '',
        model: item.model || '',
        description: item.description || '',
        notes: item.notes || '',
        items: [],
      });
    }
    groups.get(key).items.push(item);
  }
  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.unitNumber - b.unitNumber),
      amount: group.items.length,
      availableCount: group.items.filter((item) => item.status !== 'checked_out').length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getRentalsByStatuses(statuses = []) {
  const uid = requireUserUid();
  const snapshot = await getDocs(query(rentalsRef, where('ownerId', '==', uid)));
  return snapshot.docs
    .map((snap) => ({ id: snap.id, ...snap.data() }))
    .filter((rental) => !statuses.length || statuses.includes(rental.status))
    .sort((a, b) => new Date(b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : b.updatedAt || b.pickupDate || 0) - new Date(a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : a.updatedAt || a.pickupDate || 0));
}

async function getRentalById(id) {
  const snap = await getDoc(doc(db, 'rentals', id));
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() };
  return data.ownerId === requireUserUid() ? data : null;
}

async function createEquipmentGroup(payload) {
  const name = payload.name.trim();
  const type = (payload.type || 'General').trim();
  const amount = Math.max(1, Number(payload.amount) || 1);
  const groupKey = `${slugify(type)}__${slugify(name)}`;
  const existing = (await getAllEquipment()).filter((item) => item.groupKey === groupKey);
  let highest = existing.reduce((max, item) => Math.max(max, Number(item.unitNumber) || 0), 0);
  const batch = writeBatch(db);
  for (let i = 0; i < amount; i += 1) {
    highest += 1;
    batch.set(doc(equipmentRef), {
      name,
      type,
      category: type,
      unitNumber: highest,
      displayName: displayName(name, highest),
      groupKey,
      manufacturer: payload.manufacturer?.trim() || '',
      model: payload.model?.trim() || '',
      description: payload.description?.trim() || '',
      notes: payload.notes?.trim() || '',
      ownerId: requireUserUid(),
      status: 'available',
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

function parseEquipmentXml(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  if (xml.querySelector('parsererror')) throw new Error('The XML file could not be read.');
  const nodes = Array.from(xml.querySelectorAll('item, equipment, product, asset, entry, record'));
  const sourceNodes = nodes.length ? nodes : Array.from(xml.documentElement.children);
  const readField = (node, names) => {
    for (const name of names) {
      const child = Array.from(node.children).find((x) => x.tagName.toLowerCase() === name.toLowerCase());
      if (child?.textContent?.trim()) return child.textContent.trim();
      const attr = node.getAttribute(name);
      if (attr?.trim()) return attr.trim();
    }
    return '';
  };
  const rows = sourceNodes.map((node) => ({
    name: readField(node, ['name', 'title', 'label', 'equipmentname', 'description']),
    type: readField(node, ['type', 'category', 'group', 'department', 'equipmenttype']),
    amount: Math.max(1, parseInt(readField(node, ['amount', 'qty', 'quantity', 'count', 'units']) || '1', 10) || 1),
    manufacturer: readField(node, ['manufacturer', 'brand', 'make']),
    model: readField(node, ['model']),
    description: readField(node, ['description', 'details']),
    notes: readField(node, ['notes', 'comment', 'comments']),
  })).filter((row) => row.name);
  if (!rows.length) throw new Error('No equipment entries were found in the XML file.');
  return rows;
}

async function importEquipmentRows(rows) {
  const existing = await getAllEquipment();
  const highestByGroup = new Map();
  existing.forEach((item) => highestByGroup.set(item.groupKey, Math.max(highestByGroup.get(item.groupKey) || 0, item.unitNumber)));
  const batch = writeBatch(db);
  for (const row of rows) {
    const name = row.name.trim();
    const type = (row.type || 'General').trim();
    const amount = Math.max(1, Number(row.amount) || 1);
    const groupKey = `${slugify(type)}__${slugify(name)}`;
    let nextUnit = highestByGroup.get(groupKey) || 0;
    for (let i = 0; i < amount; i += 1) {
      nextUnit += 1;
      batch.set(doc(equipmentRef), {
        name,
        type,
        category: type,
        unitNumber: nextUnit,
        displayName: displayName(name, nextUnit),
        groupKey,
        manufacturer: row.manufacturer?.trim() || '',
        model: row.model?.trim() || '',
        description: row.description?.trim() || '',
        notes: row.notes?.trim() || '',
        ownerId: requireUserUid(),
        status: 'available',
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    highestByGroup.set(groupKey, nextUnit);
  }
  await batch.commit();
}

async function deleteEquipmentItem(id) {
  await deleteDoc(doc(db, 'equipment', id));
}

async function createRental(payload, status = 'booked') {
  await addDoc(rentalsRef, {
    ...payload,
    ownerId: requireUserUid(),
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function updateRental(rentalId, payload) {
  await updateDoc(doc(db, 'rentals', rentalId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
  if (!payload.items?.length) return;
  const batch = writeBatch(db);
  for (const item of payload.items) {
    if (!item.equipmentId) continue;
    let nextStatus = 'available';
    if (payload.status === 'checked_out') nextStatus = item.pickedUp ? 'checked_out' : 'available';
    if (payload.status === 'completed' || payload.status === 'partial_return') nextStatus = item.returned ? 'available' : 'checked_out';
    batch.update(doc(db, 'equipment', item.equipmentId), { status: nextStatus, updatedAt: serverTimestamp() });
  }
  await batch.commit();
}

function detailsToggleMarkup(items) {
  return `
    <details class="mini-details">
      <summary>View items (${items.length})</summary>
      <div class="item-pills compact-pills">${items.map((item) => `<span class="pill">${escapeHtml(item.name)}</span>`).join('')}</div>
    </details>
  `;
}

function rentalCard(rental, actionRoute, actionLabel) {
  const items = rental.items || [];
  return `
    <article class="card rental-card compact-card">
      <div class="row spread start-row">
        <div>
          <div class="row compact-row"><span class="badge ${escapeHtml(rental.status)}">${escapeHtml(rental.status)}</span><span class="badge">${items.length} items</span></div>
          <h3>${escapeHtml(rental.renterName || 'Unnamed renter')}</h3>
          <div class="muted small">${escapeHtml(rental.company || rental.email || rental.phone || 'No contact info')}</div>
        </div>
        <a class="btn-link secondary slim" href="#${actionRoute}?booking=${rental.id}">${actionLabel}</a>
      </div>
      <div class="grid two compact-grid">
        <div><div class="muted small">Pickup</div><div>${escapeHtml(formatDate(rental.pickupDate))}</div></div>
        <div><div class="muted small">Return</div><div>${escapeHtml(formatDate(rental.returnDate))}</div></div>
      </div>
      ${detailsToggleMarkup(items)}
    </article>`;
}

function renderDashboard() {
  return shell(`
    <div class="page-header">
      <div><div class="eyebrow">Overview</div><h2>Current bookings and checkouts</h2><p>Quick overview of your own data only.</p></div>
      <div class="row compact-row">
        <a class="btn-link primary slim" href="#/booking">New booking</a>
        <a class="btn-link secondary slim" href="#/checkout?direct=1">Direct checkout</a>
      </div>
    </div>
    <section class="grid four" id="dashboardStats">
      <div class="card stat"><div class="muted small">Active rentals</div><strong>—</strong></div>
      <div class="card stat"><div class="muted small">Pickups today</div><strong>—</strong></div>
      <div class="card stat"><div class="muted small">Returns today</div><strong>—</strong></div>
      <div class="card stat"><div class="muted small">Overdue</div><strong>—</strong></div>
    </section>
    <section class="grid two overview-grid">
      <div class="stack overview-column"><div class="row spread section-head"><h3>Upcoming bookings</h3><span class="badge" id="bookedCount">…</span></div><div id="dashboardBooked"><div class="card">Loading bookings…</div></div></div>
      <div class="stack overview-column"><div class="row spread section-head"><h3>Currently checked out</h3><span class="badge" id="checkedOutCount">…</span></div><div id="dashboardCheckedOut"><div class="card">Loading checkouts…</div></div></div>
    </section>
  `);
}

function setupDashboardPage() {
  const routeBase = '/';
  getRentalsByStatuses(['booked', 'checked_out', 'partial_return']).then((rentals) => {
    if (!isCurrentRoute(routeBase)) return;
    const booked = rentals.filter((r) => r.status === 'booked');
    const checkedOut = rentals.filter((r) => ['checked_out', 'partial_return'].includes(r.status));
    const stats = {
      active: rentals.length,
      pickupsToday: rentals.filter((r) => new Date(r.pickupDate).toDateString() === new Date().toDateString()).length,
      returnsToday: rentals.filter((r) => new Date(r.returnDate).toDateString() === new Date().toDateString()).length,
      overdue: checkedOut.filter((r) => daysUntil(r.returnDate) < 0).length,
    };
    if (!setHtmlIfPresent('dashboardStats', `
      <div class="card stat"><div class="muted small">Active rentals</div><strong>${stats.active}</strong></div>
      <div class="card stat"><div class="muted small">Pickups today</div><strong>${stats.pickupsToday}</strong></div>
      <div class="card stat"><div class="muted small">Returns today</div><strong>${stats.returnsToday}</strong></div>
      <div class="card stat"><div class="muted small">Overdue</div><strong>${stats.overdue}</strong></div>
    `)) return;
    setTextIfPresent('bookedCount', booked.length);
    setTextIfPresent('checkedOutCount', checkedOut.length);
    setHtmlIfPresent('dashboardBooked', booked.length ? booked.map((r) => rentalCard(r, '/checkout', 'Open')).join('') : '<div class="card">No upcoming bookings.</div>');
    setHtmlIfPresent('dashboardCheckedOut', checkedOut.length ? checkedOut.map((r) => rentalCard(r, '/checkout', 'Edit')).join('') : '<div class="card">Nothing is currently checked out.</div>');
  }).catch((error) => {
    setHtmlIfPresent('dashboardStats', `<div class="error">${escapeHtml(error.message || 'Failed to load overview data.')}</div>`);
    setHtmlIfPresent('dashboardBooked', `<div class="error">${escapeHtml(error.message || 'Failed to load bookings.')}</div>`);
    setHtmlIfPresent('dashboardCheckedOut', `<div class="error">${escapeHtml(error.message || 'Failed to load checkouts.')}</div>`);
  });
}

function renderBooking() {
  return shell(`
    <div class="page-header">
      <div><div class="eyebrow">Booking</div><h2>Create a new booking</h2><p>Add renter details and select individual equipment units.</p></div>
    </div>
    <form id="bookingForm" class="stack">
      <section class="card grid two">
        <div><label>Renter name</label><input name="renterName" required /></div>
        <div><label>Company / department</label><input name="company" /></div>
        <div><label>Email</label><input type="email" name="email" /></div>
        <div><label>Phone</label><input name="phone" /></div>
        <div><label>Pickup date</label><input type="date" name="pickupDate" required /></div>
        <div><label>Return date</label><input type="date" name="returnDate" required /></div>
        <div class="grid" style="grid-column:1/-1"><div><label>Notes</label><textarea name="notes"></textarea></div></div>
      </section>
      <section class="grid two">
        <div class="card stack">
          <div class="row spread"><div><h3>Search equipment</h3><div class="muted small">Already-added items disappear from the search list.</div></div><input id="equipmentSearch" placeholder="Search name or type" class="compact-input" /></div>
          <div class="search-results" id="equipmentSearchResults"></div>
          <div class="row compact-row"><input id="customItemInput" placeholder="Add a custom item" /><button class="secondary slim" type="button" id="addCustomItemBtn">Add custom item</button></div>
        </div>
        <div class="card stack"><h3>Selected equipment</h3><div class="selected-list" id="selectedEquipmentList"></div></div>
      </section>
      <div class="row compact-row"><button class="primary slim" type="submit">Save booking</button><span class="muted small">Add at least one item.</span></div>
    </form>
  `);
}

function setupBookingPage() {
  const routeBase = '/booking';
  const selectedItems = [];
  const resultsEl = getEl('equipmentSearchResults');
  const selectedEl = getEl('selectedEquipmentList');
  const searchInput = getEl('equipmentSearch');
  if (!resultsEl || !selectedEl || !searchInput) return;
  let catalog = [];

  getAllEquipment().then((items) => {
    if (!isCurrentRoute(routeBase)) return;
    catalog = items.filter((item) => item.status !== 'checked_out');
    renderResults();
  }).catch((error) => {
    resultsEl.innerHTML = `<div class="error">${escapeHtml(error.message || 'Failed to load equipment catalog.')}</div>`;
  });

  function selectedIds() {
    return new Set(selectedItems.filter((item) => item.equipmentId).map((item) => item.equipmentId));
  }

  const renderSelected = () => {
    selectedEl.innerHTML = selectedItems.length ? selectedItems.map((item, index) => `
      <div class="selected-row">
        <div><strong>${escapeHtml(item.name)}</strong><div class="muted small">${escapeHtml(item.type || '')}</div></div>
        <button class="ghost slim" type="button" data-remove-index="${index}">Remove</button>
      </div>
    `).join('') : '<div class="muted">No equipment added yet.</div>';
    selectedEl.querySelectorAll('[data-remove-index]').forEach((btn) => {
      btn.onclick = () => {
        selectedItems.splice(Number(btn.dataset.removeIndex), 1);
        renderSelected();
        renderResults();
      };
    });
  };

  const renderResults = () => {
    const q = searchInput.value.trim().toLowerCase();
    const ids = selectedIds();
    let filtered = catalog.filter((item) => !ids.has(item.id));
    if (q) filtered = filtered.filter((item) => [item.displayName, item.name, item.type].filter(Boolean).some((v) => v.toLowerCase().includes(q)));
    resultsEl.innerHTML = filtered.length ? filtered.map((item) => `
      <div class="result-row">
        <div><strong>${escapeHtml(item.displayName)}</strong><div class="muted small">${escapeHtml([item.type, item.manufacturer, item.model].filter(Boolean).join(' • ') || 'No details')}</div></div>
        <button class="secondary slim" type="button" data-add-id="${item.id}">Add</button>
      </div>
    `).join('') : '<div class="muted">No equipment matches your search.</div>';
    resultsEl.querySelectorAll('[data-add-id]').forEach((btn) => {
      btn.onclick = () => {
        const item = catalog.find((row) => row.id === btn.dataset.addId);
        if (!item) return;
        selectedItems.push({
          equipmentId: item.id,
          name: item.displayName,
          equipmentName: item.name,
          type: item.type,
          serialNumber: item.serialNumber || '',
          unitNumber: item.unitNumber || null,
          pickedUp: false,
          returned: false,
        });
        renderSelected();
        renderResults();
      };
    });
  };

  searchInput.oninput = renderResults;
  getEl('addCustomItemBtn').onclick = () => {
    const input = getEl('customItemInput');
    if (!input.value.trim()) return;
    selectedItems.push({ equipmentId: null, name: input.value.trim(), equipmentName: input.value.trim(), type: 'Custom', pickedUp: false, returned: false });
    input.value = '';
    renderSelected();
    renderResults();
  };
  renderSelected();

  const bookingForm = getEl('bookingForm');
  bookingForm.onsubmit = async (event) => {
    event.preventDefault();
    if (!selectedItems.length) {
      setFlash({ error: 'Add at least one equipment item before saving.' });
      render();
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      await createRental({
        renterName: form.get('renterName'),
        company: form.get('company'),
        email: form.get('email'),
        phone: form.get('phone'),
        pickupDate: form.get('pickupDate'),
        returnDate: form.get('returnDate'),
        notes: form.get('notes'),
        items: selectedItems,
      }, 'booked');
      setFlash({ notice: 'Booking created successfully.' });
      setRoute('/');
    } catch (error) {
      setFlash({ error: error.message || 'Failed to create booking.' });
      render();
    }
  };
}

function renderCheckout() {
  const { params } = getRouteInfo();
  const direct = params.get('direct') === '1';
  return shell(`
    <div class="page-header"><div><div class="eyebrow">Checkout</div><h2>Prepare equipment pickup</h2><p>Edit an existing checkout, complete a booking, or create a direct checkout.</p></div><div class="row compact-row"><a class="btn-link secondary slim" href="#/checkout?direct=1">Direct checkout</a></div></div>
    <section class="card stack">
      <div><label>Select booking / checkout</label><select id="checkoutBookingSelect"><option value="">Loading bookings…</option></select></div>
    </section>
    <div id="checkoutDetails">${direct ? '<section class="card">Loading direct checkout…</section>' : '<section class="card">Choose a booking or checkout, or start a direct checkout.</section>'}</div>
  `);
}

function selectedCatalogItems(items, catalog) {
  const ids = new Set(items.filter((item) => item.equipmentId).map((item) => item.equipmentId));
  return catalog.filter((item) => !ids.has(item.id) && item.status !== 'checked_out');
}

function checkoutListsMarkup(items) {
  const unpicked = items.filter((item) => !item.pickedUp);
  const picked = items.filter((item) => item.pickedUp);
  const renderItem = (item, index, pickedState) => `
    <div class="check-row ${pickedState ? 'checked' : ''}">
      <div style="flex:1"><strong>${escapeHtml(item.name)}</strong><div class="muted small">${escapeHtml(item.serialNumber || item.type || 'No serial')}</div></div>
      ${pickedState ? `<button class="secondary slim" type="button" data-unpick-index="${index}">Move back</button>` : `<button class="primary slim" type="button" data-pick-index="${index}">Add to picked</button>`}
      <button class="ghost slim" type="button" data-remove-index="${index}">Remove</button>
    </div>
  `;
  return `
    <div class="grid two">
      <div class="stack">
        <div class="row spread section-head"><h4>To pick</h4><span class="badge">${unpicked.length}</span></div>
        <div class="checklist">${unpicked.length ? unpicked.map((item) => renderItem(item, items.indexOf(item), false)).join('') : '<div class="muted">No items waiting to be picked.</div>'}</div>
      </div>
      <div class="stack">
        <div class="row spread section-head"><h4>Picked</h4><span class="badge">${picked.length}</span></div>
        <div class="checklist">${picked.length ? picked.map((item) => renderItem(item, items.indexOf(item), true)).join('') : '<div class="muted">Nothing has been picked yet.</div>'}</div>
      </div>
    </div>
  `;
}

function directCheckoutMarkup() {
  return `
    <section class="card stack">
      <h3>Direct checkout</h3>
      <form id="directCheckoutForm" class="stack">
        <div class="grid two">
          <div><label>Renter name</label><input name="renterName" required /></div>
          <div><label>Company / department</label><input name="company" /></div>
          <div><label>Email</label><input type="email" name="email" /></div>
          <div><label>Phone</label><input name="phone" /></div>
          <div><label>Pickup date</label><input type="date" name="pickupDate" required /></div>
          <div><label>Return date</label><input type="date" name="returnDate" required /></div>
        </div>
        <div><label>Notes</label><textarea name="notes"></textarea></div>
      </form>
      <section class="card subtle-card stack">
        <div class="row spread"><div><h4>Add equipment</h4><div class="muted small">Choose available units to include in this checkout.</div></div><input id="checkoutEquipmentSearch" placeholder="Search equipment" class="compact-input" /></div>
        <div class="search-results" id="checkoutEquipmentResults"></div>
      </section>
      <section class="card subtle-card stack">
        <div class="row spread"><h4>Picked list</h4><span class="badge" id="checkoutPickedCount">0/0 picked</span></div>
        <div id="checkoutChecklist"></div>
      </section>
      <div class="row compact-row"><button class="primary slim" id="saveCheckoutBtn">Save direct checkout</button></div>
    </section>
  `;
}

function setupCheckoutPage() {
  const routeBase = '/checkout';
  const { params } = getRouteInfo();
  const bookingId = params.get('booking') || '';
  const direct = params.get('direct') === '1';
  const select = getEl('checkoutBookingSelect');
  const details = getEl('checkoutDetails');
  if (!select || !details) return;
  select.onchange = () => setRoute(select.value ? `/checkout?booking=${select.value}` : '/checkout');

  getRentalsByStatuses(['booked', 'checked_out', 'partial_return']).then((bookings) => {
    if (!isCurrentRoute(routeBase)) return;
    const options = bookings.map((booking) => `<option value="${booking.id}" ${booking.id === bookingId ? 'selected' : ''}>${escapeHtml(booking.renterName)} — ${escapeHtml(booking.status)} — ${escapeHtml(formatDate(booking.pickupDate))}</option>`).join('');
    select.innerHTML = `<option value="">Choose a booking or checkout…</option>${options}`;
  }).catch((error) => {
    select.innerHTML = '<option value="">Failed to load bookings</option>';
    details.innerHTML = `<section class="card error">${escapeHtml(error.message || 'Failed to load bookings.')}</section>`;
  });

  if (direct && !bookingId) {
    details.innerHTML = directCheckoutMarkup();
    setupDirectCheckout();
    return;
  }

  if (!bookingId) {
    details.innerHTML = '<section class="card">Choose a booking or checkout, or use direct checkout.</section>';
    return;
  }

  details.innerHTML = '<section class="card">Loading checkout details…</section>';
  Promise.all([getRentalById(bookingId), getAllEquipment()]).then(([rental, catalog]) => {
    if (!isCurrentRoute(routeBase)) return;
    if (!rental) {
      details.innerHTML = '<section class="card">Booking not found.</section>';
      return;
    }
    const items = structuredClone(rental.items || []);
    details.innerHTML = `
      <section class="card stack">
        <div class="row spread"><div><h3>${escapeHtml(rental.renterName)}</h3><div class="muted small">Pickup ${escapeHtml(formatDate(rental.pickupDate))} • Return ${escapeHtml(formatDate(rental.returnDate))}</div></div><div class="badge" id="checkoutPickedCount">${items.filter((i) => i.pickedUp).length}/${items.length} picked</div></div>
        <div id="checkoutChecklist"></div>
      </section>
      <section class="card stack">
        <div class="row spread"><div><h3>Add more equipment</h3><div class="muted small">Only available units can be added.</div></div><input id="checkoutEquipmentSearch" placeholder="Search equipment" class="compact-input" /></div>
        <div class="search-results" id="checkoutEquipmentResults"></div>
        <div class="row compact-row"><button class="primary slim" id="saveCheckoutBtn">Save checkout</button></div>
      </section>
    `;
    wireCheckoutEditor({ rental, items, catalog, directMode: false });
  }).catch((error) => {
    details.innerHTML = `<section class="card error">${escapeHtml(error.message || 'Failed to load checkout data.')}</section>`;
  });
}

function wireCheckoutEditor({ rental, items, catalog, directMode }) {
  const list = getEl('checkoutChecklist');
  const results = getEl('checkoutEquipmentResults');
  const search = getEl('checkoutEquipmentSearch');
  const pickedCountEl = getEl('checkoutPickedCount');
  const saveCheckoutBtn = getEl('saveCheckoutBtn');
  if (!list || !results || !search || !pickedCountEl || !saveCheckoutBtn) return;

  const renderChecklist = () => {
    pickedCountEl.textContent = `${items.filter((i) => i.pickedUp).length}/${items.length} picked`;
    list.innerHTML = checkoutListsMarkup(items);
    list.querySelectorAll('[data-pick-index]').forEach((el) => {
      el.onclick = () => {
        items[Number(el.dataset.pickIndex)].pickedUp = true;
        renderChecklist();
      };
    });
    list.querySelectorAll('[data-unpick-index]').forEach((el) => {
      el.onclick = () => {
        items[Number(el.dataset.unpickIndex)].pickedUp = false;
        renderChecklist();
      };
    });
    list.querySelectorAll('[data-remove-index]').forEach((el) => {
      el.onclick = () => {
        items.splice(Number(el.dataset.removeIndex), 1);
        renderChecklist();
        renderResults();
      };
    });
  };

  const renderResults = () => {
    const q = search.value.trim().toLowerCase();
    let filtered = selectedCatalogItems(items, catalog);
    if (q) filtered = filtered.filter((item) => [item.displayName, item.name, item.type].filter(Boolean).some((v) => v.toLowerCase().includes(q)));
    results.innerHTML = filtered.length ? filtered.map((item) => `
      <div class="result-row">
        <div><strong>${escapeHtml(item.displayName)}</strong><div class="muted small">${escapeHtml(item.type)}</div></div>
        <button class="secondary slim" type="button" data-add-id="${item.id}">Add</button>
      </div>
    `).join('') : '<div class="muted">No equipment found.</div>';
    results.querySelectorAll('[data-add-id]').forEach((btn) => {
      btn.onclick = () => {
        const item = catalog.find((row) => row.id === btn.dataset.addId);
        if (!item) return;
        items.push({ equipmentId: item.id, name: item.displayName, equipmentName: item.name, type: item.type, serialNumber: item.serialNumber || '', unitNumber: item.unitNumber || null, pickedUp: true, returned: false });
        renderChecklist();
        renderResults();
      };
    });
  };

  search.oninput = renderResults;
  renderChecklist();
  renderResults();

  saveCheckoutBtn.onclick = async () => {
    try {
      if (directMode) {
        const form = new FormData(getEl('directCheckoutForm'));
        await createRental({
          renterName: form.get('renterName'),
          company: form.get('company'),
          email: form.get('email'),
          phone: form.get('phone'),
          pickupDate: form.get('pickupDate'),
          returnDate: form.get('returnDate'),
          notes: form.get('notes'),
          items,
          checkedOutAt: new Date().toISOString(),
        }, 'checked_out');
        await updateEquipmentStatusesForNewCheckout(items);
        setFlash({ notice: 'Direct checkout saved.' });
      } else {
        await updateRental(rental.id, { items, status: 'checked_out', checkedOutAt: new Date().toISOString() });
        setFlash({ notice: 'Checkout saved.' });
      }
      setRoute('/');
    } catch (error) {
      setFlash({ error: error.message || 'Failed to save checkout.' });
      render();
    }
  };
}

async function updateEquipmentStatusesForNewCheckout(items) {
  const batch = writeBatch(db);
  for (const item of items) {
    if (!item.equipmentId) continue;
    batch.update(doc(db, 'equipment', item.equipmentId), { status: item.pickedUp ? 'checked_out' : 'available', updatedAt: serverTimestamp() });
  }
  await batch.commit();
}

function setupDirectCheckout() {
  Promise.all([getAllEquipment()]).then(([catalog]) => {
    if (!isCurrentRoute('/checkout')) return;
    wireCheckoutEditor({ rental: null, items: [], catalog, directMode: true });
  }).catch((error) => {
    setHtmlIfPresent('checkoutDetails', `<section class="card error">${escapeHtml(error.message || 'Failed to load direct checkout.')}</section>`);
  });
}

function renderCheckin() {
  return shell(`
    <div class="page-header"><div><div class="eyebrow">Check-in</div><h2>Register returned equipment</h2><p>Tick off each item as it comes back.</p></div></div>
    <section class="card"><label>Select active checkout</label><select id="checkinRentalSelect"><option value="">Loading active checkouts…</option></select></section>
    <div id="checkinDetails"></div>
  `);
}

function setupCheckinPage() {
  const routeBase = '/checkin';
  const select = getEl('checkinRentalSelect');
  const details = getEl('checkinDetails');
  if (!select || !details) return;
  const bookingId = new URLSearchParams(location.hash.split('?')[1] || '').get('booking') || '';
  select.onchange = () => setRoute(select.value ? `/checkin?booking=${select.value}` : '/checkin');

  getRentalsByStatuses(['checked_out', 'partial_return']).then((rentals) => {
    if (!isCurrentRoute(routeBase)) return;
    const options = rentals.map((rental) => `<option value="${rental.id}" ${rental.id === bookingId ? 'selected' : ''}>${escapeHtml(rental.renterName)} — due ${escapeHtml(formatDate(rental.returnDate))}</option>`).join('');
    select.innerHTML = `<option value="">Choose a checkout…</option>${options}`;
  }).catch((error) => {
    select.innerHTML = '<option value="">Failed to load checkouts</option>';
    details.innerHTML = `<section class="card error">${escapeHtml(error.message || 'Failed to load active checkouts.')}</section>`;
  });

  if (!bookingId) {
    details.innerHTML = '<section class="card">Choose an active checkout to start check-in.</section>';
    return;
  }
  details.innerHTML = '<section class="card">Loading checkout details…</section>';
  getRentalById(bookingId).then((rental) => {
    if (!isCurrentRoute(routeBase)) return;
    if (!rental) {
      details.innerHTML = '<section class="card">Checkout not found.</section>';
      return;
    }
    const items = structuredClone(rental.items || []);
    details.innerHTML = `<section class="card stack"><div class="row spread"><div><h3>${escapeHtml(rental.renterName)}</h3><div class="muted small">Due ${escapeHtml(formatDate(rental.returnDate))}</div></div><div class="badge" id="checkinReturnedCount">${items.filter((i) => i.returned).length}/${items.length} returned</div></div><div class="checklist" id="checkinChecklist"></div><div class="row compact-row"><button class="primary slim" id="saveCheckinBtn">Save check-in</button></div></section>`;
    const list = getEl('checkinChecklist');
    const returnedCountEl = getEl('checkinReturnedCount');
    const saveCheckinBtn = getEl('saveCheckinBtn');
    const renderChecklist = () => {
      returnedCountEl.textContent = `${items.filter((i) => i.returned).length}/${items.length} returned`;
      list.innerHTML = items.map((item, index) => `
        <div class="check-row ${item.returned ? 'checked' : ''}">
          <input type="checkbox" data-return-index="${index}" ${item.returned ? 'checked' : ''} />
          <div><strong>${escapeHtml(item.name)}</strong><div class="muted small">${escapeHtml(item.serialNumber || item.type || 'No serial')}</div></div>
        </div>
      `).join('') || '<div class="muted">No items on this checkout.</div>';
      list.querySelectorAll('[data-return-index]').forEach((el) => {
        el.onchange = () => {
          const index = Number(el.dataset.returnIndex);
          items[index].returned = el.checked;
          renderChecklist();
        };
      });
    };
    renderChecklist();
    saveCheckinBtn.onclick = async () => {
      try {
        const allReturned = items.every((item) => item.returned);
        await updateRental(rental.id, { items, status: allReturned ? 'completed' : 'partial_return', checkedInAt: new Date().toISOString() });
        setFlash({ notice: allReturned ? 'Check-in completed.' : 'Partial return saved.' });
        setRoute('/');
      } catch (error) {
        setFlash({ error: error.message || 'Failed to save check-in.' });
        render();
      }
    };
  }).catch((error) => {
    details.innerHTML = `<section class="card error">${escapeHtml(error.message || 'Failed to load rental details.')}</section>`;
  });
}

function renderEquipment() {
  const { params } = getRouteInfo();
  const selectedGroup = params.get('group') || '';
  return shell(`
    <div class="page-header"><div><div class="eyebrow">Equipment</div><h2>Manage your equipment inventory</h2><p>Compact grouped list. Open a type to manage the individual units.</p></div></div>
    <section class="grid two equipment-top-grid">
      <form id="equipmentForm" class="card stack compact-card">
        <div><h3>Add new equipment type</h3><div class="muted small">Create a new equipment group and the first numbered units in one step.</div></div>
        <div class="grid two">
          <div><label>Name</label><input name="name" required /></div>
          <div><label>Type</label><input name="type" required /></div>
          <div><label>Amount</label><input type="number" min="1" name="amount" value="1" required /></div>
          <div><label>Manufacturer</label><input name="manufacturer" /></div>
          <div><label>Model</label><input name="model" /></div>
          <div><label>Description</label><input name="description" /></div>
        </div>
        <div><label>Notes</label><textarea name="notes"></textarea></div>
        <div class="row compact-row"><button class="primary slim" type="submit">Add equipment type</button></div>
      </form>
      <section class="card stack compact-card">
        <div><h3>Import XML</h3><div class="muted small">Supports common tags like name, type, amount, quantity, manufacturer and model.</div></div>
        <input type="file" id="xmlFileInput" accept=".xml,text/xml" />
        <div id="xmlPreview" class="muted small">No XML file selected.</div>
        <div class="row compact-row"><button class="secondary slim" id="importXmlBtn" type="button" disabled>Import XML</button></div>
      </section>
    </section>
    <section class="card stack compact-card">
      <div class="row spread"><div><h3>Equipment list</h3><div class="muted small">One row per equipment type with total and available counts.</div></div><input id="equipmentFilter" placeholder="Filter equipment" class="compact-input" /></div>
      <div class="list equipment-summary-list" id="equipmentGroupsList"><div class="muted">Loading inventory…</div></div>
    </section>
    <div id="equipmentModalHost" data-selected-group="${escapeHtml(selectedGroup)}"></div>
  `);
}

function equipmentGroupSummaryMarkup(group) {
  return `
    <article class="equipment-summary-row" data-filterable="${escapeHtml(`${group.name} ${group.type} ${group.manufacturer} ${group.model}`.toLowerCase())}">
      <button class="equipment-summary-button" type="button" data-open-group="${escapeHtml(group.key)}">
        <div class="equipment-summary-main compact-main">
          <div>
            <h3>${escapeHtml(group.name)}</h3>
            <div class="muted small">${escapeHtml([group.type, group.manufacturer, group.model].filter(Boolean).join(' • ') || 'No details')}</div>
          </div>
          <div class="equipment-summary-counts">
            <span class="badge">${group.amount} total</span>
            <span class="badge">${group.availableCount} available</span>
          </div>
        </div>
      </button>
    </article>
  `;
}

function equipmentModalMarkup(group) {
  return `
    <div class="modal-backdrop" id="equipmentModalClose"></div>
    <section class="modal-panel equipment-modal card stack">
      <div class="row spread"><div><div class="eyebrow">${escapeHtml(group.type)}</div><h3>${escapeHtml(group.name)}</h3><div class="muted small">${escapeHtml([group.manufacturer, group.model].filter(Boolean).join(' • ') || 'No manufacturer or model set')}</div></div><button class="ghost slim" type="button" id="equipmentBackBtn">Back</button></div>
      ${group.description ? `<div class="muted small">${escapeHtml(group.description)}</div>` : ''}
      ${group.notes ? `<div class="muted small">Notes: ${escapeHtml(group.notes)}</div>` : ''}
      <div class="row compact-row"><span class="badge">${group.amount} total</span><span class="badge">${group.availableCount} available</span></div>
      <form id="addUnitsForm" class="card stack subtle-card compact-card">
        <div><h4>Add more ${escapeHtml(group.name)}</h4><div class="muted small">New units continue the numbering automatically.</div></div>
        <div class="row compact-row add-units-row">
          <div class="inline-field"><label>Amount</label><input type="number" min="1" name="amount" value="1" required /></div>
          <button class="primary slim" type="submit">Add units</button>
        </div>
      </form>
      <div class="stack">
        <div class="row spread section-head"><h4>Individual units</h4><span class="muted small">Remove only the specific unit you no longer want.</span></div>
        <div class="equipment-unit-list">
          ${group.items.map((item) => `
            <div class="equipment-unit-row">
              <div>
                <strong>${escapeHtml(item.displayName)}</strong>
                <div class="muted small">${escapeHtml(item.status)}${item.location ? ` • ${escapeHtml(item.location)}` : ''}</div>
              </div>
              <button class="danger slim" type="button" data-delete-equipment="${item.id}">Remove</button>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function setupEquipmentPage() {
  const routeBase = '/equipment';
  let importRows = [];
  const { params } = getRouteInfo();
  const selectedGroup = params.get('group') || '';

  getEquipmentGroups().then((groups) => {
    if (!isCurrentRoute(routeBase)) return;
    const listEl = getEl('equipmentGroupsList');
    const modalHost = getEl('equipmentModalHost');
    listEl.innerHTML = groups.length ? groups.map((group) => equipmentGroupSummaryMarkup(group)).join('') : '<div class="muted">No equipment added yet.</div>';
    document.querySelectorAll('[data-open-group]').forEach((btn) => {
      btn.onclick = () => setRoute(`/equipment?group=${encodeURIComponent(btn.dataset.openGroup)}`);
    });

    const chosenGroup = groups.find((group) => group.key === selectedGroup);
    modalHost.innerHTML = chosenGroup ? equipmentModalMarkup(chosenGroup) : '';
    if (chosenGroup) {
      getEl('equipmentBackBtn').onclick = () => setRoute('/equipment');
      getEl('equipmentModalClose').onclick = () => setRoute('/equipment');
      document.querySelectorAll('[data-delete-equipment]').forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm('Remove this individual equipment item?')) return;
          try {
            await deleteEquipmentItem(btn.dataset.deleteEquipment);
            setFlash({ notice: 'Equipment item removed.' });
            render();
          } catch (error) {
            setFlash({ error: error.message || 'Failed to remove equipment item.' });
            render();
          }
        };
      });
      const addUnitsForm = getEl('addUnitsForm');
      addUnitsForm.onsubmit = async (event) => {
        event.preventDefault();
        const values = new FormData(addUnitsForm);
        try {
          await createEquipmentGroup({
            name: chosenGroup.name,
            type: chosenGroup.type,
            amount: values.get('amount'),
            manufacturer: chosenGroup.manufacturer,
            model: chosenGroup.model,
            description: chosenGroup.description,
            notes: chosenGroup.notes,
          });
          setFlash({ notice: `${chosenGroup.name} updated.` });
          render();
        } catch (error) {
          setFlash({ error: error.message || 'Failed to add equipment units.' });
          render();
        }
      };
    }
  }).catch((error) => {
    setHtmlIfPresent('equipmentGroupsList', '<div class="error">Failed to load inventory.</div>');
    setHtmlIfPresent('equipmentModalHost', `<div class="error">${escapeHtml(error.message || 'Failed to load equipment details.')}</div>`);
  });

  const form = getEl('equipmentForm');
  const xmlInput = getEl('xmlFileInput');
  const xmlPreview = getEl('xmlPreview');
  const importBtn = getEl('importXmlBtn');
  const filterInput = getEl('equipmentFilter');
  form.onsubmit = async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    try {
      await createEquipmentGroup(Object.fromEntries(values.entries()));
      setFlash({ notice: 'Equipment added successfully.' });
      render();
    } catch (error) {
      setFlash({ error: error.message || 'Failed to add equipment.' });
      render();
    }
  };

  xmlInput.onchange = async () => {
    const file = xmlInput.files?.[0];
    if (!file) return;
    try {
      importRows = parseEquipmentXml(await file.text());
      xmlPreview.textContent = `Loaded ${importRows.length} equipment rows from ${file.name}.`;
      importBtn.disabled = false;
    } catch (error) {
      importRows = [];
      importBtn.disabled = true;
      xmlPreview.textContent = error.message || 'Failed to read XML.';
    }
  };

  importBtn.onclick = async () => {
    try {
      await importEquipmentRows(importRows);
      setFlash({ notice: `XML import completed. Imported ${importRows.length} rows.` });
      render();
    } catch (error) {
      setFlash({ error: error.message || 'Failed to import XML.' });
      render();
    }
  };

  filterInput.oninput = () => {
    const q = filterInput.value.trim().toLowerCase();
    document.querySelectorAll('[data-filterable]').forEach((el) => {
      el.classList.toggle('hidden', q && !el.dataset.filterable.includes(q));
    });
  };
}

async function renderRoute() {
  switch (state.route.split('?')[0]) {
    case '/booking': return renderBooking();
    case '/checkout': return renderCheckout();
    case '/checkin': return renderCheckin();
    case '/equipment': return renderEquipment();
    case '/':
    default: return renderDashboard();
  }
}

function setupRoute() {
  const logoutBtn = getEl('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await signOut(auth);
      setFlash({ notice: 'Logged out.' });
      render();
    };
  }
  switch (state.route.split('?')[0]) {
    case '/booking': setupBookingPage(); break;
    case '/checkout': setupCheckoutPage(); break;
    case '/checkin': setupCheckinPage(); break;
    case '/equipment': setupEquipmentPage(); break;
    default: setupDashboardPage(); break;
  }
}

async function render() {
  state.route = getRoute();
  const appEl = getEl('app');
  if (!state.user) {
    renderLogin();
    return;
  }
  try {
    appEl.innerHTML = await renderRoute();
    setupRoute();
  } catch (error) {
    appEl.innerHTML = shell(`<div class="error">${escapeHtml(error.message || 'Something went wrong while loading the page.')}</div>`);
    setupRoute();
  }
}

window.addEventListener('hashchange', () => {
  state.route = getRoute();
  render();
});

onAuthStateChanged(auth, (user) => {
  state.user = user;
  render();
});
