import Navbar from "@/shared/components/layout";
import React, { ReactNode } from "react";

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main>
      <Navbar />
      <div className="pt-32"> {children}</div>
    </main>
  );
};

export default RootLayout;
