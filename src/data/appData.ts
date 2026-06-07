import type { Meal, Recipe, LabResult } from "../types";

export const USER = {
  name: "Valentina", age: 28, weight: 62, height: 165,
  streak: 14, goal: "Perder peso", bmi: 22.8,
  calories: { goal: 1850, consumed: 1240 },
  water: { goal: 8, consumed: 5 },
  macros: {
    protein: { goal: 130, consumed: 78,  label: "Proteínas",     unit: "g", color: "#3B82F6" },
    carbs:   { goal: 185, consumed: 142, label: "Carbohidratos", unit: "g", color: "#F59E0B" },
    fat:     { goal: 52,  consumed: 31,  label: "Grasas",        unit: "g", color: "#EC4899" },
  },
};

export const TODAY_MEALS: Meal[] = [
  { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Avena con plátano y miel",      kcal: 380, completed: true,  macros: { protein: 12, carbs: 68, fat: 7  }, items: ["½ taza avena", "1 plátano", "1 cda miel", "½ taza leche almendras"] },
  { id: 2, type: "Snack AM", emoji: "🍎", time: "10:00", name: "Manzana con almendras",          kcal: 180, completed: true,  macros: { protein: 4,  carbs: 28, fat: 9  }, items: ["1 manzana", "15 almendras"] },
  { id: 3, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Bowl de pollo y quinoa",         kcal: 520, completed: false, macros: { protein: 45, carbs: 52, fat: 12 }, items: ["150g pollo", "½ taza quinoa", "Verduras asadas", "Aceite de oliva"] },
  { id: 4, type: "Cena",     emoji: "🌙", time: "19:30", name: "Salmón al horno con brócoli",    kcal: 420, completed: false, macros: { protein: 39, carbs: 22, fat: 18 }, items: ["150g salmón", "1 taza brócoli", "Limón y especias"] },
];

export const WEEK_DAYS = [
  { key: "L", label: "Lun", date: "19" },
  { key: "M", label: "Mar", date: "20" },
  { key: "X", label: "Mié", date: "21" },
  { key: "J", label: "Jue", date: "22", today: true },
  { key: "V", label: "Vie", date: "23" },
  { key: "S", label: "Sáb", date: "24" },
  { key: "D", label: "Dom", date: "25" },
];

export const WEEK_PLAN: Record<string, Meal[]> = {
  L: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Tostadas con aguacate",      kcal: 350, completed: true,  macros: { protein: 10, carbs: 42, fat: 18 }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Ensalada mediterránea",       kcal: 480, completed: true,  macros: { protein: 38, carbs: 28, fat: 22 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "19:30", name: "Pasta integral con verduras", kcal: 520, completed: true,  macros: { protein: 22, carbs: 78, fat: 14 }, items: [] },
  ],
  M: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Yogur griego con frutos rojos", kcal: 290, completed: true,  macros: { protein: 18, carbs: 36, fat: 6  }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Wrap de pavo y hummus",          kcal: 410, completed: true,  macros: { protein: 32, carbs: 48, fat: 10 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "19:30", name: "Merluza al vapor con arroz",     kcal: 450, completed: false, macros: { protein: 36, carbs: 52, fat: 8  }, items: [] },
  ],
  X: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Batido verde energizante", kcal: 220, completed: true,  macros: { protein: 8,  carbs: 42, fat: 4  }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Pollo al curry con arroz",  kcal: 550, completed: true,  macros: { protein: 42, carbs: 58, fat: 16 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "19:30", name: "Sopa de lentejas",          kcal: 380, completed: false, macros: { protein: 20, carbs: 58, fat: 8  }, items: [] },
  ],
  J: TODAY_MEALS,
  V: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Pancakes de avena proteicos",  kcal: 340, completed: false, macros: { protein: 22, carbs: 46, fat: 10 }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Poke bowl de atún",             kcal: 490, completed: false, macros: { protein: 38, carbs: 54, fat: 14 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "19:30", name: "Revuelto de huevos y verduras", kcal: 320, completed: false, macros: { protein: 24, carbs: 18, fat: 18 }, items: [] },
  ],
  S: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "9:00",  name: "Tortilla francesa con tostadas", kcal: 380, completed: false, macros: { protein: 20, carbs: 36, fat: 16 }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "14:00", name: "Hamburguesa de legumbres",        kcal: 520, completed: false, macros: { protein: 28, carbs: 62, fat: 18 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "20:00", name: "Tabla de quesos y vegetales",     kcal: 420, completed: false, macros: { protein: 22, carbs: 28, fat: 24 }, items: [] },
  ],
  D: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "9:30",  name: "Overnight oats de frambuesa",  kcal: 360, completed: false, macros: { protein: 16, carbs: 58, fat: 8  }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "14:00", name: "Risotto de calabaza",            kcal: 510, completed: false, macros: { protein: 18, carbs: 72, fat: 14 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "20:00", name: "Gazpacho y tostadas integrales", kcal: 280, completed: false, macros: { protein: 10, carbs: 46, fat: 8  }, items: [] },
  ],
};

