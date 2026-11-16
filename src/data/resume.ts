// English translation of the supplied resume; identifying header intentionally omitted.
export const resumeSections = [
  { id: "profile", label: "Profile" },
  { id: "expertise", label: "Expertise" },
  { id: "didi", label: "DiDi" },
  { id: "earlier", label: "Earlier experience" },
  { id: "education", label: "Education & recognition" },
  { id: "experiments", label: "Independent work" },
] as const;

export const expertise = [
  ["Languages", "Go / Python"],
  ["Foundations", "MySQL, Redis, Kafka and Elasticsearch: practical experience and an understanding of their underlying principles."],
  ["Platforms", "Complex business modeling, reusable platforms, standardization, rule engines and domain-specific languages."],
  ["Architecture", "Critical service paths, service boundaries, standardized integrations, event-driven and asynchronous systems, data consistency and phased migrations."],
  ["Reliability", "Reliability and financial-loss prevention, idempotency, deduplication, retries, compensation, monitoring, alerting and anomaly detection."],
  ["AI engineering", "AI-native workflows, engineering context systems, development-process observability and team-wide adoption."],
] as const;

export const didiProjects = [
  {
    title: "DiDi Alliance",
    description: "The leading distribution platform in mobility.",
    points: [
      "Led the platform from inception to launch, designing merchant onboarding, campaign promotion, user participation, attribution, analytics dashboards, billing and settlement. Became the technical owner of this core growth system.",
      "Standardized integrations, attribution and core workflows through shared campaign orchestration and rules. Integrated more than 10 business lines, reducing onboarding time by approximately 40% and incidents by 50%. Order volume reached 2× its previous level and new-user volume 3×; the platform became one of the company’s top two acquisition channels outside paid advertising.",
      "Led the real-time analytics migration from ClickHouse to StarRocks, using dual writes, dual reads, consistency checks, phased traffic shifts and a rollback plan. Improved p95 performance by an order of magnitude and API success rates by 30%.",
      "Introduced system-wide financial-loss controls across rewards, attribution and settlement: pre-launch risk reviews, idempotency, deduplication, alerts, scheduled scans and billing reconciliation. Reduced financial-loss incidents by 70%.",
      "Designed volume bonuses, tiered rewards and merchant levels for field acquisition and merchant operations. Field-acquisition volume grew 133% year over year, while customer acquisition cost fell 19%.",
    ],
  },
  {
    title: "Referral growth platform",
    description: "Shared infrastructure for referral and group-based campaigns.",
    points: [
      "Built the open referral platform and led its 2.0 upgrade, turning mechanics such as friend assistance and group formation into reusable capabilities driven by event nodes.",
      "Defined service boundaries and improved campaign orchestration, request-path governance and protocol standards. Supported more than 10 upstream services and 30 campaign types, moving integrations from manual development to self-service onboarding.",
      "Built reusable orchestration components around Trigger, Condition, Action and Who. Connected campaign configuration, execution and frontend presentation through a DSL, TCA and rules. Supported 49 referral campaign variants, reused across the referral platform and DiDi Alliance.",
    ],
  },
  {
    title: "Chengxin Youxuan · Daily Cash Rewards",
    description: "User acquisition for the community grocery business.",
    points: [
      "Led the construction and ongoing iteration of critical service paths, shipping acquisition, group formation and configurable campaign strategies under demanding delivery timelines.",
      "Reworked a single-business tool into a reusable capability for the company’s user-growth infrastructure, balancing rapid iteration with reuse across multiple business lines.",
      "Used Apollo configuration to adjust campaign pacing continuously. Added location, time and audience controls to group formation, supporting precise operations across cost, conversion and strategy flexibility.",
      "The project contributed approximately 90% of new users and 35% of first-order users across the business. Registration acquisition cost fell 25%; first-order acquisition cost fell to one fifth of its previous level. Inactive-user reactivation was approximately twice the business-wide rate.",
    ],
  },
  {
    title: "AI-native engineering workflow",
    description: "Team workflows, shared context and process observability.",
    points: [
      "Led a team-wide workflow spanning product-requirements pre-review, technical design, coding, code review, testing and release. Addressed scattered AI-generated artifacts, untraceable processes and hard-to-reuse experience with an observable, reviewable and governable engineering process.",
      "Built an engineering context system and process-observability platform combining requirements, business knowledge, customer-support Q&A, code metadata, production data and exception traces. Unified access, layered storage, multidimensional retrieval and data-collection contracts give AI relevant context at each stage and automatically report stage outputs.",
      "Designed Detangle for requirements pre-review and SOAP for AI-collaboration friction analysis. Identified ambiguity, system conflicts and coordination gaps before requirements reviews, and analyzed human–AI friction during design and coding. Deployed across a 15-person backend team and more than 10 projects.",
    ],
  },
] as const;

export const earlierPoints = [
  "Mapped business domains, reviewed requirements and decoupled features. Introduced coding standards, Git Flow and code review, resolving legacy issues and improving team efficiency.",
  "Built and maintained product, trading and asset modules for the core wealth-management system, alongside shared microservices. Improved reliability, performance, availability and extensibility.",
  "Designed and independently shipped the first version of an employee-benefits system in two months. Increased voucher and red-envelope usage by 20% and helped increase monthly product sales by approximately 5 million.",
  "Built an SMS service platform with multiple providers and automatic failover, improving fault tolerance and business continuity. Developed integration SDKs to reduce repeated work across the team.",
] as const;
