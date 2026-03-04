import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Application } from "@dbClient";

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    console.log(id);
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid app id" }, { status: 400 });
    }
    const app = await Application.findById(id).lean();
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    const { clientSecret, ...safe } = app;
    return NextResponse.json({ ...safe, id: app._id.toString() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid app id" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, appUrl, redirectUrl, logo } = body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (appUrl !== undefined) update.appUrl = appUrl;
    if (redirectUrl !== undefined) update.redirectUrl = redirectUrl;
    if (logo !== undefined) update.logo = logo;
    const app = await Application.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    const { clientSecret, ...safe } = app;
    return NextResponse.json({ ...safe, id: app._id.toString() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid app id" }, { status: 400 });
    }
    const app = await Application.findByIdAndDelete(id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
