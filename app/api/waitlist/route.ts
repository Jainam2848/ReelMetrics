import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Supabase waitlist count error:", error);
      return NextResponse.json({ count: null });
    }

    return NextResponse.json({ count });
  } catch (err) {
    console.error("Waitlist GET handler crash:", err);
    return NextResponse.json({ count: null });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, instagramHandle, followersCount } = body;

    // 1. Sanitize & Validate Email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // 1b. Sanitize & Validate Instagram Handle (Required)
    if (!instagramHandle || typeof instagramHandle !== "string" || instagramHandle.trim() === "") {
      return NextResponse.json(
        { error: "Please enter your Instagram ID." },
        { status: 400 }
      );
    }

    const sanitizedHandle = instagramHandle.trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(sanitizedHandle)) {
      return NextResponse.json(
        { error: "Please enter a valid Instagram ID (e.g. @username)." },
        { status: 400 }
      );
    }

    // 1c. Validate Followers Count Range (Required)
    const allowedRanges = ["Under 10k", "10k - 50k", "50k - 250k", "250k+"];
    if (!followersCount || typeof followersCount !== "string" || followersCount.trim() === "") {
      return NextResponse.json(
        { error: "Please select your followers count range." },
        { status: 400 }
      );
    }
    if (!allowedRanges.includes(followersCount)) {
      return NextResponse.json(
        { error: "Please select a valid followers count range." },
        { status: 400 }
      );
    }

    // 2. Initialize Supabase Server Client
    const supabase = await createClient();

    // 3. Check for Duplicate Entry
    const { data: existingUser, error: checkError } = await supabase
      .from("waitlist")
      .select("email")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error("Supabase check error:", checkError);
      return NextResponse.json(
        { error: "A database error occurred. Please try again." },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered on our waitlist!" },
        { status: 400 }
      );
    }

    // 4. Insert New Waitlist Subscriber
    const { error: insertError } = await supabase
      .from("waitlist")
      .insert([{ 
        email: sanitizedEmail,
        instagram_handle: sanitizedHandle || null,
        followers_count: followersCount || null
      }]);

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to secure your spot. Please try again." },
        { status: 500 }
      );
    }

    // 5. Send Transactional Confirmation Email (Fault-Tolerant)
    if (env.RESEND_API_KEY) {
      try {
        const resend = new Resend(env.RESEND_API_KEY);

        // Render sleek HTML template matching Trendoraa styling
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to the Trendoraa Waitlist</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  background-color: #08090D;
                  color: #F8F8FC;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 40px 20px;
                  text-align: center;
                }
                .logo {
                  width: 48px;
                  height: 48px;
                  background: linear-gradient(135deg, #CCF381 0%, #4831D4 100%);
                  border-radius: 12px;
                  display: inline-block;
                  line-height: 48px;
                  font-weight: 900;
                  color: #FFFFFF;
                  font-size: 20px;
                  margin-bottom: 24px;
                  box-shadow: 0 4px 20px rgba(204, 243, 129, 0.2);
                }
                h1 {
                  font-size: 28px;
                  font-weight: 800;
                  color: #FFFFFF;
                  margin-bottom: 16px;
                  letter-spacing: -0.5px;
                }
                h1 span {
                  color: #CCF381;
                }
                p {
                  font-size: 15px;
                  color: #A0A5B5;
                  line-height: 1.6;
                  margin-bottom: 32px;
                }
                .features {
                  background-color: rgba(255, 255, 255, 0.02);
                  border: 1px solid rgba(255, 255, 255, 0.05);
                  border-radius: 16px;
                  padding: 24px;
                  margin-bottom: 32px;
                  text-align: left;
                }
                .feature-item {
                  margin-bottom: 16px;
                }
                .feature-item:last-child {
                  margin-bottom: 0;
                }
                .feature-title {
                  font-weight: 700;
                  color: #CCF381;
                  font-size: 13px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                .feature-desc {
                  color: #A0A5B5;
                  font-size: 13px;
                  margin-top: 4px;
                }
                .badge {
                  background-color: rgba(204, 243, 129, 0.1);
                  color: #CCF381;
                  border: 1px solid rgba(204, 243, 129, 0.3);
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  display: inline-block;
                  margin-bottom: 32px;
                }
                .footer {
                  font-size: 11px;
                  color: #4A4D5A;
                  border-top: 1px solid rgba(255, 255, 255, 0.05);
                  padding-top: 24px;
                  margin-top: 40px;
                  letter-spacing: 0.5px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">T</div>
                <h1>You are officially on the <span>Trendoraa Waitlist!</span></h1>
                
                <p>
                  Thank you for securing early-access! You are now in line to gain full access to the state-of-the-art AI-powered short-form video optimization platform.
                </p>

                <div class="badge">Waitlist Secured</div>

                <div class="features">
                  <div class="feature-item">
                    <div class="feature-title">01. 9-Dimension Structural Scores</div>
                    <div class="feature-desc">See exactly where viewers skip your videos, scored mathematically across hooks, pacings, and retention curves.</div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-title">02. peak strategy calendar</div>
                    <div class="feature-desc">Automated posting calendars giving you optimized hook &amp; caption copywriting alongside peak watch hours.</div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-title">03. 3 free scores on launch</div>
                    <div class="feature-desc">As a waitlist member, we have pre-loaded 3 premium AI score credits to your profile for launch day.</div>
                  </div>
                </div>

                <p style="font-size: 13px; color: #6A6D7D; margin-bottom: 0;">
                  We will reach out to you with your personal invite code the moment we open the doors. Stay tuned!
                </p>

                <div class="footer">
                  © 2026 Trendoraa Inc. • built with cinematic intelligence
                </div>
              </div>
            </body>
          </html>
        `;

        await resend.emails.send({
          from: "Trendoraa <onboarding@resend.dev>",
          to: sanitizedEmail,
          subject: "You are on the Trendoraa Waitlist! 🌟",
          html: emailHtml,
        });
      } catch (emailErr) {
        // Log the email failure but do not crash the registration since the DB record was successfully saved
        console.error("Resend API warning (signup saved, email failed):", emailErr);
      }
    }

    // 6. Query Waitlist Position
    let position: number | null = null;
    try {
      const { data: userRecord, error: userError } = await supabase
        .from("waitlist")
        .select("created_at")
        .eq("email", sanitizedEmail)
        .single();

      if (!userError && userRecord) {
        const { count: posCount, error: posError } = await supabase
          .from("waitlist")
          .select("*", { count: "exact", head: true })
          .lte("created_at", userRecord.created_at);

        if (!posError && posCount !== null) {
          position = posCount;
        }
      }
    } catch (posErr) {
      console.error("Waitlist position query crash:", posErr);
    }

    // 7. Return Success Response
    return NextResponse.json(
      { success: true, message: "Successfully secured your spot on the waitlist!", position },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Waitlist API handler crash:", err);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
