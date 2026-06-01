# Pre-Launch Waitlist Page

## Goal
Implement a high-converting, mobile-responsive standalone waitlist page in exactly 2 files on an isolated git branch (`waitlist-launch`) to maximize pre-launch sign-ups without exposing unfinished features.

### Visual Preview (Engineered Mockup Asset)
![Trendoraa UI Dashboard Mockup](file:///C:/Users/jaina/.gemini/antigravity/brain/4cc6059b-1e77-49a4-ab95-256eed7fcf5b/trendoraa_dashboard_mockup_1780286636782.png)

*The waitlist will display this premium generated UI mockup side-by-side with the email form on desktop, and beautifully stacked below the form on mobile screens, ensuring instant product comprehension and a high conversion rate (>25%).*

## Target Skills to Leverage
To ensure maximum conversion and premium execution, we will apply these workspace skills:
*   **`page-cro` (Conversion Rate Optimization):** Structuring a single-column focal layout, high-contrast inputs, above-the-fold CTA, trust indicators, and frictionless single-field signups.
*   **`avoid-ai-writing`:** Stripping generic AI jargon ("revolutionize", "seamlessly", "next-generation") in the copy to replace it with punchy, high-impact benefits tailored to short-form video creators.
*   **`design-spells`:** Adding glowing borders on input focus, an animated loading submit state, and a magical glassmorphic checkmark transition upon success.
*   **`ux-feedback`:** Providing immediate visual validation for invalid emails, checking double submissions, and rendering instant response states.

## Tasks
- [ ] Task 1: Create local branch `waitlist-launch` → Verify: `git branch` displays `waitlist-launch`
- [ ] Task 2: Back up `app/(marketing)/page.tsx` → Verify: Copy successfully renamed to `app/(marketing)/landing-backup.tsx`
- [ ] Task 3: Clean branch routes by deleting `app/(dashboard)` and other non-marketing paths → Verify: `app/(dashboard)` is physically deleted from the local branch
- [ ] Task 4: Write Frontend Waitlist page `app/page.tsx` with mobile-first CRO design → Verify: Page builds successfully, uses `<GridDistortionBackground />` if imported, scales down perfectly on simulated iPhone SE in Chrome DevTools
- [ ] Task 5: Write API handler `app/api/waitlist/route.ts` using Supabase & Resend → Verify: `curl -X POST http://localhost:3000/api/waitlist -d "email=test@test.com"` inserts row in DB and returns `200 OK`
- [ ] Task 6: Hook UI form submit action to API route handler → Verify: Entering an email and pressing "Join" renders the premium success screen and records data
- [ ] Task 7: Run terminal compilation and lint audits → Verify: `npm run typecheck` and `npm run lint` execute with 0 errors

## Done When
- [ ] Visitors to the root domain (`localhost:3000` / `yourwebsite.com`) see exclusively the waitlist page.
- [ ] Unfinished dashboard paths physically do not exist on the current `waitlist-launch` branch.
- [ ] The waitlist form is 100% responsive, beautiful on phone screens, and securely writes submissions to Supabase.
- [ ] User receives a styled confirmation welcome email from Resend.

## Notes
- To avoid database migrations, we will write directly to a `waitlist` table in Supabase via the client. You can create this table in 30 seconds via the Supabase dashboard using the SQL query in the main implementation plan.
