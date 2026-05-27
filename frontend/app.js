let backendReady = false;

const valueChainQuestions = [
  "La empresa tiene una política sistematizada de cero defectos en la producción de productos/servicios.",
  "La empresa emplea los medios productivos tecnológicamente más avanzados de su sector.",
  "La empresa dispone de un sistema de información y control de gestión eficiente y eficaz.",
  "Los medios técnicos y tecnológicos están preparados para competir a corto, medio y largo plazo.",
  "La empresa es un referente en su sector en I+D+i.",
  "La excelencia de los procedimientos de la empresa es una principal fuente de ventaja competitiva.",
  "La empresa dispone de página web y la usa para relacionarse con clientes y proveedores.",
  "Los productos/servicios incorporan tecnología difícil de imitar.",
  "La empresa optimiza su cadena de producción como ventaja competitiva en costes.",
  "La informatización de la empresa es una fuente clara de ventaja competitiva.",
  "Los canales de distribución son una fuente de ventajas competitivas.",
  "Los productos/servicios son diferencialmente valorados por el cliente.",
  "La empresa dispone y ejecuta un plan sistemático de marketing y ventas.",
  "La empresa tiene optimizada su gestión financiera.",
  "La empresa mejora continuamente la relación con clientes desde un plan previo.",
  "La empresa es referente en el lanzamiento de productos y servicios innovadores.",
  "Los recursos humanos son considerados el principal activo estratégico.",
  "La plantilla está motivada y conoce metas, objetivos y estrategias.",
  "La empresa trabaja conforme a una estrategia y objetivos claros.",
  "La gestión del circulante está optimizada.",
  "Está definido el posicionamiento estratégico de todos los productos.",
  "Existe una política de marca basada en reputación y relación con clientes.",
  "La cartera de clientes está altamente fidelizada.",
  "El equipo de ventas y marketing es una ventaja competitiva.",
  "El servicio al cliente es una ventaja competitiva frente a competidores.",
];

const scale = [
  "Totalmente en desacuerdo",
  "No está de acuerdo",
  "Está de acuerdo",
  "Bastante de acuerdo",
  "Totalmente de acuerdo",
];

const modules = [
  { id: "info", short: "Empresa", title: "Información de empresa", owner: "Administración", help: "Registre datos generales de la organización." },
  { id: "mission", short: "Misión", title: "Misión", owner: "Gerencia", help: "Defina la razón de ser de la empresa." },
  { id: "vision", short: "Visión", title: "Visión", owner: "Gerencia", help: "Defina el estado futuro deseado." },
  { id: "values", short: "Valores", title: "Valores", owner: "Gerencia", help: "Registre principios culturales y de comportamiento." },
  { id: "objectives", short: "Objetivos", title: "Objetivos estratégicos y UEN", owner: "Gerencia", help: "Defina UEN, objetivos estratégicos, específicos e indicadores." },
  { id: "swot", short: "FODA", title: "Análisis interno y externo FODA", owner: "TI", help: "Registre fortalezas, oportunidades, debilidades y amenazas." },
  { id: "valueChain", short: "Cadena", title: "Cadena de valor y autodiagnóstico", owner: "TI", help: "Evalúe las 25 afirmaciones del Excel y obtenga potencial de mejora." },
  { id: "bcg", short: "BCG", title: "Matriz de Crecimiento - Participación BCG", owner: "TI", help: "Clasifique productos por crecimiento y participación relativa." },
  { id: "porter", short: "Porter", title: "5 Fuerzas de Porter", owner: "Planeamiento", help: "Evalúe el perfil competitivo del microentorno." },
  { id: "pest", short: "PEST", title: "Análisis PEST", owner: "Planeamiento", help: "Evalúe factores políticos, económicos, sociales y tecnológicos." },
  { id: "strategy", short: "Estrategia", title: "Identificación de estrategias", owner: "Gerencia", help: "Cruce factores FODA para identificar la estrategia dominante." },
  { id: "came", short: "CAME", title: "Matriz CAME", owner: "Gerencia", help: "Defina acciones para corregir, afrontar, mantener y explotar." },
  { id: "executive", short: "Resumen", title: "Resumen ejecutivo", owner: "Gerencia", help: "Consolide el PETI en un reporte ejecutivo." },
];

const rolePermissions = {
  "Administrador Empresa": { admin: true, approve: true, edit: modules.map((m) => m.id) },
  Gerencia: { admin: false, approve: true, edit: ["mission", "vision", "values", "objectives", "strategy", "came", "executive"] },
  "Área TI": { admin: false, approve: false, edit: ["objectives", "swot", "valueChain", "bcg", "porter", "pest"] },
  Administración: { admin: false, approve: false, edit: ["info", "objectives", "executive"] },
  Planeamiento: { admin: false, approve: false, edit: ["porter", "pest"] },
  Consultor: { admin: false, approve: false, edit: modules.filter((m) => m.id !== "info").map((m) => m.id) },
  Finanzas: { admin: false, approve: false, edit: [] },
  Lector: { admin: false, approve: false, edit: [] },
};

let db = { organizations: [], users: [] };
let session = null;
let autosaveTimer = null;

const $ = (selector) => document.querySelector(selector);

function now() {
  return new Date().toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

function uid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createPeti(companyName, sector = "", ruc = "") {
  return {
    activeModule: "info",
    approvals: {},
    assignedResponsibles: {},
    history: [],
    versions: [],
    notifications: [],
    data: {
      info: { name: companyName, ruc, sector, description: "", employees: "", manager: "", tiLead: "" },
      mission: { text: "" },
      vision: { text: "" },
      values: { items: [] },
      objectives: { uen: "", rows: [] },
      swot: { strengths: [], opportunities: [], weaknesses: [], threats: [] },
      valueChain: { answers: {}, reflections: { strengths: [], weaknesses: [], summary: "" } },
      bcg: { products: [] },
      porter: { items: createPorterItems() },
      pest: { factors: createPestFactors() },
      strategy: { matrices: createStrategyMatrices(), selected: "", reflection: "" },
      came: { actions: { correct: [], confront: [], maintain: [], exploit: [] } },
      executive: { promoters: "", conclusions: "" },
    },
  };
}

function createPorterItems() {
  return [
    ["Rivalidad", "Crecimiento del sector", "Lento", "Rápido"],
    ["Rivalidad", "Naturaleza de competidores", "Muchos", "Pocos"],
    ["Rivalidad", "Exceso de capacidad productiva", "Sí", "No"],
    ["Rivalidad", "Diferenciación del producto", "Escasa", "Elevada"],
    ["Entrada", "Economías de escala", "No", "Sí"],
    ["Entrada", "Necesidad de capital", "Baja", "Alta"],
    ["Entrada", "Acceso a tecnología", "Fácil", "Difícil"],
    ["Clientes", "Número de clientes", "Pocos", "Muchos"],
    ["Clientes", "Coste de cambio de proveedor", "Bajo", "Alto"],
    ["Sustitutos", "Disponibilidad de sustitutos", "Grande", "Pequeña"],
    ["Proveedores", "Concentración de proveedores", "Alta", "Baja"],
    ["Proveedores", "Diferenciación del insumo", "Alta", "Baja"],
  ].map(([group, text, hostile, favorable]) => ({ id: uid("pt"), group, text, hostile, favorable, score: null }));
}

function createPestFactors() {
  return ["Político", "Económico", "Social", "Tecnológico"].flatMap((type) =>
    [1, 2, 3].map((n) => ({ id: uid("pest"), type, factor: `${type} ${n}`, impact: 2, probability: 2, note: "" })),
  );
}

function createStrategyMatrices() {
  return {
    fo: emptyMatrix(),
    fa: emptyMatrix(),
    do: emptyMatrix(),
    da: emptyMatrix(),
  };
}

function emptyMatrix() {
  return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null));
}

