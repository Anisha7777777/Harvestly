// ===== CHECK IF FARMER IS LOGGED IN ===== 

const loggedInFarmer = localStorage.getItem("loggedInFarmer");
if (!loggedInFarmer) {
  alert("Please login first!");
  window.location.href = "index.html";
  throw new Error("Not logged in");
}

let farmerUsers = JSON.parse(localStorage.getItem("farmerUsers")) || []; 
let farmers = JSON.parse(localStorage.getItem("farmers")) || []; 
// Find the logged-in farmer's profile 
const currentUser = farmerUsers.find(u => u.username === loggedInFarmer); 
if (!currentUser || !currentUser.profile) 
  { alert("Farmer profile not found! Please register again.");
     localStorage.removeItem("loggedInFarmer"); window.location.href = "index.html"; 
     throw new Error("Profile not found"); } let farmerProfile = currentUser.profile

function loginUser() {
  const username = document.getElementById("authUsername").value;
  const password = document.getElementById("authPassword").value;

  const users = selectedRole === "farmer" ? farmerUsers : consumerUsers;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    alert("Invalid credentials");
    return;
  }

  // Save login state
  if (selectedRole === "farmer") {
    localStorage.setItem("farmerUsers", username);
  } else {
    localStorage.setItem("consumerUsers", username);
  }

  closeAuth();
  loadDashboard(user.role);
}


// ===== GET FARMER DATA =====

// Initialize products array if it doesn't exist
if (!farmerProfile.products) {
  farmerProfile.products = [];
  console.log("Initialized empty products array");
}

console.log("Farmer profile loaded:", farmerProfile);

// Find farmer index in farmers array
let farmerIndex = farmers.findIndex(f =>
  f.name === farmerProfile.name &&
  f.location === farmerProfile.location
);

console.log("Farmer index in farmers array:", farmerIndex);

// If farmer exists in farmers array, sync the products
if (farmerIndex !== -1) {
  // Use the farmers array version if it has products
  if (farmers[farmerIndex].products && farmers[farmerIndex].products.length > 0) {
    console.log("Syncing products from farmers array:", farmers[farmerIndex].products);
    farmerProfile.products = farmers[farmerIndex].products;
    // Update farmerUsers with synced products
    const userIndex = farmerUsers.findIndex(u => u.username === loggedInFarmer);
    farmerUsers[userIndex].profile = farmerProfile;
    localStorage.setItem("farmerUsers", JSON.stringify(farmerUsers));
  }
}

// ===== DOM REFERENCES =====
const productForm = document.getElementById("productForm");
const productNameInput = document.getElementById("productName");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");
const harvestDateInput = document.getElementById("harvestDate");
const productMessage = document.getElementById("productMessage");
const productsContainer = document.getElementById("productsContainer");
const farmerNameDisplay = document.getElementById("farmerName");
const welcomeFarmerName = document.getElementById("welcomeFarmerName");

// ===== DISPLAY FARMER INFO =====
farmerNameDisplay.textContent = `👨‍🌾 ${farmerProfile.name}`;
welcomeFarmerName.textContent = farmerProfile.name;

// ===== SET MINIMUM DATES =====
function setMinimumDates() {
  const today = new Date().toISOString().split('T')[0];
  harvestDateInput.setAttribute('max', today);
}

setMinimumDates();

// ===== ADD PRODUCT =====
productForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const product = {
    name: productNameInput.value.trim(),
    quantity: Number(quantityInput.value),
    Price: Number(priceInput.value),
    harvestDate: harvestDateInput.value
  };

  if (!product.name || product.quantity <= 0 || product.Price <= 0) {
    showMessage('Please fill all fields with valid values!', 'error');
    return;
  }

  console.log("Adding product:", product);

  // Add product to farmer's profile
  farmerProfile.products.push(product);

  console.log("Products after adding:", farmerProfile.products);

  // Update in farmerUsers array
  const userIndex = farmerUsers.findIndex(u => u.username === loggedInFarmer);
  farmerUsers[userIndex].profile = farmerProfile;
  localStorage.setItem("farmerUsers", JSON.stringify(farmerUsers));

  // Update in farmers array (for backward compatibility)
  if (farmerIndex !== -1) {
    farmers[farmerIndex] = farmerProfile;
    localStorage.setItem("farmers", JSON.stringify(farmers));
  } else {
    // If farmer doesn't exist in farmers array, add them
    farmers.push(farmerProfile);
    farmerIndex = farmers.length - 1;
    localStorage.setItem("farmers", JSON.stringify(farmers));
    console.log("Added farmer to farmers array at index:", farmerIndex);
  }

  showMessage(`✅ ${product.name} added successfully!`, 'success');
  productForm.reset();
  displayMyProducts();
});

