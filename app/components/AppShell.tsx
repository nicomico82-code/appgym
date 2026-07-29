import Link from "next/link";
import {
  experienceLabel,
  getCurrentProfile,
  profileInitials,
} from "../lib/current-profile";

type NavKey =
  | "inicio"
  | "entrenar"
  | "progreso"
  | "ejercicios"
  | "perfil";

const navigation: Array<{ key: NavKey; href: string; label: string; icon: string }> = [
  { key: "inicio", href: "/", label: "Inicio", icon: "IN" },
  { key: "entrenar", href: "/entrenar", label: "Entrenar", icon: "EN" },
  { key: "progreso", href: "/progreso", label: "Progreso", icon: "PR" },
  { key: "ejercicios", href: "/ejercicios", label: "Ejercicios", icon: "EX" },
  { key: "perfil", href: "/perfil", label: "Perfil", icon: "PE" },
];

function Navigation({ current, mobile = false }: { current: NavKey; mobile?: boolean }) {
  return (
    <nav className={mobile ? "mobile-nav" : "main-nav"} aria-label="Navegación principal">
      {navigation.map((item) => (
        <Link
          className={`nav-link ${current === item.key ? "active" : ""}`}
          href={item.href}
          key={item.key}
          aria-current={current === item.key ? "page" : undefined}
        >
          <span className="nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export async function AppShell({
  current,
  children,
}: {
  current: NavKey;
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">E</span>
          <span>
            <strong>Entrena</strong>
            <small>PROGRESO CON CRITERIO</small>
          </span>
        </Link>
        <Navigation current={current} />
        <Link className="sidebar-profile" href="/perfil">
          <span className="avatar">{profileInitials(profile.displayName)}</span>
          <span>
            <strong>{profile.displayName}</strong>
            <small>{experienceLabel(profile.experienceLevel)}</small>
          </span>
          <b aria-hidden="true">›</b>
        </Link>
        <div className="sidebar-card">
          <span>MODO PILOTO</span>
          <p>
            Cada recomendación explica qué datos utilizó. Tú mantienes el
            control.
          </p>
          <Link href="/progreso">Cómo funciona →</Link>
        </div>
      </aside>
      <main className="app-main">{children}</main>
      <Navigation current={current} mobile />
    </div>
  );
}
