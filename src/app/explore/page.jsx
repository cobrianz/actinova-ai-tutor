import DashboardLayout from "../components/DashboardLayout"
import Explore from "../components/Explore"

export const metadata = {
  title: "Explore Courses",
  description: "Discover, search, and enroll in hundreds of AI-generated personalized courses tailored for your skill level.",
};

export default function ExplorePage() {
  return (
    <DashboardLayout>
      <Explore />
    </DashboardLayout>
  )
}