function createSeedDb() {
  const org1 = {
    id: uid("org"),
    name: "Nova Retail S.A.C.",
    peti: createPeti("Nova Retail S.A.C.", "Comercio minorista omnicanal"),
  };
  org1.peti.data.info = {
    name: org1.name,
    ruc: "20600000001",
    sector: "Comercio minorista omnicanal",
    description: "Empresa peruana dedicada a la venta de productos de consumo masivo mediante tiendas físicas y comercio electrónico.",
    employees: 185,
    manager: "María Torres",
    tiLead: "Luis Ramos",
  };
  const org2 = {
    id: uid("org"),
    name: "Andes Foods Export",
    peti: createPeti("Andes Foods Export", "Agroexportación"),
  };
  return {
    organizations: [org1, org2],
    users: [
      { id: uid("usr"), organizationId: org1.id, name: "María Torres", email: "owner@nova.pe", password: "demo123", role: "Administrador Empresa", area: "Gerencia General", modulePermissions: {} },
      { id: uid("usr"), organizationId: org1.id, name: "Luis Ramos", email: "ti@nova.pe", password: "demo123", role: "Área TI", area: "TI", modulePermissions: {} },
      { id: uid("usr"), organizationId: org2.id, name: "Claudia Ríos", email: "owner@andes.pe", password: "demo123", role: "Administrador Empresa", area: "Gerencia General", modulePermissions: {} },
    ],
  };
}

function applySession(payload) {
  db = {
    organizations: [{ ...payload.organization, peti: payload.peti }],
    users: payload.users,
  };
  session = { userId: payload.user.id };
}

async function persist() {
  if (!session) return;
  try {
    await Api.savePeti(peti());
  } catch (error) {
    toast(error.message);
  }
}

function currentUser() {
  return db.users.find((user) => user.id === session?.userId);
}

function currentOrg() {
  return db.organizations.find((org) => org.id === currentUser()?.organizationId);
}

function orgUsers() {
  return db.users.filter((user) => user.organizationId === currentOrg().id);
}

function peti() {
  return currentOrg().peti;
}

function canAdmin() {
  return Boolean(rolePermissions[currentUser()?.role]?.admin);
}

function canApprove() {
  const moduleId = peti()?.activeModule;
  return Boolean(canAdmin() || (rolePermissions[currentUser()?.role]?.approve && userBelongsToModuleArea(currentUser(), moduleId)));
}

function normal(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function userBelongsToModuleArea(user, moduleId) {
  const area = modules.find((m) => m.id === moduleId)?.owner || "";
  const areaText = `${user.area || ""} ${user.role || ""}`;
  const target = normal(area);
  const source = normal(areaText);
  if (target === "ti") return source.includes("ti") || source.includes("tecnologia");
  return source.includes(target);
}

function canView(moduleId) {
  return Boolean(currentUser()) && !firstMissingBefore(moduleId);
}

function canEdit(moduleId) {
  const user = currentUser();
  if (!user || firstMissingBefore(moduleId)) return false;
  if (rolePermissions[user.role]?.admin) return true;
  if (user.modulePermissions?.[moduleId] === "view") return false;
  if (user.role === "Lector") return false;
  return userBelongsToModuleArea(user, moduleId);
}

function moduleIndex(moduleId) {
  return modules.findIndex((m) => m.id === moduleId);
}

function firstMissingBefore(moduleId) {
  const target = moduleIndex(moduleId);
  for (let index = 0; index < target; index += 1) {
    if (!isModuleComplete(modules[index].id).ok) return modules[index];
  }
  return null;
}

function progressCount() {
  return modules.filter((m) => isModuleComplete(m.id).ok).length;
}

function isModuleComplete(moduleId) {
  const d = peti().data[moduleId];
  const min = (arr, n) => arr.length >= n;
  if (moduleId === "info") return check(["name", "ruc", "sector", "description", "manager", "tiLead"].every((k) => String(d[k] || "").trim()), "Complete RUC, datos de empresa y responsables.");
  if (moduleId === "mission" || moduleId === "vision") return check(String(d.text || "").trim().length >= 30, "Debe tener al menos 30 caracteres.");
  if (moduleId === "values") return check(d.items.length >= 3, "Registre como mínimo 3 valores.");
  if (moduleId === "objectives") return check(d.rows.length >= 3 && d.rows.every((r) => r.strategic && r.specific && r.indicator), "Registre 3 objetivos con indicador.");
  if (moduleId === "swot") return check(min(d.strengths, 2) && min(d.opportunities, 2) && min(d.weaknesses, 2) && min(d.threats, 2), "Registre al menos 2 elementos por cuadrante FODA.");
  if (moduleId === "valueChain") return check(validateValueChain().ok, validateValueChain().message);
  if (moduleId === "bcg") return check(d.products.length >= 3 && d.products.every((p) => p.name && Number(p.sales) > 0 && Number(p.competitorSales) > 0), "Registre 3 productos con ventas y competidor.");
  if (moduleId === "porter") return check(d.items.every((i) => i.score !== null), "Responda todos los criterios Porter.");
  if (moduleId === "pest") return check(d.factors.every((f) => f.factor && f.note), "Complete factor y nota en todos los PEST.");
  if (moduleId === "strategy") return check(Boolean(strategyWinner()) && d.selected, "Complete matrices y seleccione estrategia.");
  if (moduleId === "came") return check(Object.values(d.actions).every((list) => list.length >= 2), "Registre al menos 2 acciones por bloque CAME.");
  if (moduleId === "executive") return check(d.promoters && d.conclusions, "Complete promotores y conclusiones.");
  return check(false, "Módulo no reconocido.");
}

function check(ok, message) {
  return { ok, message };
}

function validateValueChain() {
  const answers = peti().data.valueChain.answers;
  for (let i = 0; i < valueChainQuestions.length; i += 1) {
    if (answers[i] === undefined || answers[i] === null || answers[i] === "") {
      return { ok: false, message: `Debe seleccionar una valoración para la afirmación ${i + 1}.` };
    }
    const value = Number(answers[i]);
    if (!Number.isInteger(value) || value < 0 || value > 4) {
      return { ok: false, message: `La afirmación ${i + 1} tiene una valoración inválida.` };
    }
  }
  return { ok: true, message: "Autodiagnóstico completo." };
}

function valueChainStats() {
  const values = Object.values(peti().data.valueChain.answers).map(Number);
  const answered = values.length;
  const max = valueChainQuestions.length * 4;
  const score = values.reduce((sum, v) => sum + v, 0);
  const strength = max ? Math.round((score / max) * 100) : 0;
  const improvement = 100 - strength;
  const interpretation = strength >= 80 ? "Ventaja sólida" : strength >= 60 ? "Potencial competitivo medio" : strength >= 40 ? "Requiere mejora prioritaria" : "Riesgo interno alto";
  return { answered, score, strength, improvement, interpretation };
}

async function login(event) {
  event.preventDefault();
  const email = $("#emailInput").value.trim().toLowerCase();
  const password = $("#passwordInput").value;
  try {
    const payload = await Api.login(email, password);
    Api.setToken(payload.token);
    applySession(payload);
    $("#loginView").classList.add("hidden");
    $("#appView").classList.remove("hidden");
    peti().activeModule = peti().activeModule || "info";
    renderAll();
  } catch (error) {
    toast(error.message);
  }
}

async function registerCompany(event) {
  event.preventDefault();
  const email = $("#regEmail").value.trim().toLowerCase();
  const password = $("#regPassword").value;
  const confirm = $("#regPasswordConfirm").value;
  if (password !== confirm) {
    toast("Las contraseñas no coinciden.");
    return;
  }
  try {
    const payload = await Api.register({
      companyName: $("#regCompany").value.trim(),
      ruc: $("#regRuc").value.trim(),
      email,
      adminName: $("#regName").value.trim(),
      password,
    });
    Api.setToken(payload.token);
    applySession(payload);
    $("#loginView").classList.add("hidden");
    $("#appView").classList.remove("hidden");
    toast("Empresa creada. Usted es el Administrador Empresa.");
    renderAll();
  } catch (error) {
    toast(error.message);
  }
}

function logout() {
  session = null;
  Api.clearToken();
  $("#appView").classList.add("hidden");
  $("#loginView").classList.remove("hidden");
}

function scheduleSave(moduleId, detail = "Actualización automática") {
  $("#autosaveStatus").textContent = "Guardando...";
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    logChange(moduleId, "Autoguardado", detail);
    persist();
    $("#autosaveStatus").textContent = `Guardado ${now()}`;
    renderAll();
  }, 450);
}

