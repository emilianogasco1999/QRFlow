const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Función simple para parsear el archivo .env
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error("No se encontró el archivo .env en la raíz del proyecto.");
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      env[match[1]] = value;
    }
  });
  return env;
}

const env = loadEnv();
const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("La variable MONGODB_URI no está definida en el archivo .env");
  process.exit(1);
}

// Esquema de Mongoose simplificado para el script
const RegistrationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  instagram: { type: String, required: true },
  whatsapp: { type: String, required: true },
  email: { type: String, required: true },
  dob: { type: String, required: true },
  location: { type: String, required: true },
  referral: { type: String, required: true },
  qrToken: { type: String, required: true, unique: true },
  emailSent: { type: Boolean, default: false },
  attended: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
  dni: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

const names = [
  'gonza_ramirez', 'anto_belli', 'facu.torres', 'marti_paz', 'lucas_gimenez',
  'sol.acosta', 'bruno_silva', 'valen.herrera', 'luna_castro', 'mateo.ortiz',
  'cami_sosa', 'thiago.ruiz', 'sofia_leiva', 'joaco.rios', 'mili_molina'
];

const locations = ['Buenos Aires', 'Tucumán', 'Córdoba', 'Rosario', 'Mendoza'];
const referrals = ['Instagram', 'Un amigo', 'Facebook', 'Publicidad', 'TikTok'];
const emailDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.ar'];

async function seed() {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Conexión exitosa.");

    const usersToInsert = [];

    for (let i = 0; i < 15; i++) {
      const instagram = names[i];
      const nameOnly = instagram.replace(/[._]/g, '');
      const email = `${nameOnly}${Math.floor(Math.random() * 90) + 10}@${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`;
      const whatsapp = `+549${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      
      // Fecha de nacimiento aleatoria entre 1995 y 2005
      const birthYear = Math.floor(1995 + Math.random() * 11);
      const birthMonth = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
      const birthDay = String(Math.floor(1 + Math.random() * 28)).padStart(2, '0');
      const dob = `${birthYear}-${birthMonth}-${birthDay}`;

      const location = locations[Math.floor(Math.random() * locations.length)];
      const referral = referrals[Math.floor(Math.random() * referrals.length)];
      const qrToken = crypto.randomBytes(16).toString('hex');
      
      // Algunos registros tendrán DNI y otros no, para probar ambos estados de los botones en el Panel
      const hasDni = Math.random() > 0.4;
      const dni = hasDni ? String(Math.floor(35000000 + Math.random() * 12000000)) : undefined;

      const rawName = names[i];
      const fullName = rawName
        .split(/[._]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const hasPaid = Math.random() > 0.5;

      usersToInsert.push({
        fullName,
        instagram,
        whatsapp,
        email,
        dob,
        location,
        referral,
        qrToken,
        emailSent: false,
        attended: false,
        paid: hasPaid,
        dni
      });
    }

    console.log(`Insertando 15 registros de prueba en la base de datos...`);
    const result = await Registration.insertMany(usersToInsert);
    console.log(`¡Éxito! Se insertaron ${result.length} registros ficticios.`);
    
  } catch (error) {
    console.error("Error al semillar los datos:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Conexión a MongoDB cerrada.");
  }
}

seed();
