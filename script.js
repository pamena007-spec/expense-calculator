// =====================================================
// Personal Expense Calculator - script.js
// =====================================================

// ---------- 1. Data (variables, arrays, objects) ----------
var income = 0;        // monthly income
var expenses = [];     // array of objects: { name, amount, category, date }
var CURRENCY = "₹";
var STORAGE_KEY = "expenseCalculatorData";

// Category list with an emoji for each (an array of objects)
var categories = [
  { name: "Food", icon: "🍔" },
  { name: "Transport", icon: "🚌" },
  { name: "Education", icon: "📚" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Bills", icon: "💡" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Healthcare", icon: "🏥" },
  { name: "Other", icon: "📦" }
];

// ---------- 2. Get elements from the page ----------
var incomeForm = document.getElementById("incomeForm");
var expenseForm = document.getElementById("expenseForm");
var incomeInput = document.getElementById("incomeInput");
var nameInput = document.getElementById("expenseName");
var amountInput = document.getElementById("expenseAmount");
var categoryInput = document.getElementById("expenseCategory");
var dateInput = document.getElementById("expenseDate");

var incomeError = document.getElementById("incomeError");
var nameError = document.getElementById("nameError");
var amountError = document.getElementById("amountError");
var categoryError = document.getElementById("categoryError");
var dateError = document.getElementById("dateError");

var expenseBody = document.getElementById("expenseBody");
var emptyMessage = document.getElementById("emptyMessage");
var categoryGrid = document.getElementById("categoryGrid");
var categoryEmpty = document.getElementById("categoryEmpty");
var statusBanner = document.getElementById("statusBanner");
var savingsStat = document.getElementById("savingsStat");
var savingsIcon = document.getElementById("savingsIcon");
var toast = document.getElementById("toast");

// ---------- 3. localStorage: save and load ----------

// Save income and expenses so they stay after refreshing the page
function saveData() {
  try {
    var data = { income: income, expenses: expenses };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Storage may be blocked in some browsers; the app still works without it
  }
}

// Load saved data when the page opens
function loadData() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var data = JSON.parse(saved);
      income = Number(data.income) || 0;
      expenses = Array.isArray(data.expenses) ? data.expenses : [];
    }
  } catch (error) {
    income = 0;
    expenses = [];
  }
}

// ---------- 4. Helper functions ----------

// 1250 -> "₹1250.00"
function formatMoney(value) {
  return CURRENCY + value.toFixed(2);
}

// "2026-10-07" -> "07 Oct 2026"
function formatDate(dateText) {
  var parts = dateText.split("-");               // [year, month, day]
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return parts[2] + " " + months[Number(parts[1]) - 1] + " " + parts[0];
}

// Today's date as "YYYY-MM-DD" (used as the default date)
function todayString() {
  var d = new Date();
  var month = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

// Stops text typed by the user from being treated as HTML
function escapeHTML(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Finds the emoji for a category name
function getIcon(categoryName) {
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].name === categoryName) {
      return categories[i].icon;
    }
  }
  return "📦";
}

// Adds all expense amounts together using a loop
function calculateTotalExpenses() {
  var total = 0;
  for (var i = 0; i < expenses.length; i++) {
    total = total + expenses[i].amount;
  }
  return total;
}

// Savings = Income - Total Expenses
function calculateSavings() {
  return income - calculateTotalExpenses();
}

// Shows a small message at the top for 2.5 seconds
var toastTimer;
function showToast(message, type) {
  toast.textContent = message;
  toast.className = "toast show " + (type || "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.className = "toast";
  }, 2500);
}

// Shows or clears an error under a field
function setError(inputElement, errorElement, message) {
  errorElement.textContent = message;
  if (message) {
    inputElement.classList.add("invalid");
  } else {
    inputElement.classList.remove("invalid");
  }
}

// ---------- 5. Income form ----------
incomeForm.addEventListener("submit", function (event) {
  event.preventDefault();                        // stop page reload
  var text = incomeInput.value.trim();
  var number = Number(text);

  // Validation: not empty, a number, and greater than 0
  if (text === "") {
    setError(incomeInput, incomeError, "Please enter your monthly income.");
    return;
  }
  if (isNaN(number) || number <= 0) {
    setError(incomeInput, incomeError, "Income must be a number greater than 0.");
    return;
  }

  setError(incomeInput, incomeError, "");
  income = number;
  saveData();
  updateUI();
  showToast("✅ Income saved!");
});

// ---------- 6. Add Expense form ----------
expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  var name = nameInput.value.trim();
  var amountText = amountInput.value.trim();
  var amount = Number(amountText);
  var category = categoryInput.value;
  var date = dateInput.value;
  var isValid = true;

  // Check every field and show a message for each problem
  if (name === "") {
    setError(nameInput, nameError, "Please enter an expense name.");
    isValid = false;
  } else {
    setError(nameInput, nameError, "");
  }

  if (amountText === "") {
    setError(amountInput, amountError, "Please enter an amount.");
    isValid = false;
  } else if (isNaN(amount) || amount <= 0) {
    setError(amountInput, amountError, "Amount must be a number greater than 0.");
    isValid = false;
  } else {
    setError(amountInput, amountError, "");
  }

  if (category === "") {
    setError(categoryInput, categoryError, "Please choose a category.");
    isValid = false;
  } else {
    setError(categoryInput, categoryError, "");
  }

  if (date === "") {
    setError(dateInput, dateError, "Please choose a date.");
    isValid = false;
  } else {
    setError(dateInput, dateError, "");
  }

  if (isValid === false) {
    return;                                      // stop if anything is wrong
  }

  // Add a new expense object to the array
  expenses.push({ name: name, amount: amount, category: category, date: date });
  saveData();

  expenseForm.reset();
  dateInput.value = todayString();               // put today's date back
  updateUI();
  showToast("🎉 Expense added successfully!");
});

