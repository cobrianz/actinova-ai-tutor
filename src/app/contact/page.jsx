"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Users,
  Sparkles,
  Clock,
  Headphones,
  Building,
  Handshake,
  Globe,
  ArrowRight,
  Twitter,
  Linkedin,
  Instagram,
  LifeBuoy,
  Briefcase,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import HeroNavbar from "../components/heroNavbar";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/api/contact", formData);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send message");

      toast.success(
        "Your message was sent. You'll receive a response within 24-48 hours"
      );
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general",
      });
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us an email anytime",
      contact: "hello@actirova.ai",
      action: "mailto:hello@actirova.ai",
      availability: "24/7 Response",
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak with our team",
      contact: "+254 702 764 907",
      action: "tel:+254702764907",
      availability: "Mon-Fri, 9AM-6PM EAT",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Come say hello",
      contact: "Nairobi, Kenya",
      action: "https://www.google.com/maps/search/?api=1&query=Nairobi%2C+Kenya",
      availability: "By appointment",
    },
  ];

  const departments = [
    {
      icon: Headphones,
      title: "Customer Support",
      description: "For technical issues and general inquiries",
      email: "support@actirova.ai",
    },
    {
      icon: Building,
      title: "Enterprise Sales",
      description: "Custom solutions for organizations",
      email: "enterprise@actirova.ai",
    },
    {
      icon: Handshake,
      title: "Partnerships",
      description: "Collaborate with us",
      email: "partners@actirova.ai",
    },
    {
      icon: Newspaper,
      title: "Press & Media",
      description: "For media inquiries",
      email: "press@actirova.ai",
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <HeroNavbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Have questions about our platform? Want to explore enterprise
            solutions? We'd love to hear from you and help you on your learning
            journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Send us a message
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="enterprise">Enterprise Solutions</option>
                    <option value="partnership">Partnership</option>
                    <option value="press">Press & Media</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Contact Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
                Contact Information
              </h3>

              <div className="space-y-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <motion.a
                      key={index}
                      href={info.action}
                      className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center group-hover:bg-violet-600 transition-colors">
                        <Icon className="w-5 h-5 text-violet-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {info.title}
                        </h4>
                        <p className="text-xs text-slate-500 mb-1">
                          {info.description}
                        </p>
                        <p className="text-sm font-medium text-violet-600">
                          {info.contact}
                        </p>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-5">
                <Clock className="w-5 h-5 text-violet-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Business Hours
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Monday - Friday</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">9:00 AM - 6:00 PM EAT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Saturday</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">10:00 AM - 4:00 PM EAT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Sunday</span>
                  <span className="font-medium text-slate-400">Closed</span>
                </div>
              </div>
            </div>

            {/* Department Contacts */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
                Department Contacts
              </h3>

              <div className="space-y-3">
                {departments.map((dept, index) => {
                  const Icon = dept.icon;
                  return (
                    <a
                      key={index}
                      href={`mailto:${dept.email}`}
                      className="block p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-violet-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{dept.title}</p>
                          <p className="text-xs text-slate-500">{dept.email}</p>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Social Links */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Follow Us
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xl mx-auto">
              Stay connected with us on social media for the latest updates, learning tips, and community news.
            </p>
            <div className="flex justify-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/help" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-violet-300 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Visit Help Center</p>
                  <p className="text-sm text-slate-500">BrowseFAQs and guides</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
              </div>
            </Link>
            
            <Link href="/pricing" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-violet-300 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">View Pricing</p>
                  <p className="text-sm text-slate-500">Plans for every need</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
              </div>
            </Link>
            
            <Link href="/about" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-violet-300 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Learn About Us</p>
                  <p className="text-sm text-slate-500">Our mission and story</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
