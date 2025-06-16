// Placeholder beta and alpha values (replace with API data in a real app)
const stockMetrics = {
  "PLTR": { beta: 1.8, alpha: 0.5 },
  "AMZN": { beta: 1.2, alpha: 0.3 },
  "TSLA": { beta: 2.0, alpha: -0.2 },
  "NVDA": { beta: 1.5, alpha: 0.4 },
  "SOUN": { beta: 2.5, alpha: -0.5 },
  "AAPL": { beta: 1.1, alpha: 0.2 },
  "FSK": { beta: 0.8, alpha: 0.1 },
  "JEPQ": { beta: 0.9, alpha: 0.0 },
  "VTI": { beta: 1.0, alpha: 0.0 },
  "SOFI": { beta: 1.7, alpha: -0.3 }
};

// Initialize with one stock input
let stockCount = 0;
function addStockInput() {
  stockCount++;
  let stockInputs = document.getElementById("stockInputs");
  let inputGroup = document.createElement("div");
  inputGroup.className = "input-group";
  inputGroup.id = `inputGroup${stockCount}`;
  inputGroup.innerHTML = `
    <input type="text" placeholder="Ticker" id="s${stockCount}">
    <input type="number" step="0.01" placeholder="Weight (%)" id="w${stockCount}" min="0" max="100">
    <select id="cap${stockCount}">
      <option value="Large">Large</option>
      <option value="Mid">Mid</option>
      <option value="Small">Small</option>
    </select>
    <select id="style${stockCount}">
      <option value="Value">Value</option>
      <option value="Blend">Blend</option>
      <option value="Growth">Growth</option>
    </select>
    <button type="button" class="remove-btn" id="remove${stockCount}">Remove</button>
  `;
  stockInputs.appendChild(inputGroup);
  document.getElementById(`w${stockCount}`).addEventListener("input", updateTotalWeight);
  document.getElementById(`remove${stockCount}`).addEventListener("click", function() {
    inputGroup.remove();
    updateTotalWeight();
  });
}

// Add first stock input on page load
addStockInput();

// Add event listener for the Add Stock button
document.getElementById("addStock").addEventListener("click", addStockInput);

// Update total weight dynamically
function updateTotalWeight() {
  let total = 0;
  let inputGroups = document.querySelectorAll(".input-group");
  inputGroups.forEach(group => {
    let weightInput = group.querySelector('[id^="w"]');
    if (weightInput) {
      let weight = Number(weightInput.value) || 0;
      total += weight;
      if (weight < 0 || isNaN(weight)) {
        weightInput.classList.add("invalid");
      } else {
        weightInput.classList.remove("invalid");
      }
    }
  });
  document.getElementById("totalWeight").textContent = total.toFixed(2);
}

// Clear form functionality
document.getElementById("clearForm").addEventListener("click", function() {
  document.getElementById("portfolioForm").reset();
  document.getElementById("gridContainer").innerHTML = "";
  document.getElementById("rebalanceSuggestions").innerHTML = "";
  document.getElementById("stockInputs").innerHTML = "";
  stockCount = 0;
  addStockInput();
  document.getElementById("totalWeight").textContent = "0.00";
  document.getElementById("portfolioBeta").textContent = "0.00";
  document.getElementById("portfolioAlpha").textContent = "0.00";
  document.getElementById("portfolioRisk").textContent = "0.00";
});

