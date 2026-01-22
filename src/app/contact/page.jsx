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
  ArrowRight,
  ChevronRight,
  Globe,
  Twitter,
  Linkedin,
  Github
} from "lucide-react";
import Link from "next/link";
import HeroNavbar from "../components/heroNavbar";
import { toast } from "sonner";

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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send message");

      toast.success(
        "Your message was sent. You'll receive the response in 72hrs"
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
      title: "Email",
      value: "hello@actinova.ai",
      description: "Our friendly team is here to help.",
      action: "mailto:hello@actinova.ai",
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+254 702 764 907",
      description: "Mon-Fri from 9am to 6pm.",
      action: "tel:+254702764907",
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      icon: MapPin,
      title: "Office",
      value: "Nairobi, Kenya",
      description: "Come say hello at our office.",
      action: "https://www.google.com/maps/search/?api=1&query=Nairobi%2C+Kenya",
      color: "bg-emerald-500/10 text-emerald-600"
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-gray-900 dark:text-gray-100 selection:bg-blue-500/30 overflow-x-hidden">
      <HeroNavbar />

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 border border-blue-100 dark:border-blue-800"
            >
              <MessageCircle className="w-4 h-4" />
              <span>We're here to help</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              Let's Start a <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Conversation</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              Have questions about our platform or want to explore enterprise solutions? 
              Reach out and we'll get back to you as soon as possible.
            </motion.p>
          </div>
        </section>

        <section className="pb-32 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              {/* Left Column: Info */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-5 space-y-12"
              >
                <div className="space-y-8">
                  {contactInfo.map((info, i) => {
                    const Icon = info.icon;
                    return (
                      <motion.a
                        key={i}
                        href={info.action}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start group p-2 -m-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className={`w-12 h-12 rounded-xl ${info.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="ml-6">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                            {info.title}
                            <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{info.description}</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">{info.value}</p>
                        </div>
                      </motion.a>
                    );
                  })}
                </div>

                <div className="p-8 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-3 mb-6">
                    <Clock className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold">Business Hours</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
                      <span className="text-gray-600 dark:text-gray-400">Monday - Friday</span>
                      <span className="font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
                      <span className="text-gray-600 dark:text-gray-400">Saturday</span>
                      <span className="font-medium">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Sunday</span>
                      <span className="text-red-500 font-medium">Closed</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {[Twitter, Linkedin, Github].map((Icon, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      whileHover={{ y: -5, scale: 1.1 }}
                      className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              {/* Right Column: Form */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-7"
              >
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl" />

                  <h2 className="text-3xl font-bold mb-8">Send a Message</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Your Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="John Doe"
                          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="john@example.com"
                          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">Inquiry Category</label>
                      <div className="relative">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="support">Technical Support</option>
                          <option value="enterprise">Enterprise Solutions</option>
                          <option value="partnership">Partnership</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronRight className="w-5 h-5 rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="How can we help?"
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Type your message here..."
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Preview or Alternative CTA */}
        <section className="py-20 bg-gray-50/50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-12">Looking for something else?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Help Center", description: "Browse our comprehensive guides and tutorials.", link: "/help", icon: Globe },
                { title: "Enterprise", description: "Custom solutions for large teams and institutions.", link: "/pricing", icon: Sparkles },
                { title: "Careers", description: "Join our mission to democratize education.", link: "/about", icon: Users },
              ].map((item, i) => (
                <Link 
                  key={i} 
                  href={item.link}
                  className="p-8 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
