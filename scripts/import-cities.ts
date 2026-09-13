import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno para conectar a Supabase.');
  console.error('Por favor asegurate de configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (o SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CsvRow {
  province: string;
  city: string;
  population?: number;
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  // Asumimos primera línea con headers: province,city,population
  const rows: CsvRow[] = [];
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const provIdx = header.indexOf('province');
  const cityIdx = header.indexOf('city');
  const popIdx = header.indexOf('population');

  if (provIdx === -1 || cityIdx === -1) {
    throw new Error('El archivo CSV debe contener al menos las columnas "province" y "city".');
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length > Math.max(provIdx, cityIdx)) {
      const province = cols[provIdx];
      const city = cols[cityIdx];
      const population = popIdx !== -1 && cols[popIdx] ? parseInt(cols[popIdx], 10) : undefined;

      if (province && city) {
        rows.push({
          province,
          city,
          population: isNaN(population || 0) ? undefined : population,
        });
      }
    }
  }

  return rows;
}

async function main() {
  const defaultFile = fs.existsSync(path.join(process.cwd(), 'data', 'argentina_cities_complete.csv'))
    ? path.join(process.cwd(), 'data', 'argentina_cities_complete.csv')
    : path.join(process.cwd(), 'data', 'cities-sample.csv');
  const targetFile = process.argv[2] || defaultFile;

  console.log('================================================================');
  console.log('🚀 KREVIA LEADS - IMPORTADOR DE PROVINCIAS Y CIUDADES');
  console.log('================================================================');
  console.log(`📂 Archivo origen: ${targetFile}`);

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ Archivo no encontrado: ${targetFile}`);
    process.exit(1);
  }

  const rows = parseCsv(targetFile);
  console.log(`📋 Registros detectados en CSV: ${rows.length}`);

  if (rows.length === 0) {
    console.log('⚠️ El archivo no contiene datos.');
    return;
  }

  // 1. Obtener o crear provincias
  console.log('\n🔍 Verificando provincias en la base de datos...');
  const uniqueProvinceNames = Array.from(new Set(rows.map((r) => r.province)));

  // Upsert o insert de provincias
  for (const provName of uniqueProvinceNames) {
    await supabase.from('provinces').upsert({ name: provName }, { onConflict: 'name' });
  }

  // Cargar mapa de provincias id -> nombre
  const { data: dbProvinces, error: provErr } = await supabase.from('provinces').select('id, name');
  if (provErr || !dbProvinces) {
    console.error('❌ Error obteniendo provincias:', provErr);
    process.exit(1);
  }

  const provMap = new Map<string, number>();
  dbProvinces.forEach((p) => provMap.set(p.name.toLowerCase(), p.id));

  // 2. Preparar registros de ciudades
  console.log('\n📥 Insertando ciudades por lotes...');
  const citiesToInsert = rows.map((r) => {
    const pId = provMap.get(r.province.toLowerCase());
    if (!pId) {
      throw new Error(`Provincia no encontrada en base de datos: ${r.province}`);
    }
    return {
      province_id: pId,
      name: r.city,
      population: r.population || null,
    };
  });

  // Batching de a 50
  const BATCH_SIZE = 50;
  let insertedCount = 0;

  for (let i = 0; i < citiesToInsert.length; i += BATCH_SIZE) {
    const chunk = citiesToInsert.slice(i, i + BATCH_SIZE);
    const { error: insertErr } = await supabase
      .from('cities')
      .upsert(chunk, { onConflict: 'province_id,name' });

    if (insertErr) {
      console.error(`⚠️ Error insertando lote ${i} - ${i + chunk.length}:`, insertErr.message);
    } else {
      insertedCount += chunk.length;
      process.stdout.write(`✅ Procesadas ${insertedCount}/${citiesToInsert.length} ciudades...\r`);
    }
  }

  console.log(`\n\n🎉 ¡Importación completada con éxito! Se cargaron ${insertedCount} ciudades.`);
}

main().catch((err) => {
  console.error('\n❌ Error durante la importación:', err);
  process.exit(1);
});
