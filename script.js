const scrollElements = document.querySelectorAll('.scroll-fly');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

scrollElements.forEach(el => observer.observe(el));



let selectedRole = null;
let farmerUsers = JSON.parse(localStorage.getItem("farmerUsers")) || [];
let consumerUsers = JSON.parse(localStorage.getItem("consumerUsers")) || [];

function openLogin(role) {
  selectedRole = role;
  document.getElementById('authOverlay').classList.remove("hidden")
}

function closeAuth() {
  document.getElementById("authOverlay").classList.add("hidden")
}

function switchToRegister() {
  document.getElementById("authTitle").innerText = "register"
  document.getElementById("authBtn").innerText = "register"
  document.getElementById("authBtn").onclick = registerUser;
}

function registerUser() {
  const username = document.getElementById("authUsername").value;
  const password = document.getElementById("authPassword").value;

  if (!username || !password) {
    alert("Please enter all fields!");
    return;
  }

  const user = {
    username,
    password,
    role: selectedRole
  };

  if (selectedRole === "farmer") {
    user.profile = {
      name: username,
      location: "",
      contact: "",
      products: []
    };
    farmerUsers.push(user);
    localStorage.setItem("farmerUsers", JSON.stringify(farmerUsers));
  } else {
    consumerUsers.push(user);
    localStorage.setItem("consumerUsers", JSON.stringify(consumerUsers));
  }

  alert("Registered successfully! Now login");
}



function loginUser() {
  const username = document.getElementById("authUsername").value;
  const password = document.getElementById("authPassword").value;

  // Always reload from localStorage to get the latest data 
  const farmerUsers = JSON.parse(localStorage.getItem("farmerUsers")) || []; 
  const consumerUsers = JSON.parse(localStorage.getItem("consumerUsers")) || [];

  const users = selectedRole === "farmer" ? farmerUsers : consumerUsers;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    alert("Invalid credentials");
    return;
  }

  if (selectedRole === "farmer") {
    localStorage.setItem("loggedInFarmer", username);
  } else {
    localStorage.setItem("loggedInConsumer", username);
  }

  closeAuth();
  loadDashboard(user.role);
}


function loadDashboard(role) {
  if (role === "farmer") {
        window.location.href = "farmer.html";

  } else {
    // Redirect to consumer page instead of showing section
    window.location.href = "consumer.html";
  }
}


// ---------- CART DATA ----------
let cart = JSON.parse(localStorage.getItem("cart")) || [];
function saveCart(){
  localStorage.setItem("cart" , JSON.stringify(cart))
}
function clearCart(){
  cart = []
  saveCart()
}

function addToCart(productName , price , farmerName , contact){
  const existing = cart.find(item => item.productName === productName)
  if (existing){
    existing.quantity += 1
  }else{
    cart.push({
      productName,
      price,
      quantity: 1,
      farmerName,
      contact
    })
    saveCart()
    updateCartUI()
  }
}

function updateCartUI(){
  document.getElementById("cartCount").innerText = cart.reduce((sum , item) => sum + item.quantity , 0)
  const cartItemsDiv = document.getElementById("cartItems")
  cartItemsDiv.innerHTML = ""
  cart.forEach(item => {
    cartItemsDiv.innerHTML += `<p> ${item.productName} - ${item.quantity}kg - ₹${item.price * item.quantity}</p>`

  })
}
  function openCart(){
   document.getElementById("cartModal").style.display = "flex"
  }

function closeCart(){
  document.getElementById("cartModal").style.display = "none"
}


// ---------- DATA ---------- 
let farmers = JSON.parse(localStorage.getItem("farmers")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];

// ---------- MAP ----------
const map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = [];

// ---------- DOM REFERENCES ----------
const nameInput = document.getElementById("nameInput");
const locationInput = document.getElementById("locationInput");
const contactInput = document.getElementById("contactInput");
const productForm = document.getElementById("productForm");
const productFarmerSelect = document.getElementById("productFarmerSelect");
const farmerSelect = document.getElementById("farmerSelect");
const productSelect = document.getElementById("productSelect");
const farmerForm = document.getElementById("farmerForm");
const orderForm = document.getElementById("orderForm");
const deliveryDate = document.getElementById("deliveryDate");
const deliverySlot = document.getElementById("deliverySlot");
const productsList = document.getElementById("productsList");
const farmerMessage = document.getElementById("farmerMessage");
const orderMessage = document.getElementById("orderMessage");
const productNameInput = document.getElementById("productName");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");
const harvestDateInput = document.getElementById("harvestDate");
const orderQuantityInput = document.getElementById("orderQuantity");


function displayFarmersOnMap() {
  // Remove old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  farmers.forEach(farmer => {
    const marker = L.marker([farmer.lat, farmer.lng]).addTo(map)
      .bindPopup(`<b>${farmer.name}</b><br>${farmer.contact}`).openPopup()
    markers.push(marker);
  });
}



