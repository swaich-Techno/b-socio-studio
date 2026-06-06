"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

const publicRoutes = ["/", "/login", "/register", "/pending", "/inactive", "/forgot-password", "/reset-password", "/offline"];

export default function AppFrame({ children }) {
  const pathname = usePathname();
  const isPublic = publicRoutes.includes(pathname);

  return (
    <>
      <Navbar isPublic={isPublic} />
      {!isPublic ? <Sidebar /> : null}
      <main className={isPublic ? "min-h-screen pt-20" : "min-h-screen bg-[#f6f8fb] px-4 pb-28 pt-24 md:pl-80 md:pr-8"}>
        {children}
      </main>
    </>
  );
}
