import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { globalPrices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scrapePrice } from "@/lib/firecrawl";

// POST - Refetch price using Firecrawl
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Get the price record to find the source URL
        const records = await db
            .select()
            .from(globalPrices)
            .where(eq(globalPrices.slug, slug));

        if (records.length === 0) {
            return NextResponse.json(
                { error: "Price not found" },
                { status: 404 }
            );
        }

        const record = records[0];

        // Scrape the price
        const { price, rawMarkdown, error } = await scrapePrice(record.sourceUrl);

        if (error) {
            return NextResponse.json(
                { error: `Scraping failed: ${error}` },
                { status: 500 }
            );
        }

        if (price === null) {
            return NextResponse.json(
                {
                    error: "Could not extract price from the page",
                    rawMarkdown: rawMarkdown?.substring(0, 500) // Return first 500 chars for debugging
                },
                { status: 422 }
            );
        }

        // Update the database
        const updated = await db
            .update(globalPrices)
            .set({
                price,
                lastFetchedAt: new Date(),
                manuallyUpdated: false,
                updatedAt: new Date(),
            })
            .where(eq(globalPrices.slug, slug))
            .returning();

        return NextResponse.json({
            data: updated[0],
            scrapedPrice: price
        });
    } catch (error) {
        console.error("Error refetching price:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to refetch price" },
            { status: 500 }
        );
    }
}
