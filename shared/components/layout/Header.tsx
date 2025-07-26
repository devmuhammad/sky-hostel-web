"use client";

import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <header className="py-4 px-6 bg-white transition-all duration-300 z-10 fixed top-0 right-0 w-full border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-1">
          <Image src="/logo.png" alt="Sky Hostel" width={100} height={100} />
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="text-[--sky-blue] hover:text-[--sky-dark-blue]"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
