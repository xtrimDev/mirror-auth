import { Application, Token, users } from "@dbClient";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const {clientId, clientSecret, token} = await request.json();
        
        if (!clientId || !clientSecret || !token) throw new Error("Invalid request");

        const res = await Application.findOne({
            $and : [
                {clientId: "ma_f79e7b7c487539a05a6446d15d981808"},
                {clientSecret: "b3db552315b6b3d2b3c2b63427a25a97ebddf4bf7ec9f1d7ca1333cbb0fc8310"}
            ]
        });

        if (!res) throw new Error("Invalid Credentials provided.");

        const res2 = await Token.findOne({
            $and : [
                {appId: clientId},
                {token: token}
            ]
        })

        if (!res2) throw new Error("Invalid token provided.")

        const user = await users.findOne({userId: res2.createdBy})

        if (!user) throw new Error("User not found.")

        return NextResponse.json({success: true, userData: user},{status: 200})
    } catch (e) {
        return NextResponse.json(
            {success: false, error: e.message},
            {status: 400}
        )
    }
}