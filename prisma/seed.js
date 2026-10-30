const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking reference data (Penal Code & Radio Codes)...");

  // 1. Penal Code: add missing articles; existing ones keep their (admin-edited) values,
  //    only their empty description/section get filled.
  const penalCode = require('./penalCode');
  let added = 0;
  for (const item of penalCode) {
    const existing = await prisma.penalCodeItem.findUnique({ where: { code: item.code } });
    if (!existing) {
      await prisma.penalCodeItem.create({ data: item });
      added++;
    } else if (!existing.description || !existing.section) {
      await prisma.penalCodeItem.update({
        where: { id: existing.id },
        data: {
          description: existing.description || item.description,
          section: existing.section || item.section,
        },
      });
    }
  }
  console.log(`Penal Code: ${added} article(s) added.`);

  const radioCount = await prisma.radioCodeReference.count();
  if (radioCount === 0) {
    console.log("Seeding official Radio Codes...");
    const radioCodes = [
      { codeType: "TEN_CODE", code: "10-1", title: "Officier à terre / en danger", description: "Urgence vitale", orderIndex: 1 },
      { codeType: "TEN_CODE", code: "10-3", title: "Silence Radio", description: "Cesser transmission", orderIndex: 2 },
      { codeType: "TEN_CODE", code: "10-4", title: "Affirmatif", description: "Compris / D'accord", orderIndex: 3 },
      { codeType: "TEN_CODE", code: "10-5", title: "Négatif", description: "Refus / Non", orderIndex: 4 },
      { codeType: "TEN_CODE", code: "10-6", title: "Officier Occupé", description: "Ne peut pas répondre immédiatement", orderIndex: 5 },
      { codeType: "TEN_CODE", code: "10-7", title: "Pause de Service", description: "En pause repas ou administrative", orderIndex: 6 },
      { codeType: "TEN_CODE", code: "10-8", title: "Pris de Service", description: "Disponible pour les appels", orderIndex: 7 },
      { codeType: "TEN_CODE", code: "10-9", title: "Répéter", description: "Répéter la dernière transmission", orderIndex: 8 },
      { codeType: "TEN_CODE", code: "10-10", title: "Fin de Service", description: "Quitte la fréquence", orderIndex: 9 },
      { codeType: "TEN_CODE", code: "10-12", title: "Présence Civils / Témoins", description: "Attention aux oreilles indiscrètes", orderIndex: 10 },
      { codeType: "TEN_CODE", code: "10-13", title: "Coups de feu signalés", description: "Détonations d'armes à feu", orderIndex: 11 },
      { codeType: "TEN_CODE", code: "10-19", title: "Retour au poste (Commissariat)", description: "Retour à Mission Row / Davis", orderIndex: 12 },
      { codeType: "TEN_CODE", code: "10-20", title: "Position / Localisation", description: "Donner votre position actuelle", orderIndex: 13 },
      { codeType: "TEN_CODE", code: "10-23", title: "Arrivé sur les lieux", description: "Sur zone de l'appel", orderIndex: 14 },
      { codeType: "TEN_CODE", code: "10-28", title: "Vérification d'immatriculation", description: "Plaque d'immatriculation à vérifier", orderIndex: 15 },
      { codeType: "TEN_CODE", code: "10-29", title: "Vérification d'identité / Mandats", description: "Fiche citoyen / Casier judiciaire", orderIndex: 16 },
      { codeType: "TEN_CODE", code: "10-38", title: "Contrôle de véhicule en cours", description: "Arrêt routier classique", orderIndex: 17 },
      { codeType: "TEN_CODE", code: "10-41", title: "Prise d'appel / Interpellation", description: "Prend en charge l'intervention", orderIndex: 18 },
      { codeType: "TEN_CODE", code: "10-50", title: "Accident de la circulation", description: "Collision routière", orderIndex: 19 },
      { codeType: "TEN_CODE", code: "10-70", title: "Poursuite de véhicule en cours", description: "Véhicule en fuite (Code 3)", orderIndex: 20 },
      { codeType: "TEN_CODE", code: "10-80", title: "Poursuite à pied en cours", description: "Suspect prenant la fuite à pied", orderIndex: 21 },
      { codeType: "TEN_CODE", code: "10-99", title: "Urgence Absolue / Officier en Détresse", description: "Toutes unités convergentes", orderIndex: 22 },

      { codeType: "URGENCY_CODE", code: "Code 1", title: "Déplacement Normal", description: "Respect du code de la route, pas de sirènes ni gyrophares", orderIndex: 23 },
      { codeType: "URGENCY_CODE", code: "Code 2", title: "Urgence Modérée", description: "Gyrophares seuls sans avertisseur sonore", orderIndex: 24 },
      { codeType: "URGENCY_CODE", code: "Code 3", title: "Urgence Maximale", description: "Gyrophares et deux-tons continus (priorité absolue)", orderIndex: 25 },
      { codeType: "URGENCY_CODE", code: "Code 4", title: "Situation Sous Contrôle", description: "Fin d'alerte, unités non engagées peuvent reprendre leur patrouille", orderIndex: 26 },
      { codeType: "URGENCY_CODE", code: "Code 5", title: "Surveillance Discrète", description: "Ne pas approcher avec gyrophares, zone sous filature", orderIndex: 27 },

      { codeType: "UNIT_CALLSIGN", code: "ADAM (A)", title: "Patrouille Standard", description: "Unité véhiculée classique à 2 officiers", orderIndex: 28 },
      { codeType: "UNIT_CALLSIGN", code: "LINCOLN (L)", title: "Patrouille Solo / Superviseur", description: "Officier seul ou superviseur de quart", orderIndex: 29 },
      { codeType: "UNIT_CALLSIGN", code: "MARY (M)", title: "Unité Moto", description: "Brigade motorisée d'intervention rapide", orderIndex: 30 },
      { codeType: "UNIT_CALLSIGN", code: "HENRY (H)", title: "Support Aérien", description: "Hélicoptère de police (Air Support)", orderIndex: 31 },
      { codeType: "UNIT_CALLSIGN", code: "DAVID (D)", title: "SWAT / Unité Spéciale", description: "Unité tactique d'intervention lourde", orderIndex: 32 },
      { codeType: "UNIT_CALLSIGN", code: "K9", title: "Unité Cynophile", description: "Maître-chien de patrouille", orderIndex: 33 },
    ];

    for (const rc of radioCodes) {
      await prisma.radioCodeReference.create({ data: rc });
    }
  }

  console.log("Database clean & reference data verified.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
