const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  lives: document.getElementById("livesValue"),
  distance: document.getElementById("distanceValue"),
  phase: document.getElementById("phaseValue"),
  boss: document.getElementById("bossValue"),
  bossFill: document.getElementById("bossMeterFill"),
  driver: document.getElementById("driverValue"),
  paint: document.getElementById("paintValue"),
  paintSwatch: document.getElementById("paintSwatch"),
  collection: document.getElementById("collectionValue"),
  overlay: document.getElementById("overlay"),
  overlayKicker: document.getElementById("overlayKicker"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayMessage: document.getElementById("overlayMessage"),
  startButton: document.getElementById("startButton"),
  touchButtons: Array.from(document.querySelectorAll(".touch-controls button")),
  garageButton: document.getElementById("garageButton"),
  garageModal: document.getElementById("garageModal"),
  garageCloseButton: document.getElementById("garageCloseButton"),
  garageTabs: Array.from(document.querySelectorAll(".garage-tab")),
  garagePanels: Array.from(document.querySelectorAll(".garage-section")),
  garageDriversCount: document.getElementById("garageDriversCount"),
  garageColorsCount: document.getElementById("garageColorsCount"),
  garageSelectionValue: document.getElementById("garageSelectionValue"),
  driverGrid: document.getElementById("driverGrid"),
  colorGrid: document.getElementById("colorGrid"),
};

const WORLD = {
  width: canvas.width,
  height: canvas.height,
  lanes: 3,
  roadWidth: 318,
};

WORLD.roadX = (WORLD.width - WORLD.roadWidth) / 2;
WORLD.laneWidth = WORLD.roadWidth / WORLD.lanes;

const STORAGE_KEY = "highway-boss-run-garage-v1";
const PLAYER_Y = WORLD.height - 112;
const BOSS_DISTANCE = 1800;
const MAX_LIVES = 3;
const RACE_LOOKAHEAD = 3.6;
const PATH_SAMPLE_STEP = 0.05;
const LANE_SWITCH_TIME = 0.25;
const LANE_SWITCH_STEPS = Math.ceil(LANE_SWITCH_TIME / PATH_SAMPLE_STEP);
const STARTER_COLOR_ID = "teal-pulse";
const NON_BLOCKING_OBSTACLE_TYPES = new Set(["heart", "rainbow"]);

const DRIVER_LIBRARY = [
  { id: "ant", name: "Ant", family: "Insect", group: "insect", primary: "#7c3f17", secondary: "#28120a", accent: "#f6ad14", trait: "antenna" },
  { id: "bee", name: "Bee", family: "Insect", group: "insect", primary: "#facc15", secondary: "#111827", accent: "#fff7d6", trait: "stripes" },
  { id: "beetle", name: "Beetle", family: "Insect", group: "insect", primary: "#0f766e", secondary: "#042f2e", accent: "#67e8f9", trait: "shell" },
  { id: "butterfly", name: "Butterfly", family: "Insect", group: "insect", primary: "#fb7185", secondary: "#7c2d12", accent: "#fde68a", trait: "wings" },
  { id: "dragonfly", name: "Dragonfly", family: "Insect", group: "insect", primary: "#38bdf8", secondary: "#0f172a", accent: "#d1fae5", trait: "antenna" },
  { id: "ladybug", name: "Ladybug", family: "Insect", group: "insect", primary: "#ef4444", secondary: "#111827", accent: "#fee2e2", trait: "spots" },
  { id: "mantis", name: "Mantis", family: "Insect", group: "insect", primary: "#84cc16", secondary: "#365314", accent: "#fef08a", trait: "blades" },
  { id: "octopus", name: "Octopus", family: "Sea", group: "sea", primary: "#a855f7", secondary: "#4c1d95", accent: "#f5d0fe", trait: "tentacles" },
  { id: "pufferfish", name: "Pufferfish", family: "Sea", group: "sea", primary: "#f6ad14", secondary: "#92400e", accent: "#fff7d6", trait: "spikes" },
  { id: "shark", name: "Shark", family: "Sea", group: "sea", primary: "#94a3b8", secondary: "#334155", accent: "#e2e8f0", trait: "fin" },
  { id: "clownfish", name: "Clownfish", family: "Sea", group: "sea", primary: "#fb923c", secondary: "#fff7ed", accent: "#1f2937", trait: "stripes" },
  { id: "swordfish", name: "Swordfish", family: "Sea", group: "sea", primary: "#0ea5e9", secondary: "#0c4a6e", accent: "#e0f2fe", trait: "blade" },
  { id: "whale", name: "Whale", family: "Sea", group: "sea", primary: "#2563eb", secondary: "#1e3a8a", accent: "#bfdbfe", trait: "wide" },
  { id: "dolphin", name: "Dolphin", family: "Sea", group: "sea", primary: "#38bdf8", secondary: "#0f766e", accent: "#ecfeff", trait: "smile" },
  { id: "crab", name: "Crab", family: "Sea", group: "sea", primary: "#f97316", secondary: "#7c2d12", accent: "#ffedd5", trait: "claws" },
  { id: "lobster", name: "Lobster", family: "Sea", group: "sea", primary: "#dc2626", secondary: "#7f1d1d", accent: "#fecaca", trait: "claws" },
  { id: "fox", name: "Fox", family: "Mammal", group: "mammal", primary: "#f97316", secondary: "#fff7ed", accent: "#111827", trait: "pointy" },
  { id: "wolf", name: "Wolf", family: "Mammal", group: "mammal", primary: "#94a3b8", secondary: "#e5e7eb", accent: "#111827", trait: "pointy" },
  { id: "bear", name: "Bear", family: "Mammal", group: "mammal", primary: "#92400e", secondary: "#f59e0b", accent: "#fff7d6", trait: "round" },
  { id: "rabbit", name: "Rabbit", family: "Mammal", group: "mammal", primary: "#e9d5ff", secondary: "#a78bfa", accent: "#312e81", trait: "long" },
  { id: "cat", name: "Cat", family: "Mammal", group: "mammal", primary: "#f8b4b4", secondary: "#ffffff", accent: "#1f2937", trait: "pointy" },
  { id: "tiger", name: "Tiger", family: "Mammal", group: "mammal", primary: "#fb923c", secondary: "#111827", accent: "#fff7ed", trait: "stripes" },
  { id: "lion", name: "Lion", family: "Mammal", group: "mammal", primary: "#fbbf24", secondary: "#92400e", accent: "#fff7d6", trait: "mane" },
  { id: "elephant", name: "Elephant", family: "Mammal", group: "mammal", primary: "#9ca3af", secondary: "#e5e7eb", accent: "#374151", trait: "trunk" },
  { id: "giraffe", name: "Giraffe", family: "Mammal", group: "mammal", primary: "#d97706", secondary: "#92400e", accent: "#fef3c7", trait: "spots" },
  { id: "zebra", name: "Zebra", family: "Mammal", group: "mammal", primary: "#f8fafc", secondary: "#111827", accent: "#94a3b8", trait: "stripes" },
  { id: "rhino", name: "Rhino", family: "Mammal", group: "mammal", primary: "#6b7280", secondary: "#d1d5db", accent: "#111827", trait: "horn" },
  { id: "hippo", name: "Hippo", family: "Mammal", group: "mammal", primary: "#a78bfa", secondary: "#f5d0fe", accent: "#312e81", trait: "round" },
  { id: "panda", name: "Panda", family: "Mammal", group: "mammal", primary: "#ffffff", secondary: "#111827", accent: "#94a3b8", trait: "mask" },
  { id: "monkey", name: "Monkey", family: "Mammal", group: "mammal", primary: "#a16207", secondary: "#f5d0a9", accent: "#4b2e12", trait: "round" },
  { id: "koala", name: "Koala", family: "Mammal", group: "mammal", primary: "#cbd5e1", secondary: "#64748b", accent: "#111827", trait: "round" },
  { id: "owl", name: "Owl", family: "Bird", group: "bird", primary: "#a16207", secondary: "#fef3c7", accent: "#111827", trait: "tuft" },
  { id: "eagle", name: "Eagle", family: "Bird", group: "bird", primary: "#92400e", secondary: "#ffffff", accent: "#f59e0b", trait: "beak" },
  { id: "raven", name: "Raven", family: "Bird", group: "bird", primary: "#111827", secondary: "#374151", accent: "#cbd5e1", trait: "crest" },
  { id: "penguin", name: "Penguin", family: "Bird", group: "bird", primary: "#111827", secondary: "#ffffff", accent: "#f59e0b", trait: "mask" },
  { id: "crocodile", name: "Crocodile", family: "Reptile", group: "reptile", primary: "#4d7c0f", secondary: "#365314", accent: "#fef08a", trait: "teeth" },
  { id: "chameleon", name: "Chameleon", family: "Reptile", group: "reptile", primary: "#22c55e", secondary: "#166534", accent: "#99f6e4", trait: "curl" },
  { id: "turtle", name: "Turtle", family: "Reptile", group: "reptile", primary: "#65a30d", secondary: "#92400e", accent: "#fef3c7", trait: "shell" },
  { id: "frog", name: "Frog", family: "Amphibian", group: "amphibian", primary: "#22c55e", secondary: "#14532d", accent: "#dcfce7", trait: "spots" },
  { id: "axolotl", name: "Axolotl", family: "Amphibian", group: "amphibian", primary: "#f9a8d4", secondary: "#db2777", accent: "#fce7f3", trait: "gills" },
];

