const fs = require('fs');

const PROVINCE_CODES = {
  'Buenos Aires': 'BA',
  'Ciudad Autónoma de Buenos Aires': 'CABA',
  'Catamarca': 'CAT',
  'Chaco': 'CHA',
  'Chubut': 'CHU',
  'Córdoba': 'CBA',
  'Corrientes': 'COR',
  'Entre Ríos': 'ER',
  'Formosa': 'FOR',
  'Jujuy': 'JUJ',
  'La Pampa': 'LP',
  'La Rioja': 'LR',
  'Mendoza': 'MDZ',
  'Misiones': 'MIS',
  'Neuquén': 'NEU',
  'Río Negro': 'RN',
  'Salta': 'SAL',
  'San Juan': 'SJ',
  'San Luis': 'SL',
  'Santa Cruz': 'SC',
  'Santa Fe': 'SF',
  'Santiago del Estero': 'SDE',
  'Tierra del Fuego': 'TDF',
  'Tucumán': 'TUC'
};

const lines = fs.readFileSync('data/argentina_cities_complete.csv', 'utf8')
  .split(/\r?\n/)
  .filter(l => l.trim().length > 0);

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  let prov = '';
  let city = '';
  if (line.startsWith('"')) {
    const nextQuote = line.indexOf('"', 1);
    prov = line.substring(1, nextQuote);
    city = line.substring(nextQuote + 2).split(',')[0].replace(/^"|"$/g, '');
  } else {
    const parts = line.split(',');
    prov = parts[0];
    city = parts[1] ? parts[1].replace(/^"|"$/g, '') : '';
  }
  if (prov && city) {
    rows.push({ prov: prov.trim(), city: city.trim() });
  }
}

let sql = `-- ==============================================================================\n`;
sql += `-- KREVIA LEADS - SEED COMPLETO DE TODAS LAS CIUDADES DE ARGENTINA (GEOREF)\n`;
sql += `-- 24 Provincias / Jurisdicciones + 4.270+ Localidades y Municipios oficiales\n`;
sql += `-- ==============================================================================\n\n`;

// 1. Provincias
sql += `INSERT INTO provinces (name, code) VALUES\n`;
const provEntries = Object.entries(PROVINCE_CODES).map(([p, c]) => {
  return `  ('${p.replace(/'/g, "''")}', '${c}')`;
});
sql += provEntries.join(',\n') + `\nON CONFLICT (name) DO NOTHING;\n\n`;

// 2. Ciudades agrupadas por provincia
const byProv = new Map();
for (const r of rows) {
  if (!byProv.has(r.prov)) byProv.set(r.prov, []);
  // Evitar duplicados exactos dentro de la misma provincia
  if (!byProv.get(r.prov).includes(r.city)) {
    byProv.get(r.prov).push(r.city);
  }
}

for (const [prov, cities] of byProv.entries()) {
  const escapedProv = prov.replace(/'/g, "''");
  sql += `-- ------------------------------------------------------------------------------\n`;
  sql += `-- Provincia: ${prov} (${cities.length} localidades)\n`;
  sql += `-- ------------------------------------------------------------------------------\n`;
  sql += `INSERT INTO cities (province_id, name)\n`;
  sql += `SELECT p.id, c.name FROM provinces p, (\n  VALUES\n`;
  const cityValues = cities.map(c => `    ('${c.replace(/'/g, "''")}')`);
  sql += cityValues.join(',\n');
  sql += `\n) AS c(name) WHERE p.name = '${escapedProv}'\n`;
  sql += `ON CONFLICT (province_id, name) DO NOTHING;\n\n`;
}

fs.writeFileSync('supabase/seed_argentina_complete.sql', sql, 'utf8');
console.log('✅ Generado con éxito: supabase/seed_argentina_complete.sql');
