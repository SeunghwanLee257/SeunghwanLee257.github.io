(function(){
  var categories = ["ABS", "ADD_TH", "ADD_VER2", "ADD", "ADD3", "EQ", "GATE_VEC", "LT", "MAX", "NEG", "SELECT"];
  var colors = {
    ABS: "#f5bd22",
    ADD_TH: "#0e9f8f",
    ADD_VER2: "#3157d5",
    ADD: "#ff7a1a",
    ADD3: "#7aa62d",
    EQ: "#c14f00",
    GATE_VEC: "#ee6d15",
    LT: "#74706a",
    MAX: "#2c8f55",
    NEG: "#9a4bd6",
    SELECT: "#555f70"
  };

  var machines = {
    "ccrl-xeon-6240r": {
      label: "CCRL dual Xeon 6240R workstation",
      dataPath: "./data/"
    }
  };

  var chart;
  var activeCategory = "ABS";
  var activeMachine = "ccrl-xeon-6240r";

  function currentMachine(){
    return machines[activeMachine] || machines["ccrl-xeon-6240r"];
  }

  function formatMs(value){
    if(!Number.isFinite(value)) return "-";
    return value >= 100 ? value.toFixed(1) + " ms" : value.toFixed(2) + " ms";
  }

  function normalizeData(raw){
    return Object.keys(raw || {})
      .map(function(key){ return { x: Number(key), y: Number(raw[key]) }; })
      .filter(function(point){ return Number.isFinite(point.x) && Number.isFinite(point.y); })
      .sort(function(a, b){ return a.x - b.x; });
  }

  function representativeRows(points){
    if(points.length <= 16) return points;
    var rows = [];
    var step = Math.max(1, Math.floor(points.length / 14));
    for(var i = 0; i < points.length; i += step) rows.push(points[i]);
    if(rows[rows.length - 1] !== points[points.length - 1]) rows.push(points[points.length - 1]);
    return rows.slice(0, 18);
  }

  function updateMetrics(points){
    var first = points[0];
    var last = points[points.length - 1];
    var values = points.map(function(point){ return point.y; });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var avg = values.reduce(function(sum, value){ return sum + value; }, 0) / values.length;

    var fields = {
      benchmarkMetricCategory: activeCategory,
      benchmarkMetricRange: first.x + " - " + last.x,
      benchmarkMetricStart: formatMs(first.y),
      benchmarkMetricEnd: formatMs(last.y),
      benchmarkMetricMin: formatMs(min),
      benchmarkMetricMax: formatMs(max),
      benchmarkMetricAvg: formatMs(avg),
      benchmarkMetricPoints: String(points.length)
    };

    Object.keys(fields).forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.textContent = fields[id];
    });
  }

  function updateTable(points){
    var tbody = document.getElementById("benchmarkTableBody");
    if(!tbody) return;
    tbody.innerHTML = representativeRows(points).map(function(point){
      return "<tr><td>" + point.x + "</td><td>" + formatMs(point.y) + "</td></tr>";
    }).join("");
  }

  function updateChart(points){
    var canvas = document.getElementById("benchmarkChartCanvas");
    if(!canvas || typeof Chart === "undefined") return;
    var color = colors[activeCategory] || "#ff7a1a";
    var ctx = canvas.getContext("2d");

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: points.map(function(point){ return point.x; }),
        datasets: [{
          label: activeCategory,
          data: points.map(function(point){ return point.y; }),
          borderColor: color,
          backgroundColor: color + "22",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: color,
          tension: .16,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function(items){ return "N = " + items[0].label; },
              label: function(item){ return activeCategory + ": " + formatMs(item.parsed.y); }
            }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(24,23,22,.08)" },
            ticks: { color: "#6f6b66", maxTicksLimit: 12 }
          },
          y: {
            grid: { color: "rgba(24,23,22,.1)" },
            ticks: { color: "#6f6b66", callback: function(value){ return value + " ms"; } }
          }
        }
      }
    });
  }

  function setStatus(message){
    var status = document.getElementById("benchmarkStatus");
    if(status) status.textContent = message;
  }

  function loadCategory(category){
    activeCategory = category;
    document.querySelectorAll("[data-benchmark-category]").forEach(function(btn){
      var active = btn.getAttribute("data-benchmark-category") === category;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    var machine = currentMachine();
    setStatus("Loading " + category + " data on " + machine.label + "...");

    fetch(machine.dataPath + encodeURIComponent(category) + ".json")
      .then(function(response){
        if(!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function(raw){
        var points = normalizeData(raw);
        if(!points.length) throw new Error("Empty benchmark data");
        updateMetrics(points);
        updateTable(points);
        updateChart(points);
        setStatus(category + " loaded · " + machine.label);
      })
      .catch(function(error){
        console.error(error);
        setStatus("Failed to load benchmark data");
      });
  }

  function initialCategory(){
    var category = new URLSearchParams(window.location.search).get("category");
    return categories.indexOf(category) >= 0 ? category : "ABS";
  }

  function initMachineSelector(){
    var select = document.getElementById("benchmarkMachineSelect");
    if(!select) return;
    select.value = activeMachine;
    select.addEventListener("change", function(){
      if(!machines[select.value]) return;
      activeMachine = select.value;
      loadCategory(activeCategory);
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    initMachineSelector();
    document.querySelectorAll("[data-benchmark-category]").forEach(function(btn){
      btn.addEventListener("click", function(){
        loadCategory(btn.getAttribute("data-benchmark-category"));
      });
    });
    loadCategory(initialCategory());
  });
})();
