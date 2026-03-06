"use server";

import { headers } from "next/headers";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default async function RootLayout({ children }) {
  console.log((await headers()).get("url"));
  return (
    <>
      {children}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}