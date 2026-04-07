import LandingPage from "./components/LandingPage";
import { connectToDatabase } from "@/lib/mongodb";
import { getActiveSiteNotice } from "@/lib/siteNotices";

export default async function Home() {
  let initialNotice = null;

  try {
    const { db } = await connectToDatabase();
    const notice = await getActiveSiteNotice(db);
    initialNotice = notice
      ? {
          id: notice._id?.toString?.() || notice.key,
          key: notice.key,
          title: notice.title,
          message: notice.message,
          variant: notice.variant,
          icon: notice.icon,
        }
      : null;
  } catch (error) {
    console.error("Failed to prefetch landing notice:", error);
  }

  return (
    <div>
      <LandingPage initialNotice={initialNotice} />
    </div>
  );
}
