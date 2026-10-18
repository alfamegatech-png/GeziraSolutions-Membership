import { Inter } from 'next/font/google'
import './globals.css'
import "bootstrap/dist/css/bootstrap.min.css";
import Main from './main';


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'برنامج العضوية',
  description: 'برنامج العضوية',
}


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ direction: 'rtl' }}>
        <Main>{children}</Main>
      </body>
    </html>
  )
}
