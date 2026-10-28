const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking reference data (Penal Code & Radio Codes)...");

  // 1. Seed Penal Code Items only if table is empty
  const penalCount = await prisma.penalCodeItem.count();
  if (penalCount === 0) {
    console.log("Seeding official Penal Code...");
    const penalCode = [
      // Contraventions (11)
      { code: "CP 100", title: "Excès de vitesse", category: "Contraventions", fine: 2000, jailTime: 0, secondarySanction: null, orderIndex: 1 },
      { code: "CP 110", title: "Conduite sans permis valide", category: "Contraventions", fine: 6500, jailTime: 0, secondarySanction: null, orderIndex: 2 },
      { code: "CP 113", title: "Participation à un convoi illégal", category: "Contraventions", fine: 6000, jailTime: 0, secondarySanction: "Suspension du permis de conduire", orderIndex: 3 },
      { code: "CP 117", title: "Usage de stupéfiants", category: "Contraventions", fine: 15000, jailTime: 0, secondarySanction: "Confiscation des produits", orderIndex: 4 },
      { code: "CP 118", title: "Détention de matériel destiné à la consommation ou à la production de stupéfiants", category: "Contraventions", fine: 12000, jailTime: 0, secondarySanction: "Confiscation du matériel", orderIndex: 5 },
      { code: "CP 131", title: "Tapage nocturne", category: "Contraventions", fine: 2500, jailTime: 0, secondarySanction: null, orderIndex: 6 },
      { code: "CP 132", title: "Ivresse publique manifeste", category: "Contraventions", fine: 3000, jailTime: 0, secondarySanction: null, orderIndex: 7 },
      { code: "CP 135", title: "Occupation illégale d'un lieu", category: "Contraventions", fine: 4500, jailTime: 0, secondarySanction: "Expulsion immédiate des lieux", orderIndex: 8 },
      { code: "CP 136", title: "Dépôt sauvage de déchets", category: "Contraventions", fine: 5000, jailTime: 0, secondarySanction: "Remise en état à la charge de l'auteur", orderIndex: 9 },
      { code: "CP 138", title: "Obstruction à la voie publique", category: "Contraventions", fine: 3500, jailTime: 0, secondarySanction: "Enlèvement de l'obstacle aux frais de l'auteur", orderIndex: 10 },
      { code: "CD 19", title: "Manquement au devoir de réserve", category: "Contraventions", fine: 4000, jailTime: 0, secondarySanction: null, orderIndex: 11 },

      // Délits (7)
      { code: "CP 200", title: "Refus d'obtempérer", category: "Délits", fine: 10000, jailTime: 20, secondarySanction: null, orderIndex: 12 },
      { code: "CP 210", title: "Port d'arme illégal", category: "Délits", fine: 20000, jailTime: 30, secondarySanction: "Confiscation de l'arme", orderIndex: 13 },
      { code: "CP 120", title: "Conduite en état d'ivresse", category: "Délits", fine: 12000, jailTime: 20, secondarySanction: "Retrait immédiat du permis", orderIndex: 14 },
      { code: "CP 121", title: "Délit de fuite", category: "Délits", fine: 15000, jailTime: 30, secondarySanction: null, orderIndex: 15 },
      { code: "CP 205", title: "Outrage à agent", category: "Délits", fine: 8000, jailTime: 15, secondarySanction: null, orderIndex: 16 },
      { code: "CP 220", title: "Détention de stupéfiants", category: "Délits", fine: 18000, jailTime: 30, secondarySanction: "Confiscation des produits", orderIndex: 17 },
      { code: "CP 230", title: "Vol de véhicule", category: "Délits", fine: 25000, jailTime: 40, secondarySanction: "Restitution au propriétaire", orderIndex: 18 },

      // Crimes (5)
      { code: "CP 300", title: "Violence aggravée", category: "Crimes", fine: 35000, jailTime: 60, secondarySanction: null, orderIndex: 19 },
      { code: "CP 310", title: "Braquage de commerce", category: "Crimes", fine: 50000, jailTime: 90, secondarySanction: null, orderIndex: 20 },
      { code: "CP 320", title: "Prise d'otage", category: "Crimes", fine: 80000, jailTime: 120, secondarySanction: null, orderIndex: 21 },
      { code: "CP 330", title: "Trafic de stupéfiants", category: "Crimes", fine: 70000, jailTime: 100, secondarySanction: "Saisie des biens", orderIndex: 22 },
      { code: "CP 340", title: "Tentative de meurtre", category: "Crimes", fine: 90000, jailTime: 120, secondarySanction: null, orderIndex: 23 },

      // Crimes fédéraux (2)
      { code: "CP 400", title: "Trafic d'armes", category: "Crimes fédéraux", fine: 100000, jailTime: 120, secondarySanction: "Transfert au procureur fédéral", orderIndex: 24 },
      { code: "CP 410", title: "Meurtre sur agent des forces de l'ordre", category: "Crimes fédéraux", fine: 150000, jailTime: 180, secondarySanction: "Transfert au procureur fédéral", orderIndex: 25 },
    ];

    for (const item of penalCode) {
      await prisma.penalCodeItem.create({ data: item });
    }
  }

  // 2. Seed Radio Codes only if table is empty
  const radioCount = await prisma.radioCodeReference.count();
  if (radioCount === 0) {
    console.log("Seeding official Radio Codes...");
    const radioCodes = [
      { codeType: "TEN_CODE", code: "10-1", title: "Officier à terre / en danger", description: "Priorité absolue sur la fréquence", orderIndex: 1 },
      { codeType: "TEN_CODE", code: "10-3", title: "Silence Radio", description: "Cesser toute communication non vitale", orderIndex: 2 },
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
