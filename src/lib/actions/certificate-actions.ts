"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  certificateSchema,
  type CertificateFormData,
} from "@/lib/validations/certificate";
import {
  getPermissionErrorMessage,
  requireAuth,
  requireRole,
  WRITE_ROLES,
} from "@/lib/permissions";

function serializeCertificate(certificate: Awaited<ReturnType<typeof getCertificatePayload>>) {
  if (!certificate) return null;

  return {
    ...certificate,
    issueDate: certificate.issueDate.toISOString(),
    eventDate: certificate.eventDate?.toISOString() ?? null,
    createdAt: certificate.createdAt.toISOString(),
    updatedAt: certificate.updatedAt.toISOString(),
  };
}

async function getCertificatePayload(id: string) {
  return prisma.certificate.findUnique({
    where: { id },
    include: {
      person: {
        select: {
          id: true,
          fullName: true,
          photoUrl: true,
          personType: true,
        },
      },
    },
  });
}

export async function getCertificates() {
  await requireAuth();

  const certificates = await prisma.certificate.findMany({
    include: {
      person: {
        select: {
          id: true,
          fullName: true,
          photoUrl: true,
          personType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return certificates.map((certificate) => ({
    ...certificate,
    issueDate: certificate.issueDate.toISOString(),
    eventDate: certificate.eventDate?.toISOString() ?? null,
    createdAt: certificate.createdAt.toISOString(),
    updatedAt: certificate.updatedAt.toISOString(),
  }));
}

export async function createCertificate(formData: CertificateFormData) {
  try {
    await requireRole(WRITE_ROLES);

    const result = certificateSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    const data = result.data;
    const personId = data.personId && data.personId !== "manual" ? data.personId : null;

    const certificate = await prisma.certificate.create({
      data: {
        type: data.type,
        title: data.title.trim(),
        recipientName: data.recipientName.trim(),
        description: data.description?.trim() || null,
        issueDate: new Date(`${data.issueDate}T12:00:00Z`),
        eventDate: data.eventDate ? new Date(`${data.eventDate}T12:00:00Z`) : null,
        issuerName: data.issuerName?.trim() || null,
        personId,
      },
    });

    revalidatePath("/relatorios");

    const payload = await getCertificatePayload(certificate.id);
    return { success: true, certificate: serializeCertificate(payload) };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error creating certificate:", error);
    return { success: false, error: "Erro ao emitir certificado." };
  }
}

export async function deleteCertificate(id: string) {
  try {
    await requireRole(WRITE_ROLES);

    await prisma.certificate.delete({ where: { id } });
    revalidatePath("/relatorios");

    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error deleting certificate:", error);
    return { success: false, error: "Erro ao excluir certificado." };
  }
}
