import Features from "./components/Features";
import Hero from "./components/Hero";
import HeroNavbar from "./components/heroNavbar";
import Testimonials from "./components/Testimonials";

export default function Home() {
  return (
    <div>
      <HeroNavbar />
      <Hero />
      <Features />
      <Testimonials />
    </div>
  );
}
