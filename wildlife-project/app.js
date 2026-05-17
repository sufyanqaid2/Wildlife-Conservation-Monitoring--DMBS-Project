/* ============================================================
   WILDLIFE CONSERVATION MANAGEMENT SYSTEM
   Supabase + Login + CRUD + Role Access Control + Dynamic Stats
   + Dashboard + Reports Page + Recent Activity
   IMPORTANT:
   sightings table uses user_id, not ranger_id
   ============================================================ */

/* SUPABASE INFORMATION */
const SUPABASE_URL = "https://ygvrgfrghzccyatqhlww.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yZKp9A9OeVXmybrzRrYQKw_Gb4EGd-1";

let supabaseClient = null;

if (
  typeof supabase !== "undefined" &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes("PASTE")
) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* 3) TABLE NAMES */
const TABLES = {
  animals: "animals",
  health_records: "health_records",
  sightings: "sightings",
  threats: "threats",
  zones: "zones",
  rangers: "rangers",
  users: "users"
};

/* 4) ALLOWED ROLES */
const ALLOWED_ROLES = ["admin", "ranger", "researcher", "viewer"];

/* ============================================================
   ROLE ACCESS CONTROL
   ============================================================ */

const ROLE_ACCESS = {
  admin: {
    defaultPage: "dashboard.html",
    pages: [
      "dashboard",
      "animals",
      "health_records",
      "sightings",
      "threats",
      "zones",
      "rangers",
      "users",
      "reports"
    ],
    editableTables: [
      "animals",
      "health_records",
      "sightings",
      "threats",
      "zones",
      "rangers",
      "users"
    ]
  },

  ranger: {
    defaultPage: "animals.html",
    pages: [
      "animals",
      "health_records",
      "sightings",
      "threats",
      "zones",
      "reports"
    ],
    editableTables: [
      "health_records",
      "sightings",
      "threats"
    ]
  },

  researcher: {
    defaultPage: "animals.html",
    pages: [
      "animals",
      "health_records",
      "sightings",
      "threats",
      "zones",
      "reports"
    ],
    editableTables: []
  },

  viewer: {
    defaultPage: "animals.html",
    pages: [
      "animals",
      "health_records",
      "sightings",
      "zones",
      "reports"
    ],
    editableTables: []
  }
};

function currentPage() {
  return document.body.dataset.page;
}

function getCurrentRole() {
  return String(localStorage.getItem("currentRole") || "").trim().toLowerCase();
}

function getDefaultPageForRole(role) {
  if (!ROLE_ACCESS[role]) return "login.html";
  return ROLE_ACCESS[role].defaultPage;
}

function canAccessPage(page) {
  const role = getCurrentRole();
  return ROLE_ACCESS[role] && ROLE_ACCESS[role].pages.includes(page);
}

function canEditTable(table) {
  const role = getCurrentRole();
  return ROLE_ACCESS[role] && ROLE_ACCESS[role].editableTables.includes(table);
}

function pageFromHref(href) {
  if (!href) return "";

  if (href.includes("dashboard")) return "dashboard";
  if (href.includes("animals")) return "animals";
  if (href.includes("health_records")) return "health_records";
  if (href.includes("sightings")) return "sightings";
  if (href.includes("threats")) return "threats";
  if (href.includes("zones")) return "zones";
  if (href.includes("rangers")) return "rangers";
  if (href.includes("users")) return "users";
  if (href.includes("reports")) return "reports";

  return "";
}

function getPrimaryKey(table) {
  const keys = {
    animals: "animal_id",
    health_records: "record_id",
    sightings: "sighting_id",
    threats: "threat_id",
    zones: "zone_id",
    rangers: "ranger_id",
    users: "user_id"
  };

  return keys[table];
}

/* ============================================================
   PROTECTION + LOGOUT + UI
   ============================================================ */

