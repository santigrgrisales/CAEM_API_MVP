// app/layout.js
import '../styles/globals.css';

export const metadata = {
  title: "Bank API Staging",
  description: "Staging UI para consumir screening y batch cases"
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <div className="app-shell">
          <header className="header">
            <div>
              <div className="h-title">Bank API — Staging</div>
              <div className="h-sub">Demo MVP — Screening y Batch Case Details</div>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}