export const RECIPES: Recipe[] = [
  { id: 1, name: "Bowl Proteico de Pollo",   category: "Almuerzo", emoji: "🥗", color: "#059669", calories: 520, time: "25 min", rating: 4.8, difficulty: "Fácil",     macros: { protein: 45, carbs: 52, fat: 12 }, tags: ["Alta proteína","Sin gluten"],   ingredients: ["150g pechuga de pollo","½ taza quinoa cocida","½ aguacate","1 taza espinacas","Tomates cherry","1 cda aceite oliva","Limón y sal al gusto"], instructions: "Cocina la quinoa. Marina y cocina el pollo a la plancha 7 min por lado. Arma el bowl con espinacas, quinoa, pollo en tiras, aguacate y tomates. Aliña con limón y aceite de oliva." },
  { id: 2, name: "Avena Overnight",          category: "Desayuno", emoji: "🫙", color: "#F59E0B", calories: 380, time: "5 min",  rating: 4.9, difficulty: "Muy fácil", macros: { protein: 14, carbs: 62, fat: 8  }, tags: ["Vegetariano","Rápido"],        ingredients: ["½ taza avena integral","¾ taza leche almendras","1 cda chía","1 cda miel","½ plátano","Frutos rojos al gusto"], instructions: "Mezcla avena, leche y chía en un frasco. Refrigera mínimo 6 horas. Al servir, agrega miel, plátano y frutos rojos." },
  { id: 3, name: "Salmón al Horno",          category: "Cena",     emoji: "🐟", color: "#3B82F6", calories: 420, time: "35 min", rating: 4.7, difficulty: "Media",     macros: { protein: 39, carbs: 22, fat: 18 }, tags: ["Omega-3","Sin lactosa"],       ingredients: ["150g filete de salmón","1 taza brócoli","1 zanahoria","1 cda aceite oliva","2 dientes ajo","Zumo de limón","Tomillo, sal y pimienta"], instructions: "Precalienta horno 200°C. Aliña el salmón con aceite, ajo, limón y tomillo. Coloca con verduras y hornea 20-25 minutos." },
  { id: 4, name: "Wrap de Pavo y Hummus",    category: "Almuerzo", emoji: "🌯", color: "#8B5CF6", calories: 410, time: "10 min", rating: 4.6, difficulty: "Muy fácil", macros: { protein: 32, carbs: 48, fat: 10 }, tags: ["Alto en fibra","Rápido"],      ingredients: ["1 tortilla integral","120g pavo en lonchas","2 cdas hummus","Lechuga romana","1 tomate","½ pepino en bastones"], instructions: "Extiende hummus sobre la tortilla. Agrega pavo, lechuga, tomate y pepino. Enrolla y corta en diagonal." },
  { id: 5, name: "Batido Verde Energizante", category: "Snack",    emoji: "🥤", color: "#10B981", calories: 220, time: "5 min",  rating: 4.5, difficulty: "Muy fácil", macros: { protein: 8,  carbs: 42, fat: 4  }, tags: ["Vegano","Detox"],             ingredients: ["1 taza espinacas baby","½ plátano congelado","½ taza piña","1 cda jengibre rallado","1 taza agua de coco","Miel al gusto"], instructions: "Licúa todos los ingredientes a velocidad alta 60 segundos. Sirve inmediatamente." },
  { id: 6, name: "Huevos Benedictinos Fit",  category: "Desayuno", emoji: "🍳", color: "#EC4899", calories: 440, time: "20 min", rating: 4.8, difficulty: "Media",     macros: { protein: 28, carbs: 32, fat: 20 }, tags: ["Alta proteína","Sin azúcar"], ingredients: ["2 huevos frescos","2 tostadas integrales","60g salmón ahumado","½ aguacate","Limón","Eneldo fresco","Vinagre para escalfar"], instructions: "Tuesta el pan. Escalfa los huevos 3-4 min en agua con vinagre. Monta: tostada → aguacate → salmón → huevo. Decora con eneldo." },
];