function logChange(moduleId, action, detail) {
  const user = currentUser();
  peti().history.unshift({ id: uid("hist"), moduleId, action, detail, user: user.name, role: user.role, area: user.area, at: now() });
  peti().versions.unshift({ id: uid("ver"), moduleId, version: peti().versions.length + 1, user: user.name, at: now(), snapshot: structuredClone(peti().data[moduleId]) });
  peti().history = peti().history.slice(0, 80);
  peti().versions = peti().versions.slice(0, 40);
}

function renderAll() {
  $("#tenantName").textContent = currentOrg().name;
  $("#userBadge").textContent = `${currentUser().name} | ${currentUser().role}`;
  $("#manageUsersBtn").classList.toggle("hidden", !canAdmin());
  renderNav();
  renderDashboard();
  renderModule(peti().activeModule);
}

function renderNav() {
  $("#moduleNav").innerHTML = modules.map((m, i) => {
    const missing = firstMissingBefore(m.id);
    const done = isModuleComplete(m.id).ok;
    return `
      <button class="nav-item ${peti().activeModule === m.id ? "active" : ""} ${missing ? "locked" : ""}" data-module="${m.id}" type="button">
        <span class="nav-index">${i + 1}</span><span>${m.short}</span><span class="nav-status">${missing ? "Bloq." : done ? "Listo" : "Pend."}</span>
      </button>`;
  }).join("");
  document.querySelectorAll(".nav-item").forEach((btn) => btn.addEventListener("click", () => navigate(btn.dataset.module)));
}

function navigate(moduleId) {
  const missing = firstMissingBefore(moduleId);
  if (missing) {
    openModal("Acceso bloqueado", `<p class="notice">No puede acceder a <strong>${label(moduleId)}</strong> hasta completar <strong>${missing.title}</strong>.</p><p>${isModuleComplete(missing.id).message}</p>`);
    return;
  }
  peti().activeModule = moduleId;
  persist();
  $(".sidebar").classList.remove("open");
  renderAll();
}

function renderDashboard() {
  const vc = valueChainStats();
  const p = peti();
  const percent = Math.round((progressCount() / modules.length) * 100);
  const risk = porterAverage() <= 2 ? "Hostil" : "Favorable";
  $("#dashboard").innerHTML = `
    <article class="card"><span>Avance PETI</span><strong>${percent}%</strong><div class="progress-bar"><span style="width:${percent}%"></span></div></article>
    <article class="card"><span>Módulos completos</span><strong>${progressCount()}/${modules.length}</strong></article>
    <article class="card"><span>Cadena de valor</span><strong>${vc.strength}%</strong><small>${vc.interpretation}</small></article>
    <article class="card"><span>Potencial mejora</span><strong>${vc.improvement}%</strong></article>
    <article class="card"><span>Microentorno</span><strong>${risk}</strong></article>
    <article class="card"><span>Última edición</span><strong>${p.history[0]?.at || "Sin historial"}</strong></article>
  `;
}

function renderModule(moduleId) {
  const module = modules.find((m) => m.id === moduleId);
  $("#moduleStep").textContent = `Paso ${moduleIndex(moduleId) + 1} de ${modules.length} | Responsable: ${module.owner}`;
  $("#moduleTitle").textContent = module.title;
  const readonly = !canEdit(moduleId);
  const views = {
    info: renderInfo,
    mission: () => renderTextModule("mission", "Misión de la empresa"),
    vision: () => renderTextModule("vision", "Visión de la empresa"),
    values: renderValues,
    objectives: renderObjectives,
    swot: renderSwot,
    valueChain: renderValueChain,
    bcg: renderBcg,
    porter: renderPorter,
    pest: renderPest,
    strategy: renderStrategy,
    came: renderCame,
    executive: renderExecutive,
  };
  $("#moduleContent").innerHTML = panelShell(moduleId, readonly, views[moduleId]());
  bindModule(moduleId, readonly);
}

function panelShell(moduleId, readonly, inner) {
  const status = isModuleComplete(moduleId);
  const responsible = assignedResponsible(moduleId);
  const assignButton = canAdmin()
    ? `<button class="secondary-btn" data-action="assign" type="button">Asignar responsable</button>`
    : "";
  return `
    <article class="panel">
      <header class="panel-header">
        <div>
          <span class="badge ${status.ok ? "done" : "warn"}">${status.ok ? "Completo" : "Pendiente"}</span>
          ${readonly ? `<span class="badge block">Solo lectura</span>` : ""}
          <p>${modules.find((m) => m.id === moduleId).help}</p>
          <p class="responsible-line"><strong>Responsable del módulo:</strong> ${responsible ? `${esc(responsible.name)} — ${esc(responsible.role)} — ${esc(responsible.area)}` : `Sin asignar (${modules.find((m) => m.id === moduleId).owner})`}</p>
          ${status.ok ? "" : `<p class="notice">${status.message}</p>`}
        </div>
        <div class="action-row">
          ${canApprove() ? `<button class="secondary-btn" data-action="approve" type="button">Aprobar versión</button>` : ""}
          ${assignButton}
          <button class="secondary-btn" data-action="history" type="button">Historial</button>
        </div>
      </header>
      ${inner}
    </article>`;
}

function assignedResponsible(moduleId) {
  const userId = peti().assignedResponsibles?.[moduleId];
  if (!userId) return null;
  return orgUsers().find((user) => user.id === userId) || null;
}

function renderInfo() {
  const d = peti().data.info;
  return `<div class="form-grid">${field("name", "Nombre de la empresa", d.name)}${field("ruc", "RUC", d.ruc)}${field("sector", "Sector", d.sector)}${field("employees", "Colaboradores", d.employees, "number")}${field("manager", "Responsable gerencial", d.manager)}${field("tiLead", "Responsable TI", d.tiLead)}${field("description", "Descripción", d.description, "textarea", "wide")}</div>`;
}