function protectPages() {
  const page = currentPage();

  if (page === "login") return;

  const user = localStorage.getItem("currentUser");
  const role = getCurrentRole();

  if (!user || !role) {
    window.location.href = "login.html";
    return;
  }

  if (!canAccessPage(page)) {
    alert("Access denied. Your role cannot open this page.");
    window.location.href = getDefaultPageForRole(role);
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentRole");
  localStorage.removeItem("currentUserId");
  window.location.href = "login.html";
}

window.logout = logout;

function updateLoggedUserUI() {
  const username = localStorage.getItem("currentUser") || "User";
  const role = localStorage.getItem("currentRole") || "role";

  document.querySelectorAll(".current-user-name").forEach(el => {
    el.textContent = username;
  });

  document.querySelectorAll(".current-user-role").forEach(el => {
    el.textContent = role;
  });
}

function applyRoleAccessUI() {
  document.querySelectorAll(".nav a").forEach(link => {
    const page = pageFromHref(link.getAttribute("href"));

    if (page && !canAccessPage(page)) {
      link.style.display = "none";
    } else {
      link.style.display = "flex";
    }
  });
}

/* ============================================================
   LOGIN
   ============================================================ */

function setupLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!supabaseClient) {
      alert("Supabase is not connected.");
      return;
    }

    const usernameOrEmail = document.getElementById("loginUsername").value.trim();
    const passwordInput = document.getElementById("loginPassword").value.trim();
    const roleInput = document.getElementById("loginRole").value.trim().toLowerCase();

    if (!usernameOrEmail || !passwordInput || !roleInput) {
      alert("Please enter username/email, password, and role.");
      return;
    }

    if (!ALLOWED_ROLES.includes(roleInput)) {
      alert("Invalid role selected.");
      return;
    }

    try {
      const { data: users, error } = await supabaseClient
        .from(TABLES.users)
        .select("*")
        .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`);

      if (error) {
        console.error("Login select error:", error);
        alert("Login error: " + error.message);
        return;
      }

      if (!users || users.length === 0) {
        alert("Login failed: username or email does not exist.");
        return;
      }

      const matchedUser = users.find(user => {
        const dbPassword = String(user.password || "").trim();
        const dbRole = String(user.role || "").trim().toLowerCase();

        return dbPassword === passwordInput && dbRole === roleInput;
      });

      if (!matchedUser) {
        alert("Login failed: password or role is not correct.");
        return;
      }

      localStorage.setItem("currentUser", matchedUser.username);
      localStorage.setItem("currentRole", String(matchedUser.role).trim().toLowerCase());
      localStorage.setItem("currentUserId", matchedUser.user_id);

      window.location.href = getDefaultPageForRole(String(matchedUser.role).trim().toLowerCase());

    } catch (error) {
      console.error("Login error:", error);
      alert("Login error: " + error.message);
    }
  });
}

/* ============================================================
   HELPERS
   ============================================================ */

function badge(value) {
  if (value === true || value === "true" || value === "TRUE") {
    return `<span class="badge green">TRUE</span>`;
  }

  if (value === false || value === "false" || value === "FALSE") {
    return `<span class="badge gray">FALSE</span>`;
  }

  const text = String(value || "").toLowerCase();
  let color = "gray";

  if (["alive", "healthy", "forest", "admin", "ranger", "low"].includes(text)) color = "green";
  if (["dead", "sick", "high"].includes(text)) color = "red";
  if (["injured", "medium", "grassland", "desert"].includes(text)) color = "orange";
  if (["recovering", "wetland", "researcher"].includes(text)) color = "purple";
  if (["viewer", "male"].includes(text)) color = "blue";

  return `<span class="badge ${color}">${value}</span>`;
}

function valueOf(row, field) {
  return row[field] === null || row[field] === undefined ? "" : row[field];
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function buildMap(data, keyField) {
  const map = {};
  data.forEach(item => {
    map[item[keyField]] = item;
  });
  return map;
}

function daysAgo(dateString) {
  if (!dateString) return 999999;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 999999;

  const now = new Date();
  const diff = now - date;

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatDisplayDate(dateString) {
  if (!dateString) return "-";

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatShortDate(dateString) {
  if (!dateString) return "-";

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

/* ============================================================
   DATABASE FUNCTIONS
   ============================================================ */

async function dbSelect(table) {
  if (!supabaseClient) {
    alert("Supabase is not connected. Check app.js.");
    return [];
  }

  const pk = getPrimaryKey(table);

  const { data, error } = await supabaseClient
    .from(TABLES[table])
    .select("*")
    .order(pk, { ascending: true });

  if (error) {
    console.error("Select error:", error);
    alert("Select error from " + table + ": " + error.message);
    return [];
  }

  return data || [];
}

/* ============================================================
   RECENT ACTIVITY LOG
   ============================================================ */

function tableDisplayName(table) {
  const names = {
    animals: "Animal",
    health_records: "Health Record",
    sightings: "Sighting",
    threats: "Threat",
    zones: "Zone",
    rangers: "Ranger",
    users: "User"
  };

  return names[table] || table;
}

function tableIcon(table) {
  const icons = {
    animals: "🐾",
    health_records: "💚",
    sightings: "👀",
    threats: "⚠️",
    zones: "📍",
    rangers: "👤",
    users: "👥"
  };

  return icons[table] || "📝";
}

function recordName(table, row) {
  if (!row) return "record";

  if (table === "animals") return row.name || "animal";
  if (table === "zones") return row.zone_name || "zone";
  if (table === "rangers") return row.full_name || "ranger";
  if (table === "users") return row.username || "user";
  if (table === "threats") return row.threat_type || "threat";
  if (table === "health_records") return "health record";
  if (table === "sightings") return "sighting";

  return "record";
}

function logActivity(table, action, row = {}) {
  const currentUser = localStorage.getItem("currentUser") || "Unknown user";

  const activity = {
    date: new Date().toISOString(),
    icon: tableIcon(table),
    title: `${tableDisplayName(table)} ${action}`,
    subtitle: `${recordName(table, row)} • by ${currentUser}`
  };

  const oldActivities = JSON.parse(localStorage.getItem("recentActivities") || "[]");
  oldActivities.unshift(activity);

  localStorage.setItem("recentActivities", JSON.stringify(oldActivities.slice(0, 50)));
}

function getLoggedActivities() {
  return JSON.parse(localStorage.getItem("recentActivities") || "[]");
}

async function dbInsert(table, row) {
  if (!supabaseClient) {
    alert("Supabase is not connected.");
    return false;
  }

  if (!canEditTable(table)) {
    alert("Access denied. Your role cannot add records here.");
    return false;
  }

  const { data, error } = await supabaseClient
    .from(TABLES[table])
    .insert([row])
    .select();

  if (error) {
    console.error("Insert error:", error);
    alert("Insert error: " + error.message);
    return false;
  }

  logActivity(table, "added", data && data[0] ? data[0] : row);
  return true;
}

async function dbUpdate(table, id, row) {
  if (!supabaseClient) {
    alert("Supabase is not connected.");
    return false;
  }

  if (!canEditTable(table)) {
    alert("Access denied. Your role cannot edit records here.");
    return false;
  }

  const pk = getPrimaryKey(table);

  const { data, error } = await supabaseClient
    .from(TABLES[table])
    .update(row)
    .eq(pk, id)
    .select();

  if (error) {
    console.error("Update error:", error);
    alert("Update error: " + error.message);
    return false;
  }

  logActivity(table, "edited", data && data[0] ? data[0] : row);
  return true;
}

async function dbDelete(table, id) {
  if (!supabaseClient) {
    alert("Supabase is not connected.");
    return;
  }

  if (!canEditTable(table)) {
    alert("Access denied. Your role cannot delete records here.");
    return;
  }

  if (!confirm("Are you sure you want to delete this record?")) return;

  const pk = getPrimaryKey(table);

  const { data: deletedRow } = await supabaseClient
    .from(TABLES[table])
    .select("*")
    .eq(pk, id)
    .maybeSingle();

  const { error } = await supabaseClient
    .from(TABLES[table])
    .delete()
    .eq(pk, id);

  if (error) {
    console.error("Delete error:", error);
    alert("Delete error: " + error.message);
    return;
  }

  logActivity(table, "deleted", deletedRow || { name: `ID ${id}` });

  alert("Record deleted successfully.");
  await loadPage();
}

window.dbDelete = dbDelete;

/* ============================================================
   FORM + CRUD
   ============================================================ */

function getFormData(form) {
  const row = {};

  [...form.elements].forEach(el => {
    if (!el.name) return;
    if (el.disabled) return;

    if (el.type === "checkbox") {
      row[el.name] = el.checked;
    } else {
      row[el.name] = el.value.trim();
    }
  });

  return row;
}

function fillForm(form, row) {
  [...form.elements].forEach(el => {
    if (!el.name) return;

    if (el.type === "checkbox") {
      el.checked = row[el.name] === true || row[el.name] === "true";
    } else {
      el.value = valueOf(row, el.name);
    }
  });
}

function clearForm(form) {
  form.reset();
  form.dataset.editId = "";
}

function cleanRowBeforeSave(table, row, isEdit) {
  const pk = getPrimaryKey(table);
  delete row[pk];

  Object.keys(row).forEach(key => {
    if (row[key] === "") {
      delete row[key];
    }
  });

  ["animal_id", "zone_id", "user_id", "reported_by", "birth_year"].forEach(key => {
    if (row[key] !== undefined) row[key] = Number(row[key]);
  });

  ["weight_kg", "area_km2"].forEach(key => {
    if (row[key] !== undefined) row[key] = Number(row[key]);
  });

  if (table === "animals") {
    if (row.gender) row.gender = String(row.gender).trim().toLowerCase();
    if (row.status) row.status = String(row.status).trim().toLowerCase();
  }

  if (table === "health_records") {
    const currentUserId = localStorage.getItem("currentUserId");

    if (currentUserId) {
      row.user_id = Number(currentUserId);
    }
  }

  if (table === "sightings") {
    if (!row.user_id) {
      const currentUserId = localStorage.getItem("currentUserId");
      if (currentUserId) row.user_id = Number(currentUserId);
    }
  }

  if (table === "threats" && row.resolved !== undefined) {
    row.resolved = row.resolved === "true" || row.resolved === true;
  }

  if (table === "users") {
    if (getCurrentRole() !== "admin") {
      alert("Only admin can create or edit users.");
      return null;
    }

    if (row.role) {
      row.role = String(row.role).trim().toLowerCase();
    }

    if (row.role && !ALLOWED_ROLES.includes(row.role)) {
      alert("Invalid role. Use only: admin, ranger, researcher, viewer");
      return null;
    }

    if (!isEdit) {
      row.created_at = new Date().toISOString();
    }

    if (isEdit) {
      delete row.created_at;

      if (!row.password) {
        delete row.password;
      }
    }
  }

  return row;
}

window.editRecord = function (table, row) {
  if (!canEditTable(table)) {
    alert("Access denied. Your role cannot edit this table.");
    return;
  }

  const form = document.querySelector(`form[data-table="${table}"]`);
  if (!form) return;

  const pk = getPrimaryKey(table);

  form.dataset.editId = row[pk];
  fillForm(form, row);

  window.scrollTo({ top: 0, behavior: "smooth" });
};

async function setupCrudPage(table, columns, formId, tableBodyId) {
  const data = await dbSelect(table);
  const tbody = document.getElementById(tableBodyId);
  const form = document.getElementById(formId);
  const pk = getPrimaryKey(table);

  if (!tbody || !form) return;

  const allowedToEdit = canEditTable(table);

  const animals = await dbSelect("animals");
  const zones = await dbSelect("zones");
  const users = await dbSelect("users");
  const rangers = await dbSelect("rangers");

  const animalMap = buildMap(animals, "animal_id");
  const zoneMap = buildMap(zones, "zone_id");
  const userMap = buildMap(users, "user_id");

  function displayCellValue(row, col) {
    if (table === "sightings") {
      if (col === "animal_id") {
        const animal = animalMap[row.animal_id];
        return animal ? animal.name : row.animal_id;
      }

      if (col === "zone_id") {
        const zone = zoneMap[row.zone_id];
        return zone ? zone.zone_name : row.zone_id;
      }

      if (col === "user_id") {
        const user = userMap[row.user_id];
        return user ? user.username : row.user_id;
      }
    }

    if (table === "health_records") {
      if (col === "animal_id") {
        const animal = animalMap[row.animal_id];
        return animal ? animal.name : row.animal_id;
      }

      if (col === "user_id") {
        const user = userMap[row.user_id];
        return user ? user.username : row.user_id;
      }
    }

    if (table === "threats") {
      if (col === "zone_id") {
        const zone = zoneMap[row.zone_id];
        return zone ? zone.zone_name : row.zone_id;
      }

      if (col === "reported_by") {
        const user = userMap[row.reported_by];
        return user ? user.username : row.reported_by;
      }
    }

    if (table === "rangers") {
  /*
    IMPORTANT:
    In Rangers page, show the real user_id number.
    Do not replace user_id with username.
  */
  if (col === "user_id") {
    return row.user_id;
  }

  if (col === "zone_id") {
    const zone = zoneMap[row.zone_id];
    return zone ? zone.zone_name : row.zone_id;
  }
}

    if (table === "animals") {
      if (col === "zone_id") {
        const zone = zoneMap[row.zone_id];
        return zone ? zone.zone_name : row.zone_id;
      }
    }

    return valueOf(row, col);
  }

  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");

    columns.forEach(col => {
      let display = displayCellValue(row, col);

      if (["health_status", "severity", "habitat_type", "role", "resolved", "status"].includes(col)) {
        display = badge(row[col]);
      }

      tr.innerHTML += `<td>${display}</td>`;
    });

    if (allowedToEdit) {
      tr.innerHTML += `
        <td>
          <div class="actions">
            <button class="icon-btn edit" type="button"
              onclick='editRecord("${table}", ${JSON.stringify(row).replace(/'/g, "&apos;")})'>✎</button>

            <button class="icon-btn delete" type="button"
              onclick='dbDelete("${table}", "${row[pk]}")'>🗑</button>
          </div>
        </td>
      `;
    } else {
      tr.innerHTML += `<td><span class="badge gray">View only</span></td>`;
    }

    tbody.appendChild(tr);
  });

  if (!allowedToEdit) {
    form.querySelectorAll("input, select, textarea, button").forEach(el => {
      el.disabled = true;
    });

    const existingNote = form.parentElement.querySelector(".view-only-note");

    if (!existingNote) {
      const note = document.createElement("div");
      note.className = "card view-only-note";
      note.style.background = "#f9fafb";
      note.style.marginTop = "15px";
      note.innerHTML = `
        <b>View Only</b>
        <p style="margin-top:8px;color:#6b7280;">
          Your role can view this page, but cannot add, edit, or delete records.
        </p>
      `;

      form.parentElement.appendChild(note);
    }

    return;
  }

  form.onsubmit = async function (e) {
    e.preventDefault();

    let row = getFormData(form);
    const editId = form.dataset.editId;
    const isEdit = Boolean(editId);

    if (table === "users") {
      const passwordInput = form.querySelector('input[name="password"]');
      const confirmPasswordInput = document.getElementById("confirmPassword");

      if (!isEdit && (!passwordInput.value || !confirmPasswordInput.value)) {
        alert("Password and confirm password are required.");
        return;
      }

      if (passwordInput.value || confirmPasswordInput.value) {
        if (passwordInput.value !== confirmPasswordInput.value) {
          alert("Passwords do not match.");
          return;
        }
      }
    }

    row = cleanRowBeforeSave(table, row, isEdit);
    if (!row) return;

    let success = false;

    if (isEdit) {
      success = await dbUpdate(table, editId, row);
      if (success) alert("Record updated successfully.");
    } else {
      success = await dbInsert(table, row);
      if (success) alert("Record added successfully.");
    }

    if (success) {
      clearForm(form);
      await loadPage();
    }
  };

  const clearButton = form.querySelector("[data-clear]");
  if (clearButton) {
    clearButton.onclick = function () {
      clearForm(form);
    };
  }
}

/* ============================================================
   SEARCH + DROPDOWNS
   ============================================================ */

function setupSearch(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);

  if (!input || !table) return;

  input.addEventListener("input", function () {
    const value = input.value.toLowerCase();
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
    });
  });
}

async function loadDropdowns() {
  const zones = await dbSelect("zones");
  const animals = await dbSelect("animals");
  const users = await dbSelect("users");
  const rangers = await dbSelect("rangers");

  /*
    For normal user dropdowns, show all users.
    For ranger form, show ONLY users whose role = ranger.
  */
  const rangerUsers = users.filter(user => {
    return String(user.role || "").trim().toLowerCase() === "ranger";
  });

  fillSelect("zoneSelect", zones, "zone_id", "zone_name");
  fillSelect("animalSelect", animals, "animal_id", "name");

  /* General users dropdown */
  fillSelect("userSelect", users, "user_id", "username");

  /* Reporter dropdown */
  fillSelect("reporterSelect", users, "user_id", "username");

  /* Rangers dropdown if used somewhere else */
  fillSelect("rangerSelect", rangers, "ranger_id", "full_name");

  /*
    Ranger page user_id dropdown:
    only users with role = ranger.
    It shows: ID - username
    It saves: real user_id
  */
  fillSelect("rangerUserSelect", rangerUsers, "user_id", "username", true);
}

function fillSelect(id, data, valueKey, textKey, showId = false) {
  document.querySelectorAll(`#${id}`).forEach(select => {
    const firstOption = select.querySelector("option")?.outerHTML || `<option value="">Select</option>`;

    select.innerHTML = firstOption + data.map(item => {
      const value = item[valueKey];

      const text = showId
        ? `${item[valueKey]} - ${item[textKey]}`
        : item[textKey];

      return `<option value="${value}">${text}</option>`;
    }).join("");
  });
}