const COLOR_LIBRARY = [
  { id: "teal-pulse", name: "Teal Pulse", body: "#19c1b1", trim: "#0b6e67", highlight: "#dffcf7", glow: "rgba(23, 193, 178, 0.38)", canopy: "rgba(223, 252, 247, 0.72)" },
  { id: "sunset-ember", name: "Sunset Ember", body: "#f97316", trim: "#9a3412", highlight: "#ffedd5", glow: "rgba(249, 115, 22, 0.34)", canopy: "rgba(255, 237, 213, 0.7)" },
  { id: "ion-blue", name: "Ion Blue", body: "#3b82f6", trim: "#1d4ed8", highlight: "#dbeafe", glow: "rgba(59, 130, 246, 0.34)", canopy: "rgba(219, 234, 254, 0.72)" },
  { id: "rose-drift", name: "Rose Drift", body: "#fb7185", trim: "#be123c", highlight: "#ffe4e6", glow: "rgba(251, 113, 133, 0.34)", canopy: "rgba(255, 228, 230, 0.72)" },
  { id: "lime-shock", name: "Lime Shock", body: "#84cc16", trim: "#3f6212", highlight: "#fef9c3", glow: "rgba(132, 204, 22, 0.34)", canopy: "rgba(254, 249, 195, 0.72)" },
  { id: "solar-gold", name: "Solar Gold", body: "#facc15", trim: "#a16207", highlight: "#fff7d6", glow: "rgba(250, 204, 21, 0.34)", canopy: "rgba(255, 247, 214, 0.72)" },
  { id: "crimson-jet", name: "Crimson Jet", body: "#ef4444", trim: "#991b1b", highlight: "#fee2e2", glow: "rgba(239, 68, 68, 0.34)", canopy: "rgba(254, 226, 226, 0.72)" },
  { id: "polar-mint", name: "Polar Mint", body: "#6ee7b7", trim: "#047857", highlight: "#ecfdf5", glow: "rgba(110, 231, 183, 0.34)", canopy: "rgba(236, 253, 245, 0.72)" },
  { id: "copper-dust", name: "Copper Dust", body: "#c2410c", trim: "#7c2d12", highlight: "#fed7aa", glow: "rgba(194, 65, 12, 0.34)", canopy: "rgba(254, 215, 170, 0.72)" },
  { id: "coral-rush", name: "Coral Rush", body: "#fb7185", trim: "#9f1239", highlight: "#fff1f2", glow: "rgba(251, 113, 133, 0.3)", canopy: "rgba(255, 241, 242, 0.72)" },
  { id: "arctic-pearl", name: "Arctic Pearl", body: "#e5e7eb", trim: "#94a3b8", highlight: "#ffffff", glow: "rgba(229, 231, 235, 0.34)", canopy: "rgba(255, 255, 255, 0.75)" },
  { id: "violet-arc", name: "Violet Arc", body: "#8b5cf6", trim: "#5b21b6", highlight: "#ede9fe", glow: "rgba(139, 92, 246, 0.34)", canopy: "rgba(237, 233, 254, 0.72)" },
  { id: "glacier-sky", name: "Glacier Sky", body: "#38bdf8", trim: "#075985", highlight: "#e0f2fe", glow: "rgba(56, 189, 248, 0.34)", canopy: "rgba(224, 242, 254, 0.72)" },
  { id: "forest-drift", name: "Forest Drift", body: "#16a34a", trim: "#14532d", highlight: "#dcfce7", glow: "rgba(22, 163, 74, 0.34)", canopy: "rgba(220, 252, 231, 0.72)" },
  { id: "candy-cloud", name: "Candy Cloud", body: "#f9a8d4", trim: "#be185d", highlight: "#fdf2f8", glow: "rgba(249, 168, 212, 0.34)", canopy: "rgba(253, 242, 248, 0.72)" },
  { id: "midnight-ash", name: "Midnight Ash", body: "#475569", trim: "#0f172a", highlight: "#cbd5e1", glow: "rgba(71, 85, 105, 0.34)", canopy: "rgba(203, 213, 225, 0.72)" },
  { id: "dune-sand", name: "Dune Sand", body: "#d6a45a", trim: "#92400e", highlight: "#fef3c7", glow: "rgba(214, 164, 90, 0.34)", canopy: "rgba(254, 243, 199, 0.72)" },
  { id: "lagoon-flash", name: "Lagoon Flash", body: "#14b8a6", trim: "#115e59", highlight: "#ccfbf1", glow: "rgba(20, 184, 166, 0.34)", canopy: "rgba(204, 251, 241, 0.72)" },
  { id: "orchid-burst", name: "Orchid Burst", body: "#d946ef", trim: "#86198f", highlight: "#fae8ff", glow: "rgba(217, 70, 239, 0.34)", canopy: "rgba(250, 232, 255, 0.72)" },
  { id: "citrus-bolt", name: "Citrus Bolt", body: "#f59e0b", trim: "#b45309", highlight: "#fff7ed", glow: "rgba(245, 158, 11, 0.34)", canopy: "rgba(255, 247, 237, 0.72)" },
];

const DRIVER_BY_ID = new Map(DRIVER_LIBRARY.map((driver) => [driver.id, driver]));
const COLOR_BY_ID = new Map(COLOR_LIBRARY.map((color) => [color.id, color]));

const basePlayer = {
  lane: 1,
  x: laneCenter(1),
  targetX: laneCenter(1),
  y: PLAYER_Y,
  width: 54,
  height: 94,
  invulnerable: 0,
  bob: 0,
};

const obstacleTypes = {
  crate: { width: 44, height: 44, palette: ["#eb9d2f", "#975719"] },
  oil: { width: 76, height: 26, palette: ["#1f2937", "#09090b"] },
  barrier: { width: 82, height: 34, palette: ["#ffb703", "#222222"] },
  truck: { width: 70, height: 118, palette: ["#c9472a", "#631d13"] },
  heart: { width: 42, height: 38, palette: ["#fb7185", "#be123c"] },
  mine: { width: 46, height: 46, palette: ["#f97316", "#581c14"] },
  pulse: { width: 92, height: 22, palette: ["#fee2e2", "#ef4444"] },
  rainbow: { width: 96, height: 58, palette: ["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#38bdf8", "#8b5cf6"] },
};

const game = {
  mode: "idle",
  paused: false,
  garageOpen: false,
  garageTab: "drivers",
  speed: 340,
  distance: 0,
  lives: MAX_LIVES,
  roadOffset: 0,
  spawnTimer: 0,
  heartDropPending: false,
  heartDropTimer: 0,
  bannerTimer: 0,
  bannerText: "",
  flash: 0,
  time: 0,
  lastFrame: 0,
  obstacles: [],
  particles: [],
  player: { ...basePlayer },
  garage: loadGarageState(),
  runRewards: {
    drivers: [],
    colors: [],
  },
  boss: {
    active: false,
    lane: 1,
    x: laneCenter(1),
    targetX: laneCenter(1),
    y: -180,
    targetY: 126,
    width: 108,
    height: 146,
    armor: 0,
    moveTimer: 0,
    attackTimer: 0,
  },
};

function laneCenter(lane) {
  return WORLD.roadX + WORLD.laneWidth * lane + WORLD.laneWidth / 2;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function uniqueValidIds(ids, library) {
  const valid = new Set(library.map((item) => item.id));
  return Array.from(new Set((Array.isArray(ids) ? ids : []).filter((id) => valid.has(id))));
}

function createInitialGarageState() {
  const starterDriver = pick(DRIVER_LIBRARY);

  return {
    unlockedDriverIds: [starterDriver.id],
    selectedDriverId: starterDriver.id,
    unlockedColorIds: [STARTER_COLOR_ID],
    selectedColorId: STARTER_COLOR_ID,
    bossesDefeated: 0,
    rainbowsCollected: 0,
  };
}

function normalizeGarageState(rawState) {
  const safeState = rawState && typeof rawState === "object" ? rawState : {};
  const starter = createInitialGarageState();
  const unlockedDriverIds = uniqueValidIds(safeState.unlockedDriverIds, DRIVER_LIBRARY);
  const unlockedColorIds = uniqueValidIds(safeState.unlockedColorIds, COLOR_LIBRARY);
  const resolvedDrivers = unlockedDriverIds.length ? unlockedDriverIds : starter.unlockedDriverIds;
  const resolvedColors = unlockedColorIds.length ? unlockedColorIds : starter.unlockedColorIds;
  const selectedDriverId = resolvedDrivers.includes(safeState.selectedDriverId)
    ? safeState.selectedDriverId
    : resolvedDrivers[0];
  const selectedColorId = resolvedColors.includes(safeState.selectedColorId)
    ? safeState.selectedColorId
    : resolvedColors[0];

  return {
    unlockedDriverIds: resolvedDrivers,
    selectedDriverId,
    unlockedColorIds: resolvedColors,
    selectedColorId,
    bossesDefeated: Number.isFinite(safeState.bossesDefeated) ? safeState.bossesDefeated : 0,
    rainbowsCollected: Number.isFinite(safeState.rainbowsCollected) ? safeState.rainbowsCollected : 0,
  };
}

function loadGarageState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeGarageState(JSON.parse(stored)) : createInitialGarageState();
  } catch (error) {
    return createInitialGarageState();
  }
}

