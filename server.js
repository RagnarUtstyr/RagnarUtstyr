import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_4kINWig7n6YqB11yM2M-EuxGNz5uekI",
  authDomain: "roll202-c0b0d.firebaseapp.com",
  databaseURL: "https://roll202-c0b0d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "roll202-c0b0d",
  storageBucket: "roll202-c0b0d.appspot.com",
  messagingSenderId: "607661730400",
  appId: "1:607661730400:web:b4b3f97a12cfae373e7105",
  measurementId: "G-6X5L39W56C"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function submitData() {
  const name = document.getElementById('name')?.value?.trim();
  const numberInput = document.getElementById('initiative') || document.getElementById('number');
  const number = numberInput ? parseInt(numberInput.value, 10) : null;

  const healthInput = document.getElementById('health');
  const health = healthInput && healthInput.value !== '' ? parseInt(healthInput.value, 10) : null;

  const grdInput = document.getElementById('grd');
  const resInput = document.getElementById('res');
  const tghInput = document.getElementById('tgh');

  const grd = grdInput ? (grdInput.value !== '' ? parseInt(grdInput.value, 10) : null) : undefined;
  const res = resInput ? (resInput.value !== '' ? parseInt(resInput.value, 10) : null) : undefined;
  const tgh = tghInput ? (tghInput.value !== '' ? parseInt(tghInput.value, 10) : null) : undefined;

  if (!name || Number.isNaN(number)) {
    console.log('Please enter a valid name and initiative number.');
    return;
  }

  try {
    const entry = { name, number };
    if (health !== null && !Number.isNaN(health)) entry.health = health;
    if (grd !== undefined && !Number.isNaN(grd)) entry.grd = grd;
    if (res !== undefined && !Number.isNaN(res)) entry.res = res;
    if (tgh !== undefined && !Number.isNaN(tgh)) entry.tgh = tgh;

    const rankingsRef = ref(db, 'rankings/');
    const monsterRef = ref(db, 'OpenLegendMonster/');

    await push(rankingsRef, entry);
    await push(monsterRef, entry);
    console.log('Data submitted to rankings and OpenLegendMonster:', entry);

    document.getElementById('name').value = '';
    if (numberInput) numberInput.value = '';
    if (healthInput) healthInput.value = '';
    if (grdInput) grdInput.value = '';
    if (resInput) resInput.value = '';
    if (tghInput) tghInput.value = '';

    const swordSound = document.getElementById('sword-sound');
    if (swordSound) swordSound.play();
  } catch (error) {
    console.error('Error submitting data:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit-button')?.addEventListener('click', submitData);
});
