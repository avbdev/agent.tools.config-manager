import { NextResponse } from "next/server";

/**
 * Legacy /api/settings endpoint — redirected to /api/configs in v2.
 *
 * The `setting` model was replaced by `ConfigItem` + `ConfigVersion` in the v2
 * schema migration. All callers should migrate to /api/configs.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "This endpoint has moved to /api/configs" },
    { status: 410 },
  );
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "This endpoint has moved to /api/configs" },
    { status: 410 },
  );
}
