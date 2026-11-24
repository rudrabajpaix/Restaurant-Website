/* CANADIAN PIZZA BURGER - menu, cart, WhatsApp order */

const R = RESTAURANT;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let foods = [];
let category = "All";
let cart = [];
try { cart = JSON.parse(localStorage.getItem("cpb-cart2")) || []; } catch (e) { cart = []; }
if (!Array.isArray(cart)) cart = [];

const saveCart = () => {
    try { localStorage.setItem("cpb-cart2", JSON.stringify(cart)); } catch (e) {}
};

// ---------- RESTAURANT DETAILS ----------
function renderInfo() {
    $("contact-info").innerHTML = `
        <div><h3>📞 Phone</h3><a href="tel:${esc(R.phone)}">${esc(R.phone)}</a></div>
        <div><h3>💬 WhatsApp</h3><a href="https://wa.me/${esc(R.whatsapp)}" target="_blank" rel="noopener">Chat with us</a></div>
        <div><h3>📍 Address</h3>${esc(R.address)}</div>
        <div><h3>🕒 Opening Hours</h3>${esc(R.hours)}</div>`;
    if (R.mapEmbed) {
        $("map").innerHTML = `<iframe src="${esc(R.mapEmbed)}" loading="lazy" title="Restaurant location"></iframe>`;
    }
    $("map-link").href = R.mapLink;
}

// ---------- MENU ----------
function renderCategories() {
    const cats = ["All", ...new Set(foods.map(f => f.category))];
    $("category-list").innerHTML = cats.map(c =>
        `<button class="category-button ${c === category ? "active" : ""}" data-category="${esc(c)}">${c === "All" ? "All Items" : esc(c)}</button>`
    ).join("");
}

function renderFoods() {
    const q = $("search-input").value.trim().toLowerCase();
    const list = foods.filter(f =>
        (category === "All" || f.category === category) &&
        (f.name.toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q)));

    $("no-results").hidden = list.length !== 0;
    $("food-grid").innerHTML = list.map(f => `
        <article class="food-card ${f.available === false ? "sold-out" : ""}">
            <img src="${esc(f.image)}" alt="${esc(f.name)}" loading="lazy">
            <div class="food-info">
                <span class="food-tag">${esc(f.tag)}</span>
                <h3>${esc(f.name)}</h3>
                <p>${esc(f.description)}</p>
                <div class="food-bottom">
                    <span class="food-price">₹${Number(f.price)}</span>
                    <button class="add-button" data-add="${esc(f.id)}" ${f.available === false ? "disabled" : ""}>
                        ${f.available === false ? "Sold out" : "+ Add"}
                    </button>
                </div>
            </div>
        </article>`).join("");
}

$("category-list").addEventListener("click", e => {
    const b = e.target.closest("[data-category]");
    if (!b) return;
    category = b.dataset.category;
    renderCategories();
    renderFoods();
});
$("search-input").addEventListener("input", renderFoods);

$("food-grid").addEventListener("click", e => {
    const b = e.target.closest("[data-add]");
    if (!b || b.disabled) return;
    const food = foods.find(f => f.id === b.dataset.add);
    if (!food) return;

    const item = cart.find(i => i.id === food.id);
    if (item) item.quantity++;
    else cart.push({ id: food.id, name: food.name, price: Number(food.price), quantity: 1 });

    saveCart();
    updateCart();
    b.textContent = "Added ✓";
    setTimeout(() => { b.textContent = "+ Add"; }, 700);
});

// ---------- CART ----------
function deliveryFee(subtotal) {
    if (subtotal === 0 || subtotal >= R.freeDeliveryAbove) return 0;
    return R.deliveryCharge;
}

function getTotals() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const delivery = deliveryFee(subtotal);
    return { subtotal, delivery, total: subtotal + delivery };
}

function updateCart() {
    // Menu me jo item ab nahi hai ya sold out hai, cart se hata do; price taaza rakho
    cart = cart.filter(i => {
        const f = foods.find(x => x.id === i.id);
        if (!f || f.available === false) return false;
        i.price = Number(f.price);
        return true;
    });

    const { subtotal, delivery, total } = getTotals();

    $("cart-items").innerHTML = cart.length === 0
        ? '<p class="empty-cart">Your cart is empty. Add some delicious food!</p>'
        : cart.map(i => `
            <div class="cart-row">
                <div>
                    <h3>${esc(i.name)}</h3>
                    <p>₹${i.price} each</p>
                    <div class="quantity-controls">
                        <button data-minus="${esc(i.id)}" aria-label="Decrease quantity">−</button>
                        <strong>${i.quantity}</strong>
                        <button data-plus="${esc(i.id)}" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="remove-button" data-remove="${esc(i.id)}">Remove item</button>
                </div>
                <strong>₹${i.price * i.quantity}</strong>
            </div>`).join("");

    $("cart-count").textContent = cart.reduce((s, i) => s + i.quantity, 0);
    $("cart-subtotal").textContent = "₹" + subtotal;
    $("delivery-charge").textContent = subtotal === 0 ? "₹0" : (delivery === 0 ? "FREE" : "₹" + delivery);
    $("cart-total").textContent = "₹" + total;
    $("checkout-total").textContent = "₹" + total;
    $("checkout-button").disabled = cart.length === 0;
    saveCart();
}