function saveGarageState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game.garage));
  } catch (error) {
    return;
  }
}

function getSelectedDriver() {
  return DRIVER_BY_ID.get(game.garage.selectedDriverId) || DRIVER_BY_ID.get(game.garage.unlockedDriverIds[0]);
}

function getSelectedColor() {
  return COLOR_BY_ID.get(game.garage.selectedColorId) || COLOR_BY_ID.get(game.garage.unlockedColorIds[0]);
}

function getLockedDrivers() {
  const unlocked = new Set(game.garage.unlockedDriverIds);
  return DRIVER_LIBRARY.filter((driver) => !unlocked.has(driver.id));
}

function getLockedColors() {
  const unlocked = new Set(game.garage.unlockedColorIds);
  return COLOR_LIBRARY.filter((color) => !unlocked.has(color.id));
}

function getAvailableRainbowRewards() {
  const taken = new Set(game.garage.unlockedColorIds);

  game.obstacles
    .filter((obstacle) => obstacle.type === "rainbow" && obstacle.rewardId)
    .forEach((obstacle) => {
      taken.add(obstacle.rewardId);
    });

  return COLOR_LIBRARY.filter((color) => !taken.has(color.id));
}

function formatNameList(items) {
  if (!items.length) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function isGameplayMode() {
  return game.mode === "race" || game.mode === "boss";
}

function setOverlay(kicker, title, message, buttonText) {
  ui.overlayKicker.textContent = kicker;
  ui.overlayTitle.textContent = title;
  ui.overlayMessage.textContent = message;
  ui.startButton.textContent = buttonText;
  ui.overlay.classList.remove("hidden");
}

function hideOverlay() {
  ui.overlay.classList.add("hidden");
}

function showBanner(text, duration = 2.2) {
  game.bannerText = text;
  game.bannerTimer = duration;
}

function refreshIdleOverlay() {
  if (game.mode !== "idle") {
    return;
  }

  const driver = getSelectedDriver();
  setOverlay(
    "Start Run",
    "Reach the boss rig.",
    `${driver.name} is in the seat. Open the Garage to switch animal drivers or paint, then dodge traffic, collect rainbows, and break the boss rig.`,
    "Start Engine"
  );
}

function syncGarageIndicators() {
  const driver = getSelectedDriver();
  const color = getSelectedColor();

  ui.driver.textContent = driver.name;
  ui.paint.textContent = color.name;
  ui.paintSwatch.style.background = `linear-gradient(180deg, ${color.highlight}, ${color.body})`;
  ui.collection.textContent = `${game.garage.unlockedDriverIds.length} / ${DRIVER_LIBRARY.length} drivers · ${game.garage.unlockedColorIds.length} / ${COLOR_LIBRARY.length} paints`;
  ui.garageDriversCount.textContent = `${game.garage.unlockedDriverIds.length} / ${DRIVER_LIBRARY.length}`;
  ui.garageColorsCount.textContent = `${game.garage.unlockedColorIds.length} / ${COLOR_LIBRARY.length}`;
  ui.garageSelectionValue.textContent = `${driver.name} · ${color.name}`;
}

function syncHud() {
  ui.lives.textContent = String(game.lives);

  if (game.mode === "boss") {
    ui.distance.textContent = "Boss reached";
  } else if (game.mode === "won") {
    ui.distance.textContent = "Route clear";
  } else if (game.mode === "lost") {
    ui.distance.textContent = "Run ended";
  } else {
    ui.distance.textContent = `${Math.max(0, Math.ceil(BOSS_DISTANCE - game.distance))} m`;
  }

  if (game.mode === "idle") {
    ui.phase.textContent = "Standby";
  } else if (game.paused) {
    ui.phase.textContent = "Garage";
  } else if (game.mode === "race") {
    ui.phase.textContent = "Highway";
  } else if (game.mode === "boss") {
    ui.phase.textContent = "Boss";
  } else if (game.mode === "won") {
    ui.phase.textContent = "Victory";
  } else {
    ui.phase.textContent = "Wrecked";
  }

  const armor = game.boss.active || game.mode === "won" ? Math.max(0, Math.ceil(game.boss.armor)) : 0;
  ui.boss.textContent = `${armor}%`;
  ui.bossFill.style.width = `${armor}%`;
  syncGarageIndicators();
}

function unlockDriverById(driverId) {
  if (!DRIVER_BY_ID.has(driverId) || game.garage.unlockedDriverIds.includes(driverId)) {
    return null;
  }

  game.garage.unlockedDriverIds = [...game.garage.unlockedDriverIds, driverId];
  saveGarageState();
  syncHud();
  renderGarage();
  return DRIVER_BY_ID.get(driverId);
}

function unlockRandomDriver() {
  const lockedDrivers = getLockedDrivers();
  return lockedDrivers.length ? unlockDriverById(pick(lockedDrivers).id) : null;
}

function unlockColorById(colorId) {
  if (!COLOR_BY_ID.has(colorId) || game.garage.unlockedColorIds.includes(colorId)) {
    return null;
  }

  game.garage.unlockedColorIds = [...game.garage.unlockedColorIds, colorId];
  saveGarageState();
  syncHud();
  renderGarage();
  return COLOR_BY_ID.get(colorId);
}

function setSelectedDriver(driverId) {
  if (!game.garage.unlockedDriverIds.includes(driverId)) {
    return;
  }

  game.garage.selectedDriverId = driverId;
  saveGarageState();
  syncHud();
  renderGarage();
  refreshIdleOverlay();
}

function setSelectedColor(colorId) {
  if (!game.garage.unlockedColorIds.includes(colorId)) {
    return;
  }

  game.garage.selectedColorId = colorId;
  saveGarageState();
  syncHud();
  renderGarage();
  refreshIdleOverlay();
}

function setGarageTab(tab) {
  game.garageTab = tab;

  ui.garageTabs.forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  ui.garagePanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === tab);
  });
}

function openGarage(tab = game.garageTab) {
  game.garageOpen = true;
  game.paused = isGameplayMode();
  ui.garageModal.classList.remove("hidden");
  ui.garageModal.setAttribute("aria-hidden", "false");
  setGarageTab(tab);
  renderGarage();
  syncHud();
}

function closeGarage() {
  game.garageOpen = false;
  game.paused = false;
  ui.garageModal.classList.add("hidden");
  ui.garageModal.setAttribute("aria-hidden", "true");
  syncHud();
}

function renderGarage() {
  syncGarageIndicators();

  ui.driverGrid.textContent = "";

  DRIVER_LIBRARY.forEach((driver) => {
    const isUnlocked = game.garage.unlockedDriverIds.includes(driver.id);
    const isSelected = game.garage.selectedDriverId === driver.id;
    const button = document.createElement("button");
    const preview = document.createElement("canvas");
    const name = document.createElement("strong");
    const family = document.createElement("span");
    const state = document.createElement("span");

    button.type = "button";
    button.className = "garage-item";
    button.dataset.driverId = driver.id;
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-locked", !isUnlocked);
    preview.className = "driver-preview";
    preview.width = 84;
    preview.height = 84;
    name.textContent = driver.name;
    family.textContent = driver.family;
    state.textContent = isUnlocked ? (isSelected ? "Selected" : "Ready to drive") : "Beat bosses to recruit";
    state.className = isUnlocked ? "" : "locked-copy";

    button.append(preview, name, family, state);
    ui.driverGrid.append(button);
    drawDriverBadge(preview, driver, !isUnlocked);
  });

  ui.colorGrid.textContent = "";

  COLOR_LIBRARY.forEach((color) => {
    const isUnlocked = game.garage.unlockedColorIds.includes(color.id);
    const isSelected = game.garage.selectedColorId === color.id;
    const button = document.createElement("button");
    const preview = document.createElement("span");
    const name = document.createElement("strong");
    const state = document.createElement("span");

    button.type = "button";
    button.className = "garage-item";
    button.dataset.colorId = color.id;
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-locked", !isUnlocked);
    preview.className = "paint-preview";
    preview.style.setProperty("--paint-body", color.body);
    preview.style.setProperty("--paint-trim", color.trim);
    preview.style.setProperty("--paint-glow", color.glow);
    name.textContent = color.name;
    state.textContent = isUnlocked ? (isSelected ? "Selected" : "Unlocked") : "Catch rainbow drops";
    state.className = isUnlocked ? "" : "locked-copy";

    button.append(preview, name, state);
    ui.colorGrid.append(button);
  });
}

function resetGame() {
  game.mode = "race";
  game.paused = false;
  game.speed = 340;
  game.distance = 0;
  game.lives = MAX_LIVES;
  game.roadOffset = 0;
  game.spawnTimer = 0.48;
  game.heartDropPending = false;
  game.heartDropTimer = 0;
  game.bannerText = "HOLD YOUR LINE";
  game.bannerTimer = 2.2;
  game.flash = 0;
  game.time = 0;
  game.obstacles = [];
  game.particles = [];
  game.runRewards = { drivers: [], colors: [] };
  game.player = { ...basePlayer };
  game.boss = {
    active: false,
    lane: 1,
    x: laneCenter(1),
    targetX: laneCenter(1),
    y: -180,
    targetY: 126,
    width: 108,
    height: 146,
    armor: 100,
    moveTimer: 1.45,
    attackTimer: 1.2,
  };
  closeGarage();
  hideOverlay();
  syncHud();
}

