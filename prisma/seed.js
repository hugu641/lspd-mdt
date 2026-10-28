const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding LSPD MDT database...");

  const officerCount = await prisma.officer.count();
  if (officerCount > 0 && process.env.FORCE_SEED !== "true") {
    console.log("Database already contains data (" + officerCount + " officers found). Skipping seed to preserve data.");
    return;
  }

  // Clean old data if any
  await prisma.citationItem.deleteMany();
  await prisma.citation.deleteMany();
  await prisma.arrestReport.deleteMany();
  await prisma.warrant.deleteMany();
  await prisma.registeredWeapon.deleteMany();
  await prisma.registeredVehicle.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.trainingRegistration.deleteMany();
  await prisma.trainingSession.deleteMany();
  await prisma.officerBadge.deleteMany();
  await prisma.trainingCourse.deleteMany();
  await prisma.radioCodeReference.deleteMany();
  await prisma.penalCodeItem.deleteMany();
  await prisma.officer.deleteMany();
  await prisma.citizen.deleteMany();

  // 1. Seed Officers
  const chief = await prisma.officer.create({
    data: {
      badgeNumber: "01",
      name: "Marcus Vance",
      callsign: "1-LINCOLN-01",
      rank: "Chief of Police",
      department: "LSPD",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      phone: "555-0101",
      status: "10-8",
      unitType: "Lincoln",
      isInstructor: true,
      isAdmin: true,
    },
  });

  const captain = await prisma.officer.create({
    data: {
      badgeNumber: "12",
      name: "Sarah Connor",
      callsign: "1-ADAM-12",
      rank: "Capitaine",
      department: "LSPD",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      phone: "555-0112",
      status: "10-8",
      unitType: "Adam",
      isInstructor: true,
      isAdmin: true,
    },
  });

  const sergeant = await prisma.officer.create({
    data: {
      badgeNumber: "34",
      name: "David Miller",
      callsign: "2-DAVID-34",
      rank: "Sergent-Chef",
      department: "LSPD",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      phone: "555-0134",
      status: "10-8",
      unitType: "David",
      isInstructor: true,
      isAdmin: false,
    },
  });

  const officer2 = await prisma.officer.create({
    data: {
      badgeNumber: "77",
      name: "Lucas Ray",
      callsign: "3-ADAM-77",
      rank: "Officier II",
      department: "LSPD",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      phone: "555-0177",
      status: "10-8",
      unitType: "Adam",
      isInstructor: false,
      isAdmin: false,
    },
  });

  const rookie = await prisma.officer.create({
    data: {
      badgeNumber: "99",
      name: "Alex Mercer",
      callsign: "4-ROOKIE-99",
      rank: "Rookie",
      department: "LSPD",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
      phone: "555-0199",
      status: "10-8",
      unitType: "Adam",
      isInstructor: false,
      isAdmin: false,
    },
  });

  // 2. Seed Penal Code Items (Exact list provided by user)
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

  // 3. Seed Radio Codes (Exact list provided by user)
  const radioCodes = [
    { codeType: "TEN_CODE", code: "10-1", title: "Officier à terre / en danger", description: "Priorité absolue sur la fréquence", orderIndex: 1 },
    { codeType: "TEN_CODE", code: "10-3", title: "Silence Radio", description: "Cesser toute communication non vitale", orderIndex: 2 },
    { codeType: "TEN_CODE", code: "10-4", title: "Affirmatif", description: "Compris / D'accord", orderIndex: 3 },
    { codeType: "TEN_CODE", code: "10-5", title: "Négatif", description: "Refus / Non", orderIndex: 4 },
    { codeType: "TEN_CODE", code: "10-6", title: "Officier Occupé", description: "Ne peut pas répondre immédiatement", orderIndex: 5 },
    { codeType: "TEN_CODE", code: "10-7", title: "Pause de Service", description: "En pause repas ou administrative", orderIndex: 6 },
    { codeType: "TEN_CODE", code: "10-8", title: "Pris de Service", description: "Disponible pour les appels", orderIndex: 7 },
    { codeType: "TEN_CODE", code: "10-9", title: "Répéter", description: "Répéter la dernière transmission", orderIndex: 8 },
    { codeType: "TEN_CODE", code: "10-10", title: "Fin de Service", description: "Déconnexion de la fréquence", orderIndex: 9 },
    { codeType: "TEN_CODE", code: "10-14", title: "Prise d'otage", description: "Situation d'otage en cours", orderIndex: 10 },
    { codeType: "TEN_CODE", code: "10-17", title: "En Route Vers", description: "Déplacement vers la position indiquée", orderIndex: 11 },
    { codeType: "TEN_CODE", code: "10-19", title: "Retour PDP", description: "Retour au Poste de Police", orderIndex: 12 },
    { codeType: "TEN_CODE", code: "10-20", title: "Demande de Localisation", description: "Où vous trouvez-vous ?", orderIndex: 13 },
    { codeType: "TEN_CODE", code: "10-22", title: "Annulez le Dernier Message", description: "Information caduque", orderIndex: 14 },
    { codeType: "TEN_CODE", code: "10-30", title: "Coup de feu", description: "Tirs d'armes à feu signalés", orderIndex: 15 },
    { codeType: "TEN_CODE", code: "10-33", title: "Suspect appréhendé", description: "Individu sous contrôle et menotté", orderIndex: 16 },
    { codeType: "TEN_CODE", code: "10-35", title: "Demande de Renforts", description: "Besoin d'unités supplémentaires sur zone", orderIndex: 17 },
    { codeType: "TEN_CODE", code: "10-37", title: "Véhicule Suspect", description: "Signalement d'un véhicule d'intérêt", orderIndex: 18 },
    { codeType: "TEN_CODE", code: "10-38", title: "Contrôle Routier", description: "Arrêt d'un véhicule pour vérification", orderIndex: 19 },
    { codeType: "TEN_CODE", code: "10-40", title: "En Attente d'Affectation", description: "En attente d'une mission dispatch", orderIndex: 20 },
    { codeType: "TEN_CODE", code: "10-41", title: "Début de Patrouille", description: "Prise de patrouille sur secteur", orderIndex: 21 },
    { codeType: "TEN_CODE", code: "10-42", title: "Fin de Patrouille", description: "Retour secteur / fin de mission", orderIndex: 22 },
    { codeType: "TEN_CODE", code: "10-43", title: "Rapport de Situation", description: "Donner l'état des lieux", orderIndex: 23 },
    { codeType: "TEN_CODE", code: "10-44", title: "Demande de Quitter la patrouille", description: "Autorisation de quitter le secteur", orderIndex: 24 },
    { codeType: "TEN_CODE", code: "10-45", title: "Braquage", description: "Braquage à main armée en cours", orderIndex: 25 },
    { codeType: "TEN_CODE", code: "10-50", title: "Accident de la Route", description: "Collision matérielle ou corporelle", orderIndex: 26 },
    { codeType: "TEN_CODE", code: "10-52", title: "Demande d'assistance Médicale", description: "Besoin urgent des EMS sur les lieux", orderIndex: 27 },
    { codeType: "TEN_CODE", code: "10-60", title: "Ventes de Drogues", description: "Activité de deal constatée", orderIndex: 28 },
    { codeType: "TEN_CODE", code: "10-80", title: "Refus d'Obtempérer", description: "Poursuite de véhicule en fuite", orderIndex: 29 },
    { codeType: "TEN_CODE", code: "10-99", title: "Appel à toutes les Unités", description: "Urgence maximale généralisée", orderIndex: 30 },

    // Indicatifs Unités (Exact list provided)
    { codeType: "UNIT_CALLSIGN", code: "Lincoln", title: "Patrouille Seul", description: "Officier patrouillant en unité solo", orderIndex: 31 },
    { codeType: "UNIT_CALLSIGN", code: "Adam", title: "Patrouille à Deux", description: "Binôme standard en patrouille", orderIndex: 32 },
    { codeType: "UNIT_CALLSIGN", code: "Tango", title: "Patrouille à Trois", description: "Trinôme de patrouille", orderIndex: 33 },
    { codeType: "UNIT_CALLSIGN", code: "XRay", title: "Patrouille à Quatre", description: "Unité lourde à 4 officiers", orderIndex: 34 },
    { codeType: "UNIT_CALLSIGN", code: "Victor", title: "Patrouille à Vélo", description: "Unité cycliste de proximité", orderIndex: 35 },
    { codeType: "UNIT_CALLSIGN", code: "Mary", title: "Patrouille à Moto", description: "Unité motocycliste rapide", orderIndex: 36 },
    { codeType: "UNIT_CALLSIGN", code: "Henry", title: "Patrouille en Hélicoptère", description: "Soutien aérien Air Support", orderIndex: 37 },
    { codeType: "UNIT_CALLSIGN", code: "David", title: "Patrouille SWAT", description: "Équipe d'intervention tactique", orderIndex: 38 },
    { codeType: "UNIT_CALLSIGN", code: "Nora", title: "Patrouille DOA", description: "Division d'Opérations Aériennes / Armées", orderIndex: 39 },

    // Codes d'urgence
    { codeType: "URGENCY_CODE", code: "CODE 1", title: "Non Urgent", description: "Aucun Gyro, respect normal du code de la route", orderIndex: 40 },
    { codeType: "URGENCY_CODE", code: "CODE 2", title: "Urgence", description: "Gyrophares allumés SANS sirène", orderIndex: 41 },
    { codeType: "URGENCY_CODE", code: "CODE 3", title: "Urgence Grave", description: "Gyrophares + Sirène 2 tons (priorité absolue)", orderIndex: 42 },
    { codeType: "URGENCY_CODE", code: "CODE 4", title: "Intervention Terminée", description: "Situation sous contrôle, reprise normale", orderIndex: 43 },
  ];

  for (const rc of radioCodes) {
    await prisma.radioCodeReference.create({ data: rc });
  }

  // 4. Seed Training Courses & Badges
  const courseEVOC = await prisma.trainingCourse.create({
    data: {
      title: "EVOC - Conduite Haute Vitesse & Manœuvre PIT",
      description: "Apprentissage des techniques de poursuite, de la manœuvre d'interception PIT et de la conduite sous Code 3.",
      category: "Conduite",
      badgeName: "Pilote EVOC Interception",
      badgeIcon: "Zap",
      prerequisiteRank: "Officier I",
      creatorId: captain.id,
    },
  });

  const courseAir = await prisma.trainingCourse.create({
    data: {
      title: "Air Support - Pilotage Tactique Hélicoptère (Henry)",
      description: "Qualification au pilotage de l'hélicoptère de police, repérage thermique, guidage radio et surveillance en vol stationnaire.",
      category: "Aérien",
      badgeName: "Pilote Aérien (Air Support)",
      badgeIcon: "Plane",
      prerequisiteRank: "Officier II",
      creatorId: chief.id,
    },
  });

  const courseSWAT = await prisma.trainingCourse.create({
    data: {
      title: "SWAT / Unité Tactique (David)",
      description: "Assauts de bâtiments, prises d'otages, brèches, armement lourd et techniques de bouclier balistique.",
      category: "Tactique",
      badgeName: "Opérateur SWAT Tactique",
      badgeIcon: "ShieldAlert",
      prerequisiteRank: "Officier III",
      creatorId: sergeant.id,
    },
  });

  const courseK9 = await prisma.trainingCourse.create({
    data: {
      title: "K9 - Maître-Chien & Détection Cynophile",
      description: "Entraînement avec les chiens de police pour la recherche de stupéfiants, pistage de fugitifs et neutralisation.",
      category: "Spécialité",
      badgeName: "Conducteur K9",
      badgeIcon: "Dog",
      prerequisiteRank: "Officier I",
      creatorId: captain.id,
    },
  });

  const courseFTO = await prisma.trainingCourse.create({
    data: {
      title: "FTO - Instructeur de Terrain (Field Training Officer)",
      description: "Formation pédagogique pour encadrer, noter et valider la période probatoire des Rookies.",
      category: "Pédagogique",
      badgeName: "Instructeur FTO Certifié",
      badgeIcon: "GraduationCap",
      prerequisiteRank: "Sergent",
      creatorId: chief.id,
    },
  });

  // Assign some badges to existing officers
  await prisma.officerBadge.create({
    data: { officerId: captain.id, courseId: courseEVOC.id, awardedBy: chief.name },
  });
  await prisma.officerBadge.create({
    data: { officerId: sergeant.id, courseId: courseSWAT.id, awardedBy: chief.name },
  });
  await prisma.officerBadge.create({
    data: { officerId: sergeant.id, courseId: courseEVOC.id, awardedBy: captain.name },
  });
  await prisma.officerBadge.create({
    data: { officerId: officer2.id, courseId: courseEVOC.id, awardedBy: captain.name },
  });

  // 5. Seed Training Sessions
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(21, 0, 0, 0);

  const session1 = await prisma.trainingSession.create({
    data: {
      courseId: courseEVOC.id,
      instructorId: captain.id,
      scheduledAt: tomorrow,
      location: "Aérodrome désaffecté de Sandy Shores",
      maxSeats: 4,
      status: "Planifiée",
      notes: "Amener tenue de patrouille et véhicule d'interception attribué.",
    },
  });

  // Register rookie to session1
  await prisma.trainingRegistration.create({
    data: {
      sessionId: session1.id,
      officerId: rookie.id,
      status: "Inscrit",
      notes: "Validation première étape demandée par l'instructeur",
    },
  });

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 4);
  nextWeek.setHours(20, 30, 0, 0);

  await prisma.trainingSession.create({
    data: {
      courseId: courseSWAT.id,
      instructorId: sergeant.id,
      scheduledAt: nextWeek,
      location: "Centre d'entraînement tactique PDP",
      maxSeats: 6,
      status: "Planifiée",
      notes: "Test physique préalable obligatoire. Équipement balistique complet.",
    },
  });

  // 6. Seed Citizens (Dossiers Citoyens)
  const citizen1 = await prisma.citizen.create({
    data: {
      firstName: "Dmitri",
      lastName: "Voronov",
      birthDate: "1988-04-12",
      gender: "M",
      phone: "555-9821",
      address: "Appartement 14, Vespucci Canals",
      job: "Mécanicien Benny's",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
      driverLicense: "Suspendu",
      weaponLicense: "Non titulaire",
      dangerLevel: "Armé et dangereux",
      notes: "Suspect récurrent dans les affaires de convois illégaux et trafic d'armes. Ne jamais approcher sans unité de renfort.",
    },
  });

  const citizen2 = await prisma.citizen.create({
    data: {
      firstName: "Emily",
      lastName: "Parker",
      birthDate: "1995-11-23",
      gender: "F",
      phone: "555-4432",
      address: "21 Spanish Avenue, Vinewood",
      job: "Agent Immobilier Dynasty8",
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      driverLicense: "Valide",
      weaponLicense: "Valide",
      dangerLevel: "Faible",
      notes: "Citoyenne coopérative, signalée pour quelques excès de vitesse en centre-ville.",
    },
  });

  const citizen3 = await prisma.citizen.create({
    data: {
      firstName: "Tyrell",
      lastName: "Jackson",
      birthDate: "2001-08-05",
      gender: "M",
      phone: "555-7761",
      address: "Grove Street, Davis",
      job: "Livreur",
      photoUrl: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150",
      driverLicense: "Valide",
      weaponLicense: "Non titulaire",
      dangerLevel: "Modéré",
      notes: "Connu pour refus d'obtempérer et détention de stupéfiants.",
    },
  });

  // 7. Seed Vehicles & Weapons
  await prisma.registeredVehicle.create({
    data: {
      plate: "82VOR099",
      model: "Karin Sultan RS",
      color: "Noir Mat",
      status: "BOLO / Recherché",
      notes: "Signalé lors d'un délit de fuite sur le Boulevard Del Perro.",
      ownerId: citizen1.id,
    },
  });

  await prisma.registeredVehicle.create({
    data: {
      plate: "77EPK312",
      model: "Pfister Comet S2",
      color: "Bleu Nuit",
      status: "En règle",
      notes: "Véhicule propre et assuré.",
      ownerId: citizen2.id,
    },
  });

  await prisma.registeredWeapon.create({
    data: {
      serialNumber: "SN-998241",
      weaponType: "Arme de poing",
      modelName: "Combat Pistol 9mm",
      status: "En règle",
      notes: "Permis PPA valide enregistré.",
      ownerId: citizen2.id,
    },
  });

  await prisma.registeredWeapon.create({
    data: {
      serialNumber: "SN-ILLEGAL-04",
      weaponType: "Fusil d'assaut",
      modelName: "Special Carbine",
      status: "Recherche",
      notes: "Numéro de série meulé en partie, recherché dans l'affaire Voronov.",
      ownerId: citizen1.id,
    },
  });

  // 8. Seed Warrants / BOLO
  await prisma.warrant.create({
    data: {
      warrantNumber: "WRT-2026-004",
      type: "WARRANT",
      title: "Mandat d'arrêt : Trafic de stupéfiants & Refus d'obtempérer",
      description: "Individu recherché suite à une saisie de stupéfiants et délit de fuite armé. À appréhender avec prudence.",
      dangerLevel: "Armé et dangereux",
      status: "Actif",
      officerId: captain.id,
      citizenId: citizen1.id,
    },
  });

  await prisma.warrant.create({
    data: {
      warrantNumber: "BOLO-2026-012",
      type: "BOLO_VEHICLE",
      title: "BOLO Véhicule : Sultan RS Noir Mat",
      description: "Plaque 82VOR099. Impliqué dans un refus d'obtempérer sur l'autoroute de Paleto.",
      dangerLevel: "Modéré",
      status: "Actif",
      officerId: officer2.id,
      vehiclePlate: "82VOR099",
    },
  });

  // 9. Seed Citations (using exact penal code items)
  const cpSpeed = await prisma.penalCodeItem.findUnique({ where: { code: "CP 100" } });
  const cpRefusal = await prisma.penalCodeItem.findUnique({ where: { code: "CP 200" } });

  const citation1 = await prisma.citation.create({
    data: {
      citationNumber: "PV-2026-001",
      citizenId: citizen2.id,
      officerId: officer2.id,
      location: "Boulevard Del Perro / Rockford",
      notes: "Contrôle radar à 145 km/h en zone 70.",
      totalFine: 2000,
      totalJailTime: 0,
      status: "Impayée",
    },
  });

  if (cpSpeed) {
    await prisma.citationItem.create({
      data: {
        citationId: citation1.id,
        penalCodeItemId: cpSpeed.id,
        count: 1,
        fine: cpSpeed.fine,
        jailTime: cpSpeed.jailTime,
      },
    });
  }

  // 10. Seed Investigation
  await prisma.investigation.create({
    data: {
      caseNumber: "INV-2026-08",
      title: "Réseau de trafic d'armes et convois nocturnes",
      summary: "Enquête conjointe sur un réseau de distribution d'armes semi-automatiques sévissant dans la zone des canaux de Vespucci.",
      status: "En cours",
      dangerLevel: "Élevé",
      leadOfficerId: sergeant.id,
      suspects: "Dmitri Voronov (Principal suspect), contact inconnu sur Sandy Shores",
      evidence: "Photographies de surveillance aux quais de l'Est, balles de calibre 7.62 retrouvées sur place.",
      notes: "Surveillance discrète recommandée, ne pas intervenir seul.",
    },
  });

  console.log("Database seeded successfully with all LSPD rules, penal code, radio codes and grades!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
