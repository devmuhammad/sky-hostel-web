import Image from "next/image";
import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full gap-5 p-6 shadow-light-300 sm:px-12 bg-white">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/images/logo.png"
          width={100}
          height={100}
          alt="Sky Student Hostel Logo"
        />
      </Link>
      <Link href="#" className=" paragraph-regular text-primary-500 ">
        Admin<span className="text-primary-500">Flow</span>
      </Link>
    </nav>
  );
};

export default Navbar;
