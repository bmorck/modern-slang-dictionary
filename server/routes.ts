import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { terms, votes, moderators } from "@db/schema";
import { eq, sql, desc, and, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { authenticateModerator, requireModerator, hashPassword, generateTestHash } from "./auth";
import { insertTermSchema, loginSchema } from "@db/schema";
import { moderateContent } from "./ai";

const TRENDING_WINDOW_HOURS = 24;

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Development route to generate a test hash
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/mod/generate-test-hash", async (req, res) => {
      try {
        const hashedPassword = await generateTestHash();
        console.log("Generated test hash:", hashedPassword);

        // Delete existing moderator first to avoid conflicts
        await db.delete(moderators).where(eq(moderators.username, "admin"));

        // Create a new moderator with this hash
        const [moderator] = await db
          .insert(moderators)
          .values({
            username: "admin",
            passwordHash: hashedPassword,
          })
          .returning();

        res.json({ 
          message: "Test moderator created", 
          username: "admin",
          passwordHash: hashedPassword,
          note: "Use admin/admin123 to login" 
        });
      } catch (error) {
        console.error("Error creating test hash:", error);
        res.status(500).json({ message: "Error creating test hash" });
      }
    });
  }

  // Moderator login
  app.post("/api/mod/login", async (req, res) => {
    try {
      console.log("Login attempt received for username:", req.body.username);
      console.log("Raw password from request:", req.body.password);

      const { username, password } = loginSchema.parse(req.body);
      const moderator = await authenticateModerator(username, password);

      if (!moderator) {
        console.log("Authentication failed for username:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.moderatorId = moderator.id;
      await req.session.save();
      console.log("Login successful for moderator:", username);
      res.json({ message: "Logged in successfully" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // Get terms for moderation
  app.get("/api/mod/terms", requireModerator, async (req, res) => {
    try {
      const results = await db
        .select()
        .from(terms)
        .where(eq(terms.isApproved, false))
        .orderBy(desc(terms.createdAt));

      res.json(results);
    } catch (error) {
      console.error("Error fetching terms for moderation:", error);
      res.status(500).json({ message: "Error fetching terms" });
    }
  });

  // Approve a term
  app.post("/api/mod/terms/:id/approve", requireModerator, async (req, res) => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      const [result] = await db
        .update(terms)
        .set({
          isApproved: true,
          moderatedAt: new Date(),
          moderatedBy: req.session.moderatorId,
          moderationNote: note || null,
        })
        .where(eq(terms.id, parseInt(id)))
        .returning();

      if (!result) {
        return res.status(404).json({ message: "Term not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error approving term:", error);
      res.status(500).json({ message: "Error approving term" });
    }
  });

  // Reject a term
  app.post("/api/mod/terms/:id/reject", requireModerator, async (req, res) => {
    try {
      const { id } = req.params;
      const { note } = z.object({ note: z.string() }).parse(req.body);

      const [result] = await db
        .update(terms)
        .set({
          isApproved: false,
          moderatedAt: new Date(),
          moderatedBy: req.session.moderatorId,
          moderationNote: note,
        })
        .where(eq(terms.id, parseInt(id)))
        .returning();

      if (!result) {
        return res.status(404).json({ message: "Term not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error rejecting term:", error);
      res.status(500).json({ message: "Error rejecting term" });
    }
  });

  // Get all terms sorted by score or trending score
  app.get("/api/terms", async (req, res) => {
    try {
      const search = req.query.q?.toString() || "";
      const sortBy = req.query.sort?.toString() || "score";
      const limit = parseInt(req.query.limit?.toString() || "25");
      const offset = parseInt(req.query.offset?.toString() || "0");

      // Create a CTE with properly aliased fields
      const rankedTerms = db
        .select({
          id: terms.id,
          term: terms.term,
          definition: terms.definition,
          example: terms.example,
          createdAt: terms.createdAt,
          score: terms.score,
          isApproved: terms.isApproved,
          moderatedAt: terms.moderatedAt,
          moderatedBy: terms.moderatedBy,
          moderationNote: terms.moderationNote,
          trendingScore: terms.trendingScore,
          rank: sql<number>`row_number() over (
            order by ${sortBy === "trending" ? terms.trendingScore : terms.score} desc
          )`.as('rank')
        })
        .from(terms)
        .where(eq(terms.isApproved, true))
        .as('ranked_terms');

      // Then apply search filter and pagination
      let searchConditions = [];
      if (search) {
        searchConditions.push(ilike(rankedTerms.term, `%${search}%`));
      }

      const results = await db
        .select()
        .from(rankedTerms)
        .where(and(...searchConditions))
        .limit(limit)
        .offset(offset);

      res.json(results);
    } catch (error) {
      console.error("Error fetching terms:", error);
      res.status(500).json({ message: "Error fetching terms" });
    }
  });

  // Add new term
  app.post("/api/terms", async (req, res) => {
    try {
      console.log("Received term submission:", req.body);
      const termData = insertTermSchema.parse(req.body);
      console.log("Term data passed validation");

      // Perform AI moderation
      console.log("Calling OpenAI moderation...");
      const moderation = await moderateContent(termData);
      console.log("Moderation result:", moderation);

      console.log("Inserting term into database...");
      const [result] = await db
        .insert(terms)
        .values({
          term: termData.term,
          definition: termData.definition,
          example: termData.example,
          isApproved: false, // All terms require moderation
          moderationNote: moderation.moderationNote || null,
          moderatedAt: null,
        })
        .returning();
      console.log("Term saved successfully:", result);

      res.json(result);
    } catch (error) {
      console.error("Error in /api/terms:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid term data" 
      });
    }
  });

  // Vote on a term
  app.post("/api/terms/:id/vote", async (req, res) => {
    try {
      const { id } = req.params;
      const { value } = z
        .object({ value: z.number().min(-1).max(1) })
        .parse(req.body);
      const ipAddress = req.ip;

      // Check if user has already voted
      const existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votes.termId, parseInt(id)),
          eq(votes.ipAddress, ipAddress),
        ),
      });

      if (existingVote) {
        return res.status(400).json({ message: "Already voted" });
      }

      // Insert vote and update term score
      await db.transaction(async (tx) => {
        await tx.insert(votes).values({
          termId: parseInt(id),
          ipAddress,
          value,
        });

        const [updatedTerm] = await tx
          .update(terms)
          .set({
            score: sql`${terms.score} + ${value}`,
          })
          .where(eq(terms.id, parseInt(id)))
          .returning();

        res.json(updatedTerm);
      });
    } catch (error) {
      console.error("Error processing vote:", error);
      res.status(400).json({ message: "Invalid vote data" });
    }
  });

  // Get term insights with trending data
  app.get("/api/terms/insights", async (req, res) => {
    try {
      console.log('Fetching term insights...'); // Debug log
      const search = req.query.q?.toString() || "";
      const recentTime = new Date();
      recentTime.setHours(recentTime.getHours() - TRENDING_WINDOW_HOURS);

      try {
        console.log('Updating trending scores...'); // Debug log
        // Update trending scores
        await db.execute(sql`
          WITH recent_votes AS (
            SELECT 
              term_id,
              COUNT(*) FILTER (WHERE value > 0) as recent_upvotes,
              COUNT(*) FILTER (WHERE value < 0) as recent_downvotes,
              COUNT(*) as total_votes
            FROM votes
            WHERE created_at >= ${recentTime}
            GROUP BY term_id
          )
          UPDATE terms t
          SET trending_score = COALESCE(
            (
              SELECT 
                CASE 
                  WHEN total_votes = 0 THEN 0
                  ELSE (recent_upvotes - recent_downvotes)::float / NULLIF(total_votes, 0)
                END
              FROM recent_votes rv
              WHERE rv.term_id = t.id
            ), 0
          )
        `);
        console.log('Trending scores updated successfully'); // Debug log
      } catch (err) {
        console.error('Error updating trending scores:', err);
        throw err;
      }

      // Build the query
      const query = db
        .select()
        .from(terms)
        .where(eq(terms.isApproved, true));

      // Add search condition if search term is provided
      if (search) {
        query.where(
          and(
            eq(terms.isApproved, true),
            sql`(${terms.term} ILIKE ${`%${search}%`} OR ${
              terms.definition
            } ILIKE ${`%${search}%`})`
          )
        );
      }

      console.log('Executing insights query...'); // Debug log
      // Get results ordered by absolute trending score
      const results = await query.orderBy(sql`ABS(trending_score) DESC`);
      console.log(`Found ${results.length} terms for insights`); // Debug log

      res.json(results);
    } catch (error) {
      console.error("Error fetching term insights (detailed):", {
        error,
        message: error.message,
        stack: error.stack
      });
      res.status(500).json({ 
        message: "Error fetching term insights",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get about information
  app.get("/api/about", async (req, res) => {
    res.json({
      github: process.env.GITHUB_URL || "https://github.com/yourusername",
      about: process.env.ABOUT_TEXT || "A community-driven dictionary of tech terms and slang",
      version: process.env.npm_package_version || "1.0.0",
      author: process.env.AUTHOR_NAME || "Your Name"
    });
  });

  return httpServer;
}