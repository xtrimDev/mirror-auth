import './globals.css'

export const metadata = {
  title: 'MirrorAuth',
  description: 'Experience seamless and secure access with MirrorAuth. No passwords, no hassle—just use your face to log in to all your favorite applications. Enjoy effortless authentication and ultimate convenience while keeping your identity safe and private.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}