# Trendoraa — Comprehensive Screens, Motion, & Animation Architecture Guide

This document provides a detailed, comprehensive walkthrough of every screen inside the **Trendoraa** (ReelMetrics / Reel Logic AI) ecosystem. It details the design layouts, textual content elements, visual aesthetics, user workflows, and premium interactive animations/motions that establish the platform's clinical computational authority.

---

## 🎨 1. Global Visual Identity & Design Systems

To differentiate Trendoraa from standard software-as-a-service platforms, the user interface follows an **Elite Clinical Analytics Engine** theme. Every styling choice, layout constraint, and animation is designed to feel fast, scientifically exact, and extremely premium.

### 1.1 Glowing HSL Color Palette
Trendoraa avoids generic colors in favor of customized HSL tokens optimized for modern OLED screens and space-obsidian interfaces:
*   **Velvety Space Obsidian (Background):** `hsl(240, 25%, 3%)` (`#06060A`) — A deep, light-absorbing black that eliminates visual fatigue and makes glowing charts look self-luminous.
*   **Electric Cobalt (Primary):** `hsl(251, 88%, 62%)` — A deep, hyper-saturated indigo replacing basic purples, conveying mathematical precision.
*   **Neon Jade (Secondary/Success):** `hsl(158, 85%, 46%)` — A crisp, energetic glowing mint used for positive indicators and optimal metric highlights.
*   **Sunset Rose (Accent/Warnings):** `hsl(328, 92%, 60%)` — A warm sunset pink indicating hooks, high-priority actions, and optimization suggestions.
*   **High-Contrast White (Text):** `hsl(240, 10%, 97%)` (`#F8F8FC`) — Ultra-clean white text for key readouts.
*   **Muted Steel (Secondary Text):** `hsl(240, 5%, 65%)` — Soft silver-grey for descriptors, limits, and helper text.
*   **Transparent Glass (Panels):** Semi-transparent white backing (`rgba(255, 255, 255, 0.04)`) layered over intense background blurs (`backdrop-filter: blur(20px)`), framed with thin translucent borders (`rgba(255, 255, 255, 0.08)`) to give elements a floating glassmorphic weight.

### 1.2 Typography
*   **Display Headers:** *Cabinet Grotesk* — A geometric, tight-letterspaced font that projects modern design trends.
*   **Body & Interface UI:** *Satoshi* — An elegant, highly readable sans-serif optimized for multi-column grids and technical data displays.
*   **Metric / Numerical Readouts:** Strict monospaced fonts (e.g., Outfit Mono / JetBrains style) to match clinical tracking charts.

### 1.3 Cinematic Global Motion Effects

#### 1.3.1 WebGL Neural Network Background (`DashboardBackground.tsx`)
A high-performance interactive backdrop running in an GPU-accelerated WebGL HTML5 `<canvas>` via `@react-three/fiber` (Three.js):
*   **Visual Structure:** A sparse constellation grid of 40 glowing points, categorized into three distinct Z-depth groups (-6, -3, and 0) to form a physical parallax layer.
*   **Drifting Motion:** The particles slowly drift in random paths, bounded by invisible screen limits that cause them to bounce back smoothly when hitting boundaries.
*   **Cursor-Reactive Trailing:** Moving the mouse projects a 3D gravity vector into the scene. Hairline glowing indigo segments are dynamically drawn connecting the cursor to any nearby particles within a 3.5-unit radius.
*   **Performance Optimization:** To conserve device battery and prevent CPU lag, connection lines are strictly capped at a maximum of 6 visible segments at once. The canvas scales down its pixel ratio (`dpr={[1, 1.5]}`), disables standard antialiasing, and requests `"low-power"` rendering from the GPU.
*   **Visibility Interrupts:** The render loop intercepts tab changes (`document.visibilityState`) and pauses frame rendering instantly when the tab is unfocused. If a mobile device or touch-screen pointer is detected, the WebGL background is bypassed completely.

#### 1.3.2 Liquid SVG Wipe Transition (`components/shared/sweep-transition.tsx`)
A transition effect for switching pages and navigation states without harsh screen refreshes:
*   **Mechanics:** A custom, stylized liquid SVG path overlay that covers the viewport with a fluid swipe motion.
*   **Morphing Logic:** Uses a two-phase bezier path transition (Wipe-In → Hold → Wipe-Out).
*   **Callback Sync:** Executes an `onHalfway` event precisely at the peak of the wipe (when the screen is fully obscured) to swap out the underlying panel content, completely eliminating "flash-of-unstyled-content" (FOUC).

---

## 💻 2. Screen-by-Screen Detailed Breakdown

```mermaid
flowchart TD
    Marketing["Marketing Landing Page (/)"] -->|Access / Sign Up| Auth["Auth Pages (/login, /signup)"]
    Auth -->|First login (No accounts connected)| Onboarding["Onboarding Stepper (/dashboard)"]
    Onboarding -->|Connect Account / Sandbox Demo| Home["Dashboard Home (/dashboard)"]
    
    subgraph DashboardSpace["Dashboard Cockpit Workspace"]
        Home <--> Accounts["Social Accounts (/accounts)"]
        Home <--> Analytics["Performance Analytics (/analytics)"]
        Home <--> Strategy["Content Strategy Briefs (/strategy)"]
        Home <--> Posts["Post/Reel List & Detail (/posts, /posts/[id])"]
        Home <--> Billing["Billing & Subscription (/billing)"]
        Home <--> Settings["Profile & GDPR Settings (/settings)"]
    end
```

---

### 2.1 Marketing Landing Page (`/`)

The storefront page designed to convert casual creators and agencies into paying subscribers. It introduces the clinical authority of Trendoraa through interactive visual tools.

#### 2.1.1 Structural Layout & Content Blocks
1.  **Fixed Translucent Navigation Bar:**
    *   Left side: Glowing gradient brand emblem ("T" inside a box) next to the "Trendoraa" wordmark.
    *   Right side: Interactive authentication action buttons. If logged in, a prominent cobalt-glowing "Go to Dashboard" button; otherwise, a clean "Sign In" button surrounded by a thin glass border.