function shiftLane(direction) {
  if (!isGameplayMode() || game.paused) {
    return;
  }

  game.player.lane = clamp(game.player.lane + direction, 0, WORLD.lanes - 1);
  game.player.targetX = laneCenter(game.player.lane);

  for (let index = 0; index < 6; index += 1) {
    spawnParticle(
      game.player.x,
      game.player.y + 36,
      random(-60, 60),
      random(18, 84),
      random(2, 4),
      0.3,
      "rgba(255, 200, 120, 0.65)"
    );
  }
}

function startBossPhase() {
  game.mode = "boss";
  game.boss.active = true;
  game.boss.armor = 100;
  game.boss.y = -180;
  game.boss.targetY = 126;
  game.boss.attackTimer = 1;
  game.obstacles = game.obstacles.filter((obstacle) => obstacle.y < WORLD.height + 120);
  showBanner("BOSS ON THE ROAD", 2.8);
  syncHud();
}

function buildLossMessage() {
  const paintNames = game.runRewards.colors.map((color) => color.name);

  if (!paintNames.length) {
    return "Restart and stay patient through the two-lane patterns. There is always one clean escape lane.";
  }

  return `You still kept ${formatNameList(paintNames)} in the garage. Restart and try for the boss again.`;
}

function loseRun() {
  game.mode = "lost";
  game.paused = false;
  setOverlay(
    "Run Failed",
    "You got boxed in.",
    buildLossMessage(),
    "Restart Run"
  );
  syncHud();
}

function buildWinMessage(driverReward) {
  const rewardLines = [];

  if (driverReward) {
    rewardLines.push(`New driver unlocked: ${driverReward.name}.`);
  } else if (game.garage.unlockedDriverIds.length === DRIVER_LIBRARY.length) {
    rewardLines.push("Every animal driver is already in your garage.");
  }

  if (game.runRewards.colors.length) {
    rewardLines.push(`New paint collected: ${formatNameList(game.runRewards.colors.map((color) => color.name))}.`);
  }

  if (!rewardLines.length) {
    rewardLines.push("You made it through the highway and broke the boss rig.");
  }

  return rewardLines.join(" ");
}

function winRun() {
  game.mode = "won";
  game.paused = false;
  game.boss.armor = 0;
  game.boss.active = false;
  game.garage.bossesDefeated += 1;
  const driverReward = unlockRandomDriver();

  if (driverReward) {
    game.runRewards.drivers.push(driverReward);
  }

  saveGarageState();
  setOverlay(
    "Boss Down",
    "The rig is broken.",
    buildWinMessage(driverReward),
    "Run Again"
  );
  syncHud();
}

function spawnParticle(x, y, vx, vy, size, life, color) {
  game.particles.push({ x, y, vx, vy, size, life, maxLife: life, color });
}

function makeObstacle(lane, type, y = -110, extra = {}) {
  const spec = obstacleTypes[type];

  return {
    lane,
    type,
    x: laneCenter(lane),
    y,
    width: spec.width,
    height: spec.height,
    speed: extra.speed ?? game.speed + random(20, 160),
    palette: spec.palette,
    dead: false,
    wobble: random(0, Math.PI * 2),
    rewardId: extra.rewardId ?? null,
  };
}

function spawnObstacle(lane, type, y = -110, extra = {}) {
  const obstacle = makeObstacle(lane, type, y, extra);
  game.obstacles.push(obstacle);
  return obstacle;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function pickupWindowForObstacle(obstacle) {
  if (obstacle.speed <= 0) {
    return null;
  }

  const overlapHalfHeight = (game.player.height + obstacle.height) / 2;
  const start = (game.player.y - overlapHalfHeight - obstacle.y) / obstacle.speed;
  const end = (game.player.y + overlapHalfHeight - obstacle.y) / obstacle.speed;

  if (end <= 0 || start >= RACE_LOOKAHEAD) {
    return null;
  }

  return {
    lane: obstacle.lane,
    start: Math.max(0, start),
    end: Math.min(RACE_LOOKAHEAD, end),
  };
}

function obstacleBlockWindow(obstacle) {
  if (NON_BLOCKING_OBSTACLE_TYPES.has(obstacle.type)) {
    return null;
  }

  return pickupWindowForObstacle(obstacle);
}

function collectUpcomingWindows(extraObstacles = []) {
  return game.obstacles
    .filter((obstacle) => !obstacle.dead)
    .concat(extraObstacles)
    .map(obstacleBlockWindow)
    .filter(Boolean);
}

function laneBlockedDuring(lane, start, end, windows) {
  return windows.some((window) => window.lane === lane && overlaps(start, end, window.start, window.end));
}

function canStartLaneMove(fromLane, toLane, startTime, windows) {
  const endTime = startTime + LANE_SWITCH_TIME;
  return !laneBlockedDuring(fromLane, startTime, endTime, windows) &&
    !laneBlockedDuring(toLane, startTime, endTime, windows);
}

function getActiveHeartTarget(extraObstacles = []) {
  const heartObstacles = game.obstacles
    .filter((obstacle) => !obstacle.dead && obstacle.type === "heart")
    .concat(extraObstacles.filter((obstacle) => obstacle.type === "heart"));

  const targets = heartObstacles
    .map((obstacle) => pickupWindowForObstacle(obstacle))
    .filter(Boolean)
    .sort((left, right) => left.start - right.start);

  return targets[0] ?? null;
}

function stateTouchesTarget(state, startTime, endTime, target) {
  if (!target || !overlaps(startTime, endTime, target.start, target.end)) {
    return false;
  }

  if (state.remainingSteps > 0) {
    return state.lane === target.lane || state.movingTo === target.lane;
  }

  return state.lane === target.lane;
}

function hasSafePath(candidates, target = null) {
  const windows = collectUpcomingWindows(candidates);
  const activeTarget = target ?? getActiveHeartTarget(candidates);

  if (!windows.length && !activeTarget) {
    return true;
  }

  const farthestThreat = windows.length ? Math.max(...windows.map((window) => window.end)) : 0;
  const horizon = Math.min(
    RACE_LOOKAHEAD,
    Math.max(farthestThreat, activeTarget?.end ?? 0) + PATH_SAMPLE_STEP
  );
  const steps = Math.ceil(horizon / PATH_SAMPLE_STEP);
  let states = [{
    lane: game.player.lane,
    movingTo: null,
    remainingSteps: 0,
    reachedTarget: false,
  }];

  for (let step = 0; step < steps; step += 1) {
    const time = step * PATH_SAMPLE_STEP;
    const nextStates = new Map();

    const rememberState = (state) => {
      const key = `${state.lane}:${state.movingTo ?? "x"}:${state.remainingSteps}`;
      nextStates.set(key, state);
    };

    states.forEach((state) => {
      if (state.remainingSteps > 0) {
        if (!laneBlockedDuring(state.lane, time, time + PATH_SAMPLE_STEP, windows) &&
          !laneBlockedDuring(state.movingTo, time, time + PATH_SAMPLE_STEP, windows)) {
          const remainingSteps = state.remainingSteps - 1;
          const reachedTarget = state.reachedTarget || stateTouchesTarget(state, time, time + PATH_SAMPLE_STEP, activeTarget);

          if (remainingSteps === 0) {
            rememberState({
              lane: state.movingTo,
              movingTo: null,
              remainingSteps: 0,
              reachedTarget,
            });
          } else {
            rememberState({
              lane: state.lane,
              movingTo: state.movingTo,
              remainingSteps,
              reachedTarget,
            });
          }
        }

        return;
      }

      if (!laneBlockedDuring(state.lane, time, time + PATH_SAMPLE_STEP, windows)) {
        rememberState({
          ...state,
          reachedTarget: state.reachedTarget || stateTouchesTarget(state, time, time + PATH_SAMPLE_STEP, activeTarget),
        });
      }

      [-1, 1].forEach((direction) => {
        const targetLane = state.lane + direction;

        if (targetLane < 0 || targetLane >= WORLD.lanes) {
          return;
        }

        if (!canStartLaneMove(state.lane, targetLane, time, windows)) {
          return;
        }

        if (LANE_SWITCH_STEPS === 1) {
          rememberState({
            lane: targetLane,
            movingTo: null,
            remainingSteps: 0,
          });
          return;
        }

        rememberState({
          lane: state.lane,
          movingTo: targetLane,
          remainingSteps: LANE_SWITCH_STEPS - 1,
          reachedTarget: state.reachedTarget || stateTouchesTarget({
            lane: state.lane,
            movingTo: targetLane,
            remainingSteps: LANE_SWITCH_STEPS - 1,
          }, time, time + PATH_SAMPLE_STEP, activeTarget),
        });
      });
    });

    states = Array.from(nextStates.values());

    if (!states.length) {
      return false;
    }
  }

  return activeTarget ? states.some((state) => state.reachedTarget) : true;
}

function chooseRacePattern(progress) {
  const roll = Math.random();

  if (roll < 0.34 || progress < 0.18) {
    return "single";
  }

  if (roll < 0.78) {
    return "double";
  }

  return "truck";
}

function buildRacePattern(patternType, safeLane, patternSpeed) {
  const lanes = [0, 1, 2];

  if (patternType === "single") {
    return [
      makeObstacle(
        Math.floor(random(0, WORLD.lanes)),
        pick(["crate", "oil", "barrier"]),
        -120,
        { speed: patternSpeed }
      ),
    ];
  }

  if (patternType === "double") {
    return lanes
      .filter((lane) => lane !== safeLane)
      .map((lane, index) => makeObstacle(
        lane,
        pick(index === 0 ? ["barrier", "crate"] : ["oil", "crate"]),
        -120 - index * 90,
        { speed: patternSpeed }
      ));
  }

  const blockedLanes = lanes.filter((lane) => lane !== safeLane);
  const truckLane = pick(blockedLanes);
  const supportLane = blockedLanes.find((lane) => lane !== truckLane);

  return [
    makeObstacle(truckLane, "truck", -180, { speed: patternSpeed }),
    makeObstacle(supportLane, pick(["barrier", "crate"]), -80, { speed: patternSpeed }),
  ];
}

function spawnFallbackRacePattern() {
  const patternSpeed = game.speed + 56;

  for (const lane of shuffle([0, 1, 2])) {
    const candidate = makeObstacle(lane, pick(["crate", "oil", "barrier"]), -120, { speed: patternSpeed });

    if (hasSafePath([candidate])) {
      game.obstacles.push(candidate);
      return;
    }
  }
}

function hasHeartOnRoad() {
  return game.obstacles.some((obstacle) => !obstacle.dead && obstacle.type === "heart");
}

function scheduleHeartDrop() {
  if (game.lives >= MAX_LIVES || hasHeartOnRoad()) {
    return;
  }

  const nextTimer = random(3.5, 6.2);
  game.heartDropPending = true;
  game.heartDropTimer = game.heartDropTimer > 0
    ? Math.min(game.heartDropTimer, nextTimer)
    : nextTimer;
}

function chooseHeartCandidate() {
  const candidateSpeed = Math.max(255, game.speed - 80);
  const upcomingWindows = collectUpcomingWindows();
  const rankedLanes = [0, 1, 2]
    .map((lane) => {
      const nextThreat = upcomingWindows
        .filter((window) => window.lane === lane)
        .reduce((soonest, window) => Math.min(soonest, window.start), Infinity);

      return {
        lane,
        score: nextThreat - Math.abs(lane - game.player.lane) * 0.45 + (lane === game.player.lane ? 0.4 : 0),
      };
    })
    .sort((left, right) => right.score - left.score);

  for (const { lane } of rankedLanes) {
    const candidate = makeObstacle(lane, "heart", -120, {
      speed: candidateSpeed,
    });
    const target = pickupWindowForObstacle(candidate);

    if (target && hasSafePath([], target)) {
      return candidate;
    }
  }

  return null;
}

function spawnHeartPickup() {
  if (game.lives >= MAX_LIVES || hasHeartOnRoad()) {
    game.heartDropPending = false;
    game.heartDropTimer = 0;
    return;
  }

  const candidate = chooseHeartCandidate();

  if (!candidate) {
    game.heartDropPending = true;
    game.heartDropTimer = 0.9;
    return;
  }

  game.obstacles.push(candidate);

  game.heartDropPending = false;
  game.heartDropTimer = 0;
  showBanner("HEART ON THE ROAD", 1.9);
}

function spawnRacePattern() {
  const progress = game.distance / BOSS_DISTANCE;
  const heartTarget = getActiveHeartTarget();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const patternType = chooseRacePattern(progress);
    const safeLane = Math.floor(random(0, WORLD.lanes));
    const patternSpeed = game.speed + random(42, 108);
    const candidates = buildRacePattern(patternType, safeLane, patternSpeed);

    if (hasSafePath(candidates, heartTarget)) {
      game.obstacles.push(...candidates);
      return;
    }
  }

  const patternSpeed = game.speed + 56;

  for (const lane of shuffle([0, 1, 2])) {
    const candidate = makeObstacle(lane, pick(["crate", "oil", "barrier"]), -120, { speed: patternSpeed });

    if (hasSafePath([candidate], heartTarget)) {
      game.obstacles.push(candidate);
      return;
    }
  }
}