function renderTextModule(moduleId, title) {
  return `<div class="form-grid">${field("text", title, peti().data[moduleId].text, "textarea", "wide")}</div>`;
}

function renderValues() {
  return `<div class="action-row"><button class="primary-btn" data-action="add-value" type="button">Agregar valor</button></div>${table(["Valor", "Descripción", "Acciones"], peti().data.values.items.map((r) => [esc(r.name), esc(r.description), rowActions("value", r.id)]))}`;
}

function renderObjectives() {
  const d = peti().data.objectives;
  return `<div class="form-grid">${field("uen", "Unidades Estratégicas de Negocio", d.uen, "textarea", "wide")}</div><div class="action-row"><button class="primary-btn" data-action="add-objective" type="button">Agregar objetivo</button></div>${table(["Estratégico", "Específico", "Indicador", "Responsable", "Acciones"], d.rows.map((r) => [esc(r.strategic), esc(r.specific), esc(r.indicator), esc(r.owner), rowActions("objective", r.id)]))}`;
}

function renderSwot() {
  const groups = [["strengths", "Fortalezas"], ["opportunities", "Oportunidades"], ["weaknesses", "Debilidades"], ["threats", "Amenazas"]];
  return `<div class="form-grid">${groups.map(([key, title]) => `<section class="panel"><div class="panel-header"><h3>${title}</h3><button class="secondary-btn" data-action="add-swot" data-kind="${key}" type="button">Agregar</button></div><div class="notification-list">${peti().data.swot[key].map((i) => `<div class="notification-item">${esc(i.text)} ${rowActions("swot", i.id, key)}</div>`).join("") || `<p class="muted">Sin registros.</p>`}</div></section>`).join("")}</div>`;
}

function renderValueChain() {
  const stats = valueChainStats();
  return `
    <section class="panel">
      <div class="panel-header"><div><h3>Autodiagnóstico de la cadena de valor interna</h3><p>Escala: 0 = Totalmente en desacuerdo, 4 = Totalmente de acuerdo.</p></div><span class="badge ${stats.strength >= 60 ? "done" : "warn"}">${stats.strength}% potencial actual</span></div>
      <div class="progress-bar"><span style="width:${stats.strength}%"></span></div>
      <p class="muted">Potencial de mejora: ${stats.improvement}%. Interpretación: ${stats.interpretation}.</p>
      <div class="table-wrap"><table><thead><tr><th>Afirmación</th><th>Valoración</th></tr></thead><tbody>${valueChainQuestions.map((q, i) => `<tr><td>${i + 1}. ${esc(q)}</td><td>${scoreOptions(`vc-${i}`, peti().data.valueChain.answers[i], i)}</td></tr>`).join("")}</tbody></table></div>
    </section>
    <section class="panel">
      <h3>Reflexiones y análisis</h3>
      <div class="form-grid">${field("summary", "Reflexión general", peti().data.valueChain.reflections.summary, "textarea", "wide")}</div>
      <div class="action-row"><button class="secondary-btn" data-action="add-vc-strength" type="button">Agregar fortaleza detectada</button><button class="secondary-btn" data-action="add-vc-weakness" type="button">Agregar debilidad detectada</button></div>
      <div class="form-grid"><section>${table(["Fortalezas", "Acciones"], peti().data.valueChain.reflections.strengths.map((r) => [esc(r.text), rowActions("vc-strength", r.id)]))}</section><section>${table(["Debilidades", "Acciones"], peti().data.valueChain.reflections.weaknesses.map((r) => [esc(r.text), rowActions("vc-weakness", r.id)]))}</section></div>
    </section>`;
}

function renderBcg() {
  const rows = peti().data.bcg.products.map((p) => ({ ...p, share: relativeShare(p), quadrant: bcgQuadrant(p) }));
  return `<div class="bcg-layout"><section><div class="action-row"><button class="primary-btn" data-action="add-product" type="button">Agregar producto</button><button class="secondary-btn" data-action="seed-bcg" type="button">Simular datos</button></div>${table(["Producto", "Ventas", "Crec.", "Part. rel.", "Cuadrante", "Acciones"], rows.map((r) => [esc(r.name), money(r.sales), `${Number(r.growth || 0).toFixed(1)}%`, r.share.toFixed(2), `<span class="badge">${r.quadrant}</span>`, rowActions("product", r.id)]))}</section><section><div class="bcg-canvas-wrap"><canvas id="bcgCanvas" width="520" height="430"></canvas></div></section></div>`;
}

function renderPorter() {
  return `${table(["Grupo", "Criterio", "Hostil", "Valor", "Favorable"], peti().data.porter.items.map((i) => [i.group, i.text, i.hostile, scoreOptions(`porter-${i.id}`, i.score, i.id), i.favorable]))}<p class="notice">Promedio competitivo: ${porterAverage().toFixed(1)} / 4. ${porterAverage() >= 2.5 ? "Entorno favorable." : "Entorno hostil, requiere defensa estratégica."}</p>`;
}

function renderPest() {
  return `<div class="action-row"><button class="primary-btn" data-action="add-pest" type="button">Agregar factor PEST</button></div>${table(["Tipo", "Factor", "Impacto", "Probabilidad", "Nota", "Acciones"], peti().data.pest.factors.map((f) => [f.type, esc(f.factor), f.impact, f.probability, esc(f.note), rowActions("pest", f.id)]))}`;
}

function renderStrategy() {
  const scores = strategyScores();
  return `
    <div class="form-grid">${["fo", "fa", "do", "da"].map((key) => matrixBlock(key)).join("")}</div>
    ${table(["Relación", "Tipología", "Puntuación", "Descripción"], [
      ["FO", "Estrategia Ofensiva", scores.fo, "Adoptar estrategias de crecimiento."],
      ["FA", "Estrategia Defensiva", scores.fa, "Prepararse para enfrentar amenazas."],
      ["DA", "Estrategia de Supervivencia", scores.da, "Reducir exposición ante amenazas."],
      ["DO", "Estrategia de Reorientación", scores.do, "Prepararse para aprovechar oportunidades."],
    ])}
    <div class="form-grid">${field("selected", "Estrategia identificada", peti().data.strategy.selected || strategyWinner(), "text")}${field("reflection", "Reflexión estratégica", peti().data.strategy.reflection, "textarea", "wide")}</div>`;
}

function renderCame() {
  const labels = { correct: "Corregir debilidades", confront: "Afrontar amenazas", maintain: "Mantener fortalezas", exploit: "Explotar oportunidades" };
  return `<div class="form-grid">${Object.entries(labels).map(([key, title]) => `<section class="panel"><div class="panel-header"><h3>${title}</h3><button class="secondary-btn" data-action="add-came" data-kind="${key}" type="button">Agregar</button></div>${table(["Acción", "Responsable", "Plazo", "Acciones"], peti().data.came.actions[key].map((r) => [esc(r.text), esc(r.owner), esc(r.deadline), rowActions("came", r.id, key)]))}</section>`).join("")}</div>`;
}