farmerForm.addEventListener('submit', function (e) {
  e.preventDefault()
  const name = nameInput.value.trim();
  const location = locationInput.value.trim();
  const contact = contactInput.value.trim();




  if (!name || !location || !contact) {
    alert('please fill out all the fields!')
    return;
  }
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        alert("Location not found!");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);


      const farmer = {
        name,
        location,
        contact,
        lat,
        lng,
        products: []
      };

      farmers.push(farmer);
      localStorage.setItem("farmers", JSON.stringify(farmers));

      // Add marker to map
      const marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>${name}</b><br>${contact}`)
        .openPopup();

      markers.push(marker);
      displayFarmersOnMap()
      populateProductFarmerDropdown();


      farmerMessage.innerText = "Farmer registered successfully!";
      farmerForm.reset();
    }, function (err) {
      alert("Location error: " + err.message);
    })
})

function populateProductFarmerDropdown() {
  productFarmerSelect.innerHTML = ""

  const defaultoption = document.createElement('option')
  defaultoption.value = ""
  defaultoption.textContent = "select farmer"
  productFarmerSelect.appendChild(defaultoption)

  farmers.forEach((farmer, index) => {
    const option = document.createElement('option')
    option.value = index
    option.textContent = farmer.name
    productFarmerSelect.appendChild(option)


  })

}
populateProductFarmerDropdown()
productForm.addEventListener('submit', function (e) {
  e.preventDefault()
  const farmerIndex = productFarmerSelect.value

  const product = {
    name: productNameInput.value.trim(),
    quantity: Number(quantityInput.value),
    Price: Number(priceInput.value),
    harvestDate: harvestDateInput.value
  }

  farmers[farmerIndex].products.push(product)
  localStorage.setItem("farmers", JSON.stringify(farmers));
  alert("Product added successfully!");
  productForm.reset();
  populateOrderDropdowns();


})
displayFarmersOnMap();

function populateOrderDropdowns() {
  productSelect.innerHTML = `<option value="">Select Product</option>`

  farmers.forEach((farmer, fIndex) => {
    farmer.products.forEach((product, pIndex) => {
      const opt = document.createElement('option')
      opt.value = `${fIndex}-${pIndex}`
      opt.textContent = `${product.name} (Available: ${product.quantity} kg)`
      productSelect.appendChild(opt);

    })
  })



}



orderForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const [farmerIndex, productIndex] = productSelect.value.split("-").map(Number);
  const orderQuantity = Number(orderQuantityInput.value);
  const slot = deliverySlot.value;

  const farmer = farmers[farmerIndex];
  const product = farmers[farmerIndex].products[productIndex];

  if (orderQuantity > product.quantity) {
    alert('Order quantity exceeds available stock');
    return;
  }

  const totalPrice = product.Price * orderQuantity;

  const order = {
    product: product.name,
    quantity: orderQuantity,
    totalPrice,
    farmerName: farmer.name,
    farmerContact: farmer.contact,
    slot
  };

  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));

  orderMessage.innerHTML = `
    <b>Order Placed Successfully!</b><br>
    Product: ${product.name}<br>
    Quantity: ${orderQuantity} kg<br>
    Total Price: ₹${totalPrice}<br>
    Farmer: ${farmer.name}<br>
    Contact: ${farmer.contact}
  `
  orderMessage.style.display = "block"; // show banner


  orderForm.reset();
});

populateOrderDropdowns();



function displayProducts() {
  productsList.innerHTML = "";
  farmers.forEach(f => {
    f.products.forEach(p => {
      productsList.innerHTML += `
        <p><b>${f.name}</b> → ${p.productName} | ₹${p.price} | ${p.quantity}kg</p>
      `;
    });
  });
}

// ---------- PRICE DASHBOARD ----------
function populatePriceDashboard() {
  const tableBody = document.querySelector("#priceTable tbody");
  tableBody.innerHTML = ""; // Clear existing rows

  farmers.forEach(farmer => {
    farmer.products.forEach(product => {
      const tr = document.createElement("tr");

      const farmerNameTd = document.createElement("td");
      farmerNameTd.textContent = farmer.name;

      const productNameTd = document.createElement("td");
      productNameTd.textContent = product.name;

      const farmerPriceTd = document.createElement("td");
      farmerPriceTd.textContent = product.Price;

      const marketPriceTd = document.createElement("td");
      // For demo, random market price within ±20% of farmer price
      const marketPrice = Math.round(product.Price * (0.8 + Math.random() * 0.4));
      marketPriceTd.textContent = marketPrice;

      const differenceTd = document.createElement("td");
      differenceTd.textContent = marketPrice - product.Price;

      tr.appendChild(farmerNameTd);
      tr.appendChild(productNameTd);
      tr.appendChild(farmerPriceTd);
      tr.appendChild(marketPriceTd);
      tr.appendChild(differenceTd);

      tableBody.appendChild(tr);
    });
  });
}

// Call this function whenever products are added or updated
populatePriceDashboard();