function spawnRainbowBonus(occupiedLanes) {
  const lanes = [0, 1, 2].filter((lane) => !occupiedLanes.has(lane));
  const rewards = getAvailableRainbowRewards();

  if (!lanes.length || !rewards.length) {
    return;
  }

  const lane = pick(lanes);
  const reward = pick(rewards);

  spawnObstacle(lane, "rainbow", game.boss.y + game.boss.height * 0.46, {
    speed: 470 + random(0, 40),
    rewardId: reward.id,
  });
}

function bossAttack() {
  const heartTarget = getActiveHeartTarget();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bossLane = game.boss.lane;
    const occupiedLanes = new Set([bossLane]);
    const candidates = [
      makeObstacle(bossLane, "mine", game.boss.y + game.boss.height * 0.3, {
        speed: 560 + random(10, 90),
      }),
    ];

    if (Math.random() < 0.58) {
      const otherLane = pick([0, 1, 2].filter((lane) => lane !== bossLane));
      occupiedLanes.add(otherLane);
      candidates.push(makeObstacle(otherLane, pick(["pulse", "mine"]), game.boss.y + game.boss.height * 0.42, {
        speed: 620 + random(10, 70),
      }));
    }

    if (getLockedColors().length && Math.random() < 0.28) {
      const lanes = [0, 1, 2].filter((lane) => !occupiedLanes.has(lane));
      const rewards = getAvailableRainbowRewards();

      if (lanes.length && rewards.length) {
        const lane = pick(lanes);
        const reward = pick(rewards);
        candidates.push(makeObstacle(lane, "rainbow", game.boss.y + game.boss.height * 0.46, {
          speed: 470 + random(0, 40),
          rewardId: reward.id,
        }));
      }
    }

    if (hasSafePath(candidates, heartTarget)) {
      game.obstacles.push(...candidates);
      return;
    }
  }
}

function chooseNextBossLane() {
  const options = [0, 1, 2].filter((lane) => lane !== game.boss.lane);
  game.boss.lane = pick(options);
  game.boss.targetX = laneCenter(game.boss.lane);
}

function playerRect() {
  return {
    x: game.player.x - game.player.width / 2,
    y: game.player.y - game.player.height / 2,
    width: game.player.width,
    height: game.player.height,
  };
}

function obstacleRect(obstacle) {
  return {
    x: obstacle.x - obstacle.width / 2,
    y: obstacle.y - obstacle.height / 2,
    width: obstacle.width,
    height: obstacle.height,
  };
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function handleDamageCollision(obstacle) {
  if (game.player.invulnerable > 0) {
    return;
  }

  obstacle.dead = true;
  game.lives -= 1;
  game.player.invulnerable = 1.2;
  game.flash = 0.35;

  for (let index = 0; index < 14; index += 1) {
    spawnParticle(
      game.player.x,
      game.player.y,
      random(-180, 180),
      random(-140, 90),
      random(3, 6),
      random(0.25, 0.55),
      pick(["#ffe08a", "#ef4444", "#fb7185"])
    );
  }

  if (game.lives <= 0) {
    loseRun();
  } else {
    scheduleHeartDrop();
    syncHud();
  }
}

function collectHeart(obstacle) {
  obstacle.dead = true;
  game.lives = Math.min(MAX_LIVES, game.lives + 1);

  if (game.lives >= MAX_LIVES) {
    game.heartDropPending = false;
    game.heartDropTimer = 0;
  }

  showBanner("HEART RECOVERED", 1.8);

  for (let index = 0; index < 14; index += 1) {
    spawnParticle(
      obstacle.x + random(-8, 8),
      obstacle.y + random(-8, 8),
      random(-120, 120),
      random(-160, 20),
      random(2, 5),
      random(0.3, 0.65),
      pick(["#fb7185", "#fda4af", "#ffe4e6"])
    );
  }

  syncHud();
}

function collectRainbow(obstacle) {
  obstacle.dead = true;

  const unlockedColor = unlockColorById(obstacle.rewardId);

  if (unlockedColor) {
    game.garage.rainbowsCollected += 1;
    saveGarageState();
    game.runRewards.colors.push(unlockedColor);
    showBanner(`PAINT UNLOCKED: ${unlockedColor.name.toUpperCase()}`, 2.4);
  } else {
    showBanner("FULL SPECTRUM", 1.6);
  }

  for (let index = 0; index < 18; index += 1) {
    spawnParticle(
      obstacle.x + random(-12, 12),
      obstacle.y + random(-8, 8),
      random(-120, 120),
      random(-140, 40),
      random(2, 5),
      random(0.35, 0.7),
      pick(obstacle.palette)
    );
  }
}

function updateRace(dt) {
  const progress = game.distance / BOSS_DISTANCE;
  game.speed = 340 + progress * 170;
  game.distance += game.speed * dt * 0.115;
  game.spawnTimer -= dt;

  if (game.heartDropPending && !hasHeartOnRoad()) {
    game.heartDropTimer -= dt;

    if (game.heartDropTimer <= 0) {
      spawnHeartPickup();
    }
  }

  if (game.spawnTimer <= 0) {
    spawnRacePattern();
    game.spawnTimer = random(0.52, 0.95) - progress * 0.18;
  }

  if (game.distance >= BOSS_DISTANCE) {
    game.distance = BOSS_DISTANCE;
    startBossPhase();
  }
}

function updateBoss(dt) {
  game.speed = 430;
  game.boss.y += (game.boss.targetY - game.boss.y) * Math.min(1, dt * 3.8);
  game.boss.x += (game.boss.targetX - game.boss.x) * Math.min(1, dt * 4.8);
  game.boss.moveTimer -= dt;
  game.boss.attackTimer -= dt;

  if (game.heartDropPending && !hasHeartOnRoad()) {
    game.heartDropTimer -= dt;

    if (game.heartDropTimer <= 0) {
      spawnHeartPickup();
    }
  }

  if (game.boss.moveTimer <= 0) {
    chooseNextBossLane();
    game.boss.moveTimer = random(0.8, 1.35) * (0.85 + game.boss.armor / 240);
  }

  if (game.boss.attackTimer <= 0 && game.boss.y > 80) {
    bossAttack();
    game.boss.attackTimer = random(0.55, 0.95);
  }

  if (game.player.lane === game.boss.lane && game.boss.y > 60) {
    game.boss.armor = Math.max(0, game.boss.armor - 22 * dt);

    if (Math.random() < 0.28) {
      spawnParticle(
        game.boss.x,
        game.boss.y + 50,
        random(-44, 44),
        random(90, 180),
        random(2, 4),
        random(0.18, 0.35),
        pick(["#ffe08a", "#fb923c", "#fff7d6"])
      );
    }

    if (game.boss.armor <= 0) {
      winRun();
    }
  }
}

function updateObstacles(dt) {
  const playerHitbox = playerRect();

  game.obstacles.forEach((obstacle) => {
    obstacle.y += obstacle.speed * dt;
    obstacle.wobble += dt * 5;

    if (obstacle.dead || !intersects(playerHitbox, obstacleRect(obstacle))) {
      return;
    }

    if (obstacle.type === "rainbow") {
      collectRainbow(obstacle);
      return;
    }

    if (obstacle.type === "heart") {
      collectHeart(obstacle);
      return;
    }

    handleDamageCollision(obstacle);
  });

  game.obstacles = game.obstacles.filter((obstacle) => !obstacle.dead && obstacle.y < WORLD.height + 180);
}

function updateParticles(dt) {
  game.particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 180 * dt;
    particle.life -= dt;
  });

  game.particles = game.particles.filter((particle) => particle.life > 0);
}

