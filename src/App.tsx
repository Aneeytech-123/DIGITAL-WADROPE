import { useEffect } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Icon } from "./components/ui";
import { useStore } from "./lib/store";
import AvatarPage from "./pages/AvatarPage";
import Insights from "./pages/Insights";
import Outfits from "./pages/Outfits";
import Studio from "./pages/Studio";
import Wardrobe from "./pages/Wardrobe";

const NAV = [
  { to: "/", label: "Studio", icon: "studio", title: "Try-on studio" },
  { to: "/wardrobe", label: "Wardrobe", icon: "wardrobe", title: "Wardrobe" },
  { to: "/outfits", label: "Outfits", icon: "outfits", title: "Outfits" },
  { to: "/avatar", label: "Avatar", icon: "avatar", title: "Avatar" },
  { to: "/insights", label: "Insights", icon: "insights", title: "Insights" },
];

export default function App() {
  const { ready } = useStore();
  const { pathname } = useLocation();

  useEffect(() => {
    const page = NAV.find((n) => n.to === pathname);
    document.title = page ? `${page.title} | Digital Wardrobe` : "Digital Wardrobe";
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="logo" aria-label="Digital Wardrobe home">
          <span className="logo-mark" aria-hidden="true">
            <Icon name="studio" size={20} />
          </span>
          <span className="logo-text">
            Digital<em>Wardrobe</em>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-foot">Your closet, on screen.</p>
      </aside>

      <main className="main">
        {!ready ? (
          <div className="loading" role="status">
            <span className="spinner" /> Opening your wardrobe…
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Studio />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/outfits" element={<Outfits />} />
            <Route path="/avatar" element={<AvatarPage />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