document.getElementById("portfolioForm").addEventListener("submit", function(e) {
  e.preventDefault();
  console.log("Form submitted");
  let stocks = [];
  let inputGroups = document.querySelectorAll(".input-group");
  inputGroups.forEach(group => {
    let ticker = group.querySelector('[id^="s"]');
    let weight = group.querySelector('[id^="w"]');
    let cap = group.querySelector('[id^="cap"]');
    let style = group.querySelector('[id^="style"]');
    if (ticker && weight && cap && style && ticker.value && Number(weight.value) > 0) {
      stocks.push({
        name: ticker.value.toUpperCase(),
        weight: Number(weight.value),
        cap: cap.value,
        style: style.value
      });
      console.log(`Added stock: ${ticker.value}, Weight: ${weight.value}, Cap: ${cap.value}, Style: ${style.value}`);
    }
  });
  console.log("Stocks array:", stocks);
  if (stocks.length === 0) {
    alert("Please add at least one stock with a valid weight!");
    return;
  }
  let total = stocks.reduce((sum, stock) => sum + stock.weight, 0);
  console.log("Total weight:", total);
  if (Math.abs(total - 100) > 0.01) {
    alert("Weights must add up to 100% (allowing for minor decimal differences)!");
    return;
  }

  // Calculate portfolio beta and alpha
  let portfolioBeta = 0;
  let portfolioAlpha = 0;
  stocks.forEach(stock => {
    let metrics = stockMetrics[stock.name] || { beta: 1.0, alpha: 0.0 };
    portfolioBeta += (stock.weight / 100) * metrics.beta;
    portfolioAlpha += (stock.weight / 100) * metrics.alpha;
  });

  // Calculate risk percentage (simplified: based on beta)
  let riskPercentage = (portfolioBeta * 50).toFixed(2);
  document.getElementById("portfolioBeta").textContent = portfolioBeta.toFixed(2);
  document.getElementById("portfolioAlpha").textContent = portfolioAlpha.toFixed(2);
  document.getElementById("portfolioRisk").textContent = riskPercentage;

  // Initialize 3x3 grid (Large, Mid, Small) x (Value, Blend, Growth)
  let grid = [
    [0, 0, 0], // Large
    [0, 0, 0], // Mid
    [0, 0, 0]  // Small
  ];
  stocks.forEach(stock => {
    let capIndex = { "Large": 0, "Mid": 1, "Small": 2 }[stock.cap];
    let styleIndex = { "Value": 0, "Blend": 1, "Growth": 2 }[stock.style];
    grid[capIndex][styleIndex] += stock.weight;
  });

  // Display grid with labels
  let gridContainer = document.getElementById("gridContainer");
  gridContainer.innerHTML = "";

  // Create row for column headers (Value, Blend, Growth)
  let headerRow = document.createElement("div");
  headerRow.style.display = "grid";
  headerRow.style.gridTemplateColumns = "100px repeat(3, 1fr)";
  headerRow.style.gap = "5px";
  headerRow.innerHTML = '<div class="cell label"></div>';
  ["Value", "Blend", "Growth"].forEach(style => {
    let cell = document.createElement("div");
    cell.className = "cell header";
    cell.textContent = style;
    headerRow.appendChild(cell);
  });
  gridContainer.appendChild(headerRow);

  // Create rows with cap labels and data
  ["Large", "Mid", "Small"].forEach((cap, i) => {
    let row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "100px repeat(3, 1fr)";
    row.style.gap = "5px";

    let capCell = document.createElement("div");
    capCell.className = "cell label";
    capCell.textContent = cap;
    row.appendChild(capCell);

    grid[i].forEach(weight => {
      let cell = document.createElement("div");
      cell.className = "cell";
      cell.textContent = weight.toFixed(2) + "%";
      if (weight > 33) cell.className += " overweight";
      cell.style.backgroundColor = `rgba(0, 128, 0, ${weight / 100})`;
      row.appendChild(cell);
    });
    gridContainer.appendChild(row);
  });

  // Rebalancing suggestions
  let desiredRisk = Number(document.getElementById("desiredRisk").value);
  let desiredBeta = desiredRisk / 50;
  let rebalanceSuggestions = document.getElementById("rebalanceSuggestions");
  rebalanceSuggestions.innerHTML = "<h3>Rebalancing Suggestions</h3>";

  if (portfolioBeta > desiredBeta) {
    let highBetaStocks = stocks.filter(stock => stockMetrics[stock.name]?.beta > 1.0);
    let lowBetaStocks = stocks.filter(stock => stockMetrics[stock.name]?.beta <= 1.0);
    if (highBetaStocks.length > 0 && lowBetaStocks.length > 0) {
      rebalanceSuggestions.innerHTML += `<p>Current Beta (${portfolioBeta.toFixed(2)}) is higher than desired (${desiredBeta.toFixed(2)}).</p>`;
      rebalanceSuggestions.innerHTML += `<p>Consider reducing weight in high-beta stocks like ${highBetaStocks.map(s => s.name).join(", ")} and increasing weight in lower-beta stocks like ${lowBetaStocks.map(s => s.name).join(", ")}.</p>`;
    }
  } else if (portfolioBeta < desiredBeta) {
    let highBetaStocks = stocks.filter(stock => stockMetrics[stock.name]?.beta > 1.0);
    let lowBetaStocks = stocks.filter(stock => stockMetrics[stock.name]?.beta <= 1.0);
    if (highBetaStocks.length > 0 && lowBetaStocks.length > 0) {
      rebalanceSuggestions.innerHTML += `<p>Current Beta (${portfolioBeta.toFixed(2)}) is lower than desired (${desiredBeta.toFixed(2)}).</p>`;
      rebalanceSuggestions.innerHTML += `<p>Consider increasing weight in high-beta stocks like ${highBetaStocks.map(s => s.name).join(", ")} and reducing weight in lower-beta stocks like ${lowBetaStocks.map(s => s.name).join(", ")}.</p>`;
    }
  } else {
    rebalanceSuggestions.innerHTML += `<p>Portfolio Beta (${portfolioBeta.toFixed(2)}) matches your desired risk level.</p>`;
  }

  if (portfolioAlpha < 0) {
    let highAlphaStocks = stocks.filter(stock => stockMetrics[stock.name]?.alpha > 0);
    let lowAlphaStocks = stocks.filter(stock => stockMetrics[stock.name]?.alpha <= 0);
    if (highAlphaStocks.length > 0 && lowAlphaStocks.length > 0) {
      rebalanceSuggestions.innerHTML += `<p>Portfolio Alpha (${portfolioAlpha.toFixed(2)}) is negative. Consider increasing weight in stocks with positive alpha like ${highAlphaStocks.map(s => s.name).join(", ")} and reducing weight in stocks with negative alpha like ${lowAlphaStocks.map(s => s.name).join(", ")}.</p>`;
    }
  } else {
    rebalanceSuggestions.innerHTML += `<p>Portfolio Alpha (${portfolioAlpha.toFixed(2)}) is positive or zero, which is optimal.</p>`;
  }
});