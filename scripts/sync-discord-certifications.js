const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Official certifications mapping
const DISCORD_CERTIFICATIONS_MAP = [
  {
    keywords: ["ppalourd", "ppa lourd", "lourd"],
    title: "Armement Tactique & PPA Lourd",
    badgeName: "PPA Lourd",
    badgeIcon: "Crosshair",
    category: "Armement",
    description: "Habilitation au port d'arme lourde de service et d'intervention tactique.",
  },
  {
    keywords: ["ppa", "permisdeportdarme"],
    title: "Permis de Port d'Arme (PPA)",
    badgeName: "PPA Civil",
    badgeIcon: "Shield",
    category: "Armement",
    description: "Certification de maniement et port d'arme de poing réglementaire.",
  },
  {
    keywords: ["asd", "airsupport", "aerien", "supportaerien", "pilot", "helico"],
    title: "Air Support Division (ASD)",
    badgeName: "Pilote ASD",
    badgeIcon: "Plane",
    category: "Aérien",
    description: "Pilote breveté de la division aérienne de police (Hélicoptère).",
  },
  {
    keywords: ["leadnegociation", "negociat", "negociation"],
    title: "Lead Négociation & Prises d'Otage",
    badgeName: "Négociateur",
    badgeIcon: "MessageSquare",
    category: "Tactique",
    description: "Spécialiste de la désescalade, médiation et négociation de crise.",
  },
  {
    keywords: ["leaddispatch", "dispatch"],
    title: "Lead Dispatch & Régulation Radio",
    badgeName: "Lead Dispatch",
    badgeIcon: "Radio",
    category: "Procédure",
    description: "Gestion des fréquences radio, affectation des appels et supervision 10-Codes.",
  },
  {
    keywords: ["brevetpsychologique", "psychologique", "psycho"],
    title: "Brevet Psychologique & Aptitude",
    badgeName: "Brevet Psycho",
    badgeIcon: "Brain",
    category: "Spécialité",
    description: "Aptitude psychologique validée pour interventions sous haute tension.",
  },
  {
    keywords: ["formationperimetredesecurite", "perimetredesecurite", "perimetre"],
    title: "Périmètres de Sécurité & Zonage",
    badgeName: "Périmètre Sécurité",
    badgeIcon: "ShieldAlert",
    category: "Procédure",
    description: "Mise en place de cordons de sécurité, rubalise et sécurisation de scènes de crime.",
  },
  {
    keywords: ["formationcallradio", "callradio", "radiocode"],
    title: "Procédures Radio & 10-Codes",
    badgeName: "Procédures Radio",
    badgeIcon: "Radio",
    category: "Procédure",
    description: "Maîtrise des protocoles radio, 10-codes et phraséologie de service.",
  },
  {
    keywords: ["formationprocedure", "procedure", "miranda"],
    title: "Procédures Légales & Droits Miranda",
    badgeName: "Procédures Légales",
    badgeIcon: "FileText",
    category: "Procédure",
    description: "Respect des règles de garde à vue, rédaction des PV et lecture des droits.",
  },
  {
    keywords: ["formateur", "instructeur", "fto"],
    title: "Formateur Police Academy (FTO)",
    badgeName: "Instructeur FTO",
    badgeIcon: "GraduationCap",
    category: "Spécialité",
    description: "Habilité à former, évaluer et instruire les nouvelles recrues du LSPD.",
  },
  {
    keywords: ["responsablepa", "directionpa"],
    title: "Direction Police Academy",
    badgeName: "Responsable Academy",
    badgeIcon: "Award",
    category: "Spécialité",
    description: "Cadre formateur responsable du cursus d'incorporation de l'Academy.",
  },
  {
    keywords: ["recruteurpa", "recruteurlspd", "recruteur", "recrutement"],
    title: "Division du Recrutement & RH",
    badgeName: "Officier Recruteur",
    badgeIcon: "UserCheck",
    category: "Spécialité",
    description: "Officier habilité aux entretiens d'embauche et sélection des postulants.",
  },
  {
    keywords: ["hp", "highpursuit", "interception"],
    title: "High Pursuit & Interception Rapide (HP)",
    badgeName: "Pilote HP",
    badgeIcon: "Zap",
    category: "Conduite",
    description: "Conduite d'urgence avancée, manœuvres PIT et neutralisation de véhicules en fuite.",
  },
  {
    keywords: ["doa"],
    title: "Division Opérations Aériennes & Spéciales (DOA)",
    badgeName: "Opérateur DOA",
    badgeIcon: "Shield",
    category: "Tactique",
    description: "Unité d'appui opérationnel lourd et interventions coordonnées.",
  },
  {
    keywords: ["marry", "mary", "moto", "motard"],
    title: "Brigade Motorisée (Unité Mary)",
    badgeName: "Motard Police",
    badgeIcon: "Bike",
    category: "Conduite",
    description: "Pilote d'intervention motocycliste pour escorte et circulation rapide.",
  },
  {
    keywords: ["leadunites", "leadunite"],
    title: "Commandement de Quart & Lead Unités",
    badgeName: "Lead Unités",
    badgeIcon: "Star",
    category: "Tactique",
    description: "Gestion stratégique des patrouilles sur le terrain et dispatch opérationnel.",
  },
];

