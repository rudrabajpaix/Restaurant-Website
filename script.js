const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const money = value => "₹" + Math.round(Number(value) || 0).toLocaleString("en-IN");
const statuses = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered"];
const restaurantDetails = () => ({ ...RESTAURANT, ...Store.settings().restaurant });
let menuItems = Store.menu();
let activeCategory = "All";
let cart = Store.cart();
let appliedCoupon = localStorage.getItem("saffron-stone-coupon") || "";
let toastTimer;

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function saveCart() {
    try {
        Store.saveCart(cart);
        localStorage.setItem("saffron-stone-coupon", appliedCoupon);
    } catch (error) {
        console.error("Could not save your bag:", error);
        showToast("Your browser could not save the bag. Check available storage and try again.");
    }
}

function renderCategories() {
    const categories = ["All", ...new Set(menuItems.map(item => item.category))];
    if (!categories.includes(activeCategory)) activeCategory = "All";
    $("category-list").innerHTML = categories.map(category => `
        <button class="category-button${category === activeCategory ? " active" : ""}" type="button" data-category="${escapeHTML(category)}" aria-pressed="${category === activeCategory}">
            ${category === "All" ? "All plates" : escapeHTML(category)}
        </button>`).join("");
}

function renderMenu() {
    const query = $("search-input").value.trim().toLocaleLowerCase();
    const maxPrice = Number($("price-range").value);
    const sort = $("sort-select").value;
    let visibleItems = menuItems.filter(item =>
        (activeCategory === "All" || item.category === activeCategory) &&
        Number(item.price) <= maxPrice &&
        `${item.name} ${item.description} ${item.category} ${item.type}`.toLocaleLowerCase().includes(query)
    );
    if (sort === "price-low") visibleItems.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-high") visibleItems.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") visibleItems.sort((a, b) => a.name.localeCompare(b.name));

    $("price-value").textContent = money(maxPrice);
    $("menu-result-count").textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "plate" : "plates"} to make your day`;
    $("no-results").hidden = visibleItems.length > 0;
    $("food-grid").innerHTML = visibleItems.map((item, index) => `
        <article class="food-card${item.available === false ? " sold-out" : ""}" style="animation-delay:${Math.min(index * 35, 280)}ms">
            <div class="food-image">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" loading="lazy">
                ${item.tag ? `<span class="food-tag">${escapeHTML(item.tag)}</span>` : ""}
                <span class="food-type${item.type === "non-veg" ? " non-veg" : ""}" role="img" aria-label="${item.type === "non-veg" ? "Non-vegetarian" : "Vegetarian"}"></span>
                ${item.available === false ? '<span class="sold-out-label">SOLD OUT</span>' : ""}
            </div>
            <div class="food-info">
                <div class="food-title-row"><h3>${escapeHTML(item.name)}</h3><span class="food-price">${money(item.price)}</span></div>
                <p>${escapeHTML(item.description)}</p>
                <div class="food-bottom"><span class="food-category">${escapeHTML(item.category)}</span><button class="add-button" type="button" data-add="${escapeHTML(item.id)}" ${item.available === false ? "disabled" : ""}>${item.available === false ? "Unavailable" : "+ Add"}</button></div>
            </div>
        </article>`).join("");
}

function currentMenuItem(id) {
    return menuItems.find(item => item.id === id);
}

function addToCart(id) {
    const item = currentMenuItem(id);
    if (!item || item.available === false) {
        showToast("This plate is not available right now.");
        return;
    }
    const existing = cart.find(row => row.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ id: item.id, quantity: 1 });
    saveCart();
    renderCart();
    showToast(`${item.name} added to your bag.`);
}

function couponDiscount(subtotal) {
    if (!appliedCoupon) return { amount: 0, coupon: null };
    const coupon = Store.settings().coupons.find(item => item.code.toUpperCase() === appliedCoupon && item.active);
    if (!coupon || subtotal < Number(coupon.minimum || 0)) return { amount: 0, coupon: null };
    const amount = coupon.kind === "fixed" ? Number(coupon.value) : subtotal * Number(coupon.value) / 100;
    return { amount: Math.min(subtotal, amount), coupon };
}

function calculateTotals() {
    const subtotal = cart.reduce((sum, row) => {
        const item = currentMenuItem(row.id);
        return item && item.available !== false ? sum + Number(item.price) * row.quantity : sum;
    }, 0);
    const { amount: discount, coupon } = couponDiscount(subtotal);
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * RESTAURANT.taxRate);
    const fulfilment = document.querySelector('input[name="fulfilment"]:checked')?.value || "Delivery";
    const restaurant = restaurantDetails();
    const delivery = subtotal === 0 || fulfilment === "Takeaway" || subtotal >= restaurant.freeDeliveryAbove ? 0 : restaurant.deliveryCharge;
    return { subtotal, discount, tax, delivery, total: taxable + tax + delivery, coupon };
}

function renderCart() {
    cart = cart.filter(row => {
        const item = currentMenuItem(row.id);
        return item && item.available !== false && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 99;
    });
    const totals = calculateTotals();
    const count = cart.reduce((sum, row) => sum + row.quantity, 0);
    $("cart-count").textContent = count;
    $("drawer-count").textContent = count;
    $("cart-items").innerHTML = cart.length ? cart.map(row => {
        const item = currentMenuItem(row.id);
        return `<div class="cart-row">
            <img src="${escapeHTML(item.image)}" alt="">
            <div><h3>${escapeHTML(item.name)}</h3><p>${money(item.price)} each</p>
                <div class="quantity-controls"><button type="button" data-minus="${escapeHTML(row.id)}" aria-label="Decrease ${escapeHTML(item.name)} quantity">−</button><strong>${row.quantity}</strong><button type="button" data-plus="${escapeHTML(row.id)}" aria-label="Increase ${escapeHTML(item.name)} quantity">+</button><button type="button" class="remove-button" data-remove="${escapeHTML(row.id)}">Remove</button></div>
            </div><strong>${money(Number(item.price) * row.quantity)}</strong>
        </div>`;
    }).join("") : '<p class="empty-cart">Your bag is taking a little breather.<br>Add something lovely from the menu.</p>';
    $("cart-subtotal").textContent = money(totals.subtotal);
    $("cart-tax").textContent = money(totals.tax);
    $("delivery-charge").textContent = totals.delivery ? money(totals.delivery) : (totals.subtotal ? "FREE" : money(0));
    $("cart-discount").textContent = "−" + money(totals.discount);
    $("discount-row").hidden = totals.discount <= 0;
    $("cart-total").textContent = money(totals.total);
    $("checkout-total").textContent = money(totals.total);
    $("checkout-button").disabled = cart.length === 0;
    $("coupon-code").value = appliedCoupon;
    if (appliedCoupon && !totals.coupon && totals.subtotal > 0) {
        const coupon = Store.settings().coupons.find(item => item.code.toUpperCase() === appliedCoupon);
        $("coupon-feedback").textContent = coupon ? `Add ${money(Math.max(0, Number(coupon.minimum) - totals.subtotal))} more to use this code.` : "This code is no longer available.";
    } else if (totals.coupon) {
        $("coupon-feedback").textContent = `${totals.coupon.code} applied — you saved ${money(totals.discount)}.`;
    } else {
        $("coupon-feedback").textContent = "";
    }
    saveCart();
}

function setDialogVisible(element, visible) {
    element.classList.toggle("show", visible);
    element.setAttribute("aria-hidden", String(!visible));
    document.body.classList.toggle("no-scroll", visible || $("cart-drawer").classList.contains("open"));
}

function openCart() {
    $("cart-drawer").classList.add("open");
    $("cart-overlay").classList.add("show");
    $("cart-drawer").setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
}

function closeCart() {
    $("cart-drawer").classList.remove("open");
    $("cart-overlay").classList.remove("show");
    $("cart-drawer").setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
}

function formatTime(value) {
    if (!value) return "—";
    const [hour, minute] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function scheduleFor(date) {
    const settings = Store.settings();
    const todayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const regular = settings.hours.find(row => row.day === todayName);
    const special = settings.closedDates.find(row => typeof row === "object" && row.date === dateKey(date));
    if (special) {
        if (special.closed) return { closed: true, label: special.label || "Holiday closure" };
        if (special.open && special.close) return { open: special.open, close: special.close, label: special.label || "Special hours" };
    }
    if (settings.closedDates.includes(dateKey(date))) return { closed: true, label: "Holiday closure" };
    return regular ? { open: regular.open, close: regular.close } : { closed: true };
}

function isTemporarilyClosed() {
    return Store.settings().temporaryClosure;
}

function openingState(now = new Date()) {
    const schedule = scheduleFor(now);
    if (isTemporarilyClosed()) {
        return { open: false, schedule, message: "Temporarily closed · check back soon" };
    }
    const minuteNow = now.getHours() * 60 + now.getMinutes();
    const opening = schedule.open ? Number(schedule.open.slice(0, 2)) * 60 + Number(schedule.open.slice(3)) : 0;
    const closing = schedule.close ? Number(schedule.close.slice(0, 2)) * 60 + Number(schedule.close.slice(3)) : 0;
    const open = !isTemporarilyClosed() && !schedule.closed && minuteNow >= opening && minuteNow < closing;
    if (open) return { open, schedule, message: `Open now · until ${formatTime(schedule.close)}` };
    for (let offset = 0; offset < 8; offset++) {
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + offset);
        const nextSchedule = scheduleFor(nextDate);
        if (nextSchedule.closed || !nextSchedule.open) continue;
        const nextOpen = Number(nextSchedule.open.slice(0, 2)) * 60 + Number(nextSchedule.open.slice(3));
        if (offset > 0 || nextOpen > minuteNow) {
            const label = offset === 0 ? "today" : offset === 1 ? "tomorrow" : nextDate.toLocaleDateString("en-US", { weekday: "long" });
            return { open, schedule, message: `Closed · opens ${label} at ${formatTime(nextSchedule.open)}` };
        }
    }
    return { open: false, schedule, message: "Currently closed" };
}

function renderHours() {
    const state = openingState();
    const dot = document.querySelector(".hero-meta .live-dot");
    dot.classList.toggle("closed", !state.open);
    $("hero-open-status").textContent = state.message;
    $("reservation-open-status").textContent = state.open ? state.message : state.message;
    $("open-pill").textContent = state.open ? "OPEN NOW" : "CLOSED NOW";
    $("open-pill").classList.toggle("is-closed", !state.open);
    $("today-hours").textContent = state.schedule.closed
        ? `Today's hours: Closed${state.schedule.label ? ` · ${state.schedule.label}` : ""}`
        : `Today's hours: ${formatTime(state.schedule.open)} – ${formatTime(state.schedule.close)}`;
    $("weekly-hours").innerHTML = Store.settings().hours.map(row => {
        const isToday = row.day === new Date().toLocaleDateString("en-US", { weekday: "long" });
        return `<div class="${isToday ? "today" : ""}"><span>${escapeHTML(row.day)}${isToday ? " · Today" : ""}</span><span>${formatTime(row.open)} – ${formatTime(row.close)}</span></div>`;
    }).join("");
}

