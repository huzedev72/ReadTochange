import { NextResponse } from "next/server";
import { INITIAL_GOALS } from "@/data/mockData";

export async function GET() {
  return NextResponse.json({ goals: INITIAL_GOALS });
}
