// Official Bagong Nayon 1 Elementary School grade levels and section names.
export const SCHOOL_DATA = {
  "K1": [
    "MASAYAHIN", "MAPAGBIGAY", "BAYANIHAN", "AKTIBO", "MAPAG-ALAGA", "MASUNURIN", "MAGITING", "PAGKAKAISA", "MARIKIT", "MAHINHIN", "MAKATAO", "MATIPID", "MASIPAG", "MALAMBING", "MAUNAWAIN", "MASIGLA", "KATAPATAN", "MAPAGKAWANGGAWA", "KARANGALAN", "MAALALAHANIN", "MATULUNGIN", "KAAYA-AYA", "MAHUSAY", "TAGUMPAY", "MASINOP", "MATALINO", "MAYUMI", "MAKISIG"
  ],
  "K2": [
    "MAGALANG", "MAGILIW", "MAKA-DIYOS", "MAPAGMAHAL", "PAG-ASA", "MABAIT", "MAPAGKUMBABA", "KAGALAKAN", "MAPAGKAKATIWALAAN", "MASIGASIG", "MATIYAGA", "MATAPAT", "RESPONSIBLE", "MALIKHAIN", "PALAKAIBIGAN", "MAPAMARAAN", "MASIKAP", "MAAGAP", "KAALAMAN", "KARUNUNGAN", "MAKABAYAN"
  ],
  "Grade 1": [
    "SAGING", "DALANDAN", "KAHEL", "STRAWBERRY", "GUYABANO", "KIWI", "PAPAYA", "MACOPA", "LANZONES", "MELON", "ATIS", "KAIMITO", "KALAMANSI", "LEMON", "DUHAT", "POMELO", "PAKWAN", "PERAS", "BLUEBERRY", "RAMBUTAN", "CHERRY", "SUHA", "LANGKA", "MANGOSTEEN", "SAMPALOK", "FL AM", "MANGGA", "KASOY", "DURIAN", "BAYABAS", "LONGAN"
  ],
  "Grade 2": [
    "Acacia", "Alibangbang", "FL-Narra", "Amugis", "Apitong", "Banaba", "Mayapis", "Kamatsile", "Kamuning", "Lanete", "Mahogany", "Pino", "Talisay", "Tanguile", "Tibig", "Toog", "Nipa", "FL-Igos", "Kamagong", "Anonang", "Caballero", "Dapdap", "Gemelina", "Ipil-Ipil", "Kalumpit", "Lawaan", "Malugai", "Mulawin", "Malabulak", "Molave", "Oliva", "Tindalo", "Yakal", "Almaciga", "Bani", "Aroma"
  ],
  "Grade 3": [
    "ST. RAPHAEL", "ST. BERNADETTE", "ST. MARY", "ST. JOHN", "ST. DOMINIC", "ST. SEBASTIAN", "ST. IGNATIUS", "ST. PIO", "ST. VINCENT", "ST. AGNES", "ST. MICHAEL", "ST. CLEMENT", "ST. MARTIN", "ST. HELENA", "ST. MARK", "ST. ANTHONY", "ST. CLARE", "ST. JOSEPH", "ST. THOMAS", "ST. FRANCIS", "ST. EMMANUEL", "ST. BENEDICT", "ST. LUKE", "ST. GABRIEL", "ST. PAUL", "ST. MATTHEW", "ST. ROSE", "ST. ANNE", "ST. PATRICK", "ST. CATHERINE", "ST. THERESE", "ST. ELIZABETH", "ST. DAVID", "ST. CASSIAN", "ST. PHILOMENA"
  ],
  "Grade 4": [
    "ILANG-ILANG", "DAFFODIL", "SUNFLOWER", "MARIGOLD", "ANTHURIUM", "ASTER", "YELLOWBELL", "BOUGAINVILLEA", "DAISY", "LAVENDER", "LILAC", "WILDZINNIA", "EVERLASTING", "ROSE", "TULIPS", "STARGAZER", "CARNATION", "HYACINTH", "GLADIOLA", "JASMINE"
  ],
  "Grade 5": [
    "FL PM", "AMBER", "APATITE", "BLUE TOPAZ", "CITRINE", "DIAMOND", "FLOURITE", "PEARL", "RUBY", "SARDONYX", "TOURMALINE", "CORAL", "GOSHENITE", "JASPER", "MOONSTONE", "IDOCRASE", "PERIDOT", "SAPPHIRE", "YELLOW TOPAZ", "EMERALD"
  ],
  "Grade 6": [
    "FL PM – ANDRES BONIFACIO", "F. BALTAZAR", "P. URDUJA", "E. JACINTO", "MH. DEL PILAR", "G. SILANG", "M. SAKAY", "F. DAGOHOY", "J. LUNA", "JL. ESCODA", "S. KUDARAT", "V. LUCBAN", "GL. JAENA", "M. GOMEZ", "A. MABINI", "M. PONCE", "A. LUNA", "E. AGUINALDO"
  ]
};

// Export keys for convenience
export const GRADES = Object.keys(SCHOOL_DATA);

// Helper to normalize DB grade to official grade keys
export const normalizeGrade = (dbGrade) => {
  const g = String(dbGrade || "").toUpperCase();
  if (g === "K" || g === "K1" || g === "KINDER 1") return "K1";
  if (g === "K2" || g === "KINDER 2") return "K2";
  if (g === "1" || g === "GRADE 1" || g === "G1") return "Grade 1";
  if (g === "2" || g === "GRADE 2" || g === "G2") return "Grade 2";
  if (g === "3" || g === "GRADE 3" || g === "G3") return "Grade 3";
  if (g === "4" || g === "GRADE 4" || g === "G4") return "Grade 4";
  if (g === "5" || g === "GRADE 5" || g === "G5") return "Grade 5";
  if (g === "6" || g === "GRADE 6" || g === "G6") return "Grade 6";
  return dbGrade || "Unknown";
};
