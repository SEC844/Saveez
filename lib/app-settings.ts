import { prisma } from "@/lib/db";

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    return setting?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function isRegistrationEnabled(): Promise<boolean> {
  const v = await getSetting("registrationEnabled", "true");
  return v === "true";
}