export const SHOPPING_LIST = [
  { category: "Proteínas",         color: "#3B82F6", icon: "🥩", items: [{ name: "Pechuga de pollo", qty: "500g", checked: true }, { name: "Salmón fresco", qty: "300g", checked: true }, { name: "Atún al natural", qty: "2 latas", checked: false }, { name: "Pavo en lonchas", qty: "200g", checked: false }, { name: "Huevos", qty: "12 uds.", checked: false }] },
  { category: "Granos y cereales", color: "#F59E0B", icon: "🌾", items: [{ name: "Avena integral", qty: "500g", checked: true }, { name: "Quinoa", qty: "400g", checked: false }, { name: "Arroz integral", qty: "500g", checked: false }, { name: "Tortillas integrales", qty: "1 paquete", checked: false }] },
  { category: "Frutas y verduras", color: "#10B981", icon: "🥦", items: [{ name: "Espinacas baby", qty: "200g", checked: false }, { name: "Brócoli", qty: "1 pieza", checked: false }, { name: "Plátanos", qty: "6 uds.", checked: false }, { name: "Aguacate", qty: "3 uds.", checked: false }, { name: "Tomates cherry", qty: "250g", checked: false }, { name: "Manzanas", qty: "4 uds.", checked: false }] },
  { category: "Lácteos y altern.", color: "#8B5CF6", icon: "🥛", items: [{ name: "Leche de almendras", qty: "1L", checked: true }, { name: "Yogur griego 0%", qty: "4 uds.", checked: false }, { name: "Queso cottage", qty: "250g", checked: false }] },
];

export const WEEKLY_STATS = [
  { day: "L", kcal: 1820 }, { day: "M", kcal: 1760 }, { day: "X", kcal: 1910 },
  { day: "J", kcal: 1240 }, { day: "V", kcal: 0 },    { day: "S", kcal: 0 },   { day: "D", kcal: 0 },
];

export const LAB_HISTORY: LabResult[] = [
  { id: "1", date: "22 May 2025", type: "Perfil lipídico",    typeColor: "#3B82F6", typeIcon: "🩸", fileName: "examen_mayo_2025.pdf",
    values: [
      { name: "Colesterol total", value: 185, unit: "mg/dL", refMin: 0,   refMax: 200, date: "22 May" },
      { name: "HDL",              value: 58,  unit: "mg/dL", refMin: 40,  refMax: 999, date: "22 May" },
      { name: "LDL",              value: 108, unit: "mg/dL", refMin: 0,   refMax: 130, date: "22 May" },
      { name: "Triglicéridos",    value: 95,  unit: "mg/dL", refMin: 0,   refMax: 150, date: "22 May" },
    ]},
  { id: "2", date: "18 Feb 2025", type: "Perfil lipídico",    typeColor: "#3B82F6", typeIcon: "🩸", fileName: "examen_feb_2025.pdf",
    values: [
      { name: "Colesterol total", value: 210, unit: "mg/dL", refMin: 0,   refMax: 200, date: "18 Feb" },
      { name: "HDL",              value: 48,  unit: "mg/dL", refMin: 40,  refMax: 999, date: "18 Feb" },
      { name: "LDL",              value: 138, unit: "mg/dL", refMin: 0,   refMax: 130, date: "18 Feb" },
      { name: "Triglicéridos",    value: 142, unit: "mg/dL", refMin: 0,   refMax: 150, date: "18 Feb" },
    ]},
  { id: "3", date: "10 Nov 2024", type: "Glicemia",           typeColor: "#F59E0B", typeIcon: "🧪", fileName: "glicemia_nov_2024.pdf",
    values: [
      { name: "Glucosa en ayuno", value: 88,  unit: "mg/dL", refMin: 70,  refMax: 100, date: "10 Nov" },
      { name: "HbA1c",           value: 5.2, unit: "%",      refMin: 0,   refMax: 5.7, date: "10 Nov" },
    ]},
  { id: "4", date: "10 Nov 2024", type: "Perfil bioquímico",  typeColor: "#8B5CF6", typeIcon: "🔬", fileName: "bioquimico_nov_2024.pdf",
    values: [
      { name: "Creatinina",  value: 0.85, unit: "mg/dL", refMin: 0.5, refMax: 1.1, date: "10 Nov" },
      { name: "Urea",        value: 28,   unit: "mg/dL", refMin: 10,  refMax: 50,  date: "10 Nov" },
      { name: "Ácido úrico", value: 4.2,  unit: "mg/dL", refMin: 2.4, refMax: 6.0, date: "10 Nov" },
    ]},
];

export const KPI_TRENDS: Record<string, { date: string; value: number }[]> = {
  "Colesterol total": [{ date: "Nov '24", value: 218 }, { date: "Feb '25", value: 210 }, { date: "May '25", value: 185 }],
  "LDL":             [{ date: "Nov '24", value: 145 }, { date: "Feb '25", value: 138 }, { date: "May '25", value: 108 }],
  "HDL":             [{ date: "Nov '24", value: 44  }, { date: "Feb '25", value: 48  }, { date: "May '25", value: 58  }],
  "Triglicéridos":   [{ date: "Nov '24", value: 165 }, { date: "Feb '25", value: 142 }, { date: "May '25", value: 95  }],
};