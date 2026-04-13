import '../styles/globals.css';

export const metadata = {
  title: 'Sensync MBG Dashboard',
  description: 'Monitoring pH, Turbidity, and Conductivity with a TFT display interface.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