const LSPD_RANK_NAMES = [
  "Directeur US Marshal",
  "US Marshal - Superviseur Légal",
  "US Marshal",
  "Chief of Police",
  "Assistant-Chief",
  "Deputy-Chief",
  "Commandant",
  "Capitaine",
  "Lieutenant-Chef",
  "Lieutenant",
  "Sergent-Chef",
  "Sergent",
  "SLO",
  "Officier III",
  "Officier II",
  "Officier I",
  "Rookie",
];

function cleanRoleString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function detectRank(roleNames) {
  for (const roleName of roleNames) {
    const clean = cleanRoleString(roleName);
    if (clean.includes("directeur") && (clean.includes("marshal") || clean.includes("marshall"))) {
      return "Directeur US Marshal";
    }
    if (clean.includes("superviseur") && (clean.includes("marshal") || clean.includes("marshall"))) {
      return "US Marshal - Superviseur Légal";
    }
    if (clean.includes("marshal") || clean.includes("marshall")) {
      return "US Marshal";
    }
  }

  for (const rank of LSPD_RANK_NAMES) {
    const cleanRank = cleanRoleString(rank);
    for (const roleName of roleNames) {
      const cleanRole = cleanRoleString(roleName).replace("offcier", "officier");
      if (cleanRole.includes(cleanRank)) {
        return rank;
      }
    }
  }
  return null;
}

