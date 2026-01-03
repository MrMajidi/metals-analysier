import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { globalPrices } from "@/db/schema";
import { GLOBAL_PRICE_MAPPINGS } from "@/lib/globalPricesMappings";
import { eq } from "drizzle-orm";

// GET - Retrieve all global prices
export async function GET() {
    try {
        const prices = await db.select().from(globalPrices);
        return NextResponse.json({ data: prices });
    } catch (error) {
        console.error("Error fetching global prices:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch prices" },
            { status: 500 }
        );
    }
}

// POST - Seed/initialize the database with mappings
export async function POST() {
    try {
        // Check if data already exists
        const existing = await db.select().from(globalPrices);

        if (existing.length > 0) {
            return NextResponse.json({
                message: "Database already seeded",
                data: existing
            });
        }

        // Insert all mappings
        const insertedPrices = await db
            .insert(globalPrices)
            .values(
                GLOBAL_PRICE_MAPPINGS.map((mapping) => ({
                    slug: mapping.slug,
                    globalName: mapping.globalName,
                    localLabel: mapping.localLabel,
                    sourceUrl: mapping.sourceUrl,
                    price: null,
                    lastFetchedAt: null,
                    manuallyUpdated: false,
                }))
            )
            .returning();

        return NextResponse.json({
            message: "Database seeded successfully",
            data: insertedPrices
        });
    } catch (error) {
        console.error("Error seeding database:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to seed database" },
            { status: 500 }
        );
    }
}