function renderExecutive() {
  const d = peti().data;
  return `<div class="form-grid">${field("promoters", "Emprendedores / promotores", d.executive.promoters, "textarea", "wide")}${field("conclusions", "Conclusiones", d.executive.conclusions, "textarea", "wide")}</div><section class="panel"><h3>Resumen generado</h3><p><strong>Empresa:</strong> ${esc(currentOrg().name)}</p><p><strong>Misión:</strong> ${esc(d.mission.text || "Pendiente")}</p><p><strong>Visión:</strong> ${esc(d.vision.text || "Pendiente")}</p><p><strong>Estrategia:</strong> ${esc(d.strategy.selected || strategyWinner() || "Pendiente")}</p><p><strong>Acciones CAME:</strong> ${Object.values(d.came.actions).flat().length}</p></section>`;
}

function bindModule(moduleId, readonly) {
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.disabled = readonly;
    input.addEventListener("input", () => {
      updateField(moduleId, input.dataset.field, input.value);
      scheduleSave(moduleId, `Campo ${input.dataset.field}`);
    });
  });
  document.querySelectorAll("[data-score]").forEach((input) => {
    input.disabled = readonly;
    input.addEventListener("change", () => {
      updateScore(input.dataset.score, input.value);
      scheduleSave(moduleId, "Valoración");
    });
  });
  document.querySelectorAll("[data-action]").forEach((btn) => btn.addEventListener("click", () => handleAction(btn.dataset.action, btn.dataset, readonly, moduleId)));
  if (moduleId === "bcg") drawBcg();
}

function updateField(moduleId, key, value) {
  if (moduleId === "valueChain" && key === "summary") peti().data.valueChain.reflections.summary = value;
  else peti().data[moduleId][key] = value;
}

function updateScore(key, value) {
  if (key.startsWith("vc-")) peti().data.valueChain.answers[key.replace("vc-", "")] = Number(value);
  if (key.startsWith("porter-")) peti().data.porter.items.find((i) => i.id === key.replace("porter-", "")).score = Number(value);
  if (key.startsWith("matrix-")) {
    const [, matrix, r, c] = key.split("-");
    peti().data.strategy.matrices[matrix][Number(r)][Number(c)] = Number(value);
  }
}

function handleAction(action, data, readonly, moduleId) {
  const writeActions = ["add-value", "add-objective", "add-swot", "add-vc-strength", "add-vc-weakness", "add-product", "seed-bcg", "add-pest", "add-came"];
  if ((writeActions.includes(action) || action.startsWith("edit-") || action.startsWith("delete-")) && readonly) return toast("Su rol no tiene permiso de edición para este módulo.");
  if (action === "history") return openHistory(moduleId);
  if (action === "assign") return openAssign(moduleId);
  if (action === "approve") return approveModule(moduleId);
  if (action === "add-value") return openValueModal();
  if (action === "add-objective") return openObjectiveModal();
  if (action === "add-swot") return openSwotModal(data.kind);
  if (action === "add-vc-strength") return openTextListModal("valueChain", peti().data.valueChain.reflections.strengths, "Fortaleza detectada");
  if (action === "add-vc-weakness") return openTextListModal("valueChain", peti().data.valueChain.reflections.weaknesses, "Debilidad detectada");
  if (action === "add-product") return openProductModal();
  if (action === "seed-bcg") return seedBcgData();
  if (action === "add-pest") return openPestModal();
  if (action === "add-came") return openCameModal(data.kind);
  if (action.startsWith("edit-")) return editEntity(action.replace("edit-", ""), data.id, data.kind);
  if (action.startsWith("delete-")) return confirmDelete(action.replace("delete-", ""), data.id, data.kind);
}

function field(key, label, value, type = "text", className = "", placeholder = "") {
  if (type === "textarea") return `<label class="${className}">${label}<textarea data-field="${key}" placeholder="${placeholder}">${esc(value || "")}</textarea></label>`;
  return `<label class="${className}">${label}<input data-field="${key}" type="${type}" value="${esc(value ?? "")}" placeholder="${placeholder}" /></label>`;
}

function scoreOptions(name, selected, id) {
  return `<div class="score-options">${scale.map((label, value) => `<label title="${label}"><input type="radio" name="${name}" data-score="${name}" value="${value}" ${Number(selected) === value ? "checked" : ""} />${value}</label>`).join("")}</div>`;
}

function matrixBlock(key) {
  const titles = { fo: "Fortalezas vs Oportunidades", fa: "Fortalezas vs Amenazas", do: "Debilidades vs Oportunidades", da: "Debilidades vs Amenazas" };
  const matrix = peti().data.strategy.matrices[key];
  return `<section class="panel"><h3>${titles[key]}</h3><div class="table-wrap"><div class="matrix-grid">${matrix.map((row, r) => `<div class="matrix-row"><strong>${r + 1}</strong>${row.map((cell, c) => `<div class="score-cell">${scoreOptions(`matrix-${key}-${r}-${c}`, cell, `${r}-${c}`)}</div>`).join("")}</div>`).join("")}</div></div></section>`;
}