$("cart-items").addEventListener("click", e => {
    const plus = e.target.closest("[data-plus]");
    const minus = e.target.closest("[data-minus]");
    const remove = e.target.closest("[data-remove]");

    if (plus) {
        const item = cart.find(i => i.id === plus.dataset.plus);
        if (item) item.quantity++;
    }
    if (minus) {
        const item = cart.find(i => i.id === minus.dataset.minus);
        if (item && --item.quantity <= 0) cart = cart.filter(i => i.id !== item.id);
    }
    if (remove) cart = cart.filter(i => i.id !== remove.dataset.remove);
    updateCart();
});

$("clear-cart").addEventListener("click", () => { cart = []; updateCart(); });

const drawer = $("cart-drawer");
const cartOverlay = $("cart-overlay");
const openCart = () => { drawer.classList.add("open"); cartOverlay.classList.add("show"); };
const closeCart = () => { drawer.classList.remove("open"); cartOverlay.classList.remove("show"); };
$("open-cart").addEventListener("click", openCart);
$("close-cart").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// ---------- CHECKOUT ----------
const checkoutOverlay = $("checkout-overlay");
const closeCheckout = () => checkoutOverlay.classList.remove("show");

$("checkout-button").addEventListener("click", () => {
    if (cart.length === 0) return;
    closeCart();
    checkoutOverlay.classList.add("show");
});
$("close-checkout").addEventListener("click", closeCheckout);

// ---------- PLACE ORDER ON WHATSAPP ----------
$("checkout-form").addEventListener("submit", e => {
    e.preventDefault();
    if (cart.length === 0) return;

    const name = $("customer-name").value.trim();
    const phone = $("customer-phone").value.trim();
    const address = $("customer-address").value.trim();
    const notes = $("customer-notes").value.trim();
    if (!name || !phone || !address) {
        alert("Please fill in all required details.");
        return;
    }

    const { subtotal, delivery, total } = getTotals();
    const orderId = "CPB" + Date.now().toString().slice(-6);

    const lines = cart.map((i, n) =>
        (n + 1) + ". " + i.name + " x " + i.quantity + " = ₹" + (i.price * i.quantity)).join("\n");

    const message =
        "🍕 *NEW ORDER - " + orderId + "*\n\n" +
        "*Items:*\n" + lines + "\n\n" +
        "Subtotal: ₹" + subtotal + "\n" +
        "Delivery: " + (delivery === 0 ? "FREE" : "₹" + delivery) + "\n" +
        "*Total: ₹" + total + "*\n\n" +
        "*Customer Details*\n" +
        "Name: " + name + "\n" +
        "Mobile: " + phone + "\n" +
        "Address: " + address + "\n" +
        (notes ? "Notes: " + notes + "\n" : "") +
        "\nPayment: Cash on Delivery";

    const url = "https://wa.me/" + R.whatsapp + "?text=" + encodeURIComponent(message);

    // WhatsApp pehle kholo (mobile popup blocker se bachne ke liye), phir order save karo
    const win = window.open(url, "_blank");
    if (!win) window.location.href = url;

    Store.addOrder({
        id: orderId, name, phone, address, notes,
        items: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
        subtotal, delivery, total,
        status: "New", created: Date.now()
    }).catch(err => console.warn("Order save failed:", err));

    closeCheckout();
    $("success-message").textContent =
        "Thank you, " + name + "! Aapka order number " + orderId +
        " hai. WhatsApp me Send button dabana mat bhoolna, tabhi order restaurant tak pahunchega.";
    $("success-overlay").classList.add("show");

    cart = [];
    updateCart();
    $("checkout-form").reset();
});

$("finish-order").addEventListener("click", () => {
    $("success-overlay").classList.remove("show");
    $("menu").scrollIntoView({ behavior: "smooth" });
});

// ---------- START ----------
async function start() {
    document.title = R.name + " | Order Online";
    renderInfo();
    try { foods = await Store.menu(); } catch (e) { console.warn("Menu load failed:", e); }
    if (!foods.length) foods = DEFAULT_MENU;
    renderCategories();
    renderFoods();
    updateCart();
}
start();