function update(dt) {
  game.time += dt;

  if (game.mode === "idle" || game.paused) {
    return;
  }

  game.roadOffset += game.speed * dt;
  game.player.x += (game.player.targetX - game.player.x) * Math.min(1, dt * 14);
  game.player.bob += dt * 8;
  game.player.invulnerable = Math.max(0, game.player.invulnerable - dt);
  game.flash = Math.max(0, game.flash - dt);
  game.bannerTimer = Math.max(0, game.bannerTimer - dt);

  if (game.mode === "race") {
    updateRace(dt);
  } else if (game.mode === "boss") {
    updateBoss(dt);
  }

  if (isGameplayMode()) {
    updateObstacles(dt);
  }

  updateParticles(dt);
  syncHud();
}

function roundedRect(x, y, width, height, radius) {
  const actualRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + actualRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, actualRadius);
  ctx.arcTo(x + width, y + height, x, y + height, actualRadius);
  ctx.arcTo(x, y + height, x, y, actualRadius);
  ctx.arcTo(x, y, x + width, y, actualRadius);
  ctx.closePath();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  sky.addColorStop(0, "#f7c15d");
  sky.addColorStop(0.28, "#ef8d35");
  sky.addColorStop(0.55, "#6f3626");
  sky.addColorStop(1, "#241314");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#8b4428";
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.lineTo(90, 205);
  ctx.lineTo(165, 250);
  ctx.lineTo(290, 188);
  ctx.lineTo(390, 248);
  ctx.lineTo(WORLD.width, 226);
  ctx.lineTo(WORLD.width, 360);
  ctx.lineTo(0, 360);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#4c261d";
  ctx.beginPath();
  ctx.moveTo(0, 290);
  ctx.lineTo(60, 250);
  ctx.lineTo(150, 312);
  ctx.lineTo(230, 248);
  ctx.lineTo(340, 318);
  ctx.lineTo(420, 272);
  ctx.lineTo(WORLD.width, 334);
  ctx.lineTo(WORLD.width, 420);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d78f44";
  ctx.fillRect(0, 382, WORLD.roadX, WORLD.height - 382);
  ctx.fillRect(WORLD.roadX + WORLD.roadWidth, 382, WORLD.width - WORLD.roadX - WORLD.roadWidth, WORLD.height - 382);

  const postOffset = game.roadOffset % 90;
  for (let y = -90; y < WORLD.height + 90; y += 90) {
    const top = y + postOffset;
    const height = 18 + (top / WORLD.height) * 24;
    ctx.fillStyle = "#f5dfab";
    ctx.fillRect(WORLD.roadX - 18, top, 6, height);
    ctx.fillRect(WORLD.roadX + WORLD.roadWidth + 12, top, 6, height);
    ctx.fillStyle = "#532e20";
    ctx.fillRect(WORLD.roadX - 18, top + height, 6, 10);
    ctx.fillRect(WORLD.roadX + WORLD.roadWidth + 12, top + height, 6, 10);
  }

  const roadGradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  roadGradient.addColorStop(0, "#44403c");
  roadGradient.addColorStop(1, "#141313");
  ctx.fillStyle = roadGradient;
  ctx.fillRect(WORLD.roadX, 0, WORLD.roadWidth, WORLD.height);

  ctx.fillStyle = "#f7d070";
  ctx.fillRect(WORLD.roadX, 0, 8, WORLD.height);
  ctx.fillRect(WORLD.roadX + WORLD.roadWidth - 8, 0, 8, WORLD.height);

  const lineOffset = game.roadOffset % 80;
  ctx.fillStyle = "rgba(255, 244, 200, 0.9)";

  for (let lane = 1; lane < WORLD.lanes; lane += 1) {
    const x = WORLD.roadX + WORLD.laneWidth * lane - 4;
    for (let y = -80; y < WORLD.height + 80; y += 80) {
      ctx.fillRect(x, y + lineOffset, 8, 44);
    }
  }
}

function drawMessageBanner() {
  if (game.bannerTimer <= 0 || !game.bannerText) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = Math.min(1, game.bannerTimer / 0.4);
  roundedRect(68, 40, WORLD.width - 136, 46, 23);
  ctx.fillStyle = "rgba(7, 7, 7, 0.58)";
  ctx.fill();
  ctx.fillStyle = "#f7e2b0";
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(game.bannerText, WORLD.width / 2, 68);
  ctx.restore();
}

