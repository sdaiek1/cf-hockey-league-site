"use client";

import { useMemo, useState } from "react";

const WAIVER_TEXT = `
COLD FUSION SUMMER HOCKEY LEAGUE
ADULT PARTICIPANT WAIVER, RELEASE OF LIABILITY, ASSUMPTION OF RISK,
INDEMNIFICATION, MEDICAL AUTHORIZATION, AND ELECTRONIC SIGNATURE AGREEMENT

IMPORTANT: THIS IS A LEGAL DOCUMENT. BY SIGNING IT, YOU ARE GIVING UP CERTAIN
LEGAL RIGHTS, INCLUDING THE RIGHT TO BRING CERTAIN CLAIMS. PLEASE READ CAREFULLY.

1. Adult Certification
I certify that I am 18 years of age or older and legally competent to sign this Agreement.
Participation in the Cold Fusion Summer Hockey League is limited to adults only.

2. Released Parties
“Released Parties” includes Shane Daiek, individually; the Cold Fusion Summer Hockey League;
its volunteers, assistants, referees, scorekeepers, schedulers, coordinators, representatives,
contractors, sponsors, and, to the fullest extent permitted by law, the owners, operators,
managers, employees, and agents of any rink or facility used in connection with League activities.

3. Activities Covered
This Agreement applies to all League-related activities, including games, warm-ups, on-ice and
off-ice participation, locker rooms, benches, parking areas, hallways, entrances, exits, and
travel to and from League activities.

4. Assumption of Risk
I understand that adult recreational ice hockey is a dangerous contact sport involving substantial
risks of serious injury, illness, disability, property damage, and death. These risks include,
without limitation, collisions with players, referees, boards, glass, doors, benches, and fixed
objects; being struck by pucks, sticks, skates, or equipment; falls on or off the ice; slips
and trips in locker rooms, parking areas, and common areas; cuts, fractures, concussions, dental
and eye injuries, spinal injuries, paralysis, and death; negligent or dangerous play by others;
facility conditions; delayed emergency response; and injuries caused by my own acts, omissions,
condition, judgment, or equipment.

I knowingly and voluntarily assume all risks of participation, whether known or unknown, inherent
or non-inherent, and including risks arising from the ordinary negligence of the Released Parties,
to the fullest extent permitted by law.

5. Release and Covenant Not to Sue
In consideration of being permitted to participate, I release, waive, discharge, and agree not
to sue the Released Parties for any and all claims, demands, actions, causes of action, damages,
losses, liabilities, costs, and expenses arising out of or related in any way to my participation
in the League, including claims for personal injury, illness, property damage, disability, death,
medical expenses, lost wages, and emotional distress, including claims based on the ordinary
negligence of the Released Parties, to the fullest extent permitted by law.

Nothing in this Agreement is intended to release claims that cannot legally be waived, including
claims based on conduct a court determines to be gross negligence, recklessness, willful misconduct,
or intentional wrongdoing.

6. Indemnification
I agree to indemnify, defend, and hold harmless the Released Parties from and against any claims,
liabilities, losses, damages, costs, and expenses, including reasonable attorneys’ fees, arising
out of or related to my acts or omissions, my conduct, my participation, my rule violations, or
my breach of this Agreement.

7. Medical Fitness and Emergency Care
I certify that I am physically and mentally fit to participate in adult recreational ice hockey,
or have chosen to participate despite any condition after my own evaluation. I will not participate
while ill, injured, impaired, or intoxicated. I authorize emergency medical care if needed and
understand that the Released Parties are not obligated to provide such care and are not responsible
for my medical expenses, which remain my sole responsibility.

8. Equipment and Rules
I am solely responsible for my own equipment, its condition, and wearing it properly. I agree to
follow all League rules, rink rules, referee decisions, and safety instructions. I understand I may
be removed or suspended for unsafe conduct, misconduct, fighting, intoxication, harassment, or other
rule violations, with or without refund in the organizer’s discretion.

9. Insurance
I understand that the League may or may not carry insurance applicable to my injuries or losses, and
I am solely responsible for my own medical, accident, disability, liability, and property insurance.

10. Photo / Video Consent
I grant permission to Shane Daiek and the Cold Fusion Summer Hockey League to photograph, record,
and use my name, image, likeness, and voice in connection with League operations, standings,
statistics, news, promotional materials, website content, and social media, without compensation.

11. Electronic Signature
I agree that this Agreement may be presented, signed, stored, and enforced electronically. I consent
to the use of an electronic signature, typed name, checkbox acknowledgment, click-through acceptance,
or similar process, and agree that such electronic signature has the same force and effect as a
handwritten signature. I also agree that associated electronic records and metadata, including date,
time, IP address, browser, device, and submission data, may be retained and used to establish
authenticity and assent.

12. Governing Law; Venue; Severability
This Agreement shall be governed by the laws of the State of New Jersey. Any dispute arising out of
or relating to this Agreement or my participation in the League shall be brought exclusively in a
court of competent jurisdiction in New Jersey. If any provision is held invalid or unenforceable,
the remaining provisions shall remain in effect to the fullest extent permitted by law.

13. Acknowledgment
I have carefully read this Agreement, understand its contents and legal effect, understand that I am
waiving substantial legal rights, and sign it freely and voluntarily.
`;