// ===== DISPLAY MY PRODUCTS =====
function displayMyProducts() {
  console.log("=== DISPLAYING PRODUCTS ===");
  console.log("Farmer Profile:", farmerProfile);
  console.log("Products array:", farmerProfile.products);
  console.log("Products length:", farmerProfile.products ? farmerProfile.products.length : 0);

  productsContainer.innerHTML = "";

  if (!farmerProfile.products || farmerProfile.products.length === 0) {
    console.log("No products found, showing empty message");
    productsContainer.innerHTML = "<p class='no-products'>You haven't added any products yet. Start by adding your first product above!</p>";
    return;
  }

  console.log(`Rendering ${farmerProfile.products.length} products`);

  farmerProfile.products.forEach((product, index) => {
    console.log(`Rendering product ${index}:`, product);
    const card = document.createElement("div");
    card.className = "product-card";

    const harvestDate = new Date(product.harvestDate).toLocaleDateString('en-IN');

    card.innerHTML = `
      <div class="product-header">
        <h3>${product.name}</h3>
        <span class="product-status ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'}">
          ${product.quantity > 0 ? '✅ In Stock' : '❌ Out of Stock'}
        </span>
      </div>
      <div class="product-details">
        <div class="detail-item">
          <span class="label">Quantity:</span>
          <span class="value">${product.quantity} kg</span>
        </div>
        <div class="detail-item">
          <span class="label">Price:</span>
          <span class="value">₹${product.Price}/kg</span>
        </div>
        <div class="detail-item">
          <span class="label">Harvested:</span>
          <span class="value">${harvestDate}</span>
        </div>
        <div class="detail-item">
          <span class="label">Total Value:</span>
          <span class="value total">₹${product.quantity * product.Price}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteProduct(${index})">🗑️ Delete</button>
    `;

    productsContainer.appendChild(card);
    console.log(`Product ${index} card appended to container`);
  });

  console.log("=== FINISHED DISPLAYING PRODUCTS ===");
}

// ===== DELETE PRODUCT =====
function deleteProduct(index) {
  if (!confirm("Are you sure you want to delete this product?")) {
    return;
  }

  console.log("Deleting product at index:", index);

  farmerProfile.products.splice(index, 1);

  // Update in farmerUsers array
  const userIndex = farmerUsers.findIndex(u => u.username === loggedInFarmer);
  farmerUsers[userIndex].profile = farmerProfile;
  localStorage.setItem("farmerUsers", JSON.stringify(farmerUsers));

  // Update in farmers array
  if (farmerIndex !== -1) {
    farmers[farmerIndex] = farmerProfile;
    localStorage.setItem("farmers", JSON.stringify(farmers));
  }

  showMessage('Product deleted successfully!', 'success');
  displayMyProducts();
}

// ===== LOGOUT =====
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("loggedInFarmer");
    window.location.href = "index.html";
  }
}

// ===== UTILITY FUNCTIONS =====
function showMessage(message, type) {
  productMessage.innerHTML = message;
  productMessage.style.display = 'block';
  productMessage.className = type === 'success' ? 'message success' : 'message error';

  if (type === 'success') {
    setTimeout(() => {
      productMessage.style.display = 'none';
    }, 5000);
  }
}

// ===== INITIALIZE =====
window.addEventListener('DOMContentLoaded', function () {
  console.log("=== PAGE LOADED ===");
  displayMyProducts();
});