/* ============================================================
   PAGE STATISTICS
   ============================================================ */

function updateCardNumbers(values) {
  const cards = document.querySelectorAll(".cards .stat-card h3");

  values.forEach((value, index) => {
    if (cards[index]) {
      cards[index].textContent = value;
    }
  });
}

function uniqueCount(data, field) {
  return new Set(
    data
      .map(row => row[field])
      .filter(value => value !== null && value !== undefined && value !== "")
  ).size;
}

function countWhere(data, field, expectedValue) {
  return data.filter(row => {
    return String(row[field] || "").trim().toLowerCase() === String(expectedValue).toLowerCase();
  }).length;
}

async function updatePageStatistics() {
  const page = currentPage();

  if (page === "login") return;

  const animals = await dbSelect("animals");
  const health = await dbSelect("health_records");
  const sightings = await dbSelect("sightings");
  const threats = await dbSelect("threats");
  const zones = await dbSelect("zones");
  const rangers = await dbSelect("rangers");
  const users = await dbSelect("users");

  if (page === "dashboard") {
    setText("statAnimals", animals.length);
    setText("statHealth", health.length);
    setText("statSightings", sightings.length);
    setText("statThreats", threats.length);
    setText("statZones", zones.length);
    setText("statRangers", rangers.length);
    setText("statUsers", users.length);
  }

  if (page === "animals") {
    updateCardNumbers([
      animals.length,
      countWhere(animals, "gender", "male"),
      countWhere(animals, "gender", "female"),
      countWhere(animals, "status", "alive"),
      countWhere(animals, "status", "dead"),
      uniqueCount(animals, "zone_id")
    ]);
  }

  if (page === "health_records") {
    updateCardNumbers([
      health.length,
      countWhere(health, "health_status", "healthy"),
      countWhere(health, "health_status", "injured"),
      countWhere(health, "health_status", "recovering"),
      countWhere(health, "health_status", "sick")
    ]);
  }

  if (page === "sightings") {
    updateCardNumbers([
      sightings.length,
      uniqueCount(sightings, "animal_id"),
      uniqueCount(sightings, "zone_id"),
      uniqueCount(sightings, "user_id")
    ]);
  }

  if (page === "threats") {
    const resolvedThreats = threats.filter(t => {
      return t.resolved === true || String(t.resolved).toLowerCase() === "true";
    }).length;

    updateCardNumbers([
      threats.length,
      countWhere(threats, "severity", "high"),
      countWhere(threats, "severity", "medium"),
      resolvedThreats,
      uniqueCount(threats, "zone_id")
    ]);
  }

  if (page === "zones") {
    updateCardNumbers([
      zones.length,
      countWhere(zones, "habitat_type", "forest"),
      countWhere(zones, "habitat_type", "wetland"),
      countWhere(zones, "habitat_type", "grassland"),
      countWhere(zones, "habitat_type", "desert"),
      uniqueCount(zones, "country")
    ]);
  }

  if (page === "rangers") {
    let earliestDate = "-";

    if (rangers.length > 0) {
      const dates = rangers
        .map(r => r.hire_date)
        .filter(date => date)
        .sort();

      earliestDate = dates.length > 0 ? dates[0] : "-";
    }

    updateCardNumbers([
      rangers.length,
      uniqueCount(rangers, "zone_id"),
      uniqueCount(rangers, "user_id"),
      earliestDate
    ]);
  }

  if (page === "users") {
    const roleCards = document.querySelectorAll(".cards .card");

    const adminCount = countWhere(users, "role", "admin");
    const rangerCount = countWhere(users, "role", "ranger");
    const researcherCount = countWhere(users, "role", "researcher");
    const viewerCount = countWhere(users, "role", "viewer");

    const values = [adminCount, rangerCount, researcherCount, viewerCount];

    roleCards.forEach((card, index) => {
      const h2 = card.querySelector("h2");
      if (h2 && values[index] !== undefined) {
        h2.textContent = values[index];
      }
    });
  }
}

