import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  example: text("example").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  score: integer("score").default(0).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  moderatedAt: timestamp("moderated_at"),
  moderatedBy: integer("moderated_by").references(() => moderators.id),
  moderationNote: text("moderation_note"),
  trendingScore: integer("trending_score").default(0).notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  termId: integer("term_id").references(() => terms.id).notNull(),
  ipAddress: text("ip_address").notNull(),
  value: integer("value").notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moderators = pgTable("moderators", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const termsRelations = relations(terms, ({ one, many }) => ({
  votes: many(votes),
  moderator: one(moderators, {
    fields: [terms.moderatedBy],
    references: [moderators.id],
  }),
}));

export const moderatorsRelations = relations(moderators, ({ many }) => ({
  moderatedTerms: many(terms),
}));

export const insertTermSchema = createInsertSchema(terms, {
  term: z.string().min(1).max(50),
  definition: z.string().min(1).max(500),
  example: z.string().min(1).max(200),
});

export const selectTermSchema = createSelectSchema(terms);

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertTerm = typeof terms.$inferInsert;
export type SelectTerm = typeof terms.$inferSelect;
export type LoginFormData = z.infer<typeof loginSchema>;