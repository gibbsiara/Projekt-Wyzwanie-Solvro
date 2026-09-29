-- CreateTable
CREATE TABLE "shots" (
    "id" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "location" DOUBLE PRECISION[],
    "play_pattern" TEXT NOT NULL,
    "under_pressure" BOOLEAN NOT NULL DEFAULT false,
    "shot_type" TEXT NOT NULL,
    "shot_body_part" TEXT NOT NULL,
    "shot_technique" TEXT NOT NULL,
    "shot_first_time" BOOLEAN NOT NULL DEFAULT false,
    "shot_deflected" BOOLEAN NOT NULL DEFAULT false,
    "shot_freeze_frame" JSONB,
    "shot_aerial_won" BOOLEAN NOT NULL DEFAULT false,
    "shot_statsbomb_xg" DOUBLE PRECISION NOT NULL,
    "xG" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shots_position_idx" ON "shots"("position");

-- CreateIndex
CREATE INDEX "shots_shot_type_idx" ON "shots"("shot_type");