2.  **Wide Asymmetric Hero Section:**
    *   Top badge: "Strategy Engine Active" pill framed by a neon-accented border and a pulsing amber light.
    *   Primary heading: Giant Cabinet Grotesk title: "Engineer Viral. Not Hope." in bold, clean white and bright green.
    *   Paragraph: "Trendoraa evaluates retention triggers and pacing patterns, revealing exactly why your Reels capture the feed — or die in the first 3 seconds."
    *   Call-to-Action (CTA) Cluster:
        *   Primary button: Large cobalt-glowing button displaying "Analyze My First Reel Free →" (which triggers the interactive simulator) or "Launch Dashboard Cockpit →" (if logged in).
        *   Secondary link: Frameless "See how it works" button that smooth-scrolls the browser to the execution steps section.
    *   Stats Bar: Horizontal grid displaying numerical achievements (e.g., "1.2M+ Videos Scored", "92.4% Strategy Accuracy", "48ms Engine Latency").
3.  **Interactive Live Reel Scoring Simulator (Right Hero Column):**
    *   A simulated browser terminal block showing real-time analysis phases.
    *   Phase 1 (Idle Input): Paste input form ("Paste your Instagram Reel URL...") flanked by an "Analyze Reel →" action button and a "Use Demo Reel" fallback trigger.
    *   Phase 2 (Scanning): Live-typed system logs mimicking backend metadata ingestion (e.g., `resolution: 1080x1920`, `duration: 00:28`, `reel_id: Cd7xK2mPqR8`).
    *   Phase 3 (Analyzing): Ingested video waveform graph pulsating in a multicolor gradient stream (orange-to-indigo-to-green) next to a sweeping vertical playhead line, accompanied by numerical scoring progress bars representing the 9 key video dimensions.
    *   Phase 4 (Analysis Complete): Big radial score ring showcasing an overall rating of "83" and an emerald success badge reading "Strong Hook Profile". Underneath, a dual retention-curve overlay compares an "Average Creator" (rapid drop-off curve in red) to a "Trendoraa Optimized" profile (stable, flat retention line in emerald green).
4.  **Infinite Partner Ticker:**
    *   A borderless, dark-grey horizontal ticker sliding across the screen showing social proof references (e.g., "MediaGroup Studio", "D2C Collective", "Pulse Influence").
5.  **How It Works Cards:**
    *   Three-column vertical progression sequence explaining the technical loop:
        1.  *Establish Data Linkage* (OAuth connection)
        2.  *Extract Retention Metrics* (Skip-rate and completion-rate calculations)
        3.  *Compile Posting Playbooks* (AI-generated weekly strategy briefs)
6.  **Bento Feature Grid:**
    *   A wide, interactive gapless grid showcasing core product features:
        *   *Hook Efficacy Index Card:* Demonstrates 9-dimension scoring with custom score dials.
        *   *Skip Resistance Radar Card:* Focuses on early viewer drop-offs.
        *   *Story Completion Tracker Card:* Detailed Story statistics showing replies and reach.
        *   *Daily Ingestion Pipeline Card:* Status bars showing scheduled database cron updates.
7.  **Cinematic Before-After Transformation Sequence:**
    *   An interactive visual slider dividing a chaotic, unoptimized video grid (Before: descriptive red warnings like "Muted opening scene", "Delayed hook text") from an optimized, high-pacing video template (After: neon overlays like "Dynamic pacing cuts", "Title text at 0.1s").
8.  **Testimonial Glass Carousel:**
    *   Transparent testimonials showing user quotes and performance metrics.
9.  **Pricing Section:**
    *   Subscription grid displaying plan cards (Free, Creator, Pro, Agency) complete with pricing amounts, database limits, and feature lists.

#### 2.1.2 Metrics Displayed on this Page
*   **Hero Achievements (Stats Bar):**
    *   *Total Videos Scored:* Dynamic baseline count (`1.2M+`).
    *   *Predictive Strategy Accuracy:* Percentage rating (`92.4%`).
    *   *Engine Ingestion Latency:* API performance metric (`48ms`).
*   **Simulator Meta Logs (Phase 2):**
    *   *Reel ID:* `Cd7xK2mPqR8`
    *   *Duration:* `00:28` (seconds)
    *   *Resolution:* `1080×1920` (pixels)
*   **Simulator Evaluation Categories (Phase 3 & 4):**
    *   *9 Dimensions (Scored 1-100):* Hook Strength, Visual Pacing, Skip Resistance, Retention Curve, Caption Layout, Emotional Trigger, Audio Hook, Structural Flow, and Trend Alignment.
    *   *Overall Engagement Rating:* Unified calculated index (`83 / 100`).
    *   *Viewer Retention Curve Coordinates:* Plotting viewer density percentages against timeline seconds (`0s` to `28s`).

#### 2.1.3 Animations & Motions
*   **Scrambled Text Ingestion (`useScrambleText`):** The hero headings run a terminal scramble effect on load and when the cursor hovers over them, making letters shift rapidly through random special characters before resolving into plain English in 0.8 seconds.
*   **Interactive Hover Click-Sparks (`ClickSpark`):** Clicking primary simulation buttons fires an outward explosion of 8 microscopic, gradient-colored line particles that expand from the click coordinates and fade over 500ms.
*   **Waveform Interpolation Morphing:** The audio hook waveform morphs between three distinct bezier paths using framer-motion path interpolation to represent live sound processing.
*   **Count-Up Number Ticker:** Final numerical values on the stats bar and simulator score dial run a rapid numerical count-up transition from 0 to the target value within 400ms.

---

### 2.2 Auth Pages (`/login` & `/signup`)

The entrance portals rebranded to project technical rigor and security.

