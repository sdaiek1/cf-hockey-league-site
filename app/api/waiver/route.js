import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const requiredFields = [
      "fullName",
      "dob",
      "streetAddress",
      "city",
      "state",
      "zip",
      "phone",
      "email",
      "emergencyName",
      "emergencyPhone",
      "emergencyRelationship",
      "signatureName",
      "signedDate",
    ];

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (body.signatureName.trim() !== body.fullName.trim()) {
      return NextResponse.json(
        { error: "Typed signature must match full legal name." },
        { status: 400 }
      );
    }

    const requiredChecks = [
      "agreeAdult",
      "agreeRisk",
      "agreeRelease",
      "agreeMedical",
      "agreeElectronic",
      "agreeFullWaiver",
    ];

    for (const key of requiredChecks) {
      if (!body[key]) {
        return NextResponse.json(
          { error: `Required acknowledgment missing: ${key}` },
          { status: 400 }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "";
    const userAgent = request.headers.get("user-agent") || "";

    const payload = {
      full_name: body.fullName,
      dob: body.dob,
      street_address: body.streetAddress,
      city: body.city,
      state: body.state,
      zip: body.zip,
      phone: body.phone,
      email: body.email,
      team_name: body.teamName || null,
      jersey_number: body.jerseyNumber || null,
      emergency_name: body.emergencyName,
      emergency_phone: body.emergencyPhone,
      emergency_relationship: body.emergencyRelationship,
      signature_name: body.signatureName,
      signed_date: body.signedDate,
      agree_adult: !!body.agreeAdult,
      agree_risk: !!body.agreeRisk,
      agree_release: !!body.agreeRelease,
      agree_medical: !!body.agreeMedical,
      agree_electronic: !!body.agreeElectronic,
      agree_full_waiver: !!body.agreeFullWaiver,
      photo_consent: !!body.photoConsent,
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    const { data, error } = await supabase
      .from("waiver_submissions")
      .insert(payload)
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_WAIVER_URL;

    if (appsScriptUrl) {
      try {
        await fetch(appsScriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionId: data.id,
            createdAt: data.created_at,
            ...body,
            ipAddress,
            userAgent,
          }),
        });
      } catch (googleError) {
        console.error("Google webhook error:", googleError);
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: data.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to submit waiver." },
      { status: 500 }
    );
  }
}
