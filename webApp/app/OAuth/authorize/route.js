import { Application } from "@dbClient";
import { NextResponse } from "next/server";

export async function GET(request, context) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    if (!clientId) throw new Error("clientId is required");

    const res = await Application.findOne({clientId: clientId});
    if (!res) throw new Error("Client Id is invalid");

    //show the Login page by maintaining the current session
    return NextResponse.redirect(`${origin}/account/login?appId=${clientId}&redirectURI=${res.redirectUrl}`)
  } catch (e) {
    return NextResponse.json(
      {success: false, error: e.message},
      {status: 400}
    )
  }
}