#### 2.2.1 Structural Layout & Content Blocks
*   **Left Column (Authority Panels):**
    *   Occupying 40% of the screen width, a dark-indigo space showing platform stats and legal-level credentials.
    *   Visual status bar indicating: `Computational Node Status: Active | Active Slots: 88% | Latency: 92ms`.
    *   High-status FAQ accordion drawers detailing computational resource routing, proration, and Stripe-backed AES-256 secure checkout policies.
*   **Right Column (Form Cockpit):**
    *   Clean, minimalist card framed inside a thin glowing outline.
    *   Title Copy (Login): Rebranded as **"Access Computational Node / Establish Connection"**.
    *   Title Copy (Signup): Rebranded as **"Establish Creator Vector"** or **"Secure Computational Quota"**.
    *   Opportunity Cost Warnings (Objection Resolution): Framed directly underneath the signup buttons: *"Every daily posting cycle without algorithmic calibration represents a lost distribution window. Securing credentials locks in evaluation prioritization."*
    *   Form fields (Email and Password) styled with glowing borders that react when selected.

#### 2.2.2 Metrics Displayed on this Page
*   **Computational Health Metrics:**
    *   *Server Node Status:* `Active` / `Inactive` text.
    *   *Active Quota Slots Remaining:* Capacity tracking percentage (`88%`).
    *   *Engine Latency Response:* Technical speed score (`92ms`).

#### 2.2.3 Animations & Motions
*   **GPU-Accelerated 3D Parallax Stack (`OnboardingCore3D`):** The credential section uses a stacked layout of 3D layered element cards. The cards tilt on their Z and Y axes based on the user's cursor position, utilizing `transform: perspective()` to add dimensional depth.
*   **Smooth Accordion Drawer slide-downs:** FAQ sections animate open using spring physics.

---

### 2.3 Onboarding Stepper (`/dashboard` - Initial State)

If a user signs up and has 0 linked social accounts, the dashboard blocks default workspace views and presents this structured 3-step setup guide to capture user intent and lower initial friction.

#### 2.3.1 Structural Layout & Content Blocks
*   **Step 1: Content Niche Selection**
    *   Heading: "Calibrate Niche Optimization"
    *   A responsive grid presenting 6 specific niche selection cards: Tech & Gadgets, Comedy & Skits, Business & Finance, Education & How-to, Lifestyle & Vlogs, and Fashion & Beauty. Selecting a niche changes the theme's background accent color.
*   **Step 2: Growth Goal Selection**
    *   Heading: "Establish Operational Target"
    *   Three columns corresponding to primary metrics:
        *   *Audience Retention* (Focusing on Hook scroll-stop performance)
        *   *Engagement Rate* (Optimizing saves and repost shares)
        *   *Active Followers* (Boosting posting schedule velocity)
*   **Step 3: Social Connection & Sandbox Portal**
    *   Heading: "Social Data Ingestion Link"
    *   *Meta Graph Ingestion Pre-Flight Checklist Modal:* To prevent common API connection errors, the primary connection button opens a checklist requiring users to confirm that they have switched to an Instagram Creator/Business account and linked it to a Facebook Page they manage.
    *   *Setup Linkage Instructions:* An toggleable instructions drawer showing step-by-step setup walkthroughs.
    *   *Wow-Effect Sandbox Demo Trigger:* A prominent primary button to skip production social linking and immediately seed a high-fidelity mock environment (ingesting `@alice_reels` statistics).

#### 2.3.2 Metrics Displayed on this Page
*   **Operational Targets (Step 2 selection values):**
    *   *Niche category identifier:* Selected index (`0` to `5`).
    *   *Niche specific variables:* Preserved parameters (`instagram_accounts.niche` and `instagram_accounts.goal`).
*   **Pre-Flight State Variables (Step 3):**
    *   *Instagram Profile Type:* Boolean status (`Creator or Business Account` == `True`).
    *   *Managed Facebook Page Status:* Linkage verification status (`Linked to Managed Page` == `True`).

#### 2.3.3 Animations & Motions
*   **Staggered Card Entries:** Niche selection cards fade and slide up sequentially (0.05s staggers) to keep the layout load organized.
*   **Simulated Pipeline Log Stream:** Clicking the "Sandbox Demo" button runs an immersive full-screen terminal logging interface that displays exact backend execution statements (e.g., `Connecting to Trendoraa Ingestion...`, `Parsing Alice_Reels Hook Metrics...`) to build anticipation before transitioning.
*   **Spring Scale Selection Effects:** Selected cards scale up slightly (`scale: 1.03`) and glow with a neon border matching the chosen category.

---

### 2.4 Dashboard Home (`/dashboard` - Normal State)

The primary workspace cockpit displaying aggregated insights, content spotlights, and scoring matrices once an account is active.

```
+-------------------------------------------------------------------------------+
|  [T] Trendoraa        [Dashboard]  [Accounts]  [Analytics]  [Strategy]  [Posts]   |
+-------------------------------------------------------------------------------+
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | (IG) @alice_reels [Syncing... 67%]          Last synced: 2 min ago      |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  +----------------------------------+   +----------------------------------+  |
|  |  Best Reel Spotlight             |   |  Content Niche Calibrator        |  |
|  |  "CSS Grid vs Flexbox Tricks"    |   |  🎯 Goal: Audience Retention     |  |
|  |  Likes: 42K  |  Views: 120K      |   |  Weekly strategy status: Ready   |  |
|  +----------------------------------+   +----------------------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |  Viewer Attention Decay Curve Analyzer (Growth Matrix)                  |  |
|  |  Hook Phase (82%) | Body Phase (74%) | End Phase (68%)                  |  |
|  |                                                                         |  |
|  |  [SVG Retention Graph Curve: orange -> indigo -> teal]                  |  |
|  |                                                                         |  |
|  |  Actionable Suggestions:                                                |  |
|  |  * Deliver visual cuts or B-roll every 2.5 seconds                      |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
+-------------------------------------------------------------------------------+
```

