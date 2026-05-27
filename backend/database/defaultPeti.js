const { randomUUID } = require("node:crypto");

function uid(prefix = "id") {
  return `${prefix}-${randomUUID()}`;
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

function emptyMatrix() {
  return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null));
}

function createPeti(companyName, ruc = "", sector = "") {
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
      strategy: { matrices: { fo: emptyMatrix(), fa: emptyMatrix(), do: emptyMatrix(), da: emptyMatrix() }, selected: "", reflection: "" },
      came: { actions: { correct: [], confront: [], maintain: [], exploit: [] } },
      executive: { promoters: "", conclusions: "" },
    },
  };
}

module.exports = { createPeti };
