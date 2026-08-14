// ===== CONFIG PAR DÉFAUT DES RAPPELS =====
const DEFAULT_REMINDERS = {
  sommeil:  { enabled: true, hour: 8,  minute: 0,  label: "💤 Note ton sommeil de la nuit" },
  fatigue:  { enabled: true, hour: 8,  minute: 5,  label: "🔋 Note ton niveau de fatigue" },
  stress:   { enabled: true, hour: 8,  minute: 10, label: "🧠 Note ton niveau de stress" },
  seance:   { enabled: true, hour: 18, minute: 0,  label: "🏋️ N'oublie pas ta séance prévue !" }
};

const STORAGE_KEY = 'reminders_config';
const LOG_KEY = 'reminders_last_sent';

// ===== GESTION CONFIG =====
function getRemindersConfig() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : structuredClone(DEFAULT_REMINDERS);
}

function saveRemindersConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function getLastSentLog() {
  const saved = localStorage.getItem(LOG_KEY);
  return saved ? JSON.parse(saved) : {};
}

function markAsSent(key) {
  const log = getLastSentLog();
  log[key] = new Date().toISOString().split('T')[0]; // date du jour YYYY-MM-DD
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

function alreadySentToday(key) {
  const log = getLastSentLog();
  const today = new Date().toISOString().split('T')[0];
  return log[key] === today;
}

// ===== PERMISSION =====
async function requestNotifPermission() {
  if (!('Notification' in window)) {
    alert("Les notifications ne sont pas supportées sur ce navigateur.");
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    alert("Notifications bloquées. Active-les dans les réglages de ton navigateur/téléphone.");
    return false;
  }
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ===== ENVOI D'UNE NOTIF =====
async function sendNotification(title, body) {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) {
    reg.showNotification(title, {
      body: body,
      icon: './images/icon-192.png',
      badge: './images/icon-192.png',
      vibrate: [200, 100, 200],
      tag: title, // évite les doublons empilés
    });
  } else if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

// ===== VÉRIFICATION DES RAPPELS =====
function checkReminders() {
  if (Notification.permission !== 'granted') return;

  const config = getRemindersConfig();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const [key, reminder] of Object.entries(config)) {
    if (!reminder.enabled) continue;
    if (alreadySentToday(key)) continue;

    const reminderMinutes = reminder.hour * 60 + reminder.minute;

    // Si l'heure actuelle a dépassé l'heure du rappel (tolérance de la journée)
    if (currentMinutes >= reminderMinutes) {
      sendNotification("Sporlando", reminder.label);
      markAsSent(key);
    }
  }
}

// ===== INIT =====
function initReminders() {
  // Vérifie immédiatement au chargement de l'app
  checkReminders();

  // Vérifie toutes les minutes tant que l'app est ouverte/visible
  setInterval(checkReminders, 60 * 1000);

  // Vérifie aussi quand l'app redevient visible (retour au premier plan)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkReminders();
    }
  });
}