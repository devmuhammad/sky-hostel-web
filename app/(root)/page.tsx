import React from "react";
import Link from "next/link";

const page = () => {
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

export default page;