function table(headers, rows) {
  if (!rows.length) return `<p class="notice">Aún no existen registros.</p>`;
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function rowActions(type, id, kind = "") {
  return `<div class="action-row"><button class="secondary-btn" data-action="edit-${type}" data-id="${id}" data-kind="${kind}" type="button">Editar</button><button class="danger-btn" data-action="delete-${type}" data-id="${id}" data-kind="${kind}" type="button">Eliminar</button></div>`;
}

function openTextListModal(moduleId, list, title, existing = null) {
  openFormModal(existing ? `Editar ${title}` : `Crear ${title}`, [["text", title, existing?.text || "", "textarea"]], (values) => {
    if (existing) Object.assign(existing, values);
    else list.push({ id: uid("row"), ...values });
    scheduleSave(moduleId, title);
  });
}

function openValueModal(existing = null) {
  openFormModal(existing ? "Editar valor" : "Crear valor", [["name", "Valor", existing?.name || ""], ["description", "Descripción", existing?.description || "", "textarea"]], (values) => {
    if (existing) Object.assign(existing, values);
    else peti().data.values.items.push({ id: uid("val"), ...values });
    scheduleSave("values", "Valor organizacional");
  });
}

function openObjectiveModal(existing = null) {
  openFormModal(existing ? "Editar objetivo" : "Crear objetivo", [["strategic", "Objetivo estratégico", existing?.strategic || "", "textarea"], ["specific", "Objetivo específico", existing?.specific || "", "textarea"], ["indicator", "Indicador", existing?.indicator || ""], ["owner", "Responsable", existing?.owner || ""]], (values) => {
    if (existing) Object.assign(existing, values);
    else peti().data.objectives.rows.push({ id: uid("obj"), ...values });
    scheduleSave("objectives", "Objetivo");
  });
}

function openSwotModal(kind, existing = null) {
  const labels = { strengths: "Fortaleza", opportunities: "Oportunidad", weaknesses: "Debilidad", threats: "Amenaza" };
  openTextListModal("swot", peti().data.swot[kind], labels[kind], existing);
}

function openProductModal(existing = null) {
  openFormModal(existing ? "Editar producto BCG" : "Crear producto BCG", [["name", "Producto", existing?.name || ""], ["sales", "Ventas", existing?.sales || "", "number"], ["growth", "Crecimiento (%)", existing?.growth || "", "number"], ["competitorSales", "Ventas mayor competidor", existing?.competitorSales || "", "number"], ["owner", "Responsable", existing?.owner || ""]], (v) => {
    const values = { ...v, sales: Number(v.sales), growth: Number(v.growth), competitorSales: Number(v.competitorSales) };
    if (existing) Object.assign(existing, values);
    else peti().data.bcg.products.push({ id: uid("prod"), ...values });
    scheduleSave("bcg", "Producto BCG");
  });
}

function openPestModal(existing = null) {
  openFormModal(existing ? "Editar factor PEST" : "Crear factor PEST", [["type", "Tipo", existing?.type || "Político"], ["factor", "Factor", existing?.factor || ""], ["impact", "Impacto 0-4", existing?.impact ?? 2, "number"], ["probability", "Probabilidad 0-4", existing?.probability ?? 2, "number"], ["note", "Nota", existing?.note || "", "textarea"]], (v) => {
    const values = { ...v, impact: Number(v.impact), probability: Number(v.probability) };
    if (existing) Object.assign(existing, values);
    else peti().data.pest.factors.push({ id: uid("pest"), ...values });
    scheduleSave("pest", "Factor PEST");
  });
}

function openCameModal(kind, existing = null) {
  openFormModal(existing ? "Editar acción CAME" : "Crear acción CAME", [["text", "Acción", existing?.text || "", "textarea"], ["owner", "Responsable", existing?.owner || ""], ["deadline", "Plazo", existing?.deadline || ""]], (v) => {
    if (existing) Object.assign(existing, v);
    else peti().data.came.actions[kind].push({ id: uid("came"), ...v });
    scheduleSave("came", "Acción CAME");
  });
}

function openFormModal(title, fields, onSubmit) {
  openModal(title, `<form id="modalForm" class="form-grid">${fields.map(([k, l, v, t = "text"]) => field(k, l, v, t, "wide")).join("")}</form>`, [
    { text: "Cancelar", className: "ghost-btn", onClick: closeModal },
    { text: "Guardar", className: "primary-btn", onClick: () => {
      const values = {};
      $("#modalForm").querySelectorAll("[data-field]").forEach((input) => { values[input.dataset.field] = input.value.trim(); });
      onSubmit(values);
      closeModal();
    } },
  ]);
}

function editEntity(type, id, kind) {
  if (type === "value") return openValueModal(peti().data.values.items.find((r) => r.id === id));
  if (type === "objective") return openObjectiveModal(peti().data.objectives.rows.find((r) => r.id === id));
  if (type === "swot") return openSwotModal(kind, peti().data.swot[kind].find((r) => r.id === id));
  if (type === "vc-strength") return openTextListModal("valueChain", peti().data.valueChain.reflections.strengths, "Fortaleza detectada", peti().data.valueChain.reflections.strengths.find((r) => r.id === id));
  if (type === "vc-weakness") return openTextListModal("valueChain", peti().data.valueChain.reflections.weaknesses, "Debilidad detectada", peti().data.valueChain.reflections.weaknesses.find((r) => r.id === id));
  if (type === "product") return openProductModal(peti().data.bcg.products.find((r) => r.id === id));
  if (type === "pest") return openPestModal(peti().data.pest.factors.find((r) => r.id === id));
  if (type === "came") return openCameModal(kind, peti().data.came.actions[kind].find((r) => r.id === id));
}

function confirmDelete(type, id, kind) {
  openModal("Confirmar eliminación", "<p>El registro será eliminado y quedará en historial.</p>", [
    { text: "Cancelar", className: "ghost-btn", onClick: closeModal },
    { text: "Eliminar", className: "danger-btn", onClick: () => { removeEntity(type, id, kind); closeModal(); } },
  ]);
}

function removeEntity(type, id, kind) {
  const sources = {
    value: peti().data.values.items,
    objective: peti().data.objectives.rows,
    swot: peti().data.swot[kind],
    "vc-strength": peti().data.valueChain.reflections.strengths,
    "vc-weakness": peti().data.valueChain.reflections.weaknesses,
    product: peti().data.bcg.products,
    pest: peti().data.pest.factors,
    came: peti().data.came.actions[kind],
  };
  const list = sources[type];
  const idx = list.findIndex((r) => r.id === id);
  if (idx >= 0) list.splice(idx, 1);
  scheduleSave(peti().activeModule, "Eliminación de registro");
}

function openHistory(moduleId) {
  const rows = peti().history.filter((h) => h.moduleId === moduleId);
  openModal("Historial de cambios", `<div class="history-list">${rows.map((h) => `<div class="history-item"><strong>${h.action}</strong><p>${esc(h.detail)}</p><small>${h.user} | ${h.role} | ${h.area} | ${h.at}</small></div>`).join("") || "<p class='muted'>Sin cambios registrados.</p>"}</div>`);
}

function openAssign(moduleId) {
  if (!canAdmin()) {
    toast("Solo el Administrador Empresa puede asignar responsables.");
    return;
  }
  const module = modules.find((m) => m.id === moduleId);
  const candidates = orgUsers().filter((user) => userBelongsToModuleArea(user, moduleId));
  if (!candidates.length) {
    openModal("Sin usuarios del área", `<p class="notice">No hay usuarios del área responsable <strong>${module.owner}</strong>. Cree o actualice un usuario interno de esa área antes de asignar.</p>`);
    return;
  }
  openModal("Asignar responsable", `
    <p class="notice">Solo se muestran usuarios del área responsable del módulo: <strong>${module.owner}</strong>. Esta acción no modifica permisos.</p>
    <label>Responsable
      <select id="assignUser">${candidates.map((u) => `<option value="${u.id}" ${peti().assignedResponsibles?.[moduleId] === u.id ? "selected" : ""}>${esc(u.name)} — ${esc(u.role)} — ${esc(u.area)}</option>`).join("")}</select>
    </label>
  `, [
    { text: "Cancelar", className: "ghost-btn", onClick: closeModal },
    { text: "Asignar", className: "primary-btn", onClick: () => {
      const user = orgUsers().find((u) => u.id === $("#assignUser").value);
      peti().assignedResponsibles[moduleId] = user.id;
      logChange(moduleId, "Asignación de responsable", `${user.name} — ${user.role} — ${user.area}`);
      persist();
      closeModal();
      renderAll();
      toast("Responsable asignado para seguimiento.");
    } },
  ]);
}

function approveModule(moduleId) {
  peti().approvals[moduleId] = { user: currentUser().name, at: now() };
  logChange(moduleId, "Aprobación", `Módulo aprobado por ${currentUser().name}`);
  persist();
  renderAll();
  toast("Módulo aprobado.");
}

function openUsersModal() {
  if (!canAdmin()) return toast("Solo el Administrador Empresa puede gestionar usuarios.");
  openModal("Usuarios internos y permisos", `
    <div class="action-row"><button id="createUserBtn" class="primary-btn" type="button">Crear usuario</button></div>
    ${table(["Nombre", "Correo", "Rol", "Área", "Restricciones", "Acciones"], orgUsers().map((u) => [
      esc(u.name), esc(u.email), esc(u.role), esc(u.area),
      Object.entries(u.modulePermissions || {}).map(([m, p]) => `${label(m)}: ${p === "view" ? "solo lectura" : p}`).join("<br>") || "Según rol y área",
      `<button class="secondary-btn" data-user-perms="${u.id}" type="button">Área y restricciones</button>`,
    ]))}
  `);
  $("#createUserBtn").addEventListener("click", openCreateUserModal);
  document.querySelectorAll("[data-user-perms]").forEach((b) => b.addEventListener("click", () => openUserPermissions(b.dataset.userPerms)));
}

function openCreateUserModal() {
  openModal("Crear usuario interno", `
    <form id="modalForm" class="form-grid">
      ${field("name", "Nombre", "", "text", "wide")}
      ${field("email", "Correo", "", "email", "wide")}
      ${field("password", "Contraseña temporal", "", "text", "wide")}
      <label class="wide">Rol
        <select data-field="role">
          ${Object.keys(rolePermissions).filter((role) => role !== "Administrador Empresa").map((role) => `<option value="${role}">${role}</option>`).join("")}
        </select>
      </label>
      ${field("area", "Área", "", "text", "wide")}
    </form>
  `, [
    { text: "Cancelar", className: "ghost-btn", onClick: closeModal },
    { text: "Crear usuario", className: "primary-btn", onClick: async () => {
      const values = {};
      $("#modalForm").querySelectorAll("[data-field]").forEach((input) => { values[input.dataset.field] = input.value.trim(); });
      if (!values.name || !values.email || !values.password || !values.role) return toast("Complete todos los campos obligatorios.");
      try {
        const payload = await Api.createUser(values);
        db.users = payload.users;
        closeModal();
        toast("Usuario creado dentro de la empresa.");
      } catch (error) {
        toast(error.message);
      }
    } },
  ]);
}

function openUserPermissions(userId) {
  const user = db.users.find((u) => u.id === userId && u.organizationId === currentOrg().id);
  openModal(`Área y restricciones de ${esc(user.name)}`, `
    <div class="form-grid">
      <label>Rol
        <select id="userRoleEdit">${Object.keys(rolePermissions).map((role) => `<option value="${role}" ${user.role === role ? "selected" : ""}>${role}</option>`).join("")}</select>
      </label>
      <label>Área
        <input id="userAreaEdit" value="${esc(user.area)}" />
      </label>
    </div>
    <p class="notice">Editar depende del área responsable del módulo. Estas restricciones solo pueden dejar un módulo en modo lectura; no otorgan edición fuera del área.</p>
    <div class="table-wrap"><table><thead><tr><th>Módulo</th><th>Restricción</th></tr></thead><tbody>${modules.map((m) => `<tr><td>${m.title}</td><td><select data-permission-module="${m.id}"><option value="">Según rol y área</option><option value="view" ${user.modulePermissions?.[m.id] === "view" ? "selected" : ""}>Solo lectura</option></select></td></tr>`).join("")}</tbody></table></div>
  `, [
    { text: "Cancelar", className: "ghost-btn", onClick: closeModal },
    { text: "Guardar", className: "primary-btn", onClick: async () => {
      user.role = $("#userRoleEdit").value;
      user.area = $("#userAreaEdit").value.trim();
      user.modulePermissions = {};
      document.querySelectorAll("[data-permission-module]").forEach((select) => { if (select.value) user.modulePermissions[select.dataset.permissionModule] = select.value; });
      try {
        const payload = await Api.updateUser(user.id, {
          role: user.role,
          area: user.area,
          modulePermissions: user.modulePermissions,
        });
        db.users = payload.users;
        closeModal();
        renderAll();
        toast("Área y restricciones actualizadas.");
      } catch (error) {
        toast(error.message);
      }
    } },
  ]);
}

function seedBcgData() {
  peti().data.bcg.products = [
    { id: uid("prod"), name: "E-commerce", sales: 580000, growth: 22, competitorSales: 420000, owner: "TI" },
    { id: uid("prod"), name: "Tiendas físicas", sales: 760000, growth: 4, competitorSales: 610000, owner: "Operaciones" },
    { id: uid("prod"), name: "Marketplace", sales: 210000, growth: 28, competitorSales: 480000, owner: "Comercial" },
  ];
  scheduleSave("bcg", "Simulación BCG");
}

function porterAverage() {
  const answered = peti().data.porter.items.filter((i) => i.score !== null);
  return answered.length ? answered.reduce((s, i) => s + Number(i.score), 0) / answered.length : 0;
}

function strategyScores() {
  const sum = (matrix) => matrix.flat().reduce((s, v) => s + Number(v || 0), 0);
  const matrices = peti().data.strategy.matrices;
  return { fo: sum(matrices.fo), fa: sum(matrices.fa), do: sum(matrices.do), da: sum(matrices.da) };
}

function strategyWinner() {
  const scores = strategyScores();
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!entries[0] || entries[0][1] === 0) return "";
  return ({ fo: "Estrategia Ofensiva", fa: "Estrategia Defensiva", do: "Estrategia de Reorientación", da: "Estrategia de Supervivencia" })[entries[0][0]];
}

