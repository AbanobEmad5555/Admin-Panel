import { NextRequest, NextResponse } from "next/server";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  const body = await request.json();
  const response = await fetch(`${apiUrl}/admin/homepage/why-shop/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { authorization: auth } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  const response = await fetch(`${apiUrl}/admin/homepage/why-shop/${id}`, {
    method: "DELETE",
    headers: auth ? { authorization: auth } : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
