const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const money = value => "₹" + Math.round(Number(value) || 0).toLocaleString("en-IN");
const formatDate = value => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const localDateString = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const orderStatuses = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
let currentMenu = Store.menu();

function showMessage(id, message) {
    $(id).textContent = message;
    window.setTimeout(() => { if ($(id).textContent === message) $(id).textContent = ""; }, 3500);
}

function customerList() {
    const records = new Map();
    Store.orders().forEach(order => {
        const key = order.phone || order.id;
        const existing = records.get(key);
        if (!existing) records.set(key, { name: order.name || "Guest", phone: order.phone || "—", orders: 1, latest: order.created });
        else {
            existing.orders += 1;
            if (order.created > existing.latest) {
                existing.name = order.name || existing.name;
                existing.latest = order.created;
            }
        }
    });
    return Array.from(records.values()).sort((a, b) => b.latest - a.latest);
}

function rowMarkup(main, actions = "") {
    return `<article class="admin-row"><div class="admin-row-main">${main}</div><div class="admin-row-actions">${actions}</div></article>`;
}

function renderOrders(targetId, orders, compact = false) {
    const target = $(targetId);
    if (!orders.length) {
        target.innerHTML = '<p class="admin-empty">No demo orders yet.</p>';
        return;
    }
    target.innerHTML = orders.map(order => {
        const lines = (order.items || []).map(item => `${escapeHTML(item.name)} × ${Number(item.quantity || item.qty || 0)}`).join(", ");
        const select = `<select data-order-status="${escapeHTML(order.id)}" aria-label="Update status for ${escapeHTML(order.id)}">${orderStatuses.map(status => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
        return rowMarkup(`<strong>${escapeHTML(order.id)} · ${money(order.total)}</strong><p>${escapeHTML(lines)}</p><p>${escapeHTML(order.name)} · ${escapeHTML(order.phone)} · ${escapeHTML(order.fulfilment || "Delivery")} · ${escapeHTML(order.address)}</p><p>${formatDate(order.created)} · ${escapeHTML(order.status)}</p>`, compact ? "" : select);
    }).join("");
}

function renderOverview() {
    const orders = Store.orders();
    const today = new Date();
    const todayOrders = orders.filter(order => {
        const date = new Date(order.created);
        return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate() && order.status !== "Cancelled";
    });
    $("stat-orders").textContent = orders.length;
    $("stat-revenue").textContent = money(todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0));
    $("stat-customers").textContent = customerList().length;
    $("stat-pending").textContent = orders.filter(order => ["Pending", "Confirmed", "Preparing"].includes(order.status)).length;
    renderOrders("recent-orders", orders.slice(0, 5), true);
    const todayKey = localDateString();
    const reservations = Store.reservations().filter(item => item.date === todayKey).slice(0, 5);
    $("recent-reservations").innerHTML = reservations.length ? reservations.map(item =>
        rowMarkup(`<strong>${escapeHTML(item.name)} · ${escapeHTML(item.time)}</strong><p>${Number(item.guests)} guests · ${escapeHTML(item.phone)} · ${escapeHTML(item.status)}</p>`)
    ).join("") : '<p class="admin-empty">No table requests for today.</p>';
}

function renderMenu() {
    currentMenu = Store.menu();
    $("menu-count").textContent = `(${currentMenu.length})`;
    $("menu-list").innerHTML = currentMenu.length ? currentMenu.map(item => `
        <article class="admin-row admin-menu-row">
            <img class="admin-menu-image" src="${escapeHTML(item.image)}" alt="">
            <div class="admin-row-main"><strong>${escapeHTML(item.name)} · ${money(item.price)}</strong><p>${escapeHTML(item.category)} · ${item.type === "non-veg" ? "Non-vegetarian" : "Vegetarian"} · ${item.available === false ? "Sold out" : "Available"}</p></div>
            <div class="admin-row-actions"><button class="admin-button" data-edit="${escapeHTML(item.id)}">Edit</button><button class="admin-button" data-availability="${escapeHTML(item.id)}">${item.available === false ? "Make available" : "Mark sold out"}</button><button class="admin-button danger" data-delete="${escapeHTML(item.id)}">Delete</button></div>
        </article>`).join("") : '<p class="admin-empty">No menu dishes yet.</p>';
}

function resetMenuForm() {
    $("menu-form").reset();
    $("menu-form").elements.id.value = "";
    $("menu-form-heading").textContent = "Add a dish";
    $("cancel-menu-edit").hidden = true;
}

function renderReservations() {
    const reservations = Store.reservations();
    $("reservations-list").innerHTML = reservations.length ? reservations.map(item => {
        const actions = `<select data-reservation-status="${escapeHTML(item.id)}" aria-label="Update reservation status">${["Pending", "Confirmed", "Declined"].map(status => `<option ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
        return rowMarkup(`<strong>${escapeHTML(item.name)} · ${escapeHTML(item.date)} at ${escapeHTML(item.time)}</strong><p>${Number(item.guests)} guests · ${escapeHTML(item.phone)} · ${escapeHTML(item.email)}</p><p>${escapeHTML(item.request || "No special request")} · ${escapeHTML(item.status)}</p>`, actions);
    }).join("") : '<p class="admin-empty">No demo reservations yet.</p>';
}

function renderHoursForm() {
    const settings = Store.settings();
    $("hours-fields").innerHTML = settings.hours.map(row => `
        <label class="hours-grid"><span>${escapeHTML(row.day)}</span><input type="time" data-hour-open="${escapeHTML(row.day)}" value="${escapeHTML(row.open)}" required aria-label="${escapeHTML(row.day)} opening time"><input type="time" data-hour-close="${escapeHTML(row.day)}" value="${escapeHTML(row.close)}" required aria-label="${escapeHTML(row.day)} closing time"></label>`).join("");
    $("temporary-closure").checked = settings.temporaryClosure;
    renderSpecialHours();
    renderCoupons();
    const contact = { ...RESTAURANT, ...settings.restaurant };
    const contactForm = $("contact-settings-form");
    Object.keys(contact).forEach(key => {
        if (contactForm.elements[key]) contactForm.elements[key].value = contact[key] || "";
    });
}

function renderSpecialHours() {
    const entries = Store.settings().closedDates;
    $("special-hours-list").innerHTML = entries.length ? entries.map((item, index) => {
        const date = typeof item === "string" ? item : item.date;
        const label = typeof item === "string" ? "Closed all day" : item.closed ? `${item.label || "Closed all day"}` : `${item.label || "Special hours"} · ${item.open}–${item.close}`;
        return `<div class="special-hour"><span><strong>${escapeHTML(date)}</strong> · ${escapeHTML(label)}</span><button class="admin-button danger" type="button" data-special-delete="${index}">Remove</button></div>`;
    }).join("") : '<p class="admin-empty">No special hours set.</p>';
}

function renderCoupons() {
    const coupons = Store.settings().coupons;
    $("coupons-list").innerHTML = coupons.length ? coupons.map((coupon, index) => {
        const discount = coupon.kind === "fixed" ? money(coupon.value) : `${Number(coupon.value)}%`;
        const actions = `<button type="button" class="admin-button danger" data-coupon-delete="${index}">Remove</button>`;
        return rowMarkup(`<strong>${escapeHTML(coupon.code)} · ${discount} off</strong><p>Minimum order ${money(coupon.minimum)} · ${coupon.active ? "Active" : "Inactive"}</p>`, actions);
    }).join("") : '<p class="admin-empty">No promo codes yet.</p>';
}

function renderEnquiries() {
    const enquiries = Store.enquiries();
    $("enquiries-list").innerHTML = enquiries.length ? enquiries.map(item => {
        const actions = `<button class="admin-button" type="button" data-enquiry-done="${escapeHTML(item.id)}">${item.done ? "Handled" : "Mark handled"}</button>`;
        return rowMarkup(`<strong>${escapeHTML(item.name)} · <a class="inline-link" href="mailto:${escapeHTML(item.email)}">${escapeHTML(item.email)}</a></strong><p>${escapeHTML(item.message)}</p><p>${formatDate(item.created)} · ${item.done ? "Handled" : "New"}</p>`, actions);
    }).join("") : '<p class="admin-empty">No demo enquiries yet.</p>';
}

function renderCustomers() {
    const customers = customerList();
    $("customers-list").innerHTML = customers.length ? customers.map(item =>
        `<tr><td>${escapeHTML(item.name)}</td><td><a class="inline-link" href="tel:${escapeHTML(item.phone)}">${escapeHTML(item.phone)}</a></td><td>${item.orders}</td><td>${formatDate(item.latest)}</td></tr>`
    ).join("") : '<tr><td colspan="4">No demo customers yet.</td></tr>';
}

function renderAll() {
    renderOverview();
    renderOrders("orders-list", Store.orders());
    renderMenu();
    renderReservations();
    renderHoursForm();
    renderEnquiries();
    renderCustomers();
}

document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(tab => tab.classList.toggle("active", tab === button));
    document.querySelectorAll(".admin-section").forEach(section => {
        section.hidden = section.id !== `section-${button.dataset.tab}`;
    });
}));

$("orders-list").addEventListener("change", event => {
    const select = event.target.closest("[data-order-status]");
    if (!select) return;
    Store.updateOrder(select.dataset.orderStatus, { status: select.value });
    renderAll();
});

$("contact-settings-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const settings = Store.settings();
    settings.restaurant = {
        ...(settings.restaurant || {}),
        phone: String(data.get("phone")).trim(),
        whatsapp: String(data.get("whatsapp")).replace(/\D/g, ""),
        email: String(data.get("email")).trim(),
        address: String(data.get("address")).trim(),
        mapLink: String(data.get("mapLink")).trim(),
        instagram: String(data.get("instagram") || "").trim(),
        facebook: String(data.get("facebook") || "").trim()
    };
    try {
        Store.saveSettings(settings);
        showMessage("contact-settings-message", "Contact details saved and applied to the customer website.");
    } catch (error) {
        console.error("Could not save contact details:", error);
        showMessage("contact-settings-message", "Could not save contact details. Check browser storage and try again.");
    }
});

$("menu-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const item = {
        id: String(data.get("id") || `dish-${Date.now().toString(36)}`),
        name: String(data.get("name")).trim(),
        category: String(data.get("category")),
        price: Number(data.get("price")),
        type: String(data.get("type")),
        tag: String(data.get("tag") || "").trim().toUpperCase(),
        description: String(data.get("description")).trim(),
        image: String(data.get("image")).trim(),
        available: form.elements.available.checked
    };
    const menu = Store.menu();
    const index = menu.findIndex(existing => existing.id === item.id);
    if (index >= 0) menu[index] = item;
    else menu.push(item);
    try {
        Store.saveMenu(menu);
        resetMenuForm();
        renderMenu();
        showMessage("menu-message", "Menu saved. The customer page will update in this browser.");
    } catch (error) {
        console.error("Could not save menu changes:", error);
        showMessage("menu-message", "Could not save the menu. Check browser storage and try again.");
    }
});

$("cancel-menu-edit").addEventListener("click", resetMenuForm);
$("menu-list").addEventListener("click", event => {
    const edit = event.target.closest("[data-edit]");
    const availability = event.target.closest("[data-availability]");
    const remove = event.target.closest("[data-delete]");
    const menu = Store.menu();
    if (edit) {
        const item = menu.find(row => row.id === edit.dataset.edit);
        if (!item) return;
        const form = $("menu-form");
        form.elements.id.value = item.id;
        form.elements.name.value = item.name;
        form.elements.price.value = item.price;
        form.elements.category.value = item.category;
        form.elements.type.value = item.type || "veg";
        form.elements.tag.value = item.tag || "";
        form.elements.image.value = item.image;
        form.elements.description.value = item.description || "";
        form.elements.available.checked = item.available !== false;
        $("menu-form-heading").textContent = `Edit ${item.name}`;
        $("cancel-menu-edit").hidden = false;
        $("menu-form").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (availability) {
        const item = menu.find(row => row.id === availability.dataset.availability);
        if (!item) return;
        item.available = item.available === false;
        Store.saveMenu(menu);
        renderMenu();
    }
    if (remove && window.confirm("Remove this dish from the demo menu?")) {
        Store.saveMenu(menu.filter(item => item.id !== remove.dataset.delete));
        renderMenu();
    }
});

$("hours-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const settings = Store.settings();
    settings.hours = settings.hours.map(row => ({
        day: row.day,
        open: $(`[data-hour-open="${row.day}"]`).value,
        close: $(`[data-hour-close="${row.day}"]`).value
    }));
    if (settings.hours.some(row => row.close <= row.open)) {
        showMessage("hours-message", "Each closing time must be later than its opening time.");
        return;
    }
    settings.temporaryClosure = $("temporary-closure").checked;
    try {
        Store.saveSettings(settings);
        showMessage("hours-message", "Opening hours saved and applied to the website.");
    } catch (error) {
        console.error("Could not save opening hours:", error);
        showMessage("hours-message", "Could not save hours. Check browser storage and try again.");
    }
});

$("special-hours-form").elements.date.min = localDateString();
$("special-hours-form").elements.closed.addEventListener("change", event => {
    $("special-hours-form").elements.open.disabled = event.target.checked;
    $("special-hours-form").elements.close.disabled = event.target.checked;
});
$("special-hours-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const settings = Store.settings();
    const date = String(data.get("date"));
    if (!form.elements.closed.checked && String(data.get("close")) <= String(data.get("open"))) {
        window.alert("Closing time must be later than opening time.");
        return;
    }
    settings.closedDates = settings.closedDates.filter(item => (typeof item === "string" ? item : item.date) !== date);
    settings.closedDates.push({
        date,
        label: String(data.get("label") || "").trim(),
        closed: form.elements.closed.checked,
        open: form.elements.closed.checked ? "" : String(data.get("open")),
        close: form.elements.closed.checked ? "" : String(data.get("close"))
    });
    try {
        Store.saveSettings(settings);
        form.reset();
        form.elements.open.disabled = false;
        form.elements.close.disabled = false;
        renderSpecialHours();
    } catch (error) {
        console.error("Could not save special hours:", error);
        window.alert("Could not save special hours. Check browser storage and try again.");
    }
});
$("special-hours-list").addEventListener("click", event => {
    const button = event.target.closest("[data-special-delete]");
    if (!button) return;
    const settings = Store.settings();
    settings.closedDates.splice(Number(button.dataset.specialDelete), 1);
    Store.saveSettings(settings);
    renderSpecialHours();
});

$("coupon-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const code = String(data.get("code")).trim().toUpperCase();
    const settings = Store.settings();
    if (String(data.get("kind")) === "percent" && Number(data.get("value")) > 100) {
        window.alert("Percentage discounts cannot be more than 100%.");
        return;
    }
    if (settings.coupons.some(item => item.code.toUpperCase() === code)) {
        window.alert("That promo code already exists.");
        return;
    }
    settings.coupons.push({
        code,
        kind: String(data.get("kind")),
        value: Number(data.get("value")),
        minimum: Number(data.get("minimum")),
        active: true
    });
    try {
        Store.saveSettings(settings);
        form.reset();
        renderCoupons();
    } catch (error) {
        console.error("Could not save promo code:", error);
        window.alert("Could not save the promo code. Check browser storage and try again.");
    }
});
$("coupons-list").addEventListener("click", event => {
    const button = event.target.closest("[data-coupon-delete]");
    if (!button) return;
    const settings = Store.settings();
    settings.coupons.splice(Number(button.dataset.couponDelete), 1);
    Store.saveSettings(settings);
    renderCoupons();
});

$("reservations-list").addEventListener("change", event => {
    const select = event.target.closest("[data-reservation-status]");
    if (!select) return;
    Store.updateReservation(select.dataset.reservationStatus, { status: select.value });
    renderReservations();
    renderOverview();
});
$("enquiries-list").addEventListener("click", event => {
    const button = event.target.closest("[data-enquiry-done]");
    if (!button) return;
    Store.updateEnquiry(button.dataset.enquiryDone, { done: true });
    renderEnquiries();
});

window.addEventListener("storage", event => {
    if (Object.values(Store.keys).includes(event.key)) renderAll();
});
window.addEventListener("saffron:menu", renderAll);
window.addEventListener("saffron:orders", renderAll);
window.addEventListener("saffron:reservations", renderAll);
window.addEventListener("saffron:settings", renderAll);
window.addEventListener("saffron:enquiries", renderAll);
renderAll();