function relativeShare(p) {
  return Number(p.competitorSales || 0) ? Number(p.sales || 0) / Number(p.competitorSales) : 0;
}

function bcgQuadrant(p) {
  const highGrowth = Number(p.growth) >= 10;
  const highShare = relativeShare(p) >= 1;
  if (highGrowth && highShare) return "Estrella";
  if (highGrowth) return "Incógnita";
  if (highShare) return "Vaca";
  return "Perro";
}

function drawBcg() {
  const canvas = $("#bcgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  [["#ecfeff", 70, 30], ["#fef3c7", w / 2 + 20, 30], ["#dcfce7", 70, h / 2 - 15], ["#fee2e2", w / 2 + 20, h / 2 - 15]].forEach(([c, x, y]) => { ctx.fillStyle = c; ctx.fillRect(x, y, (w - 100) / 2, (h - 90) / 2); });
  ctx.strokeStyle = "#334155"; ctx.strokeRect(70, 30, w - 100, h - 90);
  ctx.beginPath(); ctx.moveTo(w / 2 + 20, 30); ctx.lineTo(w / 2 + 20, h - 60); ctx.moveTo(70, h / 2 - 15); ctx.lineTo(w - 30, h / 2 - 15); ctx.stroke();
  ctx.fillStyle = "#0f172a"; ctx.font = "700 14px Segoe UI";
  [["Estrella", 105, 58], ["Incógnita", w / 2 + 55, 58], ["Vaca", 105, h / 2 + 18], ["Perro", w / 2 + 55, h / 2 + 18]].forEach(([t, x, y]) => ctx.fillText(t, x, y));
  const products = peti().data.bcg.products;
  const maxSales = Math.max(1, ...products.map((p) => Number(p.sales || 0)));
  products.forEach((p, i) => {
    const x = 70 + (Math.min(2, relativeShare(p)) / 2) * (w - 100);
    const y = h - 60 - (Math.max(0, Math.min(30, Number(p.growth || 0))) / 30) * (h - 90);
    const r = 12 + (Number(p.sales || 0) / maxSales) * 20;
    ctx.beginPath(); ctx.fillStyle = ["#2563eb", "#0f766e", "#b7791f", "#c2413b"][i % 4]; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111827"; ctx.font = "700 12px Segoe UI"; ctx.fillText(p.name.slice(0, 16), Math.min(x + r + 4, w - 130), y + 4);
  });
}

function openModal(title, body, actions = [{ text: "Cerrar", className: "primary-btn", onClick: closeModal }]) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalFooter").innerHTML = "";
  actions.forEach((a) => {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = a.className; btn.textContent = a.text; btn.addEventListener("click", a.onClick);
    $("#modalFooter").appendChild(btn);
  });
  $("#modalBackdrop").classList.remove("hidden");
}

