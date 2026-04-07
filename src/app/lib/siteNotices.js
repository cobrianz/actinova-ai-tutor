const DEFAULT_SITE_NOTICES = [
  {
    key: "premium-course-and-resume-launch",
    title: "New",
    message: "Get a premium personalised course for $6 or export your resume for $2.5.",
    variant: "promo",
    icon: "flame",
    active: true,
    priority: 100,
  },
];

export async function ensureSiteNotices(db) {
  const collection = db.collection("site_notices");

  await Promise.all(
    DEFAULT_SITE_NOTICES.map((notice) =>
      collection.updateOne(
        { key: notice.key },
        {
          $setOnInsert: {
            key: notice.key,
            createdAt: new Date(),
          },
          $set: {
            message: notice.message,
            title: notice.title,
            variant: notice.variant,
            icon: notice.icon,
            active: notice.active,
            priority: notice.priority,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      )
    )
  );
}

export async function getActiveSiteNotice(db) {
  await ensureSiteNotices(db);

  return db.collection("site_notices").findOne(
    { active: true },
    { sort: { priority: -1, updatedAt: -1, createdAt: -1 } }
  );
}
