import { getSheetData } from "@/lib/google-sheets";
import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
    const data = await getSheetData();
    return NextResponse.json(data);
}