function drawEyes(targetCtx, accent) {
  targetCtx.fillStyle = "#101010";
  targetCtx.beginPath();
  targetCtx.arc(-5, -1, 2.5, 0, Math.PI * 2);
  targetCtx.arc(5, -1, 2.5, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.fillStyle = accent;
  targetCtx.beginPath();
  targetCtx.arc(-4.2, -1.4, 0.9, 0, Math.PI * 2);
  targetCtx.arc(5.8, -1.4, 0.9, 0, Math.PI * 2);
  targetCtx.fill();
}

function drawDriverPortrait(targetCtx, driver, x, y, size, options = {}) {
  const scale = size / 24;
  const silhouette = options.silhouette ?? false;
  const palette = silhouette
    ? { primary: "#5a4a40", secondary: "#2b231f", accent: "#8b735f" }
    : driver;

  targetCtx.save();
  targetCtx.translate(x, y);
  targetCtx.scale(scale, scale);

  if (driver.group === "insect") {
    targetCtx.strokeStyle = palette.secondary;
    targetCtx.lineWidth = 2;
    targetCtx.beginPath();
    targetCtx.moveTo(-6, -9);
    targetCtx.quadraticCurveTo(-9, -14, -12, -13);
    targetCtx.moveTo(6, -9);
    targetCtx.quadraticCurveTo(9, -14, 12, -13);
    targetCtx.stroke();

    targetCtx.fillStyle = palette.primary;
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, 11, 10, 0, 0, Math.PI * 2);
    targetCtx.fill();

    if (driver.trait === "spots") {
      targetCtx.fillStyle = palette.secondary;
      targetCtx.beginPath();
      targetCtx.arc(-4, -1, 2.1, 0, Math.PI * 2);
      targetCtx.arc(4, 1, 2.1, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (driver.trait === "stripes") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 2;
      targetCtx.beginPath();
      targetCtx.moveTo(-8, -3);
      targetCtx.lineTo(8, -3);
      targetCtx.moveTo(-8, 3);
      targetCtx.lineTo(8, 3);
      targetCtx.stroke();
    } else if (driver.trait === "wings") {
      targetCtx.fillStyle = palette.accent;
      targetCtx.globalAlpha = 0.7;
      targetCtx.beginPath();
      targetCtx.ellipse(-11, -2, 5, 8, -0.5, 0, Math.PI * 2);
      targetCtx.ellipse(11, -2, 5, 8, 0.5, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.globalAlpha = 1;
    } else if (driver.trait === "blades") {
      targetCtx.fillStyle = palette.secondary;
      targetCtx.beginPath();
      targetCtx.moveTo(-11, 2);
      targetCtx.lineTo(-15, 7);
      targetCtx.lineTo(-9, 6);
      targetCtx.moveTo(11, 2);
      targetCtx.lineTo(15, 7);
      targetCtx.lineTo(9, 6);
      targetCtx.fill();
    }
  } else if (driver.group === "sea") {
    targetCtx.fillStyle = palette.primary;
    targetCtx.beginPath();
    targetCtx.ellipse(0, 1, 12, 9, 0, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = palette.secondary;
    targetCtx.beginPath();
    targetCtx.moveTo(-12, 1);
    targetCtx.lineTo(-18, -3);
    targetCtx.lineTo(-15, 5);
    targetCtx.closePath();
    targetCtx.moveTo(12, 1);
    targetCtx.lineTo(18, -3);
    targetCtx.lineTo(15, 5);
    targetCtx.closePath();
    targetCtx.fill();

    if (driver.trait === "tentacles") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 2;
      for (let index = -2; index <= 2; index += 1) {
        targetCtx.beginPath();
        targetCtx.moveTo(index * 3, 8);
        targetCtx.quadraticCurveTo(index * 5, 12, index * 2, 15);
        targetCtx.stroke();
      }
    } else if (driver.trait === "spikes") {
      targetCtx.fillStyle = palette.secondary;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 5) {
        targetCtx.beginPath();
        targetCtx.arc(Math.cos(angle) * 12, Math.sin(angle) * 9, 1.7, 0, Math.PI * 2);
        targetCtx.fill();
      }
    } else if (driver.trait === "blade") {
      targetCtx.fillStyle = palette.secondary;
      targetCtx.beginPath();
      targetCtx.moveTo(10, -2);
      targetCtx.lineTo(20, -5);
      targetCtx.lineTo(10, 1);
      targetCtx.closePath();
      targetCtx.fill();
    } else if (driver.trait === "claws") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 2;
      targetCtx.beginPath();
      targetCtx.moveTo(-14, 4);
      targetCtx.lineTo(-20, 0);
      targetCtx.moveTo(14, 4);
      targetCtx.lineTo(20, 0);
      targetCtx.stroke();
    }
  } else if (driver.group === "mammal") {
    targetCtx.fillStyle = palette.primary;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, 11, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = palette.secondary;
    if (driver.trait === "pointy") {
      targetCtx.beginPath();
      targetCtx.moveTo(-8, -6);
      targetCtx.lineTo(-12, -14);
      targetCtx.lineTo(-3, -9);
      targetCtx.closePath();
      targetCtx.moveTo(8, -6);
      targetCtx.lineTo(12, -14);
      targetCtx.lineTo(3, -9);
      targetCtx.closePath();
      targetCtx.fill();
    } else if (driver.trait === "long") {
      targetCtx.beginPath();
      targetCtx.ellipse(-7, -12, 3.5, 8, -0.2, 0, Math.PI * 2);
      targetCtx.ellipse(7, -12, 3.5, 8, 0.2, 0, Math.PI * 2);
      targetCtx.fill();
    } else {
      targetCtx.beginPath();
      targetCtx.arc(-7, -8, 4, 0, Math.PI * 2);
      targetCtx.arc(7, -8, 4, 0, Math.PI * 2);
      targetCtx.fill();
    }

    targetCtx.fillStyle = palette.secondary;
    targetCtx.beginPath();
    targetCtx.ellipse(0, 4, 8, 6, 0, 0, Math.PI * 2);
    targetCtx.fill();

    if (driver.trait === "stripes") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 2;
      targetCtx.beginPath();
      targetCtx.moveTo(-7, -2);
      targetCtx.lineTo(-2, 3);
      targetCtx.moveTo(7, -2);
      targetCtx.lineTo(2, 3);
      targetCtx.moveTo(0, -5);
      targetCtx.lineTo(0, 3);
      targetCtx.stroke();
    } else if (driver.trait === "mane") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 3;
      targetCtx.beginPath();
      targetCtx.arc(0, 0, 13, 0.3, Math.PI * 2 - 0.3);
      targetCtx.stroke();
    } else if (driver.trait === "trunk") {
      targetCtx.fillStyle = palette.secondary;
      targetCtx.beginPath();
      targetCtx.roundRect?.(-3, 3, 6, 11, 3);
      if (!targetCtx.roundRect) {
        roundedRectFallback(targetCtx, -3, 3, 6, 11, 3);
      }
      targetCtx.fill();
    } else if (driver.trait === "spots") {
      targetCtx.fillStyle = palette.accent;
      targetCtx.beginPath();
      targetCtx.arc(-5, -1, 2.1, 0, Math.PI * 2);
      targetCtx.arc(6, 2, 1.8, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (driver.trait === "horn") {
      targetCtx.fillStyle = palette.accent;
      targetCtx.beginPath();
      targetCtx.moveTo(1, -1);
      targetCtx.lineTo(8, -7);
      targetCtx.lineTo(2, 1);
      targetCtx.closePath();
      targetCtx.fill();
    } else if (driver.trait === "mask") {
      targetCtx.fillStyle = palette.secondary;
      targetCtx.beginPath();
      targetCtx.arc(-5, -2, 4, 0, Math.PI * 2);
      targetCtx.arc(5, -2, 4, 0, Math.PI * 2);
      targetCtx.fill();
    }
  } else if (driver.group === "bird") {
    targetCtx.fillStyle = palette.primary;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, 11, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = palette.secondary;
    targetCtx.beginPath();
    targetCtx.moveTo(-5, 1);
    targetCtx.lineTo(0, 6);
    targetCtx.lineTo(5, 1);
    targetCtx.closePath();
    targetCtx.fill();

    if (driver.trait === "tuft") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 2;
      targetCtx.beginPath();
      targetCtx.moveTo(-6, -9);
      targetCtx.lineTo(-9, -13);
      targetCtx.moveTo(6, -9);
      targetCtx.lineTo(9, -13);
      targetCtx.stroke();
    } else if (driver.trait === "crest") {
      targetCtx.fillStyle = palette.secondary;
      targetCtx.beginPath();
      targetCtx.moveTo(-2, -11);
      targetCtx.lineTo(1, -16);
      targetCtx.lineTo(4, -10);
      targetCtx.closePath();
      targetCtx.fill();
    } else if (driver.trait === "mask") {
      targetCtx.fillStyle = palette.secondary;
      targetCtx.beginPath();
      targetCtx.arc(-5, -1, 4, 0, Math.PI * 2);
      targetCtx.arc(5, -1, 4, 0, Math.PI * 2);
      targetCtx.fill();
    }
  } else if (driver.group === "reptile") {
    targetCtx.fillStyle = palette.primary;
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = palette.secondary;
    if (driver.trait === "teeth") {
      targetCtx.beginPath();
      for (let tooth = -2; tooth <= 2; tooth += 1) {
        targetCtx.moveTo(tooth * 3, 6);
        targetCtx.lineTo(tooth * 3 + 1.5, 10);
        targetCtx.lineTo(tooth * 3 + 3, 6);
      }
      targetCtx.fill();
    } else if (driver.trait === "curl") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 2;
      targetCtx.beginPath();
      targetCtx.arc(7, 3, 4, 0, Math.PI * 1.7);
      targetCtx.stroke();
    } else if (driver.trait === "shell") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 3;
      targetCtx.beginPath();
      targetCtx.arc(0, 1, 9, 0.2, Math.PI * 1.8);
      targetCtx.stroke();
    }
  } else {
    targetCtx.fillStyle = palette.primary;
    targetCtx.beginPath();
    targetCtx.arc(0, 2, 11, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = palette.secondary;
    targetCtx.beginPath();
    targetCtx.arc(-7, -6, 4, 0, Math.PI * 2);
    targetCtx.arc(7, -6, 4, 0, Math.PI * 2);
    targetCtx.fill();

    if (driver.trait === "gills") {
      targetCtx.strokeStyle = palette.secondary;
      targetCtx.lineWidth = 2;
      targetCtx.beginPath();
      targetCtx.moveTo(-10, 2);
      targetCtx.lineTo(-16, -1);
      targetCtx.moveTo(-10, 5);
      targetCtx.lineTo(-16, 6);
      targetCtx.moveTo(10, 2);
      targetCtx.lineTo(16, -1);
      targetCtx.moveTo(10, 5);
      targetCtx.lineTo(16, 6);
      targetCtx.stroke();
    } else if (driver.trait === "spots") {
      targetCtx.fillStyle = palette.accent;
      targetCtx.beginPath();
      targetCtx.arc(-4, 1, 2.2, 0, Math.PI * 2);
      targetCtx.arc(6, 3, 1.8, 0, Math.PI * 2);
      targetCtx.fill();
    }
  }

  drawEyes(targetCtx, palette.accent);
  targetCtx.fillStyle = palette.accent;
  targetCtx.beginPath();
  targetCtx.arc(0, 4, 1.8, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.restore();
}

function roundedRectFallback(targetCtx, x, y, width, height, radius) {
  targetCtx.beginPath();
  targetCtx.moveTo(x + radius, y);
  targetCtx.arcTo(x + width, y, x + width, y + height, radius);
  targetCtx.arcTo(x + width, y + height, x, y + height, radius);
  targetCtx.arcTo(x, y + height, x, y, radius);
  targetCtx.arcTo(x, y, x + width, y, radius);
  targetCtx.closePath();
}

function drawDriverBadge(canvasElement, driver, silhouette) {
  const previewCtx = canvasElement.getContext("2d");
  const { width, height } = canvasElement;

  previewCtx.clearRect(0, 0, width, height);

  const bg = previewCtx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, silhouette ? "#43362f" : driver.secondary);
  bg.addColorStop(1, silhouette ? "#1f1a18" : driver.primary);
  previewCtx.fillStyle = bg;
  previewCtx.fillRect(0, 0, width, height);

  previewCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
  previewCtx.beginPath();
  previewCtx.arc(width / 2, height / 2, 28, 0, Math.PI * 2);
  previewCtx.fill();

  drawDriverPortrait(previewCtx, driver, width / 2, height / 2 + 6, 34, { silhouette });
}