// ---------- 7. Delete one expense ----------
function deleteExpense(index) {
  expenses.splice(index, 1);                     // remove 1 item at this position
  saveData();
  updateUI();
  showToast("Expense deleted.", "info");
}

// One listener handles every Delete button in the table
expenseBody.addEventListener("click", function (event) {
  var button = event.target.closest("button");
  if (button) {
    deleteExpense(Number(button.getAttribute("data-index")));
  }
});

// ---------- 8. Reset everything ----------
document.getElementById("resetBtn").addEventListener("click", function () {
  if (confirm("Clear your income and all expenses?")) {
    income = 0;
    expenses = [];
    saveData();
    incomeForm.reset();
    expenseForm.reset();
    dateInput.value = todayString();
    // clear any error messages
    setError(incomeInput, incomeError, "");
    setError(nameInput, nameError, "");
    setError(amountInput, amountError, "");
    setError(categoryInput, categoryError, "");
    setError(dateInput, dateError, "");
    updateUI();
    showToast("All data cleared.", "info");
  }
});

// ---------- 9. Drawing the page ----------

// Top three dashboard cards
function showDashboard() {
  var savings = calculateSavings();
  document.getElementById("totalIncome").textContent = formatMoney(income);
  document.getElementById("totalExpenses").textContent = formatMoney(calculateTotalExpenses());
  document.getElementById("totalSavings").textContent = formatMoney(savings);

  // Savings card turns red when negative
  if (savings < 0) {
    savingsStat.classList.add("negative");
    savingsIcon.textContent = "⚠️";
  } else {
    savingsStat.classList.remove("negative");
    savingsIcon.textContent = "🏦";
  }
}

// Positive savings message or Overspending warning
function showStatusBanner() {
  var totalExpenses = calculateTotalExpenses();
  var savings = calculateSavings();

  if (income === 0 && expenses.length === 0) {
    statusBanner.className = "banner hidden";    // nothing to report yet
    return;
  }

  if (income === 0) {
    statusBanner.className = "banner neutral";
    statusBanner.textContent = "💡 Enter your monthly income to see your savings.";
  } else if (totalExpenses > income) {
    statusBanner.className = "banner bad";
    statusBanner.textContent = "⚠️ Overspending! Your expenses are " +
      formatMoney(totalExpenses - income) + " more than your income.";
  } else if (savings > 0) {
    statusBanner.className = "banner good";
    statusBanner.textContent = "🎉 Great job! You are saving " + formatMoney(savings) +
      " this month.";
  } else {
    statusBanner.className = "banner neutral";
    statusBanner.textContent = "ℹ️ You have spent exactly your income. No savings yet.";
  }
}

// Builds the table rows with a loop
function showExpenseTable() {
  expenseBody.innerHTML = "";

  for (var i = 0; i < expenses.length; i++) {
    var item = expenses[i];
    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + escapeHTML(item.name) + "</td>" +
      "<td>" + getIcon(item.category) + " " + item.category + "</td>" +
      '<td class="num">' + formatMoney(item.amount) + "</td>" +
      "<td>" + formatDate(item.date) + "</td>" +
      '<td><button class="btn btn-small" data-index="' + i + '" aria-label="Delete expense">🗑️ Delete</button></td>';
    expenseBody.appendChild(row);
  }

  emptyMessage.style.display = expenses.length === 0 ? "block" : "none";
}

// Category-wise summary cards with a bar showing each share
function showCategorySummary() {
  categoryGrid.innerHTML = "";
  var totalExpenses = calculateTotalExpenses();

  // Loop through every category
  for (var i = 0; i < categories.length; i++) {
    var catName = categories[i].name;
    var catTotal = 0;

    // Add up the expenses that belong to this category
    for (var j = 0; j < expenses.length; j++) {
      if (expenses[j].category === catName) {
        catTotal = catTotal + expenses[j].amount;
      }
    }

    // Only show categories with spending
    if (catTotal > 0) {
      var percent = (catTotal / totalExpenses) * 100;
      var card = document.createElement("div");
      card.className = "cat-card";
      card.innerHTML =
        '<div class="cat-name">' + categories[i].icon + " " + catName + "</div>" +
        '<div class="cat-amount">' + formatMoney(catTotal) + "</div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + percent.toFixed(1) + '%"></div></div>' +
        '<div class="cat-percent">' + percent.toFixed(1) + "% of expenses</div>";
      categoryGrid.appendChild(card);
    }
  }

  categoryEmpty.style.display = expenses.length === 0 ? "block" : "none";
}

// Refreshes everything on the screen
function updateUI() {
  showDashboard();
  showStatusBanner();
  showExpenseTable();
  showCategorySummary();
}

// ---------- 10. Start the app ----------
loadData();                                      // get saved data (if any)
dateInput.value = todayString();                 // default date = today
if (income > 0) {
  incomeInput.value = income;                    // show saved income in the box
}
updateUI();
