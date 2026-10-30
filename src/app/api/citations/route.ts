import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const MAX_PHOTOS = 6;
// shortcut: images are stored inline as compressed data: URLs in the DB; move to object storage (Supabase Storage) if volume grows.
const MAX_DATA_URL_LENGTH = 1_500_000;

/** Validates PV evidence photos: http(s) links or base64 image data URLs. Returns JSON string, null, or an error. */
function parsePhotos(raw: unknown): { value: string | null } | { error: string } {
  if (raw === undefined || raw === null) return { value: null };
  if (!Array.isArray(raw)) return { error: "Format des photos invalide." };
  if (raw.length > MAX_PHOTOS) return { error: `${MAX_PHOTOS} photos maximum par procès-verbal.` };
  const photos = [];
  for (const url of raw) {
    if (typeof url !== "string") return { error: "Format des photos invalide." };
    const isLink = /^https?:\/\/\S+$/i.test(url) && url.length <= 2000;
    const isImage = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(url) && url.length <= MAX_DATA_URL_LENGTH;
    if (!isLink && !isImage) return { error: "Photo refusée : lien http(s) ou image (max ~1 Mo) uniquement." };
    photos.push({ id: crypto.randomUUID(), url, createdAt: new Date().toISOString() });
  }
  return { value: photos.length ? JSON.stringify(photos) : null };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 20;

    const citations = await prisma.citation.findMany({
      take: limit,
      include: {
        citizen: true,
        officer: true,
        items: {
          include: {
            penalCodeItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(citations);
  } catch (error) {
    console.error("GET citations error:", error);
    return NextResponse.json({ error: "Failed to fetch citations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let citizenId = body.citizenId;

    const photos = parsePhotos(body.photos);
    if ("error" in photos) {
      return NextResponse.json({ error: photos.error }, { status: 400 });
    }

    // If citizenId not provided or citizen details sent directly:
    const citizenData = body.citizen || {
      firstName: body.citizenFirstName,
      lastName: body.citizenLastName,
      phone: body.citizenPhone,
      job: body.citizenJob,
      driverLicense: body.driverLicense,
    };

    if (!citizenId && (citizenData.firstName || citizenData.phone)) {
      const cleanPhone = citizenData.phone ? citizenData.phone.trim() : null;
      const cleanFirst = citizenData.firstName ? citizenData.firstName.trim() : "";
      const cleanLast = citizenData.lastName ? citizenData.lastName.trim() : "";

      let existingCitizen = null;

      // 1. Check primary unique identifier: Phone number
      if (cleanPhone && cleanPhone !== "555-") {
        existingCitizen = await prisma.citizen.findFirst({
          where: {
            phone: { equals: cleanPhone, mode: "insensitive" },
          },
        });
      }

      // 2. Fallback check: First name & Last name
      if (!existingCitizen && cleanFirst && cleanLast) {
        existingCitizen = await prisma.citizen.findFirst({
          where: {
            firstName: { equals: cleanFirst, mode: "insensitive" },
            lastName: { equals: cleanLast, mode: "insensitive" },
          },
        });
      }

      if (existingCitizen) {
        citizenId = existingCitizen.id;
        // If phone wasn't set or updated, save it
        if ((!existingCitizen.phone || existingCitizen.phone === "555-") && cleanPhone) {
          await prisma.citizen.update({
            where: { id: existingCitizen.id },
            data: { phone: cleanPhone },
          });
        }
      } else if (cleanFirst || cleanLast) {
        // Create new citizen record automatically
        const newCit = await prisma.citizen.create({
          data: {
            firstName: cleanFirst || "Inconnu",
            lastName: cleanLast || "Inconnu",
            phone: cleanPhone || null,
            birthDate: "1995-01-01",
            gender: "M",
            job: citizenData.job || "Sans emploi",
            driverLicense: citizenData.driverLicense || "Valide",
            weaponLicense: "Non titulaire",
            dangerLevel: "Faible",
          },
        });
        citizenId = newCit.id;
      }
    }

    if (!citizenId) {
      return NextResponse.json(
        { error: "Veuillez spécifier ou identifier un citoyen pour dresser le procès-verbal." },
        { status: 400 }
      );
    }

    const count = await prisma.citation.count();
    const citationNumber = `PV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const citation = await prisma.citation.create({
      data: {
        citationNumber,
        citizenId,
        officerId: body.officerId,
        location: body.location || "Los Santos",
        notes: body.notes || null,
        totalFine: Number(body.totalFine) || 0,
        totalJailTime: Number(body.totalJailTime) || 0,
        status: body.status || "Impayée",
        photos: photos.value,
        items: {
          create: (body.items || []).map((item: any) => ({
            penalCodeItemId: item.penalCodeItemId,
            count: Number(item.count) || 1,
            fine: Number(item.fine) || 0,
            jailTime: Number(item.jailTime) || 0,
          })),
        },
      },
      include: {
        citizen: true,
        officer: true,
        items: {
          include: {
            penalCodeItem: true,
          },
        },
      },
    });

    return NextResponse.json(citation, { status: 201 });
  } catch (error) {
    console.error("POST citation error:", error);
    return NextResponse.json({ error: "Failed to create citation" }, { status: 500 });
  }
}