function drawPlayer() {
  const player = game.player;
  const paint = getSelectedColor();
  const driver = getSelectedDriver();
  const flashOn = player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0;

  ctx.save();
  ctx.translate(player.x, player.y + Math.sin(player.bob) * 2);

  if (flashOn) {
    ctx.globalAlpha = 0.45;
  }

  ctx.shadowColor = paint.glow;
  ctx.shadowBlur = 20;
  roundedRect(-28, -46, 56, 92, 18);
  ctx.fillStyle = paint.trim;
  ctx.fill();
  ctx.shadowBlur = 0;

  roundedRect(-22, -34, 44, 66, 14);
  ctx.fillStyle = paint.body;
  ctx.fill();

  ctx.fillStyle = paint.highlight;
  ctx.fillRect(-18, -42, 10, 7);
  ctx.fillRect(8, -42, 10, 7);

  drawDriverPortrait(ctx, driver, 0, -11, 16);

  roundedRect(-14, -18, 28, 28, 8);
  ctx.fillStyle = paint.canopy;
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(-11, -15, 22, 4);
  ctx.fillStyle = "#101010";
  ctx.fillRect(-31, -28, 7, 24);
  ctx.fillRect(24, -28, 7, 24);
  ctx.fillRect(-31, 8, 7, 24);
  ctx.fillRect(24, 8, 7, 24);

  ctx.fillStyle = paint.highlight;
  ctx.fillRect(-14, 18, 28, 6);
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(-18, 36, 10, 6);
  ctx.fillRect(8, 36, 10, 6);

  ctx.restore();
}

function drawBoss() {
  if (!game.boss.active && game.mode !== "won") {
    return;
  }

  ctx.save();
  ctx.translate(game.boss.x, game.boss.y);

  roundedRect(-54, -72, 108, 144, 20);
  ctx.fillStyle = "#631d13";
  ctx.fill();

  roundedRect(-46, -58, 92, 114, 18);
  ctx.fillStyle = "#c9472a";
  ctx.fill();

  roundedRect(-22, -34, 44, 30, 10);
  ctx.fillStyle = "#fde68a";
  ctx.fill();

  ctx.fillStyle = "#101010";
  ctx.fillRect(-59, -40, 8, 28);
  ctx.fillRect(51, -40, 8, 28);
  ctx.fillRect(-59, 22, 8, 28);
  ctx.fillRect(51, 22, 8, 28);

  ctx.fillStyle = "#f97316";
  ctx.fillRect(-26, -66, 18, 9);
  ctx.fillRect(8, -66, 18, 9);
  ctx.fillStyle = "#fee2e2";
  ctx.fillRect(-22, 56, 16, 8);
  ctx.fillRect(6, 56, 16, 8);

  ctx.restore();
}

function drawObstacle(obstacle) {
  ctx.save();
  ctx.translate(obstacle.x, obstacle.y);

  if (obstacle.type === "oil") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 3, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    const slickGradient = ctx.createRadialGradient(-8, -6, 3, 0, 0, 42);
    slickGradient.addColorStop(0, "rgba(125, 211, 252, 0.5)");
    slickGradient.addColorStop(0.18, "rgba(59, 130, 246, 0.28)");
    slickGradient.addColorStop(0.38, "#374151");
    slickGradient.addColorStop(1, "#020617");
    ctx.fillStyle = slickGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 16, Math.sin(obstacle.wobble) * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 16, Math.sin(obstacle.wobble) * 0.1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(224, 242, 254, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-9, -3, 13, 4, -0.15, 0.2, Math.PI * 1.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(11, 2, 10, 3, 0.2, 0.15, Math.PI * 1.08);
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(-46, 0, 4, 0, Math.PI * 2);
    ctx.arc(46, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 248, 220, 0.95)";
    ctx.beginPath();
    ctx.arc(-46, 0, 1.5, 0, Math.PI * 2);
    ctx.arc(46, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (obstacle.type === "crate") {
    roundedRect(-22, -22, 44, 44, 8);
    ctx.fillStyle = obstacle.palette[0];
    ctx.fill();
    ctx.strokeStyle = obstacle.palette[1];
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(12, 12);
    ctx.moveTo(-12, 12);
    ctx.lineTo(12, -12);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (obstacle.type === "barrier") {
    roundedRect(-41, -17, 82, 34, 8);
    ctx.fillStyle = "#f6ad14";
    ctx.fill();
    ctx.strokeStyle = "#1f1f1f";
    ctx.lineWidth = 6;
    for (let x = -28; x <= 28; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, -17);
      ctx.lineTo(x + 18, 17);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (obstacle.type === "truck") {
    roundedRect(-35, -59, 70, 118, 16);
    ctx.fillStyle = obstacle.palette[0];
    ctx.fill();
    roundedRect(-24, -34, 48, 52, 12);
    ctx.fillStyle = "#f5e2c0";
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.fillRect(-38, -34, 8, 22);
    ctx.fillRect(30, -34, 8, 22);
    ctx.fillRect(-38, 18, 8, 22);
    ctx.fillRect(30, 18, 8, 22);
    ctx.restore();
    return;
  }

  if (obstacle.type === "heart") {
    ctx.shadowColor = "rgba(251, 113, 133, 0.45)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = obstacle.palette[0];
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.bezierCurveTo(-26, -2, -24, -28, -4, -24);
    ctx.bezierCurveTo(0, -20, 3, -16, 0, -12);
    ctx.bezierCurveTo(3, -16, 0, -20, 4, -24);
    ctx.bezierCurveTo(24, -28, 26, -2, 0, 18);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = obstacle.palette[1];
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 240, 246, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -12);
    ctx.quadraticCurveTo(-14, -19, -3, -20);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (obstacle.type === "mine") {
    ctx.fillStyle = obstacle.palette[1];
    for (let spike = 0; spike < 8; spike += 1) {
      ctx.save();
      ctx.rotate((Math.PI / 4) * spike + obstacle.wobble * 0.15);
      ctx.fillRect(-3, -25, 6, 14);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = obstacle.palette[0];
    ctx.fill();
    ctx.restore();
    return;
  }

  if (obstacle.type === "pulse") {
    const glow = ctx.createLinearGradient(-46, 0, 46, 0);
    glow.addColorStop(0, "rgba(248, 113, 113, 0.15)");
    glow.addColorStop(0.5, "#fee2e2");
    glow.addColorStop(1, "rgba(248, 113, 113, 0.15)");
    roundedRect(-46, -11, 92, 22, 10);
    ctx.fillStyle = glow;
    ctx.fill();
    roundedRect(-36, -5, 72, 10, 5);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.restore();
    return;
  }

  if (obstacle.type === "rainbow") {
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    obstacle.palette.forEach((stripe, index) => {
      ctx.beginPath();
      ctx.strokeStyle = stripe;
      ctx.arc(0, 10, 12 + index * 5.3, Math.PI, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(-28, 12, 9, 0, Math.PI * 2);
    ctx.arc(-20, 16, 8, 0, Math.PI * 2);
    ctx.arc(28, 12, 9, 0, Math.PI * 2);
    ctx.arc(20, 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.restore();
}

function drawParticles() {
  game.particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawEffects() {
  if (game.flash <= 0) {
    return;
  }

  ctx.save();
  ctx.fillStyle = `rgba(255, 68, 68, ${game.flash * 0.35})`;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.restore();
}

function draw() {
  drawBackground();
  drawMessageBanner();
  drawBoss();
  game.obstacles.forEach(drawObstacle);
  drawPlayer();
  drawParticles();
  drawEffects();
}

function frame(timeStamp) {
  if (!game.lastFrame) {
    game.lastFrame = timeStamp;
  }

  const dt = Math.min(0.032, (timeStamp - game.lastFrame) / 1000);
  game.lastFrame = timeStamp;

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space", "Enter", "KeyG", "Escape"].includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === "KeyG") {
    if (game.garageOpen) {
      closeGarage();
    } else {
      openGarage("drivers");
    }
    return;
  }

  if (event.code === "Escape" && game.garageOpen) {
    closeGarage();
    return;
  }

  if (game.garageOpen) {
    return;
  }

  if ((event.code === "Space" || event.code === "Enter") && (game.mode === "idle" || game.mode === "won" || game.mode === "lost")) {
    resetGame();
    return;
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    shiftLane(-1);
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    shiftLane(1);
  }
});

ui.startButton.addEventListener("click", resetGame);
ui.garageButton.addEventListener("click", () => openGarage("drivers"));
ui.garageCloseButton.addEventListener("click", closeGarage);

ui.garageTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setGarageTab(button.dataset.tab);
  });
});

ui.driverGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-driver-id]");

  if (!button) {
    return;
  }

  setSelectedDriver(button.dataset.driverId);
});

ui.colorGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-color-id]");

  if (!button) {
    return;
  }

  setSelectedColor(button.dataset.colorId);
});

ui.touchButtons.forEach((button) => {
  button.addEventListener("pointerdown", () => {
    shiftLane(Number(button.dataset.move));
  });
});

renderGarage();
refreshIdleOverlay();
syncHud();
draw();
requestAnimationFrame(frame);
