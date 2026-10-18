import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
// import "primereact/resources/themes/soho-dark/theme.css";
// import "primereact/resources/themes/soho-light/theme.css";

// import "primereact/resources/themes/lara-light-indigo/theme.css";

import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./theme/theme.css";
import "./theme/myEdit.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "club",
  description: "club's system",
  translate: "no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" translate="no">
      <body className={`bg-brown-100`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
