const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./temp_repo/saju_db.json'));
for (const k in db) {
  const v = db[k];
  if (Array.isArray(v)) {
    console.log(`[${k}] Array(${v.length}) - [0]:`, v[0]);
  } else if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    console.log(`[${k}] Object keys: ${keys.length} - [0]:`, keys[0], v[keys[0]]);
  } else {
    console.log(`[${k}] ${typeof v}`, v);
  }
}