async function run() {
  console.log("=== SCANNER DES RÔLES & CERTIFICATIONS DISCORD LSPD ===");

  const setting = await prisma.discordSetting.findUnique({ where: { id: "default" } });
  const token = setting?.botToken || process.env.DISCORD_BOT_TOKEN;
  const guildId = setting?.guildId || process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    console.error("Configuration Discord incomplète (botToken ou guildId manquant).");
    process.exit(1);
  }

  // 1. Fetch Guild Roles
  console.log("1. Récupération des rôles du serveur Discord...");
  const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!rolesRes.ok) {
    console.error("Impossible de récupérer les rôles Discord :", await rolesRes.text());
    process.exit(1);
  }
  const allGuildRoles = await rolesRes.json();
  console.log(`✓ ${allGuildRoles.length} rôles Discord détectés.`);

  // 2. Fetch Officers from DB
  const officers = await prisma.officer.findMany({
    where: { discordId: { not: null } },
    include: { badges: { include: { course: true } } },
  });

  console.log(`2. Analyse de ${officers.length} officier(s) enregistrés...`);

  let totalUpdated = 0;
  let totalBadgesAdded = 0;

  for (const officer of officers) {
    const discordId = officer.discordId.trim().replace(/[<@!>]/g, "");
    console.log(`\n• Scan de #${officer.badgeNumber} ${officer.name} (Discord ID: ${discordId})...`);

    // Fetch Guild Member
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
      { headers: { Authorization: `Bot ${token}` } }
    );

    if (!memberRes.ok) {
      console.log(`  ⚠️ Membre non présent sur le serveur Discord.`);
      continue;
    }

    const member = await memberRes.json();
    const memberRoleIds = member.roles || [];
    const memberRoles = allGuildRoles.filter((r) => memberRoleIds.includes(r.id));
    const memberRoleNames = memberRoles.map((r) => r.name);
    const cleanedMemberRoleNames = memberRoleNames.map(cleanRoleString);

    console.log(`  Rôles actuels sur Discord : [${memberRoleNames.join(", ")}]`);

    // Detect Rank
    const detectedRank = detectRank(memberRoleNames);
    const isMarshal =
      (detectedRank && detectedRank.toLowerCase().includes("marshal")) ||
      cleanedMemberRoleNames.some((r) => r.includes("marshal") || r.includes("marshall"));

    const isAdmin =
      isMarshal ||
      detectedRank === "Chief of Police" ||
      detectedRank === "Assistant-Chief" ||
      detectedRank === "Deputy-Chief" ||
      cleanedMemberRoleNames.some(
        (r) =>
          r.includes("admin") ||
          r.includes("fondateur") ||
          r.includes("owner") ||
          r.includes("staff") ||
          r.includes("direction")
      );

    const isInstructor = cleanedMemberRoleNames.some(
      (r) => r.includes("formateur") || r.includes("instructeur") || r.includes("fto") || r.includes("responsablepa")
    );

    const isRecruiter = cleanedMemberRoleNames.some(
      (r) => r.includes("recruteur") || r.includes("recrutement")
    );

    const updateData = {};
    if (detectedRank && officer.rank !== detectedRank) {
      console.log(`  -> Mise à jour du grade : ${officer.rank} => ${detectedRank}`);
      updateData.rank = detectedRank;
      if (!isMarshal) {
        updateData.callsign = `${detectedRank.toUpperCase()}-${officer.badgeNumber}`;
      }
    }

    if (isMarshal && officer.department !== "US Marshal") {
      updateData.department = "US Marshal";
    } else if (!isMarshal && officer.department === "US Marshal" && detectedRank && !detectedRank.includes("Marshal")) {
      updateData.department = "LSPD";
    }

    if (officer.isAdmin !== isAdmin) {
      updateData.isAdmin = isAdmin;
    }
    if (officer.isInstructor !== isInstructor) {
      updateData.isInstructor = isInstructor;
    }
    if (officer.isRecruiter !== isRecruiter) {
      updateData.isRecruiter = isRecruiter;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.officer.update({
        where: { id: officer.id },
        data: updateData,
      });
      totalUpdated++;
    }

    // 3. Scan & Award Certifications
    for (const cert of DISCORD_CERTIFICATIONS_MAP) {
      const hasCert = cleanedMemberRoleNames.some((cleanRole) =>
        cert.keywords.some((kw) => cleanRole.includes(kw))
      );

      if (hasCert) {
        // Ensure Course exists
        let course = await prisma.trainingCourse.findFirst({
          where: { title: cert.title },
        });

        if (!course) {
          course = await prisma.trainingCourse.create({
            data: {
              title: cert.title,
              description: cert.description,
              category: cert.category,
              badgeName: cert.badgeName,
              badgeIcon: cert.badgeIcon,
            },
          });
        }

        const alreadyAwarded = officer.badges.some(
          (b) => b.courseId === course.id || b.course?.title?.toLowerCase() === cert.title.toLowerCase()
        );

        if (!alreadyAwarded) {
          await prisma.officerBadge.create({
            data: {
              officerId: officer.id,
              courseId: course.id,
              awardedBy: "Bot Discord • Rôle Synchronisé",
            },
          });
          console.log(`  🎖️ Nouvelle certification attribuée : [${cert.badgeName}] ${cert.title}`);
          totalBadgesAdded++;
        } else {
          console.log(`  ✓ Certification déjà active : [${cert.badgeName}]`);
        }
      }
    }
  }

  console.log("\n=========================================");
  console.log(`✓ Synchronisation terminée avec succès !`);
  console.log(`• Officiers mis à jour : ${totalUpdated}`);
  console.log(`• Nouvelles certifications attribuées : ${totalBadgesAdded}`);
  console.log("=========================================\n");

  process.exit(0);
}

run().catch((e) => {
  console.error("Erreur d'exécution du scanner :", e);
  process.exit(1);
});
