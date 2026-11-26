const RESTAURANT = {
    name: "Saffron & Stone",
    shortName: "S&S",
    tagline: "A little spice. A lot of soul.",
    phone: "+91 98765 43210",
    whatsapp: "919876543210",
    email: "hello@saffronandstone.example",
    address: "24 Koregaon Park Road, Pune, Maharashtra 411001",
    mapLink: "https://maps.google.com/?q=Koregaon+Park+Pune",
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    taxRate: 0.05,
    hours: [
        { day: "Sunday", open: "11:00", close: "22:00" },
        { day: "Monday", open: "10:00", close: "22:00" },
        { day: "Tuesday", open: "10:00", close: "22:00" },
        { day: "Wednesday", open: "10:00", close: "22:00" },
        { day: "Thursday", open: "10:00", close: "22:00" },
        { day: "Friday", open: "10:00", close: "22:00" },
        { day: "Saturday", open: "10:00", close: "23:00" }
    ]
};

const DEFAULT_MENU = [
    { id: "dish-01", name: "Crispy Lotus Stem", category: "Starters", price: 245, type: "veg", tag: "CHEF'S PICK", description: "Honey-chilli glaze, sesame and spring onion.", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-02", name: "Paneer Tikka", category: "Starters", price: 295, type: "veg", tag: "BESTSELLER", description: "Tandoor-charred paneer, mint chutney, pickled onion.", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-03", name: "Chicken Malai Kebab", category: "Starters", price: 345, type: "non-veg", tag: "", description: "Silky cream-marinated chicken, charred to perfection.", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-04", name: "Dal Makhani", category: "Main Course", price: 325, type: "veg", tag: "SLOW COOKED", description: "Black lentils simmered overnight with butter and spice.", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-05", name: "Butter Chicken", category: "Main Course", price: 425, type: "non-veg", tag: "BESTSELLER", description: "Tandoori chicken in a rich tomato-butter makhani gravy.", image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-06", name: "Kadai Paneer", category: "Main Course", price: 365, type: "veg", tag: "", description: "Paneer, peppers and crushed spices from the kadai.", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-07", name: "Truffle Masala Fries", category: "Fast Food", price: 195, type: "veg", tag: "HOUSE FAVOURITE", description: "Crispy fries tossed in truffle masala and parmesan.", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-08", name: "Crispy Chicken Sliders", category: "Fast Food", price: 275, type: "non-veg", tag: "", description: "Two crunchy chicken sliders with house-made slaw.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-09", name: "Masala Grilled Sandwich", category: "Fast Food", price: 185, type: "veg", tag: "", description: "Toasted sourdough, spiced potato, cheese and chutney.", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-10", name: "Four Cheese Pizza", category: "Pizza & Burgers", price: 395, type: "veg", tag: "CHEF'S PICK", description: "Mozzarella, gouda, parmesan and smoked cheddar.", image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-11", name: "Smoky Tandoori Pizza", category: "Pizza & Burgers", price: 425, type: "non-veg", tag: "BESTSELLER", description: "Tandoori chicken, peppers, onion and mint drizzle.", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-12", name: "Saffron Smash Burger", category: "Pizza & Burgers", price: 345, type: "non-veg", tag: "", description: "Double-smash patty, aged cheddar and pepper jam.", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-13", name: "Mango Lassi", category: "Beverages", price: 145, type: "veg", tag: "SEASONAL", description: "Alphonso mango, chilled yoghurt and a hint of cardamom.", image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-14", name: "Rose & Lime Cooler", category: "Beverages", price: 125, type: "veg", tag: "", description: "Fresh lime, fragrant rose and sparkling water.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765edfd7?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-15", name: "Masala Chai", category: "Beverages", price: 85, type: "veg", tag: "", description: "Brewed to order with ginger, cardamom and Assam tea.", image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-16", name: "Gulab Jamun Cheesecake", category: "Desserts", price: 225, type: "veg", tag: "MUST TRY", description: "Baked cheesecake, rose syrup and warm gulab jamun.", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85", available: true },
    { id: "dish-17", name: "Dark Chocolate Mousse", category: "Desserts", price: 195, type: "veg", tag: "", description: "Silky 70% chocolate mousse with a sea-salt finish.", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=85", available: true }
];
