const Store = (() => {
    const keys = {
        menu: "saffron-stone-menu",
        cart: "saffron-stone-cart",
        orders: "saffron-stone-orders",
        reservations: "saffron-stone-reservations",
        settings: "saffron-stone-settings",
        enquiries: "saffron-stone-enquiries",
        newsletter: "saffron-stone-newsletter"
    };

    function read(key, fallback) {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        try {
            return JSON.parse(raw);
        } catch (error) {
            console.error("Could not read saved restaurant data:", error);
            return fallback;
        }
    }

    function write(key, value, eventName) {
        localStorage.setItem(key, JSON.stringify(value));
        if (eventName) window.dispatchEvent(new CustomEvent(eventName));
    }

    function defaultCoupons() {
        return [
            { code: "WELCOME10", kind: "percent", value: 10, minimum: 299, active: true },
            { code: "SASSY50", kind: "fixed", value: 50, minimum: 499, active: true }
        ];
    }

    return {
        keys,
        menu() {
            const data = read(keys.menu, DEFAULT_MENU);
            return Array.isArray(data) ? data : DEFAULT_MENU;
        },
        saveMenu(items) {
            write(keys.menu, items, "saffron:menu");
        },
        cart() {
            const data = read(keys.cart, []);
            return Array.isArray(data) ? data : [];
        },
        saveCart(items) {
            write(keys.cart, items);
        },
        orders() {
            const data = read(keys.orders, []);
            return Array.isArray(data) ? data : [];
        },
        saveOrder(order) {
            const orders = this.orders();
            orders.unshift(order);
            write(keys.orders, orders, "saffron:orders");
        },
        updateOrder(id, updates) {
            const orders = this.orders().map(order => order.id === id ? { ...order, ...updates } : order);
            write(keys.orders, orders, "saffron:orders");
        },
        reservations() {
            const data = read(keys.reservations, []);
            return Array.isArray(data) ? data : [];
        },
        saveReservation(reservation) {
            const reservations = this.reservations();
            reservations.unshift(reservation);
            write(keys.reservations, reservations, "saffron:reservations");
        },
        updateReservation(id, updates) {
            const reservations = this.reservations().map(item => item.id === id ? { ...item, ...updates } : item);
            write(keys.reservations, reservations, "saffron:reservations");
        },
        settings() {
            const saved = read(keys.settings, {});
            return {
                hours: Array.isArray(saved.hours) ? saved.hours : RESTAURANT.hours,
                closedDates: saved.closedDates || [],
                temporaryClosure: saved.temporaryClosure || false,
                coupons: Array.isArray(saved.coupons) ? saved.coupons : defaultCoupons(),
                restaurant: saved.restaurant || {}
            };
        },
        saveSettings(settings) {
            write(keys.settings, settings, "saffron:settings");
        },
        enquiries() {
            const data = read(keys.enquiries, []);
            return Array.isArray(data) ? data : [];
        },
        saveEnquiry(enquiry) {
            const enquiries = this.enquiries();
            enquiries.unshift(enquiry);
            write(keys.enquiries, enquiries, "saffron:enquiries");
        },
        updateEnquiry(id, updates) {
            const enquiries = this.enquiries().map(item => item.id === id ? { ...item, ...updates } : item);
            write(keys.enquiries, enquiries, "saffron:enquiries");
        },
        newsletter() {
            const data = read(keys.newsletter, []);
            return Array.isArray(data) ? data : [];
        },
        saveNewsletter(email) {
            const emails = this.newsletter();
            if (!emails.includes(email)) emails.push(email);
            write(keys.newsletter, emails, "saffron:newsletter");
        }
    };
})();
