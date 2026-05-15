"use server";

import { revalidatePath } from "next/cache";
import {
  CERTIFICATE_TEMPLATE_IDS,
  getCertificateTemplate,
  getCertificateTitle,
} from "@/lib/certificates";
import { prisma } from "@/lib/prisma";
import {
  certificateSchema,
  certificateUpdateSchema,
  type CertificateFormData,
  type CertificateUpdateData,
} from "@/lib/validations/certificate";
import {
  getPermissionErrorMessage,
  requireAuth,
  requireRole,
  WRITE_ROLES,
} from "@/lib/permissions";

function revalidateCertificatePaths() {
  revalidatePath("/relatorios");
  revalidatePath("/relatorios/certificados");
}

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
    where: {
      type: { in: [...CERTIFICATE_TEMPLATE_IDS] },
    },
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
    take: 100,
  });

  return certificates.map((certificate) => ({
    ...certificate,
    title: getCertificateTitle(certificate.type, certificate.title),
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
    const template = getCertificateTemplate(data.type);
    if (!template) {
      return { success: false, error: "Modelo de certificado inválido." };
    }

    const personId = data.personId && data.personId !== "manual" ? data.personId : null;

    const certificate = await prisma.certificate.create({
      data: {
        type: data.type,
        title: template.title,
        recipientName: data.recipientName.trim(),
        description: template.bodyText,
        issueDate: new Date(`${data.issueDate}T12:00:00Z`),
        eventDate: null,
        issuerName: null,
        personId,
      },
    });

    revalidateCertificatePaths();

    const payload = await getCertificatePayload(certificate.id);
    return { success: true, certificate: serializeCertificate(payload) };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error creating certificate:", error);
    return { success: false, error: "Erro ao emitir certificado." };
  }
}

export async function updateCertificate(formData: CertificateUpdateData) {
  try {
    await requireRole(WRITE_ROLES);

    const result = certificateUpdateSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    const data = result.data;
    const personId = data.personId && data.personId !== "manual" ? data.personId : null;

    await prisma.certificate.update({
      where: { id: data.id },
      data: {
        recipientName: data.recipientName.trim(),
        issueDate: new Date(`${data.issueDate}T12:00:00Z`),
        personId,
      },
    });

    revalidateCertificatePaths();

    const payload = await getCertificatePayload(data.id);
    return { success: true, certificate: serializeCertificate(payload) };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error updating certificate:", error);
    return { success: false, error: "Erro ao atualizar certificado." };
  }
}

export async function deleteCertificate(id: string) {
  try {
    await requireRole(WRITE_ROLES);

    await prisma.certificate.delete({ where: { id } });
    revalidateCertificatePaths();

    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error deleting certificate:", error);
    return { success: false, error: "Erro ao excluir certificado." };
  }
}