#### 2.4.1 Structural Layout & Content Blocks
1.  **Dashboard Header Status Bar:**
    *   Social account switcher dropdown showing connected profile avatar handles.
    *   Manual Sync Button with built-in cooldown display ("Sync Now" disabled with a 5-minute countdown clock on success).
    *   Sync Status Notification banner.
2.  **Top Metrics Row:**
    *   Three bento-style stats cards displaying aggregate summaries (Followers, Reach, and Engagement Rate).
    *   A bright green **`🎯 Goal Focus`** indicator badge overlays the card matching the growth target chosen during onboarding, prioritizing the user's primary focus.
3.  **Best Reel Spotlight Card (`ReelPreviewPlayer`):**
    *   Left Column: Embedded video card showing the highest-performing video from the linked profile. Underneath, interactive icons show the media's exact views, comments, shares, and skip rates.
    *   Right Column: Compact AI evaluation summary showing the video's top pacing strength and primary hook critique.
4.  **Growth Matrix / Attention Decay Analyzer:**
    *   The centerpiece of the home dashboard. Displays a wide grid containing the interactive retention timeline:
        *   *Graph Visualizer:* An SVG line showing the typical video retention decay pathway (Hook phase, Body phase, End watch-through phase). It is mapped with glowing circular node buttons representing the three phases.
        *   *Decay Zones:*
            *   Phase 1 (Hook Phase, 0-3s): Orange indicator showing "Scroll-Stop Rate".
            *   Phase 2 (Body Phase, 3-15s): Indigo indicator showing "Pacing & Retention Velocity".
            *   Phase 3 (End Phase, 15s+): Teal indicator showing "Completion & Exit Resistance".
        *   *Interactive Advice Drawer:* Clicking any phase tab updates the drawer with descriptive evaluations and 3 actionable, bulleted script/video editing suggestions (e.g., "Change the opening scene to show high-momentum movement rather than a static intro").
