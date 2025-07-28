"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import FeatureCard from "@/components/FeatureCard";
import RoomSelectionBar from "@/components/RoomSelectionBar";

// Main Landing Page Component
const Page = () => {
  // Features data
  const features = [
    { id: 1, title: "24/7 Security", icon: "/icons/security-icon.svg" },
    { id: 2, title: "Free WiFi", icon: "/icons/wifi-icon.svg" },
    { id: 3, title: "Prime Location", icon: "/icons/location-icon.svg" },
    { id: 4, title: "24/7 Support", icon: "/icons/support-icon.svg" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center mb-12 bg-light-blue relative pt-24 md:pt-8 lg:pt-0 gap-10 lg:gap-0">
        <div className="md:w-1/2">
          <div className="flex flex-col items-left max-w-2xl mx-auto text-left px-8">
            <h1 className="text-3xl lg:text-5xl font-semibold mb-4 text-dark-blue">
              Find the perfect <br /> room for your stay
            </h1>
            <p className="text-lg mb-6 text-gray-700">
              Stay, explore, and make memories—
              <br />
              The Ultimate Hostel Experience Awaits!
            </p>

            <div className="flex gap-2 items-center lg:mt-4">
              <Image
                src="/icons/play-icon.svg"
                alt="play icon"
                width={30}
                height={30}
              />
              <p className="text-lg text-green">Take a tour</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <Image
            src="/hero.png"
            alt="Sky Hostel Building"
            width={500}
            height={500}
            className="w-full h-auto object-cover"
          />
        </div>

        <RoomSelectionBar className="absolute bottom-[1%] lg:bottom-[10%] left-0 right-0 max-w-6xl mx-auto" />
      </section>

      {/* Call to Action Section */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Make Sky Hostel Your Home?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join hundreds of students who have chosen Sky Hostel for their
            accommodation needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registration">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                Start Registration
              </button>
            </Link>
            <Link href="/check-payment">
              <button className="border border-white text-white hover:bg-white hover:text-gray-900 font-semibold py-3 px-8 rounded-lg transition-colors">
                Check Payment Status
              </button>
            </Link>
          </div>
        </div>
      </section>

      <div className="h-16"></div>

      {/* Why Choose SKY Section */}
      <section className="p-4 bg-green rounded-lg shadow-sm mb-12 flex items-center gap-5 lg:gap-10 justify-center flex-wrap lg:flex-nowrap max-w-[55%] lg:max-w-[70%] mx-auto">
        <h2 className="text-2xl font-bold text-white text-center">
          Why choose SKY?
        </h2>

        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            title={feature.title}
            icon={feature.icon}
          />
        ))}
      </section>

      {/* Testimonials Section */}
      <section className="py-12 mb-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            What Students Say
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">
                    Adebayo Michael
                  </h3>
                  <p className="text-sm text-gray-600">Computer Science</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                &ldquo;Sky Hostel provides the perfect environment for studying.
                The facilities are modern and the location is convenient.&rdquo;
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">Sarah Johnson</h3>
                  <p className="text-sm text-gray-600">Engineering</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                &ldquo;I love the community here! Great security, fast WiFi, and
                amazing roommates. Highly recommended!&rdquo;
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  O
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">Olumide Grace</h3>
                  <p className="text-sm text-gray-600">Medicine</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                &ldquo;The 24/7 support team is incredible. Any issue I have is
                resolved quickly. This place feels like home.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900">
                Sky Student Hostel
              </h3>
              <p className="text-gray-600 text-sm">
                Premium student accommodation with modern facilities and
                excellent security.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-gray-900">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/registration" className="hover:text-blue-600">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/check-payment" className="hover:text-blue-600">
                    Check Payment
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-blue-600">
                    Admin
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-gray-900">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>University Campus Area</li>
                <li>+234 707 581 8778</li>
                <li>mahrikinvltd@gmail.com</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-gray-900">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>24/7 Security</li>
                <li>Free WiFi</li>
                <li>Prime Location</li>
                <li>24/7 Support</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-6 text-center text-sm text-gray-600">
            <p>&copy; 2024 Sky Student Hostel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Page;
