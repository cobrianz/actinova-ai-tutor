
import { Sparkles } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
  <footer className="bg-gray-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 sparkles text-white" />
            </div>
            <span className="text-xl font-bold">Actinova AI Tutor</span>
          </div>
          <p className="text-gray-400 mb-4"> 
            Empowering learners worldwide with AI-powered personalized education.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              GitHub
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Product</h3>
          <ul className="space-y-2 text-gray-400">
            <li>
              <Link href="#features" className="hover:text-white transition-colors">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:underline">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="#testimonials" className="hover:text-white">
                Testimonials
              </Link>
            </li>
            <li>
              <Link href="/demo" className="hover:text-white">
                Demo
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Company</h3>
          <ul className="space-y-2 text-gray-400">
            <li>
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/careers" className="hover:text-white">
                Careers
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:underline-white">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Support</h3>
          <ul className="space-y-2 text-gray-400">
            <li>
              <Link href="/help" className="hover:text-white transition-colors">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/community" className="hover:text-white">
                Community
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>© 2025 Actinova AI Tutor. All rights reserved.</p>
      </div>
    </div>
  </footer>
)};