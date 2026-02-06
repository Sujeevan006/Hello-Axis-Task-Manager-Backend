// Simple seed function that does nothing (temporarily)
async function seedAdmin() {
  console.log('⚠️  Seed admin function called but disabled');
  return true;
}

module.exports = { seedAdmin };
