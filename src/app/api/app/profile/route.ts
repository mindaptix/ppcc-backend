import { NextRequest, NextResponse } from "next/server";
import { cleanDistrict, cleanProfileEmail, cleanProfileText, getAppUser } from "@/lib/app-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  let body: { name?: unknown; email?: unknown; district?: unknown; constituency?: unknown; role?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Profile could not be read." }, { status: 400 });
  }

  const name = cleanProfileText(body.name, 80);
  const email = cleanProfileEmail(body.email);
  const district = cleanDistrict(body.district);
  const constituency = cleanProfileText(body.constituency, 80);
  const role = cleanProfileText(body.role, 80);
  if (name === false || email === false || district === false || constituency === false || role === false) {
    return NextResponse.json({ error: "Check the profile details." }, { status: 422 });
  }

  const sets: string[] = [];
  const values: Array<string | null> = [];
  if (name !== undefined) {
    values.push(name);
    sets.push(`name = $${values.length}`);
  }
  if (email !== undefined) {
    values.push(email);
    sets.push(`email = $${values.length}`);
  }
  if (district !== undefined) {
    values.push(district);
    sets.push(`district = $${values.length}`);
  }
  if (constituency !== undefined) {
    values.push(constituency);
    sets.push(`constituency = $${values.length}`);
  }
  if (role !== undefined) {
    values.push(role);
    sets.push(`role = $${values.length}`);
  }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  try {
    const session = await getAppUser(request);
    if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    values.push(session.user.id);
    const updated = await db().query(
      `UPDATE members SET ${sets.join(", ")} WHERE id = $${values.length}
       RETURNING id, name, mobile, email, district, constituency, role`,
      values,
    );
    return NextResponse.json({ user: updated.rows[0] });
  } catch {
    return NextResponse.json({ error: "Could not update the profile." }, { status: 503 });
  }
}
