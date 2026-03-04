import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { Application } from "@dbClient";
import { getAuthenticatedUser } from "@auth";

function generateClientId() {
  return `ma_${crypto.randomBytes(16).toString("hex")}`;
}

function generateClientSecret() {
  return crypto.randomBytes(32).toString("hex");
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.userId) {
      return NextResponse.json(
        {error: "You are not authenticated"},
        {status: 401}
      )
    }

    const apps = await Application.find({createdBy: user.userId}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(apps.map(({ clientSecret, ...app }) => ({ ...app })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.userId) {
      return NextResponse.json(
        {error: "You are not authenticated"},
        {status: 401}
      )
    }

    const body = await request.json();
    const { name, description, appUrl, redirectUrl, logo } = body;
    if (!name || !appUrl || !redirectUrl) {
      return NextResponse.json(
        { error: "name, appUrl and redirectUrl are required" },
        { status: 400 }
      );
    }

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const app = await Application.create({
      createdBy: user.userId,
      name,
      description: description || "",
      appUrl,
      redirectUrl,
      logo: logo || "",
      clientId,
      clientSecret
    });
    const doc = app.toObject();
    return NextResponse.json({
      ...doc,
      id: doc._id.toString()
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