5.  **Strategy Preview Card:**
    *   A compact preview card showing the current weekly strategy brief title (customized to the user's niche) and progress meter.

#### 2.4.2 Metrics Displayed on this Page
*   **Aggregate social account parameters (Top Row):**
    *   *Total Followers count:* Account subscribers (`followers`).
    *   *Reach index:* Unique account views reached (`reach`).
    *   *Engagement Rate percentage:* Unified ratio (`engagementRate`).
*   **Spotlight Reel Performance (Best Reel Card):**
    *   *Total Views count:* Total video impressions (`views` / `display_views`).
    *   *Likes Count:* Interaction count (`likesCount`).
    *   *Comments Count:* Commentary count (`commentsCount`).
    *   *Saves Count:* Video bookmark count (`savesCount`).
    *   *Shares Count:* Direct message or link transfers (`sharesCount`).
    *   *Skip Rate percentage:* Swipe-aways under 3s (`skipRate` / `reels_skip_rate`).
    *   *Hook Retention Rate percentage:* Calculated survival rate (`100 - skipRate`).
*   **Attention Timeline Zones (Growth Matrix):**
    *   *Hook Phase (0-3s):* Scroll-Stop Rate percentage (`hookVal` / e.g., `82%`).
    *   *Body Phase (3-15s):* Pacing & Retention Velocity percentage (`retentionVal` / e.g., `74%`).
    *   *End Phase (15s+):* Completion & Exit Resistance percentage (`completionVal` / e.g., `68%`).

#### 2.4.3 Animations & Motions
*   **Spring Node Scale Animations:** Clicking the interactive SVG milestone nodes triggers a fast elastic spring scaling of the marker (`scale: [1, 1.3, 1]`) utilizing an AnimeJS custom elastic easing function.
*   **Staggered Ingestion Grid entrance:** Bento cards fade and adjust coordinates on layout load.

---

### 2.5 Social Accounts Management (`/accounts`)

The center for tracking and managing API authorizations and rate quotas across connected platforms.

#### 2.5.1 Structural Layout & Content Blocks
*   **Connected Channels Grid:**
    *   Horizontal list of connected profiles (Instagram and TikTok post-MVP placeholder).
    *   Each account block showcases profile picture avatar, handle name, linked Facebook Page name, and a detailed **Sync Status Chip**:
        *   `active` / `completed`: Jade green chip showing connection active.
        *   `syncing` / `pending_sync`: Indigo chip showing sync progress.
        *   `rate_limited`: Dark amber chip warning that API quota is exhausted.
        *   `disconnected` / `error`: Red chip indicating credential revocation.
*   **Pre-Flight Connection Guide Drawer:**
    *   A comprehensive, toggleable guide detailing Meta's switch-to-business rules, complete with illustrations.
*   **Platform Sandbox Demo Toggle:**
    *   A quick-access button to load mock connections for staging reviews.

#### 2.5.2 Metrics Displayed on this Page
*   **Connection Account seats:**
    *   *Allocated Profile occupancy:* e.g., `1 of 2 connected` (Free tier limits) up to `20 connected` (Agency tier).
*   **API Quota Budgets:**
    *   *Hourly Meta API Usage:* Real-time tracking of queries against the hourly threshold (`instagram_api_hourly` count vs `200 calls/hour` quota limits).
    *   *Manual Sync Cooldown Timer:* Countdown clock representing the remaining block period (`5:00` to `0:00` minutes).

#### 2.5.3 Animations & Motions
*   **Sync Status Pulse:** Progressing status chips feature a glowing border pulse effect.
*   **Manual sync button loading spinner:** The sync button transitions into a loading dial, disabling interactions during active synchronization.

---

### 2.6 Performance Analytics (`/analytics`)

Deep graphical dashboard tracking historical follower changes, view metrics, and Story-level engagement.

#### 2.6.1 Structural Layout & Content Blocks
*   **Aggregate Data Charts:**
    *   Dual line graphs mapping Reach, Impressions, and Profile Views across selectable lookback windows (7 days, 30 days, or 90 days).
*   **Audience Follower Snapshot Curve:**
    *   Visual graph plotting daily follower changes from the historical audience database.
*   **Story Completion Analytics Section:**
    *   A list detailing recent active Stories, mapping:
        *   *Reach & Impression values.*
        *   *Reply rates.*
        *   *Exit rates.*
        *   *Visual completion bars* (calculating the percentage of viewers who watched the Story without exiting).

#### 2.6.2 Metrics Displayed on this Page
*   **Aggregated Profile Insights:**
    *   *Unique Reach count:* Daily reached profiles.
    *   *Total Impressions count:* Raw visual displays count.
    *   *Profile Views count:* Clicks landing on creator profile page.
*   **Follower Snapshots:**
    *   *Net follower gains/losses:* Historical database entries (`audience_history` plot).
*   **Story Engagement Insights:**
    *   *Story Reach:* Unique story viewers.
    *   *Story Impressions:* Total story displays.
    *   *Story Replies:* Interactions sent from the story.
    *   *Story Exits:* Users swiping away or tapping out of the active story.
    *   *Story Completion Rate:* Exact calculated completion percentage (`completion_rate` / e.g., `72%`).

#### 2.6.3 Animations & Motions
*   **Responsive SVG Line drawing:** Data curves draw their strokes across the canvas on load using progressive stroke-dashoffset transitions over 1.2 seconds.
*   **Responsive Tooltip Hover effects:** Hovering over data points opens interactive glass tooltip cards showing exact statistics, utilizing smooth position interpolation to follow the cursor.

---

### 2.7 Content Strategy Page (`/strategy`)

The planning cockpit displaying personalized, weekly AI posting playbooks, structural script blueprints, competitive niche opportunities, and creator A/B performance experiments.

#### 2.7.1 Structural Layout & Content Blocks
1.  **"What to Replicate" Winning Template Panel:**
    *   *Position:* Top full-width panel placed above the existing Personalized Strategy Card Grid.
    *   *Purpose:* Analyzes the top 3 posts from the last 60 days by engagement rate and extracts shared structural factors (Hook type, text timing, pacing cut interval, CTA format, audio type, caption structure, first-frame motion).
    *   *Confidence Metric:* Shows whether a decision is shared by "3 of 3 posts" or "2 of 3 posts".
    *   *Primary CTA:* "Use as my next brief →" — pre-populates the strategy brief generator.
    *   *Secondary Info Tag:* Based on top posts with a hover tooltip showing the source posts.
    *   *Insufficient Data Placeholder:* Displays "Score at least 3 reels to unlock your winning template." if $<3$ scored posts exist.
2.  **Personalized Strategy Card Grid:**
    *   Displays the current weekly Content Strategy Brief customized to the user's specific niche (e.g., Finance creators receive titles like "How creators structure LLCs 🏢"; Tech creators receive "Why database indexing drops writes 📊").
3.  **3D Interactive Strategy Matrix (`StrategyMatrix3D`):**
    *   An interactive 3D dimension cockpit containing depth-layered vertical bar charts representing optimization priorities (e.g., Hook Strength, Visual Pacing, Structural Flow, Call-to-Action efficacy).
    *   Clicking on bars highlights detailed AI improvement advice.
4.  **Trend Detection Report Panel & Niche Gap Radar:**
    *   Contains a tab selector switching between:
        *   *Tab 1 (Trend Insights):* Lists at least 3 concrete trend insights backed by exact media references from their profile.
        *   *Tab 2 (Niche gaps):* Renders the top 3 benchmark opportunities (topic or hook style, competitive evidence, and customSuggested angle specific to the creator's voice), with a recency label ("Updated weekly — next refresh in 3 days") and "Add to my content plan →" action buttons.
        *   *Insufficient Data Placeholder:* Displays "More niche data needed — available once 5+ accounts in your niche have been tracked for 14+ days." if competitive accounts are insufficient.
5.  **Persisted Experiment Queue Panel:**
    *   *Position:* Full-width panel at the very bottom of the page, below the Trend Detection Report Panel.
    *   *Purpose:* Generates concrete A/B experiments for any of the 9 scoring dimensions averaging below 5.0 across the user's last 5 scored posts.
    *   *Structure:* Rendered as a vertical stack of cards displaying dimension badges (using standard HSL color codes), test instructions, success metrics, and a status selector (Queued, In Progress, Complete, Skipped).
    *   *Persistence & History:* Completed and Skipped experiments collapse into a historical collapsible timeline drawer. All status adjustments and logged outcome notes persist dynamically to the PostgreSQL database.
    *   *Active Cap:* Capped at a maximum of 3 concurrent active experiments at once.
    *   *Optimal Score Placeholder:* Displays "All dimensions are above threshold — no experiments queued. Revisit after your next 5 posts." if all averages exceed 5.0.

#### 2.7.2 Metrics Displayed on this Page
*   **Format & Platform Weights:**
    *   *Social distribution weights:* Top format indicator (e.g., `80% Reel focus` / `20% Story focus` recommendations).
*   **Strategy Priority Ratings:**
    *   *Dimensional Target Scores:* Calculated score priorities (`1` to `10`) across dimensions (Hook, Pacing, CTA, Audio).
*   **Competitive Trend Benchmarks:**
    *   *Niche Comparison ratings:* Calculated skip-rate thresholds and completion baselines across 3 to 10 tracked niche profiles.
*   **Winning Template shared parameters:**
    *   *First Frame Motion:* Boolean check.
    *   *Time-to-first-text:* delay in seconds.
    *   *Average pacing cut interval:* delay in seconds.
    *   *CTA structure:* "question" | "command" | "none".
    *   *Audio type:* "trending sound" | "original audio".
    *   *Caption format:* "question" | "statement" | "hashtag-heavy" | "minimal".

#### 2.7.3 Animations & Motions
*   **Interactive 3D Card Depth Tilt:** Hovering over the strategy matrices tilts the entire panel based on cursor positions.
*   **Progressive Bar expansion:** Dimension bars scale vertically on load using custom ease-out transitions.
*   **Smooth Tab Transitions:** Switching tabs inside the Trend Detection Panel runs a sliding glass wipe effect.
*   **Collapsible Drawer Wipe animations:** Completed and Skipped experiments slide and morph smoothly into the historical drawer.

---

### 2.8 Post/Reel List Screen (`/posts`)

The content catalog page showcasing individual video achievements, permitting filters, search catalog index syncs, and navigations to individual post score details.

#### 2.8.1 Structural Layout & Content Blocks
*   **Search & Selection Header:**
    *   Dynamic text search input ("Search your content catalog...").
    *   Platform category selectors (All, Instagram, TikTok).
    *   Sorting controls (Sort by Views, Sort by Date, Sort by Moat Score).
*   **Social Catalog Grid:**
    *   Responsive cards for every ingested video. Each card showcases thumbnail image previews, video titles/captions, publication dates, and a prominent scoring badge indicator overlay.

#### 2.8.2 Metrics Displayed on this Page
*   **Reel Card Stats:**
    *   *Moat Score badge:* Overall calculated Engagement Moat rating (`overallScore` / `1` to `100`).
    *   *Total Views count:* Raw views tally (`views` / `displayViews`).
    *   *Likes Count:* Ingested video likes.
    *   *Comments Count:* Ingested video comments.

---

### 2.9 Reel Scoring & Detail Page (`/posts/[id]`)

The inspection screen for individual video analytics, transcription pacing, and AI-powered script revisions. It opens when a user clicks any post card in the catalog. It operates in two distinct states depending on database evaluation status:

```
UNRATED SCORING STATE                        RATED DETAILS STATE
+------------------------------------+       +------------------------------------+
|  [Back to Catalog]                 |       |  [Back to Catalog]                 |
|                                    |       |                                    |
|  +--------------+  +------------+  |       |  +--------------+  +------------+  |
|  | Media Shield |  | AI Portal  |  |       |  | Media Shield |  | Score Dials|  |
|  | (Preview)    |  | "Execute   |  |       |  | (Preview)    |  |  [83/100]  |  |
|  |              |  | AI Eval"   |  |       |  |              |  |            |  |
|  +--------------+  +------------+  |       |  +--------------+  +------------+  |
|                                    |       |                                    |
|                                    |       |  +------------------------------+  |
|  [Active Scoring Loading Overlay]  |       |  | Interactive Growth Matrix    |  |
|  (Typewriter metrics sequence...)  |       |  | Hook (82%) -> Body (74%)     |  |
+------------------------------------+       +------------------------------------+
```

#### 2.9.1 Structural Layout & Content Blocks (Unrated State & Active Ingestion)
When the selected Reel has not yet been processed by the Trendoraa AI engine, the right panel switches to an unrated dashboard:
1.  **AI Sparkles Portal Card:**
    *   Title: "Evaluate Engagement Moat".
    *   Descriptor text: "This short-form video has not been processed by the Trendoraa AI engine yet. Click below to analyze hook density and cta structures."
    *   Action trigger: A large, primary glowing **"Execute AI Evaluation"** button.
2.  **Active Scoring Loading Overlay (`AnimeScoringSequence`):**
    *   Clicking the evaluation trigger disables the panel and launches an interactive, terminal-style loading screen.
    *   Calculates heuristic metrics inline if budget thresholds are exceeded.
    *   Fires typewriter sequences updating the user on algorithmic computations (e.g., `"Running transcript parser..."`, `"Calibrating pace velocity..."`, `"Analyzing hook density index..."`) to build visual trust.

#### 2.9.2 Structural Layout & Content Blocks (Rated State)
Once AI scoring resolves (or if the database record is already complete), the detailed workspace loads:
1.  **Left Column: Media Metadata & Stats**
    *   *Post Visual Shield:* Ingested video preview block (`MediaReviewPreview`) overlaying media views, likes, shares, comments, saves, and calculated rates next to a platform brand badge (Instagram or TikTok).
    *   *Open Post Link:* External link button to browse the Reel directly on the live parent platform.
    *   *Caption & Context box:* Glowing card containing the raw caption text description and hashtags.
    *   *Engagement Counts Card:* Multi-column grid containing exact interaction numbers layered inside bordered glass panels. Now includes **Rewatch Rate** (`displayViews / reach`) with a benchmark label ("Strong algorithm amplification signal" in Neon Jade for ratios $>1.4x$, or "Limited rewatch signal" in Muted Steel for $<1.4x$).
    *   *Saves & Shares Intent Split:* Multi-column layout with high-intensity Saves ($1.5\%$ benchmark) and Shares ($2.5\%$ benchmark) percentages relative to views, demonstrating whether the post is overperforming or underperforming the niche benchmark, accompanied by a composite interpretation line.
2.  **Right Column: Evaluation Gauge & Dimension matrix**
    *   *Moat Authenticated Score Gauge:* High-impact circular progress gauge (`ScoreGauge`) showcasing the overall Moat Score out of 100 next to efficiency summaries.
    *   *Floating Success Banner:* An emerald-glowing warning-free banner overlayed at the top when the rewatch rate exceeds $1.4x$, reading: `"This post is being rewatched — the algorithm is likely amplifying it. Analyze its structure and replicate it."`
    *   *Algorithmic Growth Matrix Heatmap:* A second-by-second 15-cell horizontal timeline representing video duration. Mapped with color coding matching watch percentages (Neon Jade $>80\%$, Electric Cobalt $60-80\%$, Sunset Rose $40-60\%$, Deep Red $<40\%$). Includes hover tooltips, and a **2-Second Drop Detector** highlighting the 6–8s window drop if it exceeds $15\%$. Three milestone overlays (Hook / Body / End) are anchored as node buttons above the heatmap cells.
    *   *9-Dimension Interactive Bars (`DimensionBar`):* Displays horizontal evaluation bars grouped by priority (Primary, Secondary, Tertiary), complete with detail popups showing the reasoning and specific improvement advice when clicked.
    *   *Causal Hook Diagnosis Checklist:* Nested directly under the "Hook Execution" bar. Collapsible panel summarizing 5 causal factors (Visual Motion, Text delay, Spoken word delay, Opener type, and Pronoun usage) compared against optimal parameters, with specific advice for failed checks.
    *   *AI Strategic Recommendations Cards:* Dual strengths and opportunities bento boards showing key strengths and growth opportunities calculated by the LLM.
    *   *Comment Sentiment Proportional Clusters:* Segmented layout displaying proportion bars for Questions, Reactions, Objections, and Save Intent with representative top comments and a strategic AI interpretation block. Displays a placeholder if $<10$ comments are synced.

#### 2.9.3 Metrics Displayed on this Page
*   **Media Metadata Overlay (`MediaReviewPreview`):**
    *   *Total Views:* (`viewsCount` / `displayViews`).
    *   *Likes Count:* Raw likes tally (`likesCount`).
    *   *Comments Count:* Raw comments tally (`commentsCount`).
    *   *Saves Count:* Total bookmarks saved (`savesCount`).
    *   *Shares Count:* Message share tallies (`sharesCount`).
    *   *Rewatch Rate:* (`displayViews / reach`).
    *   *Engagement Rate percentage:* Interactive ratio (`engagementRate`).
    *   *Hook Retention percentage:* Surviving viewers over 3s (`100 - skipRate`).
*   **Engagement Cockpit (Right Column):**
    *   *Overall Engagement Moat Score:* Dial rating (`overallScore` / `0 - 100`).
    *   *9 Evaluation Dimension Bars (Scored 1-10):*
        *   `Primary Targets:` Hook Execution, Scroll-Stop Velocity (derived from `reels_skip_rate`), and Watch-Through Completion.
        *   `Secondary Targets:` CTA Value, Visual Pacings, and Audio Matching.
        *   `Tertiary Targets:` Trend Relevance, Caption Structure, and Timing Efficiency.
*   **Interactive Growth Matrix Heatmap:**
    *   *Timeline Cells:* 15 second-by-second cells mapped dynamically.
    *   *Heatmap Percentages:* Exact retained view rates at every second.

#### 2.9.4 Animations & Motions
*   **Typewriter scoring progress indicators:** The scoring loading screen loops logs using custom typewriter timelines.
*   **Linear dial stroke wipes:** Overall rating rings fill their circular paths with glowing indigo-to-green gradients.
*   **Pacing Alert Pulses:** Metric bars scoring below `5` display warning alert triangles that pulse in Sunset Rose.

---

### 2.10 Billing & Subscription (`/billing`)

The pricing portal calibrated to maximize creator conversions while presenting clinical security.

#### 2.10.1 Structural Layout & Content Blocks
*   **Subscription Tier Pricing Grid:**
    *   Four detailed cards matching subscription tiers (Free, Creator, Pro, Agency) highlighting their respective database size limits, account seats, and monthly AI analysis caps.
*   **Compute Routing SLA Information:**
    *   A prominent alert block explaining technical credit routing guarantees: *"Computational resource routing is allocated on a rolling weekly basis to guarantee sub-second latency for live campaigns. Unlocked quotas are protected from degradation and guaranteed upon tier activation."*
*   **Secure Stripe Checkout Drawer:**
    *   Interactive payment trigger buttons that interface directly with Stripe Checkout and Customer Billing Portals.
    *   Stripe secure check badges accompanied by SSL security verification shields.
*   **FAQ objection accordions:**
    *   A detailed, transparent question-and-answer list directly beside the payment triggers addressing computational resource costs, prorated upgrades, and credit refreshes.

#### 2.10.2 Metrics Displayed on this Page
*   **Plan Limitations Metrics (Per Card):**
    *   *Instagram seats:* Account connection limit (Max `1` / `2` / `5` / `20`).
    *   *Reels Scored quota:* Evaluation capacity limit per billing cycle (Max `10` / `50` / `200` / `1000`).
    *   *Monthly AI call threshold:* API routing limit per month (Max `10` / `150` / `600` / `2500`).
    *   *Content Strategies limit:* Playbook generation count per billing cycle (Max `0` / `4` / `12` / `40`).
    *   *LLM cost budget target cap:* Margin security quota (Max `$0.50` / `$8.00` / `$25.00` / `$75.00`).

#### 2.10.3 Animations & Motions
*   **Shimmer Hover Effect (`shimmer-btn`):** Subscribing/checkout buttons run an animated diagonal sheen overlay that sweeps across the button's surface when hovered over, catching the user's eye.
*   **FAQ Accordion Spring expansions:** FAQ questions open smoothly with elastic spring animations.

---

### 2.11 User Settings & GDPR Compliance (`/settings`)

The user dashboard control panel managing credentials, privacy data, and profile deletion options.

#### 2.11.1 Structural Layout & Content Blocks
*   **Profile Editor Form:**
    *   Fields to update email, creator handles, and credentials.
*   **GDPR Data Portability Section:**
    *   A dedicated card introducing user data rights under GDPR compliance.
    *   A prominent **"Export Personal Database"** button which triggers a compiled JSON file download containing every user record, connected account insight, and metric log in under 5 seconds (safely removing sensitive system credentials and security keys from the payload).
*   **Cascade Account Purge Panel:**
    *   A high-visibility card containing the **"Delete computational node connection permanently"** action.
    *   Triggers a cascading deletion across connected tables (`instagram_accounts`, `reels`, `reel_scores`, `stories`, `audience_history`, `strategies`) and automatically clears personal identification credentials.

#### 2.11.2 Metrics Displayed on this Page
*   **GDPR Export Metadata:**
    *   *Total Database Records Compiled:* e.g., `108 logs`.
    *   *Payload Ingestion Status:* Verification size in kilobytes (e.g., `24KB`).

#### 2.11.3 Animations & Motions
*   **Destructive Deletion Warnings:** Hovering over the cascade deletion button changes the panel's outline to a pulsing sunset rose color, prompting caution.
*   **Successful export notification toast:** Confirming data exports slides a sleek notification banner into the top right corner.

### 2.12 Script Rewriter Page (`/scripts/rewrite`)

#### 2.12.1 Structural Layout & Content Blocks
*   **The Content Input Panel**:
    *   A clean, centered card layout with a large, glassmorphic Textarea input for raw creator scripts (10–3,000 characters).
    *   Goal selector buttons utilizing layout transitions (Followers, Engagement, Conversions) with sub-titles explaining the targeted virality strategy.
    *   Niche selector (optional input) with suggestions.
    *   Premium Upgrade Overlay: Gated for paid subscription plans (Creator, Pro, Agency). Free accounts see a high-fidelity glassmorphic overlay with pricing tier comparison, features list, and a direct upgrade CTA linking to Stripe checkout.
*   **The Multi-Step Progress Loader**:
    *   An interactive, staggered sequence visible during API generation to buffer LLM processing latency:
        1. *Analyzing original hook and skip triggers...*
        2. *Extracting niche strategy and audience triggers...*
        3. *Structuring storyboard visual instructions...*
        4. *Formulating CTAs & algorithmic loop hooks...*
    *   Renders with sequential checks and smooth CSS opacity transitions.
*   **The Bento Storyboard Results Dashboard**:
    *   *Hook Audit Card*: Full breakdown detailing why the original script hook triggers early skips, compared with the selected psychological/copywriting lever.
    *   *Storyboard Chronological Grid*: Interactive timeline rows displaying start/end segments (e.g. `0.0s - 3.0s`), spoken script words, visual camera action notes, overlay text directions, and audio sync details.
    *   *Action Controls Bar*: Buttons to copy the spoken script or overlays to clipboard, and a high-contrast button to launch **Teleprompter Mode**.
*   **Cinematic Teleprompter Modal**:
    *   Displays script words in oversized, highly legible, centered styling.
    *   Active reading highlighted focus overlay.
    *   Control Dashboard: Play/pause, reset/rewind, font size adjustments, and speed controller (1 to 10 scale) powered by a smooth `requestAnimationFrame` render loop.

#### 2.12.2 Metrics Displayed on this Page
*   **Storyboard Segments Pacing:** Start and end timestamps (seconds) showing absolute duration.
*   **Usage Credits Tracker:** Displays current active plan limits and remaining monthly AI processing calls.

#### 2.12.3 Animations & Motions
*   **Auto-Scroll Script Engine:** Uses requestAnimationFrame to scroll the teleprompter container smoothly based on speed settings.
*   **Staggered Segment Reveal:** Bento storyboard blocks fade in and translate upward sequentially using Framer Motion layout animations.
*   **Copy Clipboard Feedback:** Clicking copy transitions the icon to a checkmark with a quick green pop animation.

---

## 🔬 3. Interactive Design & Motion Reference Table

The following table summarizes the specific frontend motions, libraries, and design tokens mapped to each primary screen:

| Page Route | Key Content Elements | Primary Animation Library | Core Motion Description | Theme Color Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Marketing Landing (`/`)** | Hero, Simulator, Bento Grid, Pricing | Framer Motion, Three.js, CSS Keyframes | Interactive cursor WebGL particle gravity mesh, text scrambling, liquid wipe transitions, wave path interpolation | Electric Cobalt, Neon Jade, Sunset Rose |
| **Auth Entrance (`/login`, `/signup`)** | Node connection forms, Node SLAs, FAQ | Framer Motion, custom CSS | 3D layered card perspective tilting, accordion FAQ drawer slide-downs | Space Obsidian, Electric Cobalt |
| **Onboarding Stepper (`/dashboard`)** | Stepper forms, checklist, setup drawer | Framer Motion, AnimeJS | Card entrance staggers, simulated pipeline terminal logs, spring selection scales | Electric Cobalt, Sunset Rose |
| **Dashboard Home (`/dashboard`)** | Switchers, Spotlight, Growth Matrix | Framer Motion, AnimeJS | SVG morphing decay path line, spring node scaling, metric badge glows | Electric Cobalt, Neon Jade, Sunset Rose |
| **Accounts (`/accounts`)** | Quota cards, Sync chips, guide drawer | Custom CSS, Lucide Icons | Chip state pulse glows, manual sync button loading dial sweeps | Neon Jade, Sunset Rose |
| **Analytics (`/analytics`)** | Reach charts, follower snaps, Stories list | SVG, custom React hooks | Chart stroke drawing, tooltip cursor track interpolation, completion bars | Electric Cobalt, Neon Jade |
| **Strategy Briefs (`/strategy`)** | AI Playbook briefs, 3D matrices | Framer Motion | 3D matrix card depth tilts, horizontal scale bars | Electric Cobalt, Neon Jade |
| **Post Details (`/posts/[id]`)** | Transcript segments, 9-dim bars, rewriter | Framer Motion, custom CSS | Video timeline transcription track syncing, low-efficacy warning card pulses | Sunset Rose, Electric Cobalt |
| **Billing (`/billing`)** | Tier cards, SLA notices, accordions | Framer Motion, custom CSS | Checkout button shimmer sweeps, FAQ drawer spring wipes | Space Obsidian, Electric Cobalt |
| **Settings (`/settings`)** | Profiles, GDPR exports, Cascade deletes | Framer Motion | Destructive deletion warning glows, success toast slides | Space Obsidian, Sunset Rose |
| **Script Rewriter (`/scripts/rewrite`)** | Script Form, Storyboard Bento, Teleprompter Modal | Framer Motion, requestAnimationFrame, CSS | Sequential loader checklists, staggered storyboard reveals, requestAnimationFrame scroll loop, copy clipboard feedback ticks | Space Obsidian, Electric Cobalt, Neon Jade |

