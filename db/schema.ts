import { pgTable, serial, varchar, real, timestamp, boolean } from "drizzle-orm/pg-core";

export const globalPrices = pgTable("global_prices", {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    globalName: varchar("global_name", { length: 100 }).notNull(),
    localLabel: varchar("local_label", { length: 100 }).notNull(),
    price: real("price"),
    sourceUrl: varchar("source_url", { length: 255 }).notNull(),
    lastFetchedAt: timestamp("last_fetched_at"),
    manuallyUpdated: boolean("manually_updated").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export type GlobalPrice = typeof globalPrices.$inferSelect;
export type NewGlobalPrice = typeof globalPrices.$inferInsert;
