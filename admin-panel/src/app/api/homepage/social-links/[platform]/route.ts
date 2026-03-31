import { NextRequest, NextResponse } from "next/server";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Params = {
  params: Promise<{
    platform: string;
  }>;
};

export async function GET(_request: NextRequest, context: Params) {
  const { platform } = await context.params;
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }

  const response = await fetch(
    `${apiUrl}/homepage/social-links/${platform}`
  );
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
