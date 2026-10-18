import "./globals.css";
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
import "./theme/modernization.css";
export const metadata = {
  title: "club",
  description: "club's system",
  translate: "no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" translate="no">
      <body className="membership-ui">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
