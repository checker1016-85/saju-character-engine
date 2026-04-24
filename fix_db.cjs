const fs = require('fs');
const path = './src/lib/saju_db.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));

const iljus = Object.keys(db.dna);
console.log("Total Iljus:", iljus.length);

const genericFemaleKeys = [];
const genericMaleKeys = [];

// For each key in female/male, check if it's identical across all Iljus.
if (iljus.length > 0) {
  const firstIlju = iljus[0];
  const fKeys = Object.keys(db.dna[firstIlju].female || {});
  const mKeys = Object.keys(db.dna[firstIlju].male || {});

  fKeys.forEach(k => {
    const firstVal = db.dna[firstIlju].female[k];
    const isGeneric = iljus.every(il => db.dna[il].female && db.dna[il].female[k] === firstVal);
    if (isGeneric && firstVal) {
      genericFemaleKeys.push(k);
    }
  });

  mKeys.forEach(k => {
    const firstVal = db.dna[firstIlju].male[k];
    const isGeneric = iljus.every(il => db.dna[il].male && db.dna[il].male[k] === firstVal);
    if (isGeneric && firstVal) {
      genericMaleKeys.push(k);
    }
  });
}

console.log("Generic Female Keys:", genericFemaleKeys);
console.log("Generic Male Keys:", genericMaleKeys);

// Delete generic keys so they fallback to common
iljus.forEach(il => {
  if (db.dna[il].female) {
    genericFemaleKeys.forEach(k => {
      delete db.dna[il].female[k];
    });
  }
  if (db.dna[il].male) {
    genericMaleKeys.forEach(k => {
      delete db.dna[il].male[k];
    });
  }
});

fs.writeFileSync(path, JSON.stringify(db, null, 2), 'utf8');
console.log("Successfully sanitized saju_db.json");
