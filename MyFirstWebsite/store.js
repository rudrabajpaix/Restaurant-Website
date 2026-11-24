/* DATA LAYER - menu, orders, admin login
   Firebase set hai to live database; nahi to demo mode (localStorage). */

const LIVE = !FIREBASE_CONFIG.apiKey.startsWith("YOUR_");
let db, auth;
if (LIVE) {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    auth = firebase.auth();
}

const ls = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
};
const lsSet = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
};

const Store = {
    // ---- MENU ----
    async menu() {
        if (!LIVE) return ls("cpb-menu", DEFAULT_MENU);
        const snap = await db.collection("menu").get();
        return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async saveItem(item) {
        if (!item.id) item.id = "i" + Date.now();
        if (LIVE) {
            await db.collection("menu").doc(item.id).set(item);
        } else {
            const list = ls("cpb-menu", DEFAULT_MENU).filter(i => i.id !== item.id);
            list.push(item);
            lsSet("cpb-menu", list);
        }
    },
    async deleteItem(id) {
        if (LIVE) await db.collection("menu").doc(id).delete();
        else lsSet("cpb-menu", ls("cpb-menu", DEFAULT_MENU).filter(i => i.id !== id));
    },
    async seed() {
        for (const item of DEFAULT_MENU) await Store.saveItem({ ...item });
    },

    // ---- ORDERS ----
    async addOrder(order) {
        if (LIVE) {
            await db.collection("orders").doc(order.id).set(order);
        } else {
            const list = ls("cpb-orders", []);
            list.unshift(order);
            lsSet("cpb-orders", list);
        }
    },
    watchOrders(callback) {
        if (!LIVE) { callback(ls("cpb-orders", [])); return; }
        db.collection("orders").orderBy("created", "desc").limit(100)
            .onSnapshot(snap => callback(snap.docs.map(d => d.data())));
    },
    async setStatus(id, status) {
        if (LIVE) {
            await db.collection("orders").doc(id).update({ status });
        } else {
            const list = ls("cpb-orders", []);
            list.forEach(o => { if (o.id === id) o.status = status; });
            lsSet("cpb-orders", list);
        }
    },

    // ---- ADMIN LOGIN ----
    onAuth(callback) {
        if (!LIVE) { callback(true); return; }
        auth.onAuthStateChanged(user => callback(!!user));
    },
    login(email, password) { return auth.signInWithEmailAndPassword(email, password); },
    logout() { if (LIVE) auth.signOut(); }
};