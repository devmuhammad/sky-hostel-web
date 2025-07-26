"use client";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

import React, { useEffect } from "react";
import Link from "next/link";

const Page = () => {
  // Log environment variables on page load
  useEffect(() => {
    console.log("=== ENVIRONMENT CHECK ON SITE LOAD ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
    console.log("Window location origin:", window.location.origin);
    console.log("Window location href:", window.location.href);
    console.log("Environment:", process.env.NODE_ENV);
  }, []);
  return (
    <div className="pt-60">
      <h1 className="text-primary-500">Hello World</h1>
      <ul className="flex gap-4 justify-center items-center ">
        <li>
          <Link href="/invoice">Make Payment</Link>
        </li>
        <li>
          <Link href="/check-payment">Check Payment Status</Link>
        </li>
        <li>
          <Link href="/confirm-payment">Confirm Payment</Link>
        </li>
      </ul>
    </div>
  );
};

export default Page;