const initialForm = {
  fullName: "",
  dob: "",
  streetAddress: "",
  city: "",
  state: "NJ",
  zip: "",
  phone: "",
  email: "",
  teamName: "",
  jerseyNumber: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  signatureName: "",
  agreeAdult: false,
  agreeRisk: false,
  agreeRelease: false,
  agreeMedical: false,
  agreeElectronic: false,
  agreeFullWaiver: false,
  photoConsent: true,
};

export default function WaiverPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (form.signatureName.trim() !== form.fullName.trim()) {
      setStatus({
        type: "error",
        message: "Typed signature must match your full legal name.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/waiver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          signedDate: today,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit waiver.");
      }

      setStatus({
        type: "success",
        message: "Waiver submitted successfully.",
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong while submitting.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const pageShell = {
    minHeight: "100vh",
    backgroundImage: `
      linear-gradient(rgba(2,6,23,0.38), rgba(2,6,23,0.54)),
      url("/cold-fusion-rink-bg.png")
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    padding: "32px 20px",
  };

  const container = {
    maxWidth: 980,
    margin: "0 auto",
    color: "#ffffff",
  };

  const card = {
    background: "linear-gradient(180deg, rgba(7,16,34,0.74) 0%, rgba(4,10,24,0.82) 100%)",
    border: "1px solid rgba(34,211,238,0.14)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 18px 45px rgba(0,0,0,0.26)",
    backdropFilter: "blur(7px)",
  };

  const sectionTitle = {
    fontSize: 24,
    marginTop: 0,
    marginBottom: 10,
    letterSpacing: "-0.02em",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(34,211,238,0.14)",
    background: "rgba(8,20,42,0.62)",
    color: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    color: "#dbe7f3",
    marginBottom: 8,
  };

  const grid2 = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  };

  const checkboxRow = {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    color: "#dbe7f3",
    lineHeight: 1.5,
  };

  return (
    <main style={pageShell}>
      <div style={container}>
        <section style={{ ...card, marginBottom: 20 }}>
          <div
            style={{
              display: "inline-block",
              padding: "7px 12px",
              borderRadius: 999,
              background: "rgba(8,20,42,0.62)",
              color: "#7dd3fc",
              border: "1px solid rgba(34,211,238,0.14)",
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Electronic Waiver
          </div>

          <h1
            style={{
              fontSize: 42,
              lineHeight: 1.0,
              marginTop: 0,
              marginBottom: 12,
              color: "#f8fafc",
              letterSpacing: "-0.04em",
            }}
          >
            Cold Fusion Summer Hockey League Waiver
          </h1>

          <p style={{ color: "#dbe7f3", lineHeight: 1.7, margin: 0 }}>
            Complete and sign this waiver before participating. Players must be
            18 years of age or older.
          </p>
        </section>

        <form onSubmit={handleSubmit}>
          <section style={{ ...card, marginBottom: 20 }}>
            <h2 style={sectionTitle}>Player Information</h2>

            <div style={{ ...grid2, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Full Legal Name</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Street Address</label>
              <input
                name="streetAddress"
                value={form.streetAddress}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ ...grid2, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>State</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>ZIP Code</label>
                  <input
                    name="zip"
                    value={form.zip}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={grid2}>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <section style={{ ...card, marginBottom: 20 }}>
            <h2 style={sectionTitle}>League and Emergency Contact</h2>

            <div style={{ ...grid2, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Team Name</label>
                <input
                  name="teamName"
                  value={form.teamName}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Jersey Number</label>
                <input
                  name="jerseyNumber"
                  value={form.jerseyNumber}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ ...grid2, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Emergency Contact Name</label>
                <input
                  name="emergencyName"
                  value={form.emergencyName}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Emergency Contact Phone</label>
                <input
                  name="emergencyPhone"
                  value={form.emergencyPhone}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Relationship</label>
              <input
                name="emergencyRelationship"
                value={form.emergencyRelationship}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </section>

          <section style={{ ...card, marginBottom: 20 }}>
            <h2 style={sectionTitle}>Waiver Text</h2>

            <div
              style={{
                maxHeight: 420,
                overflowY: "auto",
                padding: 18,
                borderRadius: 16,
                background: "rgba(8,20,42,0.58)",
                border: "1px solid rgba(34,211,238,0.12)",
                color: "#dbe7f3",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {WAIVER_TEXT}
            </div>
          </section>

          <section style={{ ...card, marginBottom: 20 }}>
            <h2 style={sectionTitle}>Required Acknowledgments</h2>

            <div style={{ display: "grid", gap: 14 }}>
              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  name="agreeAdult"
                  checked={form.agreeAdult}
                  onChange={handleChange}
                  required
                />
                <span>I certify that I am 18 years of age or older.</span>
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  name="agreeRisk"
                  checked={form.agreeRisk}
                  onChange={handleChange}
                  required
                />
                <span>
                  I understand that ice hockey is a dangerous contact sport and
                  that I may be injured by pucks, sticks, skates, boards, glass,
                  falls, collisions, rough play, or facility conditions.
                </span>
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  name="agreeRelease"
                  checked={form.agreeRelease}
                  onChange={handleChange}
                  required
                />
                <span>
                  I voluntarily assume these risks and agree to the release of
                  liability and covenant not to sue to the fullest extent
                  permitted by law.
                </span>
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  name="agreeMedical"
                  checked={form.agreeMedical}
                  onChange={handleChange}
                  required
                />
                <span>
                  I authorize emergency medical treatment if needed and
                  understand that I am responsible for my own medical costs.
                </span>
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  name="agreeElectronic"
                  checked={form.agreeElectronic}
                  onChange={handleChange}
                  required
                />
                <span>
                  I consent to the use of my electronic signature and electronic
                  records.
                </span>
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  name="agreeFullWaiver"
                  checked={form.agreeFullWaiver}
                  onChange={handleChange}
                  required
                />
                <span>I have read and agree to the full waiver above.</span>
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  name="photoConsent"
                  checked={form.photoConsent}
                  onChange={handleChange}
                />
                <span>
                  I consent to photo/video use in connection with league
                  operations, standings, news, promotion, website content, and
                  social media.
                </span>
              </label>
            </div>
          </section>

          <section style={{ ...card, marginBottom: 20 }}>
            <h2 style={sectionTitle}>Electronic Signature</h2>

            <div style={{ ...grid2, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Typed Full Legal Name</label>
                <input
                  name="signatureName"
                  value={form.signatureName}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Date Signed</label>
                <input value={today} readOnly style={inputStyle} />
              </div>
            </div>

            <p style={{ color: "#cbd5e1", lineHeight: 1.6, marginBottom: 0 }}>
              By submitting this form, you are electronically signing the waiver.
              Your typed legal name must exactly match the full legal name entered
              above.
            </p>
          </section>

          {status.message ? (
            <div
              style={{
                ...card,
                marginBottom: 20,
                border:
                  status.type === "error"
                    ? "1px solid rgba(248,113,113,0.35)"
                    : "1px solid rgba(34,211,238,0.24)",
                color: status.type === "error" ? "#fecaca" : "#a7f3d0",
              }}
            >
              {status.message}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                textDecoration: "none",
                color: "#082f49",
                background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
                padding: "14px 20px",
                borderRadius: 14,
                fontWeight: 800,
                boxShadow: "0 0 16px rgba(34,211,238,0.18)",
                border: 0,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Waiver"}
            </button>

            <a
              href="/"
              style={{
                textDecoration: "none",
                color: "#ffffff",
                background: "rgba(8,20,42,0.58)",
                border: "1px solid rgba(34,211,238,0.12)",
                padding: "14px 20px",
                borderRadius: 14,
                fontWeight: 700,
              }}
            >
              Back to Homepage
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
