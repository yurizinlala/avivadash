-- CreateTable
CREATE TABLE "user_notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthdaysEnabled" BOOLEAN NOT NULL DEFAULT true,
    "birthdayLeadDays" INTEGER NOT NULL DEFAULT 2,
    "eventsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eventLeadDays" INTEGER NOT NULL DEFAULT 3,
    "visitorsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "visitorRecentDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_settings_userId_key" ON "user_notification_settings"("userId");

-- AddForeignKey
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