function closeModal() {
  $("#modalBackdrop").classList.add("hidden");
}

function openExportModal() {
  openModal("Exportar PETI", `
    <div class="export-options">
      <button class="export-card" id="exportPdfBtn" type="button">
        <strong>Exportar PDF</strong>
        <span>Reporte ejecutivo listo para imprimir, presentar o guardar como PDF.</span>
      </button>
      <button class="export-card" id="exportExcelBtn" type="button">
        <strong>Exportar Excel</strong>
        <span>Tablas del PETI para revisión, análisis y entregables internos.</span>
      </button>
      ${canAdmin() ? `<button class="export-card technical" id="exportJsonBtn" type="button"><strong>Exportar JSON técnico</strong><span>Respaldo estructurado para pruebas o migración.</span></button>` : ""}
    </div>
  `);
  $("#exportPdfBtn").addEventListener("click", exportPdf);
  $("#exportExcelBtn").addEventListener("click", exportExcel);
  if ($("#exportJsonBtn")) $("#exportJsonBtn").addEventListener("click", exportJson);
}

function exportPayload() {
  return { empresa: currentOrg().name, usuario: { ...currentUser(), password: undefined }, avance: `${progressCount()}/${modules.length}`, generado: now(), peti: peti().data, historial: peti().history, aprobaciones: peti().approvals };
}

function reportHtml() {
  const d = peti().data;
  const vc = valueChainStats();
  const cameRows = Object.entries(d.came.actions).flatMap(([kind, rows]) => rows.map((row) => `<tr><td>${esc(kind)}</td><td>${esc(row.text)}</td><td>${esc(row.owner)}</td><td>${esc(row.deadline)}</td></tr>`)).join("");
  return `
    <html><head><title>PETI ${esc(currentOrg().name)}</title><style>
      body{font-family:Segoe UI,Arial,sans-serif;color:#172033;margin:32px;line-height:1.45}
      h1{font-size:28px;margin:0 0 8px} h2{margin-top:26px;border-bottom:1px solid #dbe2ea;padding-bottom:6px}
      table{width:100%;border-collapse:collapse;margin:10px 0 18px} th,td{border:1px solid #dbe2ea;padding:8px;text-align:left;vertical-align:top} th{background:#eef2f7}
      .kpi{display:inline-block;border:1px solid #dbe2ea;border-radius:8px;padding:10px 14px;margin:6px 8px 6px 0}
    </style></head><body>
      <h1>Plan Estratégico de TI</h1>
      <p><strong>Empresa:</strong> ${esc(currentOrg().name)} | <strong>RUC:</strong> ${esc(d.info.ruc || "")} | <strong>Generado:</strong> ${now()}</p>
      <div class="kpi"><strong>Avance:</strong> ${progressCount()}/${modules.length}</div>
      <div class="kpi"><strong>Cadena de valor:</strong> ${vc.strength}%</div>
      <div class="kpi"><strong>Potencial de mejora:</strong> ${vc.improvement}%</div>
      <h2>Empresa</h2><p>${esc(d.info.description || "")}</p>
      <h2>Misión</h2><p>${esc(d.mission.text || "Pendiente")}</p>
      <h2>Visión</h2><p>${esc(d.vision.text || "Pendiente")}</p>
      <h2>Valores</h2><ul>${d.values.items.map((v) => `<li><strong>${esc(v.name)}</strong>: ${esc(v.description)}</li>`).join("")}</ul>
      <h2>Objetivos</h2>${table(["Estratégico","Específico","Indicador","Responsable"], d.objectives.rows.map((r) => [esc(r.strategic), esc(r.specific), esc(r.indicator), esc(r.owner)]))}
      <h2>FODA</h2>${table(["Fortalezas","Oportunidades","Debilidades","Amenazas"], Array.from({length: Math.max(d.swot.strengths.length,d.swot.opportunities.length,d.swot.weaknesses.length,d.swot.threats.length,1)}, (_, i) => [esc(d.swot.strengths[i]?.text || ""), esc(d.swot.opportunities[i]?.text || ""), esc(d.swot.weaknesses[i]?.text || ""), esc(d.swot.threats[i]?.text || "")]))}
      <h2>Cadena de Valor</h2><p>${vc.interpretation}. Potencial actual ${vc.strength}%, mejora ${vc.improvement}%.</p>
      <h2>BCG</h2>${table(["Producto","Ventas","Crecimiento","Participación","Cuadrante"], d.bcg.products.map((p) => [esc(p.name), money(p.sales), `${p.growth}%`, relativeShare(p).toFixed(2), bcgQuadrant(p)]))}
      <h2>Estrategia</h2><p>${esc(d.strategy.selected || strategyWinner() || "Pendiente")}</p>
      <h2>Matriz CAME</h2><table><thead><tr><th>Bloque</th><th>Acción</th><th>Responsable</th><th>Plazo</th></tr></thead><tbody>${cameRows || "<tr><td colspan='4'>Pendiente</td></tr>"}</tbody></table>
      <h2>Conclusiones</h2><p>${esc(d.executive.conclusions || "Pendiente")}</p>
    </body></html>`;
}

function exportPdf() {
  const win = window.open("", "_blank");
  win.document.write(reportHtml());
  win.document.close();
  win.focus();
  win.print();
}

function exportExcel() {
  const html = reportHtml();
  downloadBlob(`PETI-${currentOrg().name.replaceAll(" ", "-")}.xls`, "application/vnd.ms-excel", html);
  toast("Excel exportado.");
}

function exportJson() {
  const data = { empresa: currentOrg().name, usuario: { ...currentUser(), password: undefined }, avance: `${progressCount()}/${modules.length}`, generado: now(), peti: peti().data, historial: peti().history, aprobaciones: peti().approvals };
  downloadBlob(`PETI-${currentOrg().name.replaceAll(" ", "-")}.json`, "application/json", JSON.stringify(data, null, 2));
  toast("JSON técnico exportado.");
}

function downloadBlob(filename, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function label(moduleId) {
  return modules.find((m) => m.id === moduleId)?.title || moduleId;
}

function money(value) {
  return Number(value || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 });
}

function esc(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast-message";
  node.textContent = message;
  $("#toast").appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

$("#loginForm").addEventListener("submit", login);
$("#registerForm").addEventListener("submit", registerCompany);
$("#showRegisterBtn").addEventListener("click", () => $("#registerForm").classList.toggle("hidden"));
$("#logoutBtn").addEventListener("click", logout);
$("#modalClose").addEventListener("click", closeModal);
$("#helpBtn").addEventListener("click", () => openModal("Ayuda contextual", `<p>${modules.find((m) => m.id === peti().activeModule).help}</p>`));
$("#exportBtn").addEventListener("click", openExportModal);
$("#manageUsersBtn").addEventListener("click", openUsersModal);
$("#menuBtn").addEventListener("click", () => $(".sidebar").classList.toggle("open"));

async function initApp() {
  if (!Api.token()) return;
  try {
    const payload = await Api.me();
    applySession(payload);
    $("#loginView").classList.add("hidden");
    $("#appView").classList.remove("hidden");
    renderAll();
  } catch {
    Api.clearToken();
  }
}

initApp();