function renderRestaurantDetails() {
    const details = restaurantDetails();
    const digits = String(details.whatsapp).replace(/\D/g, "");
    const phoneLink = `tel:${String(details.phone).replace(/[^\d+]/g, "")}`;
    const emailLink = `mailto:${details.email}`;
    $("restaurant-address").textContent = details.address;
    $("restaurant-phone").textContent = details.phone;
    $("restaurant-phone").href = phoneLink;
    $("reservation-phone").href = phoneLink;
    $("reservation-phone").innerHTML = `Rather call? ${escapeHTML(details.phone)} <span>→</span>`;
    $("reservation-whatsapp").href = `https://wa.me/${digits}?text=${encodeURIComponent(`Hello ${details.name}, I'd like to enquire about a table reservation.`)}`;
    $("restaurant-email").textContent = details.email;
    $("restaurant-email").href = emailLink;
    $("directions-link").href = /^https?:\/\//i.test(details.mapLink) ? details.mapLink : RESTAURANT.mapLink;
    $("restaurant-map").src = `https://maps.google.com/maps?q=${encodeURIComponent(details.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    $("contact-whatsapp").href = `https://wa.me/${digits}`;
    $("whatsapp-float").href = `https://wa.me/${digits}?text=${encodeURIComponent(`Hello ${details.name}, I'd love to know more.`)}`;
    if (/^https?:\/\//i.test(details.instagram || "")) $("instagram-link").href = details.instagram;
    if (/^https?:\/\//i.test(details.facebook || "")) $("facebook-link").href = details.facebook;
}

function makeTimeOptions(dateValue) {
    const select = $("reservation-time");
    const date = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
    const schedule = scheduleFor(date);
    if (isTemporarilyClosed() || schedule.closed || !schedule.open || !schedule.close) {
        select.innerHTML = '<option value="">We are closed on this date</option>';
        return;
    }
    const start = Number(schedule.open.slice(0, 2)) * 60 + Number(schedule.open.slice(3));
    const end = Number(schedule.close.slice(0, 2)) * 60 + Number(schedule.close.slice(3));
    const today = dateKey(date) === dateKey(new Date());
    const now = new Date();
    const earliestToday = Math.ceil((now.getHours() * 60 + now.getMinutes() + 30) / 30) * 30;
    const options = [];
    for (let minutes = start; minutes < end; minutes += 30) {
        if (today && minutes < earliestToday) continue;
        const value = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
        options.push(`<option value="${value}">${formatTime(value)}</option>`);
    }
    select.innerHTML = options.length ? '<option value="">Choose a time</option>' + options.join("") : '<option value="">No more times today</option>';
}

function reservationAllowed(dateValue, timeValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    if (!dateValue || Number.isNaN(date.valueOf()) || dateKey(date) < dateKey(new Date())) return false;
    const schedule = scheduleFor(date);
    if (isTemporarilyClosed() || schedule.closed || !schedule.open || !schedule.close) return false;
    return timeValue >= schedule.open && timeValue < schedule.close;
}

function renderTrack(order) {
    const statusIndex = Math.max(0, statuses.indexOf(order.status));
    $("order-track").innerHTML = `<strong>ORDER ${escapeHTML(order.id)} · ${escapeHTML(order.status)}</strong><div class="track-steps">${statuses.map((status, index) => `<span class="track-step${index <= statusIndex ? " done" : ""}">${status}</span>`).join("")}</div>`;
}

function handleCheckout(event) {
    event.preventDefault();
    if (!cart.length) {
        showToast("Add a plate to your bag before checking out.");
        return;
    }
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const fulfilment = data.get("fulfilment");
    const address = fulfilment === "Delivery" ? String(data.get("address")).trim() : "Restaurant takeaway";
    const totals = calculateTotals();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderId = `SS-${datePart}-${randomPart}`;
    const order = {
        id: orderId,
        name: String(data.get("name")).trim(),
        phone: String(data.get("phone")).trim(),
        email: String(data.get("email")).trim(),
        address,
        notes: String(data.get("notes") || "").trim(),
        fulfilment,
        payment: "Cash on delivery / pickup",
        items: cart.map(row => {
            const item = currentMenuItem(row.id);
            return { id: row.id, name: item.name, quantity: row.quantity, price: Number(item.price) };
        }),
        ...totals,
        couponCode: totals.coupon ? totals.coupon.code : "",
        status: "Pending",
        created: Date.now()
    };
    try {
        Store.saveOrder(order);
    } catch (error) {
        console.error("Could not save demo order:", error);
        showToast("We couldn't save this demo order. Your bag is still here; please try again.");
        return;
    }

    const message = [
        `Hello ${RESTAURANT.name}! I'd like to enquire about this demo order ${order.id}:`,
        ...order.items.map(item => `• ${item.name} × ${item.quantity} — ${money(item.price * item.quantity)}`),
        `Subtotal: ${money(order.subtotal)}`,
        `Tax: ${money(order.tax)}`,
        `Delivery: ${order.delivery ? money(order.delivery) : "Free / takeaway"}`,
        order.discount ? `Discount: −${money(order.discount)} (${order.couponCode})` : "",
        `Total: ${money(order.total)}`,
        `Name: ${order.name}`,
        `Mobile: ${order.phone}`,
        `Fulfilment: ${order.fulfilment}`,
        `Address: ${order.address}`,
        order.notes ? `Note: ${order.notes}` : "",
        "This WhatsApp message is an enquiry; the demo order is not yet confirmed."
    ].filter(Boolean).join("\n");
    $("share-order").href = `https://wa.me/${String(restaurantDetails().whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    $("success-message").textContent = `Thanks, ${order.name}. Demo order ${order.id} is saved in this browser as Pending. No payment has been taken and the restaurant has not received it.`;
    renderTrack(order);
    setDialogVisible($("checkout-overlay"), false);
    setDialogVisible($("success-overlay"), true);
    cart = [];
    appliedCoupon = "";
    form.reset();
    updateFulfilmentFields();
    saveCart();
    renderCart();
}

function updateFulfilmentFields() {
    const fulfilment = document.querySelector('input[name="fulfilment"]:checked')?.value;
    const address = $("delivery-address");
    const label = $("address-label");
    if (fulfilment === "Takeaway") {
        label.firstChild.textContent = "Pickup note ";
        address.required = false;
        address.value = "";
        address.placeholder = "Optional note for pickup";
    } else {
        label.firstChild.textContent = "Delivery address ";
        address.required = true;
        address.placeholder = "House, street, area and PIN code";
    }
    const totals = calculateTotals();
    $("checkout-total").textContent = money(totals.total);
}

function showPolicy(title) {
    $("policy-title").textContent = title;
    const content = {
        "Privacy Policy": "This sample website stores demo cart, reservation, enquiry and order data in your browser's local storage. No server receives it. A production restaurant must publish its own privacy notice describing real data collection, retention and customer rights.",
        "Terms & Conditions": "This is a fictional restaurant demo. Menu items, prices, hours and availability are sample data. Orders and reservations created here are demonstrations only and are not confirmed by a restaurant.",
        "Refund & Cancellation": "No payment is processed and no real order is placed in this demo, so no refund can be issued. A real restaurant should replace this text with its own cancellation, delivery and refund terms."
    };
    $("policy-content").textContent = content[title] || "Demo information.";
    setDialogVisible($("policy-overlay"), true);
}

function start() {
    if (menuItems.length !== 17) console.warn(`Expected 17 default dishes; found ${menuItems.length}.`);
    renderCategories();
    renderMenu();
    renderCart();
    renderHours();
    renderRestaurantDetails();
    makeTimeOptions($("reservation-date").value);
    $("reservation-date").min = dateKey(new Date());
    const savedTheme = localStorage.getItem("saffron-stone-theme");
    if (savedTheme === "dark") document.body.dataset.theme = "dark";
    $("theme-toggle").textContent = savedTheme === "dark" ? "☀" : "☾";
    window.setInterval(renderHours, 60000);
}

$("category-list").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderCategories();
    renderMenu();
});
$("search-input").addEventListener("input", renderMenu);
$("sort-select").addEventListener("change", renderMenu);
$("price-range").addEventListener("input", renderMenu);
$("food-grid").addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(button.dataset.add);
});
document.querySelector("[data-quick-add]").addEventListener("click", event => addToCart(event.currentTarget.dataset.quickAdd));
$("open-cart").addEventListener("click", openCart);
$("close-cart").addEventListener("click", closeCart);
$("cart-overlay").addEventListener("click", closeCart);
$("cart-items").addEventListener("click", event => {
    const plus = event.target.closest("[data-plus]");
    const minus = event.target.closest("[data-minus]");
    const remove = event.target.closest("[data-remove]");
    if (plus) {
        const row = cart.find(item => item.id === plus.dataset.plus);
        if (row && row.quantity < 99) row.quantity += 1;
        else showToast("A maximum of 99 of each plate can be added.");
    }
    if (minus) {
        const row = cart.find(item => item.id === minus.dataset.minus);
        if (row) row.quantity -= 1;
        cart = cart.filter(item => item.quantity > 0);
    }
    if (remove) cart = cart.filter(item => item.id !== remove.dataset.remove);
    saveCart();
    renderCart();
});
$("clear-cart").addEventListener("click", () => {
    cart = [];
    appliedCoupon = "";
    saveCart();
    renderCart();
});
$("apply-coupon").addEventListener("click", () => {
    const code = $("coupon-code").value.trim().toUpperCase();
    const coupon = Store.settings().coupons.find(item => item.code.toUpperCase() === code && item.active);
    if (!code) {
        appliedCoupon = "";
        $("coupon-feedback").textContent = "Enter a promo code first.";
    } else if (!coupon) {
        $("coupon-feedback").textContent = "That code isn't active. Try WELCOME10 or SASSY50.";
        return;
    } else if (calculateTotals().subtotal < Number(coupon.minimum || 0)) {
        $("coupon-feedback").textContent = `This code needs a minimum order of ${money(coupon.minimum)}.`;
        return;
    } else {
        appliedCoupon = code;
    }
    saveCart();
    renderCart();
});
$("checkout-button").addEventListener("click", () => {
    if (!cart.length) return;
    closeCart();
    setDialogVisible($("checkout-overlay"), true);
    updateFulfilmentFields();
});
$("close-checkout").addEventListener("click", () => setDialogVisible($("checkout-overlay"), false));
$("checkout-form").addEventListener("change", event => {
    if (event.target.name === "fulfilment") updateFulfilmentFields();
});
$("checkout-form").addEventListener("submit", handleCheckout);
$("finish-order").addEventListener("click", () => {
    setDialogVisible($("success-overlay"), false);
    $("menu").scrollIntoView({ behavior: "smooth" });
});
$("reservation-date").addEventListener("change", event => makeTimeOptions(event.target.value));
$("reservation-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (!reservationAllowed(String(data.get("date")), String(data.get("time")))) {
        $("reservation-feedback").textContent = "Choose a future time within our opening hours.";
        $("reservation-feedback").style.color = "var(--accent)";
        return;
    }
    const reservation = {
        id: `RS-${Date.now().toString(36).toUpperCase()}`,
        name: String(data.get("name")).trim(),
        phone: String(data.get("phone")).trim(),
        email: String(data.get("email")).trim(),
        date: String(data.get("date")),
        time: String(data.get("time")),
        guests: Number(data.get("guests")),
        request: String(data.get("request") || "").trim(),
        status: "Pending",
        created: Date.now()
    };
    try {
        Store.saveReservation(reservation);
        $("reservation-feedback").textContent = `Demo request ${reservation.id} saved. A real booking needs restaurant confirmation.`;
        $("reservation-feedback").style.color = "var(--sage)";
        form.reset();
        $("reservation-date").min = dateKey(new Date());
        makeTimeOptions("");
    } catch (error) {
        console.error("Could not save demo reservation:", error);
        $("reservation-feedback").textContent = "We couldn't save this request. Please check browser storage and try again.";
        $("reservation-feedback").style.color = "var(--accent)";
    }
});
$("hours-toggle").addEventListener("click", event => {
    const button = event.currentTarget;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    $("weekly-hours").hidden = expanded;
    button.innerHTML = expanded ? 'See weekly hours <span>+</span>' : 'Hide weekly hours <span>−</span>';
});
$("contact-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    try {
        Store.saveEnquiry({
            id: `EN-${Date.now().toString(36).toUpperCase()}`,
            name: String(data.get("name")).trim(),
            email: String(data.get("email")).trim(),
            message: String(data.get("message")).trim(),
            created: Date.now()
        });
        $("contact-feedback").textContent = "Your demo enquiry is saved in this browser.";
        form.reset();
    } catch (error) {
        console.error("Could not save demo enquiry:", error);
        $("contact-feedback").textContent = "We couldn't save this enquiry. Please try again.";
    }
});
$("newsletter-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const email = $("newsletter-email").value.trim().toLowerCase();
    try {
        const wasSubscribed = Store.newsletter().includes(email);
        Store.saveNewsletter(email);
        $("newsletter-feedback").textContent = wasSubscribed ? "You're already on our demo list." : "You're on the list — demo signup saved in this browser.";
        form.reset();
    } catch (error) {
        console.error("Could not save demo newsletter signup:", error);
        $("newsletter-feedback").textContent = "We couldn't save that signup. Please try again.";
    }
});
$("tracking-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const orderId = String(data.get("orderId")).trim().toUpperCase();
    const phone = String(data.get("phone")).trim();
    const order = Store.orders().find(item => item.id.toUpperCase() === orderId && item.phone === phone);
    const result = $("tracking-result");
    if (!order) {
        result.textContent = "No matching demo order in this browser. Check the ID and mobile number.";
        result.style.color = "var(--accent)";
        return;
    }
    result.textContent = `Order ${order.id}: ${order.status}.`;
    result.style.color = "var(--sage)";
});
$("theme-toggle").addEventListener("click", () => {
    const dark = document.body.dataset.theme !== "dark";
    if (dark) document.body.dataset.theme = "dark";
    else delete document.body.dataset.theme;
    $("theme-toggle").textContent = dark ? "☀" : "☾";
    localStorage.setItem("saffron-stone-theme", dark ? "dark" : "light");
});
$("menu-toggle").addEventListener("click", event => {
    const button = event.currentTarget;
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    $("primary-nav").classList.toggle("open", open);
});
$("primary-nav").addEventListener("click", event => {
    if (!event.target.closest("a")) return;
    $("primary-nav").classList.remove("open");
    $("menu-toggle").setAttribute("aria-expanded", "false");
    $("menu-toggle").setAttribute("aria-label", "Open navigation");
});
document.querySelectorAll("[data-policy]").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    showPolicy(event.currentTarget.dataset.policy);
}));
$("close-policy").addEventListener("click", () => setDialogVisible($("policy-overlay"), false));
$("policy-overlay").addEventListener("click", event => {
    if (event.target === $("policy-overlay")) setDialogVisible($("policy-overlay"), false);
});
document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeCart();
    setDialogVisible($("checkout-overlay"), false);
    setDialogVisible($("success-overlay"), false);
    setDialogVisible($("policy-overlay"), false);
    $("primary-nav").classList.remove("open");
    $("menu-toggle").setAttribute("aria-expanded", "false");
});
window.addEventListener("scroll", () => $("back-top").classList.toggle("visible", window.scrollY > 500), { passive: true });
$("back-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("storage", event => {
    if ([Store.keys.menu, Store.keys.settings, Store.keys.orders].includes(event.key)) {
        menuItems = Store.menu();
        renderCategories();
        renderMenu();
        renderCart();
        renderHours();
        renderRestaurantDetails();
        makeTimeOptions($("reservation-date").value);
    }
});
window.addEventListener("saffron:menu", () => {
    menuItems = Store.menu();
    renderCategories();
    renderMenu();
    renderCart();
});
window.addEventListener("saffron:settings", () => {
    renderHours();
    renderRestaurantDetails();
    makeTimeOptions($("reservation-date").value);
    renderCart();
});

start();