/* ============================================================
   DASHBOARD
   ============================================================ */

let dashboardRefreshTimer = null;

function renderRecentActivity(activities) {
  const container = document.getElementById("recentActivityList");
  if (!container) return;

  if (!activities.length) {
    container.innerHTML = `<div class="dashboard-empty">No recent activity found.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="dashboard-list">
      ${activities.map(item => `
        <div class="dashboard-list-item">
          <div class="dashboard-list-left">
            <div class="dashboard-list-icon">${item.icon}</div>
            <div>
              <div class="dashboard-list-title">${item.title}</div>
              <div class="dashboard-list-subtitle">${item.subtitle}</div>
            </div>
          </div>
          <div class="dashboard-list-date">${formatDisplayDate(item.date)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSightingsOverTime(sightings) {
  const container = document.getElementById("sightingsOverTimeContainer");
  if (!container) return;

  if (!sightings.length) {
    container.innerHTML = `<div class="dashboard-empty">No sighting data available.</div>`;
    return;
  }

  const grouped = {};

  sightings.forEach(item => {
    const dateKey = item.sighting_date || "Unknown";
    grouped[dateKey] = (grouped[dateKey] || 0) + 1;
  });

  const items = Object.entries(grouped)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-7);

  const maxValue = Math.max(...items.map(item => item[1]), 1);

  container.innerHTML = `
    <div class="metric-list">
      ${items.map(([date, count]) => `
        <div class="metric-row">
          <div class="metric-label">${formatShortDate(date)}</div>
          <div class="metric-track">
            <div class="metric-fill green" style="width: ${(count / maxValue) * 100}%"></div>
          </div>
          <div class="metric-value">${count}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderThreatsBySeverity(threats) {
  const container = document.getElementById("threatsSeverityContainer");
  if (!container) return;

  const high = countWhere(threats, "severity", "high");
  const medium = countWhere(threats, "severity", "medium");
  const low = countWhere(threats, "severity", "low");
  const resolved = threats.filter(t => t.resolved === true || String(t.resolved).toLowerCase() === "true").length;
  const total = threats.length;
  const maxValue = Math.max(high, medium, low, resolved, 1);

  container.innerHTML = `
    <div class="severity-summary">
      <div class="severity-mini-card">
        <h4>Total Threats</h4>
        <p>${total}</p>
      </div>
      <div class="severity-mini-card">
        <h4>Resolved</h4>
        <p>${resolved}</p>
      </div>
    </div>

    <div class="metric-list">
      <div class="metric-row">
        <div class="metric-label">High</div>
        <div class="metric-track">
          <div class="metric-fill red" style="width: ${(high / maxValue) * 100}%"></div>
        </div>
        <div class="metric-value">${high}</div>
      </div>

      <div class="metric-row">
        <div class="metric-label">Medium</div>
        <div class="metric-track">
          <div class="metric-fill orange" style="width: ${(medium / maxValue) * 100}%"></div>
        </div>
        <div class="metric-value">${medium}</div>
      </div>

      <div class="metric-row">
        <div class="metric-label">Low</div>
        <div class="metric-track">
          <div class="metric-fill blue" style="width: ${(low / maxValue) * 100}%"></div>
        </div>
        <div class="metric-value">${low}</div>
      </div>

      <div class="metric-row">
        <div class="metric-label">Resolved</div>
        <div class="metric-track">
          <div class="metric-fill gray" style="width: ${(resolved / maxValue) * 100}%"></div>
        </div>
        <div class="metric-value">${resolved}</div>
      </div>
    </div>
  `;
}

function startDashboardAutoRefresh() {
  if (dashboardRefreshTimer) {
    clearInterval(dashboardRefreshTimer);
    dashboardRefreshTimer = null;
  }

  if (currentPage() === "dashboard") {
    dashboardRefreshTimer = setInterval(async () => {
      await updatePageStatistics();
      await loadDashboard();
    }, 10000);
  }
}

async function loadDashboard() {
  const animals = await dbSelect("animals");
  const zones = await dbSelect("zones");
  const health = await dbSelect("health_records");
  const threats = await dbSelect("threats");
  const users = await dbSelect("users");
  const sightings = await dbSelect("sightings");
  const rangers = await dbSelect("rangers");

  const animalMap = buildMap(animals, "animal_id");
  const zoneMap = buildMap(zones, "zone_id");
  const userMap = buildMap(users, "user_id");

  setText("statAnimals", animals.length);
  setText("statHealth", health.length);
  setText("statSightings", sightings.length);
  setText("statThreats", threats.length);
  setText("statZones", zones.length);
  setText("statRangers", rangers.length);
  setText("statUsers", users.length);

  const activities = [];

  sightings.forEach(item => {
    const animal = animalMap[item.animal_id];
    const zone = zoneMap[item.zone_id];
    const user = userMap[item.user_id];

    activities.push({
      date: item.sighting_date,
      icon: "👀",
      title: `${animal ? animal.name : "Animal"} was seen`,
      subtitle: `${zone ? zone.zone_name : "Unknown Zone"} • by ${user ? user.username : "Unknown User"}`
    });
  });

  health.forEach(item => {
    const animal = animalMap[item.animal_id];

    activities.push({
      date: item.check_date,
      icon: "💚",
      title: "Health check recorded",
      subtitle: `${animal ? animal.name : "Animal"} • ${item.health_status || "unknown"}`
    });
  });

  threats.forEach(item => {
    const zone = zoneMap[item.zone_id];

    activities.push({
      date: item.report_date,
      icon: "⚠️",
      title: "Threat reported",
      subtitle: `${item.threat_type || "Threat"} • ${zone ? zone.zone_name : "Unknown Zone"}`
    });
  });

  const allActivities = [
    ...getLoggedActivities(),
    ...activities
  ];

  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderRecentActivity(allActivities.slice(0, 5));

  renderSightingsOverTime(sightings);
  renderThreatsBySeverity(threats);

  const zoneOverview = document.getElementById("zoneOverview");
  if (zoneOverview) {
    zoneOverview.innerHTML = zones.map(z => `
      <tr>
        <td>${z.zone_name}</td>
        <td>${z.area_km2}</td>
        <td>${z.habitat_type}</td>
      </tr>
    `).join("");
  }

  const topAnimals = document.getElementById("topAnimals");
  if (topAnimals) {
    const recentlyAddedAnimals = [...animals]
      .sort((a, b) => Number(b.animal_id) - Number(a.animal_id))
      .slice(0, 5);

    topAnimals.innerHTML = recentlyAddedAnimals.map(a => `
      <tr>
        <td>${a.name}</td>
        <td>${a.species}</td>
        <td>${badge(a.status)}</td>
        <td>${a.birth_year}</td>
      </tr>
    `).join("");
  }

  const recentThreats = document.getElementById("recentThreats");
  if (recentThreats) {
    const sortedThreats = [...threats].sort((a, b) => new Date(b.report_date) - new Date(a.report_date));

    recentThreats.innerHTML = sortedThreats.slice(0, 5).map(t => `
      <tr>
        <td>${t.threat_type}</td>
        <td>${zoneMap[t.zone_id] ? zoneMap[t.zone_id].zone_name : t.zone_id}</td>
        <td>${badge(t.severity)}</td>
        <td>${t.report_date}</td>
        <td>${t.resolved ? "✅" : "✕"}</td>
      </tr>
    `).join("");
  }
}

/* ============================================================
   REPORTS PAGE
   ============================================================ */

function setReportHeader(title, subtitle, description) {
  const titleEl = document.getElementById("reportTitle");
  const subtitleEl = document.getElementById("reportSubtitle");
  const descriptionEl = document.getElementById("reportDescription");

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (descriptionEl) descriptionEl.textContent = description;
}

function renderReportTable(headers, rows) {
  const thead = document.getElementById("reportsTableHead");
  const tbody = document.getElementById("reportsTableBody");

  if (!thead || !tbody) return;

  thead.innerHTML = `
    <tr>
      ${headers.map(header => `<th>${header}</th>`).join("")}
    </tr>
  `;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${headers.length}">No records found for this report.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows.map(row => `
    <tr>
      ${row.map(value => `<td>${value === null || value === undefined ? "-" : value}</td>`).join("")}
    </tr>
  `).join("");
}

async function loadReportsStats() {
  if (currentPage() !== "reports") return;

  const animals = await dbSelect("animals");
  const sightings = await dbSelect("sightings");
  const threats = await dbSelect("threats");
  const zones = await dbSelect("zones");

  setText("reportAnimalsCount", animals.length);
  setText("reportSightingsCount", sightings.length);
  setText("reportThreatsCount", threats.length);
  setText("reportZonesCount", zones.length);
}

async function runReport(reportName) {
  if (!supabaseClient) {
    alert("Supabase is not connected.");
    return;
  }

  const animals = await dbSelect("animals");
  const zones = await dbSelect("zones");
  const health = await dbSelect("health_records");
  const sightings = await dbSelect("sightings");
  const threats = await dbSelect("threats");
  const users = await dbSelect("users");

  const zoneMap = buildMap(zones, "zone_id");
  const animalMap = buildMap(animals, "animal_id");
  const userMap = buildMap(users, "user_id");

  if (reportName === "animalsPerZone") {
    setReportHeader(
      "Animals per Zone",
      "Shows the number of animals registered in each conservation zone.",
      "This report helps management identify which zones have the highest animal population."
    );

    const rows = zones.map(zone => {
      const count = animals.filter(a => Number(a.zone_id) === Number(zone.zone_id)).length;

      return [
        zone.zone_name,
        zone.habitat_type,
        zone.country,
        count
      ];
    }).sort((a, b) => b[3] - a[3]);

    renderReportTable(
      ["Zone Name", "Habitat Type", "Country", "Animal Count"],
      rows
    );
  }

  if (reportName === "avgWeightSpecies") {
    setReportHeader(
      "Average Weight per Species",
      "Shows average, minimum, maximum weight and total health checks per species.",
      "This report uses health record data to help management monitor animal health trends."
    );

    const speciesMap = {};

    health.forEach(record => {
      const animal = animalMap[record.animal_id];
      if (!animal) return;

      const species = animal.species || "Unknown";
      const weight = toNumber(record.weight_kg);

      if (!speciesMap[species]) {
        speciesMap[species] = [];
      }

      if (weight > 0) {
        speciesMap[species].push(weight);
      }
    });

    const rows = Object.entries(speciesMap).map(([species, weights]) => {
      const total = weights.reduce((sum, w) => sum + w, 0);
      const avg = weights.length ? (total / weights.length).toFixed(2) : "0.00";
      const min = weights.length ? Math.min(...weights).toFixed(2) : "0.00";
      const max = weights.length ? Math.max(...weights).toFixed(2) : "0.00";

      return [
        species,
        avg,
        min,
        max,
        weights.length
      ];
    }).sort((a, b) => Number(b[1]) - Number(a[1]));

    renderReportTable(
      ["Species", "Average Weight (kg)", "Minimum Weight", "Maximum Weight", "Total Checks"],
      rows
    );
  }

  if (reportName === "unresolvedThreats") {
    setReportHeader(
      "Unresolved Threats",
      "Shows all high and medium threats that are not resolved.",
      "This report helps management identify urgent active dangers in conservation zones."
    );

    const rows = threats
      .filter(t => {
        const severity = String(t.severity || "").toLowerCase();
        const resolved = t.resolved === true || String(t.resolved).toLowerCase() === "true";

        return ["high", "medium"].includes(severity) && !resolved;
      })
      .sort((a, b) => new Date(b.report_date) - new Date(a.report_date))
      .map(t => {
        const zone = zoneMap[t.zone_id];
        const user = userMap[t.reported_by];

        return [
          zone ? zone.zone_name : t.zone_id,
          zone ? zone.country : "-",
          t.threat_type,
          badge(t.severity),
          t.report_date,
          user ? user.username : t.reported_by
        ];
      });

    renderReportTable(
      ["Zone", "Country", "Threat Type", "Severity", "Report Date", "Reported By"],
      rows
    );
  }

  if (reportName === "sightingsByZone") {
    setReportHeader(
      "Sightings by Zone",
      "Shows animal sightings grouped by conservation zone.",
      "This report helps management understand which zones have more animal activity."
    );

    const rows = zones.map(zone => {
      const zoneSightings = sightings.filter(s => Number(s.zone_id) === Number(zone.zone_id));
      const uniqueAnimals = new Set(zoneSightings.map(s => s.animal_id)).size;
      const uniqueUsers = new Set(zoneSightings.map(s => s.user_id)).size;

      return [
        zone.zone_name,
        zone.habitat_type,
        zone.country,
        zoneSightings.length,
        uniqueAnimals,
        uniqueUsers
      ];
    }).sort((a, b) => b[3] - a[3]);

    renderReportTable(
      ["Zone Name", "Habitat", "Country", "Total Sightings", "Unique Animals", "Reporting Users"],
      rows
    );
  }

  if (reportName === "animalsNotSeen") {
    setReportHeader(
      "Animals Not Seen in the Last 30 Days",
      "Shows alive animals that have no sighting record in the last 30 days.",
      "This report is a conservation alert. These animals may need field monitoring."
    );

    const recentAnimalIds = new Set(
      sightings
        .filter(s => daysAgo(s.sighting_date) <= 30)
        .map(s => Number(s.animal_id))
    );

    const rows = animals
      .filter(a => {
        const status = String(a.status || "").toLowerCase();
        return status === "alive" && !recentAnimalIds.has(Number(a.animal_id));
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .map(a => {
        const zone = zoneMap[a.zone_id];

        return [
          a.animal_id,
          a.name,
          a.species,
          badge(a.status),
          zone ? zone.zone_name : a.zone_id
        ];
      });

    renderReportTable(
      ["Animal ID", "Name", "Species", "Status", "Zone"],
      rows
    );
  }

  if (reportName === "sightingsByRanger") {
    setReportHeader(
      "Sightings by User",
      "Shows how many sightings were reported by each system user.",
      "This report helps management review user reporting activity."
    );

    const rows = users.map(user => {
      const userSightings = sightings.filter(s => Number(s.user_id) === Number(user.user_id));

      return [
        user.username,
        user.role,
        user.email,
        userSightings.length
      ];
    }).sort((a, b) => b[3] - a[3]);

    renderReportTable(
      ["Username", "Role", "Email", "Total Sightings"],
      rows
    );
  }

  if (reportName === "totalSightingsAnimal") {
    setReportHeader(
      "Total Sightings per Animal",
      "Shows which animals are seen most often.",
      "This report helps management understand visibility and monitoring frequency for each animal."
    );

    const rows = animals.map(animal => {
      const animalSightings = sightings.filter(s => Number(s.animal_id) === Number(animal.animal_id));
      const zone = zoneMap[animal.zone_id];

      return [
        animal.name,
        animal.species,
        zone ? zone.zone_name : animal.zone_id,
        animalSightings.length
      ];
    }).sort((a, b) => b[3] - a[3]);

    renderReportTable(
      ["Animal Name", "Species", "Zone", "Total Sightings"],
      rows
    );
  }
}

window.runReport = runReport;

/* ============================================================
   PL/pgSQL FUNCTION BUTTONS
   ============================================================ */

async function callGetSightingsByUser() {
  const userId = Number(document.getElementById("procUserId").value);

  if (!userId) {
    alert("Please enter a valid user_id.");
    return;
  }

  const users = await dbSelect("users");
  const sightings = await dbSelect("sightings");

  const user = users.find(u => Number(u.user_id) === Number(userId));

  if (!user) {
    setReportHeader(
      "Procedure Result: Search Sightings by User ID",
      "No user found.",
      
    );

    renderReportTable(
      ["Message"],
      [[`No user found with ID = ${userId}`]]
    );

    return;
  }

  const totalSightings = sightings.filter(s => {
    return Number(s.user_id) === Number(userId);
  }).length;

  setReportHeader(
    "Procedure Result: Search Sightings by User ID",
   
    "The procedure searches for a user by ID, then counts how many sightings were reported by that user."
  );

  renderReportTable(
    ["User ID", "Username", "Total Sightings Reported"],
    [
      [
        user.user_id,
        user.username,
        totalSightings
      ]
    ]
  );
}

async function callSearchByZone() {
  const zoneNameInput = document.getElementById("procZoneName").value.trim();

  if (!zoneNameInput) {
    alert("Please enter a zone name.");
    return;
  }

  const zones = await dbSelect("zones");
  const animals = await dbSelect("animals");

  const matchingZones = zones.filter(zone => {
    return String(zone.zone_name || "")
      .toLowerCase()
      .includes(zoneNameInput.toLowerCase());
  });

  if (matchingZones.length === 0) {
    setReportHeader(
      "Procedure Result: Search Animals by Zone",
      "No zone found.",
      
    );

    renderReportTable(
      ["Message"],
      [[`No zone found matching: ${zoneNameInput}`]]
    );

    return;
  }

  const rows = matchingZones.map(zone => {
    const animalCount = animals.filter(animal => {
      return Number(animal.zone_id) === Number(zone.zone_id);
    }).length;

    return [
      zone.zone_id,
      zone.zone_name,
      zone.habitat_type,
      zone.country,
      animalCount
    ];
  });

  setReportHeader(
    "Procedure Result: Search Animals by Zone",
   
    "The procedure searches for a zone by name and counts how many animals live in that zone."
  );

  renderReportTable(
    ["Zone ID", "Zone Name", "Habitat Type", "Country", "Animals Living Here"],
    rows
  );
}

async function callCountAnimalSightings() {
  const animalId = Number(document.getElementById("procAnimalId").value);

  if (!animalId) {
    alert("Please enter a valid animal_id.");
    return;
  }

  const { data, error } = await supabaseClient.rpc("count_animal_sightings", {
    p_animal_id: animalId
  });

  if (error) {
    alert("Function error: " + error.message);
    console.error(error);
    return;
  }

  setReportHeader(
    "Function Result: Count Animal Sightings",
    "This result comes from the database function count_animal_sightings().",
    "The function receives an animal ID and returns the total number of sightings for that animal."
  );

  renderReportTable(
    ["Animal ID", "Total Sightings"],
    [
      [animalId, data]
    ]
  );
}

window.callGetSightingsByUser = callGetSightingsByUser;
window.callSearchByZone = callSearchByZone;
window.callCountAnimalSightings = callCountAnimalSightings;

/* ============================================================
   EXPORT
   ============================================================ */

function exportTable(tableId, filename) {
  const table = document.getElementById(tableId);

  if (!table) {
    alert("Table not found.");
    return;
  }

  let csv = "";

  table.querySelectorAll("tr").forEach(row => {
    const cells = [...row.querySelectorAll("th,td")]
      .map(cell => `"${cell.innerText.replace(/"/g, "'")}"`);

    csv += cells.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

window.exportTable = exportTable;

/* ============================================================
   LOAD CURRENT PAGE
   ============================================================ */

async function loadPage() {
  const page = currentPage();

  if (page === "login") return;

  updateLoggedUserUI();
  applyRoleAccessUI();

  await loadDropdowns();

  if (page === "dashboard") {
    await updatePageStatistics();
    await loadDashboard();
    startDashboardAutoRefresh();
  } else {
    if (dashboardRefreshTimer) {
      clearInterval(dashboardRefreshTimer);
      dashboardRefreshTimer = null;
    }

    await updatePageStatistics();
  }

  if (page === "animals") {
    await setupCrudPage(
      "animals",
      ["animal_id", "name", "species", "gender", "birth_year", "status", "zone_id"],
      "animalForm",
      "animalsBody"
    );

    setupSearch("animalSearch", "animalsTable");
  }

  if (page === "health_records") {
    await setupCrudPage(
      "health_records",
      ["record_id", "animal_id", "check_date", "health_status", "weight_kg", "notes"],
      "healthForm",
      "healthBody"
    );

    setupSearch("healthSearch", "healthTable");
  }

  if (page === "sightings") {
    await setupCrudPage(
      "sightings",
      ["sighting_id", "animal_id", "zone_id", "user_id", "sighting_date", "notes"],
      "sightingForm",
      "sightingsBody"
    );

    setupSearch("sightingSearch", "sightingsTable");
  }

  if (page === "threats") {
    await setupCrudPage(
      "threats",
      ["threat_id", "zone_id", "reported_by", "threat_type", "severity", "report_date", "resolved"],
      "threatForm",
      "threatsBody"
    );

    setupSearch("threatSearch", "threatsTable");
  }

  if (page === "zones") {
    await setupCrudPage(
      "zones",
      ["zone_id", "zone_name", "area_km2", "habitat_type", "country"],
      "zoneForm",
      "zonesBody"
    );

    setupSearch("zoneSearch", "zonesTable");
  }

  if (page === "rangers") {
    await setupCrudPage(
      "rangers",
      ["ranger_id", "user_id", "zone_id", "full_name", "phone", "hire_date"],
      "rangerForm",
      "rangersBody"
    );

    setupSearch("rangerSearch", "rangersTable");
  }

  if (page === "users") {
    await setupCrudPage(
      "users",
      ["user_id", "username", "email", "role", "created_at"],
      "userForm",
      "usersBody"
    );

    setupSearch("userSearch", "usersTable");
  }

  if (page === "reports") {
    await loadReportsStats();
  }
}
/* ============================================================
   CURRENT DATE
   Shows today's real date in the topbar
   ============================================================ */

function updateCurrentDate() {
  const dateElements = document.querySelectorAll("#currentDate");

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  dateElements.forEach(el => {
    el.textContent = `📅 ${formattedDate}`;
  });
}
/* ============================================================
   START
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  protectPages();
  setupLogin();
  loadPage();
  updateCurrentDate();
});