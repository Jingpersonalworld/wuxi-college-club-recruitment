import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { serviceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await serviceClient().from("projects")
      .select("id,name,slug,summary,description,requirements,start_at,deadline_at,status")
      .eq("status", "published").order("deadline_at", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ projects: data });
  } catch (error) { return errorResponse(error); }
}
