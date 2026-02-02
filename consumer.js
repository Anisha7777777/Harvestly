// ---------- LOAD FARMERS ----------
const farmers = JSON.parse(localStorage.getItem("farmers")) || [];

// ---------- CART ----------
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}




function addToCart(productName, price, farmerName, contact) {
  const existing = cart.find(item => item.productName === productName && item.farmerName === farmerName);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productName, price, quantity: 1, farmerName, contact });
  }
  saveCart();
  updateCartUI();
}

function openCart() {
  document.getElementById("cartModal").classList.remove("hidden");
}

function closeCart() {
  document.getElementById("cartModal").classList.add("hidden");
}

function checkout() {
  if (!cart || cart.length === 0) {
    alert("Cart is empty! Add some items!");
    return;
  }

  // Load farmers from localStorage
  let farmers = JSON.parse(localStorage.getItem("farmers")) || [];

  // Reduce stock for each cart item
  cart.forEach(item => {
    const farmerIndex = farmers.findIndex(f => f.name === item.farmerName);
    if (farmerIndex !== -1) {
      const productIndex = farmers[farmerIndex].products.findIndex(p => p.name === item.productName);
      if (productIndex !== -1) {
        // Reduce stock
        farmers[farmerIndex].products[productIndex].quantity -= item.quantity;
        if (farmers[farmerIndex].products[productIndex].quantity < 0) {
          farmers[farmerIndex].products[productIndex].quantity = 0; // prevent negative
        }
      }
    }
  });

  // Save updated farmers back
  localStorage.setItem("farmers", JSON.stringify(farmers));

  alert("Checkout successful! (demo)");

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
  closeCart();

  // Refresh UI with updated stock
  displayProducts();
  populatePriceDashboard();
}


// ---------- DISPLAY PRODUCTS ----------
function displayProducts() {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";

  farmers.forEach(farmer => {
    if (!farmer.products) return;
    farmer.products.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <h3>${product.name}</h3>
        <p>Farmer: ${farmer.name}</p>
        <p>Price: ₹${product.Price}/kg</p>
        <p>Available: ${product.quantity} kg</p>
        <button onclick="addToCart('${product.name}', ${product.Price}, '${farmer.name}', '${farmer.contact}')">Add to Cart</button>
      `;
      container.appendChild(card);
    });
  });
}

// ---------- PRICE DASHBOARD ----------
function populatePriceDashboard() {
  const tableBody = document.querySelector("#priceTable tbody");
  tableBody.innerHTML = "";

  farmers.forEach(farmer => {
    if (!farmer.products) return;
    farmer.products.forEach(product => {
      const marketPrice = Math.round(product.Price * (0.8 + Math.random() * 0.4));
      const difference = marketPrice - product.Price;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${farmer.name}</td>
        <td>${product.name}</td>
        <td>₹${product.Price}</td>
        <td>₹${marketPrice}</td>
        <td>${difference}</td>
      `;
      tableBody.appendChild(tr);
    });
  });
}

// ---------- MAP ----------
const map = L.map("map").setView([20.5937, 78.9629], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

function displayFarmersOnMap() {
  farmers.forEach(farmer => {
    if (farmer.lat && farmer.lng) {
      L.marker([farmer.lat, farmer.lng])
        .addTo(map)
        .bindPopup(`<b>${farmer.name}</b><br>${farmer.contact}`);
    }
  });
}

// ---------- INIT ----------
window.addEventListener("DOMContentLoaded", () => {
  displayProducts();
  populatePriceDashboard();
  displayFarmersOnMap();
  updateCartUI();
});


function updateCartUI() {
  document.getElementById("cartCount").innerText = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartItemsDiv = document.getElementById("cartItems");
  cartItemsDiv.innerHTML = "";

  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    cartItem.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.productName}</h4>
        <p>Farmer: ${item.farmerName}</p>
      </div>
      <div class="cart-item-controls">
        <button onclick="decreaseQuantity(${index})">-</button>
        <span>${item.quantity} kg</span>
        <button onclick="increaseQuantity(${index})">+</button>
        <button class="remove-btn" onclick="removeItem(${index})">✖</button>
      </div>
      <div class="cart-item-price">₹${item.price * item.quantity}</div>
    `;

    cartItemsDiv.appendChild(cartItem);
  });

  document.getElementById("cartTotal").innerHTML = `<h3>Total: ₹${total}</h3>`;
}


function increaseQuantity(index) {
  cart[index].quantity += 1;
  saveCart();
  updateCartUI();
}

function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    cart.splice(index, 1); // remove if quantity goes to 0
  }
  saveCart();
  updateCartUI();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function displayFarmersOnMap() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    farmers.forEach(farmer => {
        const productCount = farmer.products.filter(p => p.quantity > 0).length;
        
        const marker = L.marker([farmer.lat, farmer.lng]).addTo(map)
            .bindPopup(`
                <b>${farmer.name}</b><br>
                ${farmer.location}<br>
                📞 ${farmer.contact}<br>
                🌾 ${productCount} products available
            `);
        
        markers.push(marker);
    });
}
