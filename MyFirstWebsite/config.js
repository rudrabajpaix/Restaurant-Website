/* CANADIAN PIZZA BURGER - SETTINGS
   Restaurant ki saari details sirf yahin badalni hain. */

const RESTAURANT = {
    name: "Canadian Pizza Burger",
    whatsapp: "919XXXXXXXXX",            // 91 ke saath, bina + ya space
    phone: "+91 9XXXXXXXXX",
    address: "Shop No. __, Main Road, Your City, Uttar Pradesh",
    hours: "Daily: 11:00 AM - 11:00 PM",
    // Google Maps > Share > Embed a map > HTML me se sirf src="..." ke andar ka link
    mapEmbed: "",
    // Google Maps > Share > Copy link
    mapLink: "https://www.google.com/maps",
    deliveryCharge: 30,                  // Free delivery se kam order par
    freeDeliveryAbove: 500
};

// Firebase Console > Project settings > Your apps > Web app se copy karo.
// Jab tak "YOUR_" likha hai, site DEMO mode me chalegi (sirf isi browser me save hoga).
const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_APP_ID"
};

// Pehli baar ka menu. Admin panel me "Import default menu" dabane par database me chala jata hai.
const DEFAULT_MENU = [
    { id: "i1", name: "Margherita Pizza", category: "Pizza", price: 199, tag: "BEST SELLER", description: "Classic cheese pizza with fresh flavours.", image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?w=700", available: true },
    { id: "i2", name: "Farmhouse Pizza", category: "Pizza", price: 249, tag: "POPULAR", description: "Loaded with fresh vegetables and cheese.", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700", available: true },
    { id: "i3", name: "Classic Burger", category: "Burger", price: 129, tag: "CUSTOMER FAVOURITE", description: "Juicy burger with fresh vegetables.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700", available: true },
    { id: "i4", name: "Cheese Burger", category: "Burger", price: 159, tag: "CHEESY", description: "A delicious burger with extra cheese.", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=700", available: true },
    { id: "i5", name: "French Fries", category: "Sides", price: 79, tag: "CRISPY", description: "Golden and crispy potato fries.", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=700", available: true },
    { id: "i6", name: "Italian Pasta", category: "Sides", price: 179, tag: "CHEF'S SPECIAL", description: "Creamy pasta with delicious seasoning.", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=700", available: true },
    { id: "i7", name: "Cheese Sandwich", category: "Sides", price: 99, tag: "FRESH PICK", description: "Toasted sandwich with creamy cheese.", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700", available: true },
    { id: "i8", name: "Cold Drink", category: "Drinks", price: 49, tag: "REFRESHING", description: "A chilled refreshing beverage.", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=700", available: true }
];