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
      label: { ko: "CCRL 듀얼 Xeon 6240R 워크스테이션", en: "CCRL dual Xeon 6240R workstation" },
      dataPath: "./data/"
    }
  };

  var versions = {
    "fhe16-0-10": {
      label: { ko: "FHE16 version 0.10", en: "FHE16 version 0.10" },
      body: { ko: "현재 공개 벤치마크 버전입니다. 수치 데이터는 Latency-first / CPU 조합만 제공합니다.", en: "Current public benchmark version. Numeric data is available only for Latency-first / CPU." }
    },
    "fhe16-next": {
      label: { ko: "FHE16 다음 버전", en: "FHE16 next version" },
      body: { ko: "T.B.D", en: "T.B.D" }
    },
    "fhe16-hardware": {
      label: { ko: "FHE16 하드웨어 버전", en: "FHE16 hardware version" },
      body: { ko: "T.B.D", en: "T.B.D" }
    }
  };

  var modes = {
    latency: {
      label: { ko: "Latency-first", en: "Latency-first" },
      body: {
        ko: "Latency-first는 스레드 전체가 하나의 연산에 달라붙는 방식입니다. 목표는 회로 depth와 critical path를 줄여 단일 연산 지연 시간을 최소화하는 것입니다.",
        en: "Latency-first assigns the full thread pool to one operation. The goal is to minimize circuit depth and the critical path for the lowest single-operation latency."
      },
      focus: { ko: "회로 depth와 critical path", en: "Circuit depth and critical path" },
      parallelism: { ko: "전체 스레드가 하나의 연산에 협력", en: "All threads cooperate on one operation" }
    },
    throughput: {
      label: { ko: "Throughput-first", en: "Throughput-first" },
      body: {
        ko: "Throughput-first는 데이터를 벡터화하고 각 스레드 또는 lane이 독립 gate를 직접 처리하는 방식입니다. 전체 gate 수와 배치 점유율을 줄이는 쪽에 집중하므로 대량 처리에서는 더 빠른 경로가 됩니다.",
        en: "Throughput-first vectorizes the data so each thread or lane evaluates independent gates directly. It focuses on reducing total gate count and improving batch occupancy, making it faster for bulk workloads."
      },
      focus: { ko: "배치 전체 gate 수와 lane 점유율", en: "Total gate count and lane occupancy" },
      parallelism: { ko: "각 스레드/lane이 독립 gate 또는 샘플 처리", en: "Each thread/lane handles an independent gate or sample" }
    }
  };

  var targets = {
    cpu: {
      label: { ko: "CPU", en: "CPU" },
      body: { ko: "AVX2 / AVX-512 가능한 CPU 기준 공개 baseline", en: "Published baseline on an AVX2 / AVX-512 capable CPU" },
      pending: { ko: "공개 CPU latency 데이터셋", en: "Published CPU latency dataset" }
    },
    gpu: {
      label: { ko: "GPU / Metal", en: "GPU / Metal" },
      body: { ko: "CUDA, Metal 등 GPU backend에서 소수별 병렬화와 lane 병렬 실행을 분리해 추적하는 경로", en: "Runtime path for CUDA, Metal, and GPU backends with prime-level and lane-level parallelism" },
      pending: { ko: "GPU/Metal 수치 데이터셋 준비 트랙", en: "GPU/Metal numeric dataset track" }
    },
    fpga: {
      label: { ko: "FPGA", en: "FPGA" },
      body: { ko: "DSP slice와 고정 pipeline에 맞춰 gate 흐름을 하드웨어화하는 타깃", en: "Hardware target for mapping gate flow into DSP slices and fixed pipelines" },
      pending: { ko: "FPGA 수치 데이터셋 준비 트랙", en: "FPGA numeric dataset track" }
    },
    browser: {
      label: { ko: "WebBrowser", en: "WebBrowser" },
      body: { ko: "WASM / WebGPU 기반 클라이언트 실행 경로로 브라우저 제약에서의 지연 시간과 처리량을 분리 추적", en: "WASM / WebGPU client path for separating browser-constrained latency and throughput" },
      pending: { ko: "WebBrowser 수치 데이터셋 준비 트랙", en: "WebBrowser numeric dataset track" }
    }
  };

  var chart;
  var activeCategory = "ABS";
  var activeMachine = "ccrl-xeon-6240r";
  var activeVersion = "fhe16-0-10";
  var activeMode = "latency";
  var activeTarget = "cpu";
  var lastPoints = [];

  function currentMachine(){
    return machines[activeMachine] || machines["ccrl-xeon-6240r"];
  }

  function currentVersion(){
    return versions[activeVersion] || versions["fhe16-0-10"];
  }

  function currentLang(){
    return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "ko";
  }

  function copy(value){
    if(typeof value === "string") return value;
    var lang = currentLang();
    return value && (value[lang] || value.en || value.ko) || "";
  }

  function setText(id, value){
    var el = document.getElementById(id);
    if(el) el.textContent = copy(value);
  }

  function hasPublishedDataset(){
    return activeVersion === "fhe16-0-10" && activeMode === "latency" && activeTarget === "cpu";
  }

  function datasetLabel(){
    return hasPublishedDataset()
      ? { ko: "FHE16 v0.10 CPU latency", en: "FHE16 v0.10 CPU latency" }
      : { ko: "T.B.D", en: "T.B.D" };
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

  function updateExecutionProfile(){
    var version = currentVersion();
    var mode = modes[activeMode] || modes.latency;
    var target = targets[activeTarget] || targets.cpu;
    setText("benchmarkVersionBody", hasPublishedDataset() ? {
      ko: "FHE16 version 0.10 · Current CPU dataset",
      en: "FHE16 version 0.10 · Current CPU dataset"
    } : copy(version.label) + " · T.B.D");
    setText("benchmarkModeBody", mode.body);
    setText("benchmarkModeFocus", mode.focus);
    setText("benchmarkModeParallelism", mode.parallelism);
    setText("benchmarkTargetBody", target.body);
    setText("benchmarkModeStatus", hasPublishedDataset() ? {
      ko: "FHE16 version 0.10 / Latency-first / CPU 공개 데이터셋",
      en: "FHE16 version 0.10 / Latency-first / CPU published dataset"
    } : { ko: "T.B.D", en: "T.B.D" });
    setText("benchmarkDatasetNote", hasPublishedDataset()
      ? { ko: "FHE16 version 0.10 / Latency-first / CPU 원천 데이터는 data/*.json 파일에 보존되어 있습니다.", en: "The FHE16 version 0.10 / Latency-first / CPU source data remains in the local data/*.json files." }
      : { ko: "선택한 조합의 공개 벤치마크는 T.B.D입니다.", en: "Public benchmark data for the selected combination is T.B.D." });

    document.querySelectorAll("[data-benchmark-version]").forEach(function(btn){
      var active = btn.getAttribute("data-benchmark-version") === activeVersion;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-benchmark-mode]").forEach(function(btn){
      var active = btn.getAttribute("data-benchmark-mode") === activeMode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-benchmark-target]").forEach(function(btn){
      var active = btn.getAttribute("data-benchmark-target") === activeTarget;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function updateMetrics(points){
    var first = points[0];
    var last = points[points.length - 1];
    var values = points.map(function(point){ return point.y; });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var avg = values.reduce(function(sum, value){ return sum + value; }, 0) / values.length;
    var version = currentVersion();
    var mode = modes[activeMode] || modes.latency;
    var target = targets[activeTarget] || targets.cpu;

    var fields = {
      benchmarkMetricVersion: copy(version.label),
      benchmarkMetricMode: copy(mode.label),
      benchmarkMetricTarget: copy(target.label),
      benchmarkMetricCategory: activeCategory,
      benchmarkMetricDataset: copy(datasetLabel()),
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
    var label = hasPublishedDataset()
      ? activeCategory + " · " + copy(modes[activeMode].label) + " / " + copy(targets[activeTarget].label)
      : activeCategory + " · CPU latency baseline";

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: points.map(function(point){ return point.x; }),
        datasets: [{
          label: label,
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
              label: function(item){ return label + ": " + formatMs(item.parsed.y); }
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
    if(status) status.textContent = copy(message);
  }

  function setCanvasTbd(open){
    var wrap = document.getElementById("benchmarkCanvasWrap");
    var tbd = document.getElementById("benchmarkTbdState");
    if(wrap) wrap.classList.toggle("is-tbd", open);
    if(tbd) tbd.hidden = !open;
  }

  function updateTbdMetrics(){
    var version = currentVersion();
    var mode = modes[activeMode] || modes.latency;
    var target = targets[activeTarget] || targets.cpu;
    var fields = {
      benchmarkMetricVersion: copy(version.label),
      benchmarkMetricMode: copy(mode.label),
      benchmarkMetricTarget: copy(target.label),
      benchmarkMetricCategory: activeCategory,
      benchmarkMetricDataset: "T.B.D",
      benchmarkMetricRange: "T.B.D",
      benchmarkMetricStart: "T.B.D",
      benchmarkMetricEnd: "T.B.D",
      benchmarkMetricMin: "T.B.D",
      benchmarkMetricMax: "T.B.D",
      benchmarkMetricAvg: "T.B.D",
      benchmarkMetricPoints: "T.B.D"
    };
    Object.keys(fields).forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.textContent = fields[id];
    });
  }

  function updateTbdTable(){
    var tbody = document.getElementById("benchmarkTableBody");
    if(tbody) tbody.innerHTML = '<tr><td colspan="2">T.B.D</td></tr>';
  }

  function updateTbdView(){
    if(chart){
      chart.destroy();
      chart = null;
    }
    updateExecutionProfile();
    updateTbdMetrics();
    updateTbdTable();
    setCanvasTbd(true);
    setStatus({
      ko: copy(currentVersion().label) + " / " + copy(modes[activeMode].label) + " / " + copy(targets[activeTarget].label) + " · T.B.D",
      en: copy(currentVersion().label) + " / " + copy(modes[activeMode].label) + " / " + copy(targets[activeTarget].label) + " · T.B.D"
    });
  }

  function updateRenderedData(points){
    if(!points.length) return;
    lastPoints = points;
    if(!hasPublishedDataset()){
      updateTbdView();
      return;
    }
    setCanvasTbd(false);
    updateExecutionProfile();
    updateMetrics(points);
    updateTable(points);
    updateChart(points);
    var machine = currentMachine();
    setStatus({
      ko: activeCategory + " 로드 완료 · FHE16 version 0.10 · " + copy(machine.label) + " · Latency-first / CPU",
      en: activeCategory + " loaded · FHE16 version 0.10 · " + copy(machine.label) + " · Latency-first / CPU"
    });
  }

  function loadCategory(category){
    activeCategory = category;
    document.querySelectorAll("[data-benchmark-category]").forEach(function(btn){
      var active = btn.getAttribute("data-benchmark-category") === category;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    var machine = currentMachine();
    setStatus({ ko: category + " 데이터 로딩 중...", en: "Loading " + category + " data on " + copy(machine.label) + "..." });

    fetch(machine.dataPath + encodeURIComponent(category) + ".json")
      .then(function(response){
        if(!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function(raw){
        var points = normalizeData(raw);
        if(!points.length) throw new Error("Empty benchmark data");
        updateRenderedData(points);
      })
      .catch(function(error){
        console.error(error);
        setStatus({ ko: "벤치마크 데이터를 불러오지 못했습니다", en: "Failed to load benchmark data" });
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

  function initExecutionControls(){
    document.querySelectorAll("[data-benchmark-version]").forEach(function(btn){
      btn.addEventListener("click", function(){
        activeVersion = btn.getAttribute("data-benchmark-version") || "fhe16-0-10";
        updateExecutionProfile();
        if(lastPoints.length) updateRenderedData(lastPoints);
      });
    });
    document.querySelectorAll("[data-benchmark-mode]").forEach(function(btn){
      btn.addEventListener("click", function(){
        activeMode = btn.getAttribute("data-benchmark-mode") || "latency";
        updateExecutionProfile();
        if(lastPoints.length) updateRenderedData(lastPoints);
      });
    });
    document.querySelectorAll("[data-benchmark-target]").forEach(function(btn){
      btn.addEventListener("click", function(){
        activeTarget = btn.getAttribute("data-benchmark-target") || "cpu";
        updateExecutionProfile();
        if(lastPoints.length) updateRenderedData(lastPoints);
      });
    });
  }

  document.addEventListener("page:language-changed", function(){
    updateExecutionProfile();
    if(lastPoints.length) updateRenderedData(lastPoints);
  });

  document.addEventListener("DOMContentLoaded", function(){
    initMachineSelector();
    initExecutionControls();
    updateExecutionProfile();
    document.querySelectorAll("[data-benchmark-category]").forEach(function(btn){
      btn.addEventListener("click", function(){
        loadCategory(btn.getAttribute("data-benchmark-category"));
      });
    });
    loadCategory(initialCategory());
  });
})();
