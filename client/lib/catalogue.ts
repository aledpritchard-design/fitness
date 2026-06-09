import type { Activity } from "../../shared/types";
import bundledData from "../../server/activities.json";
import { getApiUrl } from "./query-client";

const data = bundledData as {
  catalogueVersion: string;
  activities: Activity[];
};

export const BUNDLED_CATALOGUE_VERSION: string = data.catalogueVersion;
export const BUNDLED_ACTIVITIES: Activity[] = data.activities;

export async function refreshFromNetwork(): Promise<{
  ok: boolean;
  activities?: Activity[];
  version?: string;
  message: string;
}> {
  const baseUrl = getApiUrl();
  if (!baseUrl) {
    return {
      ok: false,
      message: "No server configured. Using saved catalogue.",
    };
  }
  try {
    const response = await fetch(new URL("/api/activities", baseUrl).href);
    if (!response.ok) {
      return {
        ok: false,
        message: "Server not reachable. Using saved catalogue.",
      };
    }
    const json = (await response.json()) as {
      activities: Activity[];
      catalogueVersion: string;
    };
    return {
      ok: true,
      activities: json.activities,
      version: json.catalogueVersion,
      message: `Catalogue updated (${json.activities.length} activities, v${json.catalogueVersion}).`,
    };
  } catch {
    return {
      ok: false,
      message: "Could not reach server. Using saved catalogue.",
    };
  }
}
