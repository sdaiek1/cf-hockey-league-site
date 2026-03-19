export const metadata = {
  title: "Cold Fusion Summer Hockey League",
  description: "Adult ice hockey league website"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#020617", color: "white" }}>
        {children}
      </body>
    </html>
  );
}
