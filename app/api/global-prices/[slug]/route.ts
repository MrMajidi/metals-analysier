import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { globalPrices } from "@/db/schema";
import { eq } from "drizzle-orm";

// PATCH - Update a price manually
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { price } = body;

        if (typeof price !== "number" || isNaN(price)) {
            return NextResponse.json(
                { error: "Price must be a valid number" },
                { status: 400 }
            );
        }

        const updated = await db
            .update(globalPrices)
            .set({
                price,
                manuallyUpdated: true,
                updatedAt: new Date(),
            })
            .where(eq(globalPrices.slug, slug))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json(
                { error: "Price not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error("Error updating price:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update price" },
            { status: 500 }
        );
    }
}
