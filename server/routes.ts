import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import * as fs from "fs";
import * as path from "path";

interface Activity {
  id: string;
  name: string;
  category: string;
  defaultRepsOrTime: string;
  instructions: string;
  contraindications: string;
  equipment: string;
  intensity: number;
  tags: string[];
}

interface ActivityCatalogue {
  catalogueVersion: string;
  activities: Activity[];
}

interface DebugReport {
  appVersion: string;
  catalogueVersion: string | null;
  settings: Record<string, unknown>;
  recentLogs: unknown[];
  timestamp: string;
}

const debugReports: DebugReport[] = [];
const MAX_DEBUG_REPORTS = 100;

function loadActivities(): ActivityCatalogue {
  try {
    const filePath = path.resolve(process.cwd(), "server", "activities.json");
    const data = fs.readFileSync(filePath, "utf-8");
    const catalogue = JSON.parse(data) as ActivityCatalogue;

    if (
      !catalogue.activities ||
      !Array.isArray(catalogue.activities) ||
      !catalogue.catalogueVersion
    ) {
      throw new Error("Invalid activities.json format");
    }

    console.log(
      `Loaded ${catalogue.activities.length} activities (v${catalogue.catalogueVersion})`,
    );
    return catalogue;
  } catch (error) {
    console.error("Failed to load activities:", error);
    return {
      catalogueVersion: "0.0.0",
      activities: [],
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const catalogue = loadActivities();

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      catalogueVersion: catalogue.catalogueVersion,
      activityCount: catalogue.activities.length,
    });
  });

  app.get("/api/activities", (_req: Request, res: Response) => {
    res.json({
      activities: catalogue.activities,
      catalogueVersion: catalogue.catalogueVersion,
    });
  });

  app.post("/api/log", (req: Request, res: Response) => {
    try {
      const report = req.body as DebugReport;

      debugReports.unshift({
        ...report,
        timestamp: new Date().toISOString(),
      });

      if (debugReports.length > MAX_DEBUG_REPORTS) {
        debugReports.length = MAX_DEBUG_REPORTS;
      }

      console.log(`Debug report received from app v${report.appVersion}`);

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to process debug report:", error);
      res.status(400).json({ error: "Invalid debug report" });
    }
  });

  app.get("/api/debug-reports", (_req: Request, res: Response) => {
    res.json({
      reports: debugReports,
      count: debugReports.length,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
